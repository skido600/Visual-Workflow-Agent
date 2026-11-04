import type { Context } from "hono";
import { z, ZodError } from "zod";
import { and, eq } from "drizzle-orm";

import { generatePlan } from "../services/ai.service";
import { createPlanSchema } from "../lib/ai.schema";
import { aiPlans } from "../db/schema";
import { db } from "../db";
import { getAuthenticatedUser } from "./agent.controller";

export async function createPlanController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { success: false, message: "Request body must be valid JSON" },
      400,
    );
  }

  const result = createPlanSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        success: false,
        message: "Please provide a valid prompt",
        errors: result.error.flatten(),
      },
      400,
    );
  }

  try {
    const plan = await generatePlan(result.data.prompt);

    if (plan.type === "out_of_scope") {
      return c.json({
        success: true,
        message: plan.message,
        data: { type: "out_of_scope" },
      });
    }

    const [savedPlan] = await db
      .insert(aiPlans)
      .values({
        userId: user.id,
        goal: plan.goal,
        plan: {
          goal: plan.goal,
          explanation: plan.explanation,
          actions: plan.actions,
        },
        status: "pending_approval",
      })
      .returning();

    return c.json(
      {
        success: true,
        message: "Plan generated. Review it before approving.",
        data: savedPlan,
      },
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Invalid AI plan:", error.issues);

      return c.json(
        {
          success: false,
          message: "The AI returned a plan with an invalid structure.",
        },
        502,
      );
    }

    console.error("Plan generation failed:", error);

    return c.json(
      {
        success: false,
        message: "Unable to generate a plan. Please try again.",
      },
      502,
    );
  }
}

const paramsSchema = z.object({
  planId: z.string().uuid(),
});

export async function approvePlanController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  const params = paramsSchema.safeParse(c.req.param());

  if (!params.success) {
    return c.json({ success: false, message: "Invalid plan ID." }, 400);
  }

  try {
    const [updatedPlan] = await db
      .update(aiPlans)
      .set({
        status: "approved",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiPlans.id, params.data.planId),
          eq(aiPlans.userId, user.id),
          eq(aiPlans.status, "pending_approval"),
        ),
      )
      .returning({
        id: aiPlans.id,
        goal: aiPlans.goal,
        status: aiPlans.status,
      });

    if (!updatedPlan) {
      return c.json(
        { success: false, message: "Plan not found or already reviewed." },
        409,
      );
    }

    return c.json({
      success: true,
      message: "Plan approved. Ready for execution.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Approve plan failed:", error);

    return c.json(
      { success: false, message: "Could not approve the plan." },
      500,
    );
  }
}

export async function rejectPlanController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  const params = paramsSchema.safeParse(c.req.param());

  if (!params.success) {
    return c.json({ success: false, message: "Invalid plan ID." }, 400);
  }

  try {
    const [updatedPlan] = await db
      .update(aiPlans)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiPlans.id, params.data.planId),
          eq(aiPlans.userId, user.id),
          eq(aiPlans.status, "pending_approval"),
        ),
      )
      .returning({
        id: aiPlans.id,
        goal: aiPlans.goal,
        status: aiPlans.status,
      });

    if (!updatedPlan) {
      return c.json(
        { success: false, message: "Plan not found or already reviewed." },
        409,
      );
    }

    return c.json({
      success: true,
      message: "Plan rejected. No actions will be executed.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Reject plan failed:", error);

    return c.json(
      { success: false, message: "Could not reject the plan." },
      500,
    );
  }
}
