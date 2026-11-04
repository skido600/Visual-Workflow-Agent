"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  ArrowUp,
  Sparkles,
  Clock,
  FolderPlus,
  Monitor,
  FileText,
  ShieldCheck,
  Loader2,
  Check,
  X,
  CircleCheck,
  CircleX,
} from "lucide-react";

const suggestions = [
  {
    icon: FolderPlus,
    title: "Create a folder",
    description: "Create and organize folders on your desktop.",
    prompt: "Create a folder called Screenshots on my desktop.",
  },
  {
    icon: FileText,
    title: "Organize files",
    description: "Help organize files into folders.",
    prompt: "Organize my desktop files into appropriate folders.",
  },
  {
    icon: Monitor,
    title: "Desktop overview",
    description: "Get an overview of your desktop environment.",
    prompt: "Show me the current state of my desktop.",
  },
];

type PlanAction = {
  type: string;
  [key: string]: unknown;
};

type PlanResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    userId: string;
    goal: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    plan: {
      goal: string;
      explanation: string;
      actions: PlanAction[];
    };
  };
};

type Decision = "approve" | "reject";

const EXECUTE = process.env.NEXT_PUBLIC_EXECUTE_URL;

async function createPlan(prompt: string): Promise<PlanResponse> {
  const response = await fetch("/api/v1/ai/plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not generate AI plan.");
  }

  return result;
}

async function decidePlan({
  planId,
  decision,
}: {
  planId: string;
  decision: Decision;
}): Promise<any> {
  const response = await fetch(`/api/v1/ai/plans/${planId}/${decision}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = response.status === 204 ? null : await response.json();

  console.log("Approval response:", result);

  if (!response.ok) {
    throw new Error(result?.message || `Could not ${decision} this plan.`);
  }

  // Reject branch
  if (decision === "reject") {
    return {
      decision,
      result,
      executionResult: null,
      planResult: null,
    };
  }

  // Execute approved plan using local desktop agent
  if (!EXECUTE) {
    throw new Error("NEXT_PUBLIC_EXECUTE_URL is not configured.");
  }

  let executionResponse: Response;

  try {
    executionResponse = await fetch(`${EXECUTE}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Request": "connect",
      },
    });
  } catch {
    throw new Error(
      "Plan approved, but the local agent is unreachable. Start your agent on Windows.",
    );
  }

  const executionText = await executionResponse.text();

  let executionResult: any = null;

  if (executionText.trim()) {
    try {
      executionResult = JSON.parse(executionText);
    } catch {
      throw new Error(`Local agent returned invalid JSON: ${executionText}`);
    }
  }

  console.log("Local execution response:", executionResult);

  if (!executionResponse.ok) {
    throw new Error(
      `Plan approved, but execution failed: ${executionResponse.status} - ${executionText}`,
    );
  }

  let planResult: any = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const resultResponse = await fetch(`/api/v1/agent/result/${planId}`, {
      method: "GET",
      credentials: "include",
    });

    const resultText = await resultResponse.json();

    console.log(resultText, "text results");

    if (!resultResponse.ok) {
      throw new Error(
        `Could not retrieve execution result: ${JSON.stringify(resultText)}`,
      );
    }

    planResult = resultText;

    console.log(`Result check ${attempt + 1}:`, planResult);

    const savedResult = planResult?.data?.executionResult;

    if (savedResult !== null && savedResult !== undefined) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("Final plan result:", planResult);

  return {
    decision,
    result,
    executionResult,
    planResult,
  };
}

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const queryClient = useQueryClient();
  const planMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      setPrompt("");
      setDecision(null);
      decisionMutation.reset();
    },
  });

  const decisionMutation = useMutation<
    any,
    Error,
    {
      planId: string;
      decision: Decision;
    }
  >({
    mutationFn: decidePlan,

    onSuccess: async (_, variables) => {
      setDecision(variables.decision);

      await queryClient.invalidateQueries({
        queryKey: ["plan-history"],
      });
    },
  });

  const generatedPlan = planMutation.data?.data;

  const decisionData: any = decisionMutation.data;
  const planResult: any = decisionData?.planResult;
  const localExecutionResult: any = decisionData?.executionResult;

  const executionResults: any = planResult?.data?.executionResult ?? null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const value = prompt.trim();

    if (!value || planMutation.isPending) return;

    planMutation.mutate(value);
  }

  function handleDecision(value: Decision) {
    if (!generatedPlan || decisionMutation.isPending) return;

    decisionMutation.mutate({
      planId: generatedPlan.id,
      decision: value,
    });
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-12 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs text-neutral-400">
            <Sparkles size={14} className="text-white" />
            AI-powered desktop automation
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            What can I help you <span className="text-neutral-500">do?</span>
          </h1>

          <p className="mt-4 text-sm text-neutral-500 sm:text-base">
            Describe a task and let your AI agent handle the workflow.
          </p>
        </div>

        {/* Prompt form */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl transition focus-within:border-neutral-600">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want your desktop agent to do..."
            rows={3}
            disabled={planMutation.isPending}
            className="w-full resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-600 sm:text-base"
          />

          <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck size={15} />
              Approval required before execution
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || planMutation.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Generate plan">
              {planMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </div>
        </form>

        {/* Plan loading */}
        {planMutation.isPending && (
          <p className="mt-4 text-sm text-neutral-400">
            <Loader2 size={14} className="mr-2 inline animate-spin" />
            Creating your AI workflow...
          </p>
        )}

        {/* Plan error */}
        {planMutation.isError && (
          <div className="mt-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {planMutation.error.message}
          </div>
        )}

        {/* Generated plan */}
        {generatedPlan && (
          <section className="mt-8 w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
            {/* Plan header */}
            <div className="flex items-center justify-between border-b border-neutral-800 p-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles size={16} />
                  Generated workflow
                </div>

                <p className="mt-1 text-xs text-neutral-500">
                  Review the plan before allowing execution.
                </p>
              </div>

              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                {decision
                  ? decision === "approve"
                    ? "Approved"
                    : "Rejected"
                  : generatedPlan.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="space-y-6 p-5">
              {/* Goal */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Goal
                </p>

                <h2 className="text-lg font-semibold text-white">
                  {generatedPlan.goal}
                </h2>
              </div>

              {/* Explanation */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Explanation
                </p>

                <p className="text-sm leading-6 text-neutral-300">
                  {generatedPlan.plan.explanation}
                </p>
              </div>

              {/* Actions */}

              {/* Decision error */}
              {decisionMutation.isError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {decisionMutation.error.message}
                </div>
              )}

              {/* Decision status */}
              {decision && (
                <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-300">
                  {decision === "approve" ? (
                    <CircleCheck size={18} className="text-green-400" />
                  ) : (
                    <CircleX size={18} className="text-red-400" />
                  )}

                  {decision === "approve"
                    ? "Plan approved and sent to your desktop agent."
                    : "Plan rejected. It will not be executed."}
                </div>
              )}

              {/* Approve and Reject */}
              {!decision && (
                <div className="flex flex-col gap-3 border-t border-neutral-800 pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleDecision("approve")}
                    disabled={decisionMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50">
                    {decisionMutation.isPending &&
                    decisionMutation.variables?.decision === "approve" ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    Accept & Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision("reject")}
                    disabled={decisionMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700 px-5 py-3 text-sm font-medium text-neutral-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50">
                    {decisionMutation.isPending &&
                    decisionMutation.variables?.decision === "reject" ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <X size={17} />
                    )}
                    Reject
                  </button>
                </div>
              )}

              {decision === "approve" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <CircleCheck size={18} className="text-green-400" />
                    Desktop execution result
                  </h3>

                  {decisionMutation.isPending ? (
                    <p className="flex items-center gap-2 text-sm text-neutral-400">
                      <Loader2 size={15} className="animate-spin" />
                      Waiting for desktop agent...
                    </p>
                  ) : executionResults || localExecutionResult ? (
                    (() => {
                      const item = Array.isArray(executionResults)
                        ? executionResults[0]
                        : (executionResults ?? localExecutionResult);

                      return (
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs uppercase text-neutral-500">
                              Status
                            </p>
                            <p className="font-medium text-sm text-yellow-400">
                              {item?.result.status}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-neutral-500">
                              Message
                            </p>
                            <p className="text-neutral-300">
                              {item?.result.message}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-neutral-500">
                              Path
                            </p>
                            <p className="break-all text-neutral-300">
                              {item?.result.path}
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-yellow-400">
                      No execution result was returned.
                    </p>
                  )}

                  {planResult?.data?.status && (
                    <p className="mt-4 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
                      Workflow status: {planResult.data.status}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Suggestions */}
        <div className="mt-12 w-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300">
              Try something
            </h2>

            <span className="text-xs text-neutral-600">Suggestions</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {suggestions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setPrompt(item.prompt)}
                  className="group rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 group-hover:bg-white group-hover:text-black">
                    <Icon size={20} />
                  </div>

                  <h3 className="text-sm font-medium text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-5 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Human approval
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} />
            Workflow history
          </div>

          <div className="flex items-center gap-2">
            <Sparkles size={14} />
            AI planning
          </div>
        </div>
      </div>
    </main>
  );
}
