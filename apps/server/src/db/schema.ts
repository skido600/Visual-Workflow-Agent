import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  pgEnum,
  jsonb,
  unique,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import type { Plan } from "../lib/ai.schema";

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: ts("email_verified_at"),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const oauthIdentities = pgTable(
  "oauth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    providerEmail: text("provider_email"),
    providerEmailVerified: boolean("provider_email_verified"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("oauth_identities_provider_subject_key").on(
      t.provider,
      t.providerSubject,
    ),
    unique("oauth_identities_user_provider_key").on(t.userId, t.provider),
    index("oauth_identities_user_id_idx").on(t.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    refreshToken: text("refresh_token").notNull().unique(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("email_verification_tokens_token_hash_key").on(t.tokenHash),
    index("email_verification_tokens_user_id_idx").on(t.userId),
  ],
);
export const agentTokens = pgTable("agent_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
});

export const agentPairings = pgTable("agent_pairings", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceCodeHash: text("device_code_hash").notNull().unique(),
  userCode: text("user_code").notNull().unique(),
  userId: uuid("user_id"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
});
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("password_reset_tokens_token_hash_key").on(t.tokenHash),
    index("password_reset_tokens_user_id_idx").on(t.userId),
  ],
);

export const planStatusEnum = pgEnum("plan_status", [
  "pending_approval",
  "approved",
  "rejected",
  "executing",
  "completed",
  "failed",
]);

export const aiPlans = pgTable("ai_plans", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  goal: varchar("goal", { length: 500 }).notNull(),
  executionResult: jsonb("execution_result"),
  plan: jsonb("plan").$type<Plan>().notNull(),

  status: planStatusEnum("status").default("pending_approval").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
