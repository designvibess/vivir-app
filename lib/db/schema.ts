import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const cefrLevelEnum = pgEnum("cefr_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const skillEnum = pgEnum("skill", [
  "reading",
  "listening",
  "writing",
  "speaking",
]);

export const domainEnum = pgEnum("domain", [
  "daily_life",
  "work",
  "social",
  "housing",
]);

export const srsItemTypeEnum = pgEnum("srs_item_type", [
  "vocab",
  "grammar_pattern",
]);

export const placementTypeEnum = pgEnum("placement_type", [
  "initial",
  "manual_retest",
  "auto_retest",
]);

export const aiSessionTypeEnum = pgEnum("ai_session_type", [
  "roleplay",
  "grammar_q",
  "feedback",
]);

export const evidenceSourceEnum = pgEnum("evidence_source", [
  "placement",
  "manual_retest",
  "auto_retest",
  "lesson",
  "conversation",
  "srs_summary",
]);

export const levelChangeTriggerEnum = pgEnum("level_change_trigger", [
  "daily_job",
  "manual_retest",
  "auto_retest",
  "placement",
]);

export const speakerEnum = pgEnum("speaker", ["user", "profesora"]);

// ─── Core user table ────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Mirrors auth.users.id from Supabase — kept in sync via trigger
  authId: uuid("auth_id").unique().notNull(),
  email: text("email"),
  isGuest: boolean("is_guest").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  cefrLevel: cefrLevelEnum("cefr_level").notNull().default("A1"),
  // { reading, listening, writing, speaking } each a cefr_level string
  skillLevels: jsonb("skill_levels")
    .notNull()
    .default({
      reading: "A1",
      listening: "A1",
      writing: "A1",
      speaking: "A1",
    }),
  goals: jsonb("goals").notNull().default({}),
  dailyMinutesTarget: integer("daily_minutes_target").notNull().default(15),
});

// ─── Grammar topics (referenced by lessons) ────────────────────────────────

export const grammarTopics = pgTable("grammar_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  cefrLevel: cefrLevelEnum("cefr_level").notNull(),
  title: text("title").notNull(),
  explanationMd: text("explanation_md").notNull().default(""),
  examples: jsonb("examples").notNull().default([]),
  commonMistakesMd: text("common_mistakes_md").notNull().default(""),
});

// ─── Lessons ─────────────────────────────────────────────────────────────

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  cefrLevel: cefrLevelEnum("cefr_level").notNull(),
  domain: domainEnum("domain").notNull(),
  title: text("title").notNull(),
  scenarioDescription: text("scenario_description").notNull().default(""),
  dialogueScript: jsonb("dialogue_script").notNull().default([]),
  vocabItems: jsonb("vocab_items").notNull().default([]),
  grammarFocusId: uuid("grammar_focus_id"),
  culturaNoteText: text("cultura_note").notNull().default(""),
  orderHint: integer("order_hint").notNull().default(0),
  // Generated lesson JSON from the Spanish Professor pipeline
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

// ─── User lesson progress ─────────────────────────────────────────────────

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    userId: uuid("user_id").notNull(),
    lessonId: uuid("lesson_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // { comprehension: 0-1, writing: 0-1, speaking: 0-1, vocab: 0-1 }
    scores: jsonb("scores").notNull().default({}),
    aiFeedback: jsonb("ai_feedback").notNull().default({}),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lessonId] }),
    foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    foreignKey({ columns: [t.lessonId], foreignColumns: [lessons.id] }),
  ]
);

// ─── SRS items ─────────────────────────────────────────────────────────────

export const srsItems = pgTable("srs_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceLessonId: uuid("source_lesson_id").references(() => lessons.id, {
    onDelete: "set null",
  }),
  // nullable fk to conversation_sessions (added per FEATURE_spec §6)
  sourceSessionId: uuid("source_session_id"),
  itemType: srsItemTypeEnum("item_type").notNull(),
  prompt: text("prompt").notNull(),
  answer: text("answer").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(1),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  repetitions: integer("repetitions").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
});

// ─── Weak spots ────────────────────────────────────────────────────────────

export const weakSpots = pgTable("weak_spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  evidenceCount: integer("evidence_count").notNull().default(1),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// ─── Placement attempts ────────────────────────────────────────────────────

export const placementAttempts = pgTable("placement_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: placementTypeEnum("type").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Array of { item_id, response, correct }
  items: jsonb("items").notNull().default([]),
  estimatedCefr: cefrLevelEnum("estimated_cefr"),
  // { reading, listening, writing, speaking } each a cefr_level string
  skillBreakdown: jsonb("skill_breakdown").notNull().default({}),
});

// ─── AI sessions (in-lesson role-play and grammar Q&A) ────────────────────

export const aiSessions = pgTable("ai_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: aiSessionTypeEnum("type").notNull(),
  lessonId: uuid("lesson_id").references(() => lessons.id, {
    onDelete: "set null",
  }),
  // Array of { role: 'user'|'assistant', content: string, timestamp }
  messages: jsonb("messages").notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

// ─── Adaptive Level Assessment ────────────────────────────────────────────

export const levelEvidence = pgTable("level_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  skill: skillEnum("skill").notNull(),
  source: evidenceSourceEnum("source").notNull(),
  // UUID of the source row (placement_attempts, lessons, conversation_sessions, etc.)
  sourceRefId: uuid("source_ref_id"),
  impliedLevelNumeric: real("implied_level_numeric").notNull(),
  weight: real("weight").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const levelEstimates = pgTable(
  "level_estimates",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skill: skillEnum("skill").notNull(),
    currentLevel: cefrLevelEnum("current_level").notNull(),
    weightedAvg: real("weighted_avg").notNull(),
    confidence: real("confidence").notNull().default(0),
    evidenceCount30d: integer("evidence_count_30d").notNull().default(0),
    lastChangedAt: timestamp("last_changed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skill] })]
);

export const levelChanges = pgTable("level_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  trigger: levelChangeTriggerEnum("trigger").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // { reading, listening, writing, speaking, overall } each a cefr_level string
  previousLevels: jsonb("previous_levels").notNull(),
  newLevels: jsonb("new_levels").notNull(),
  evidenceSnapshot: jsonb("evidence_snapshot").notNull().default({}),
  userAcknowledged: boolean("user_acknowledged").notNull().default(false),
});

// ─── Conversaciones ────────────────────────────────────────────────────────

export const conversationSessions = pgTable("conversation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicUserInput: text("topic_user_input").notNull(),
  topicNormalised: text("topic_normalised").notNull().default(""),
  cefrLevelAtStart: cefrLevelEnum("cefr_level_at_start").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  userTurnCount: integer("user_turn_count").notNull().default(0),
  userWordCount: integer("user_word_count").notNull().default(0),
  profesoraWordCount: integer("profesora_word_count").notNull().default(0),
  estimatedCefrThisSession: cefrLevelEnum("estimated_cefr_this_session"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
  recapJson: jsonb("recap_json"),
  flaggedByUser: boolean("flagged_by_user").notNull().default(false),
  flagReason: text("flag_reason"),
});

export const conversationTurns = pgTable("conversation_turns", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => conversationSessions.id, { onDelete: "cascade" }),
  turnNumber: integer("turn_number").notNull(),
  speaker: speakerEnum("speaker").notNull(),
  textEs: text("text_es").notNull(),
  textEnTranslation: text("text_en_translation"),
  audioUrl: text("audio_url"),
  sttConfidence: real("stt_confidence"),
  pronunciationScores: jsonb("pronunciation_scores"),
  assessmentJson: jsonb("assessment_json"),
  tipShown: boolean("tip_shown").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Back-reference FK: srs_items → conversation_sessions ─────────────────
// Done as a separate constraint because conversation_sessions is defined after srs_items.
// Drizzle resolves this at migration time; the actual FK is in the migration SQL.
