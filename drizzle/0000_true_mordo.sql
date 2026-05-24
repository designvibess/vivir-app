CREATE TYPE "public"."ai_session_type" AS ENUM('roleplay', 'grammar_q', 'feedback');--> statement-breakpoint
CREATE TYPE "public"."cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."domain" AS ENUM('daily_life', 'work', 'social', 'housing');--> statement-breakpoint
CREATE TYPE "public"."evidence_source" AS ENUM('placement', 'manual_retest', 'auto_retest', 'lesson', 'conversation', 'srs_summary');--> statement-breakpoint
CREATE TYPE "public"."level_change_trigger" AS ENUM('daily_job', 'manual_retest', 'auto_retest', 'placement');--> statement-breakpoint
CREATE TYPE "public"."placement_type" AS ENUM('initial', 'manual_retest', 'auto_retest');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('reading', 'listening', 'writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."speaker" AS ENUM('user', 'profesora');--> statement-breakpoint
CREATE TYPE "public"."srs_item_type" AS ENUM('vocab', 'grammar_pattern');--> statement-breakpoint
CREATE TABLE "ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "ai_session_type" NOT NULL,
	"lesson_id" uuid,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_user_input" text NOT NULL,
	"topic_normalised" text DEFAULT '' NOT NULL,
	"cefr_level_at_start" "cefr_level" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"user_turn_count" integer DEFAULT 0 NOT NULL,
	"user_word_count" integer DEFAULT 0 NOT NULL,
	"profesora_word_count" integer DEFAULT 0 NOT NULL,
	"estimated_cefr_this_session" "cefr_level",
	"cost_usd" numeric(10, 6),
	"recap_json" jsonb,
	"flagged_by_user" boolean DEFAULT false NOT NULL,
	"flag_reason" text
);
--> statement-breakpoint
CREATE TABLE "conversation_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"turn_number" integer NOT NULL,
	"speaker" "speaker" NOT NULL,
	"text_es" text NOT NULL,
	"text_en_translation" text,
	"audio_url" text,
	"stt_confidence" real,
	"pronunciation_scores" jsonb,
	"assessment_json" jsonb,
	"tip_shown" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"cefr_level" "cefr_level" NOT NULL,
	"title" text NOT NULL,
	"explanation_md" text DEFAULT '' NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_mistakes_md" text DEFAULT '' NOT NULL,
	CONSTRAINT "grammar_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"cefr_level" "cefr_level" NOT NULL,
	"domain" "domain" NOT NULL,
	"title" text NOT NULL,
	"scenario_description" text DEFAULT '' NOT NULL,
	"dialogue_script" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vocab_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grammar_focus_id" uuid,
	"cultura_note" text DEFAULT '' NOT NULL,
	"order_hint" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "level_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trigger" "level_change_trigger" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"previous_levels" jsonb NOT NULL,
	"new_levels" jsonb NOT NULL,
	"evidence_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_acknowledged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "level_estimates" (
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"current_level" "cefr_level" NOT NULL,
	"weighted_avg" real NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"evidence_count_30d" integer DEFAULT 0 NOT NULL,
	"last_changed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_estimates_user_id_skill_pk" PRIMARY KEY("user_id","skill")
);
--> statement-breakpoint
CREATE TABLE "level_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"source" "evidence_source" NOT NULL,
	"source_ref_id" uuid,
	"implied_level_numeric" real NOT NULL,
	"weight" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "placement_type" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_cefr" "cefr_level",
	"skill_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srs_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_lesson_id" uuid,
	"source_session_id" uuid,
	"item_type" "srs_item_type" NOT NULL,
	"prompt" text NOT NULL,
	"answer" text NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_feedback" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "user_lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid NOT NULL,
	"email" text,
	"is_guest" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cefr_level" "cefr_level" DEFAULT 'A1' NOT NULL,
	"skill_levels" jsonb DEFAULT '{"reading":"A1","listening":"A1","writing":"A1","speaking":"A1"}'::jsonb NOT NULL,
	"goals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"daily_minutes_target" integer DEFAULT 15 NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "weak_spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"evidence_count" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_session_id_conversation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_changes" ADD CONSTRAINT "level_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_estimates" ADD CONSTRAINT "level_estimates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_evidence" ADD CONSTRAINT "level_evidence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_attempts" ADD CONSTRAINT "placement_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_items" ADD CONSTRAINT "srs_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_items" ADD CONSTRAINT "srs_items_source_lesson_id_lessons_id_fk" FOREIGN KEY ("source_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weak_spots" ADD CONSTRAINT "weak_spots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;