import type { Context } from "hono";
import { z } from "zod";

export const parseBody = async <T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> => {
  const body: unknown = await c.req.json();
  return schema.parse(body);
};
