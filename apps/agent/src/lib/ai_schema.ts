import { z } from "zod";

const directorySchema = z.enum([
  "desktop",
  "downloads",
  "documents",
  "pictures",
]);

const folderNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(
    (name) =>
      !/[<>:"/\\|?*\x00-\x1F]/.test(name) && name !== "." && name !== "..",
    "Invalid folder name",
  );

const fileTypeSchema = z.enum([
  "any",
  "image",
  "video",
  "audio",
  "document",
  "pdf",
  "spreadsheet",
  "presentation",
  "archive",
  "code",
]);

const searchScopeSchema = z
  .enum(["common_folders", "entire_computer", "selected_folder"])
  .describe(
    "Search location. Use common_folders for Documents, Desktop, Downloads, and Pictures. Use selected_folder only when the user specifies a particular folder path. Use entire_computer only when the user requests a full computer search.",
  );

const matchModeSchema = z.enum([
  "name",
  "content",
  "metadata",
  "visual_similarity",
  "any",
]);

const fileSearchSchema = z
  .object({
    type: z.literal("find_file"),

    // Filename, partial name, keywords, or a natural-language description.
    query: z.string().trim().min(1).max(500),

    fileType: fileTypeSchema.default("any"),

    // How the agent should compare files against the query/reference.
    matchMode: matchModeSchema.default("any"),

    // Search common locations, all accessible drives, or a chosen folder.
    searchScope: searchScopeSchema.default("common_folders"),

    // Required when searchScope is selected_folder.
    folderPath: z.string().trim().min(1).max(1000).optional(),

    // The backend supplies this when the user uploads a reference image/file.
    referenceFileId: z.string().trim().min(1).max(200).optional(),

    // Optional file filters.
    extensions: z
      .array(
        z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9]{1,10}$/, "Invalid file extension"),
      )
      .max(30)
      .optional(),

    modifiedAfter: z.string().datetime().optional(),
    modifiedBefore: z.string().datetime().optional(),

    minSizeBytes: z.number().int().min(0).optional(),
    maxSizeBytes: z.number().int().min(0).optional(),

    maxResults: z.number().int().min(1).max(500).default(50),
  })
  .refine(
    (search) =>
      search.searchScope !== "selected_folder" || Boolean(search.folderPath),
    {
      message: "folderPath is required for selected_folder searches",
      path: ["folderPath"],
    },
  )
  .refine(
    (search) =>
      search.matchMode !== "visual_similarity" ||
      Boolean(search.referenceFileId),
    {
      message: "referenceFileId is required for visual similarity searches",
      path: ["referenceFileId"],
    },
  )
  .refine(
    (search) =>
      search.minSizeBytes === undefined ||
      search.maxSizeBytes === undefined ||
      search.minSizeBytes <= search.maxSizeBytes,
    {
      message: "minSizeBytes cannot exceed maxSizeBytes",
      path: ["minSizeBytes"],
    },
  )
  .refine(
    (search) =>
      !search.modifiedAfter ||
      !search.modifiedBefore ||
      search.modifiedAfter <= search.modifiedBefore,
    {
      message: "modifiedAfter cannot be later than modifiedBefore",
      path: ["modifiedAfter"],
    },
  );

export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("list_files"),
    directory: directorySchema,
  }),

  z.object({
    type: z.literal("create_folder"),
    directory: directorySchema,
    folderName: folderNameSchema,
  }),

  z.object({
    type: z.literal("move_file"),

    source: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .describe(
        'Absolute source path, or "$LAST_FOUND_FILE" to use the file found by the previous find_file action.',
      ),

    destination: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .describe(
        'Absolute destination file path, or "$LAST_CREATED_FOLDER" to put the source file inside the folder created by the previous create_folder action.',
      ),
  }),

  fileSearchSchema,
]);

export const planSchema = z.object({
  goal: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(2000),
  actions: z.array(actionSchema).min(1).max(20),
});

export const createPlanSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
});
export const promptResultSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("plan"),
    goal: z.string().trim().min(1).max(500),
    explanation: z.string().trim().min(1).max(2000),
    actions: z.array(actionSchema).min(1).max(20),
  }),

  z.object({
    type: z.literal("out_of_scope"),
    message: z.string().trim().min(1).max(500),
  }),
]);

export type PromptResult = z.infer<typeof promptResultSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Plan = z.infer<typeof planSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type FileSearch = z.infer<typeof fileSearchSchema>;
