# PRD: Vivir — A Spanish Learning App for Life in Spain

> **Document purpose:** This PRD is written to be handed to Claude Code as the source-of-truth specification for building the MVP. It is opinionated about tech stack, data model, and feature boundaries so that implementation can begin without further clarification rounds.

> **Working name:** `Vivir` (placeholder — replace as you wish)

---

## 1. Executive Summary

Vivir is a web-first Spanish learning app for people who live, are moving to, or work remotely in Spain. Unlike gamified tap-the-translation apps, Vivir teaches **Castilian Spanish in the contexts users will actually encounter** — renting a piso, talking to a neighbour, ordering at a bar, navigating a work meeting, dealing with a community of owners (comunidad de vecinos).

The MVP blends **reading, writing, listening, and speaking** in every lesson, adapts to the learner's CEFR level (A1–C2) starting from a placement test, and is supported by an AI tutor that role-plays scenarios, scores pronunciation, explains grammar on demand, detects weak spots, and surfaces cultural context.

---

## 2. Product Goals & Non-Goals

### 2.1 Goals
1. Get an expat in Spain from "I can survive" to "I can live confidently" — measured by self-reported confidence in real scenarios.
2. Make every lesson **transferable to a real situation** within 48 hours of completing it.
3. Adapt content difficulty automatically as the learner improves (or struggles).
4. Provide a single coherent learning path, not an endless tree of disconnected exercises.

### 2.2 Non-Goals (explicit, to prevent scope creep)
- **Not Duolingo.** No streaks, no hearts, no leaderboards, no mascot, no gamification.
- **Not a phrasebook.** Practical, but always with grammar/structure scaffolding.
- **Not Latin American Spanish.** Castilian (Iberian) only — vosotros, vale, coger, etc.
- **Not bureaucracy-focused for MVP** (NIE/padrón/healthcare can come post-launch).
- **Not a community/social product** in MVP — no user-to-user features.

---

## 3. Target Users

Broad expat audience, three overlapping personas:

| Persona | Context | Primary need |
|---|---|---|
| **The Newcomer** | Recently moved to Spain (0–12 months) | Survive daily life; build basic confidence fast |
| **The Planner** | Moving in next 6–12 months | Pre-arrival foundation; reduce arrival friction |
| **The Settled Nomad** | Living in Spain 1+ years, plateaued at A2/B1 | Break through to genuine fluency; sound less foreign |

All three share: **adult learners, motivated, time-constrained, frustrated by toy apps.**

### 3.1 Practical Scenario Coverage (MVP)
Lessons and AI role-plays must cover these four life domains. **Bureaucracy is deferred to v2.**
- **Daily life:** shopping, restaurants/bars, transport, supermarket, pharmacy, doctor (general), gym
- **Work & professional:** meetings, emails, calls, coworking, freelance/autónomo basics, networking
- **Social & cultural:** neighbours, small talk, friendships, invitations, navigating sobremesa, regional customs
- **Housing & rentals:** apartment hunting, lease vocabulary, contacting landlords, comunidad de vecinos, utilities, repairs

---

## 4. Core Differentiators (what makes this not Duolingo)

1. **Scenario-first, not vocab-first.** Each lesson opens with a real situation ("Your landlord just messaged about a leaking pipe"), then teaches the language needed to handle it.
2. **Blended modality every lesson.** Every lesson includes reading, listening, writing, and speaking — not separate tracks.
3. **Cultural micro-context.** Each lesson includes a "Cultura" note explaining the *why* (e.g., why Spaniards say "venga" 14 times to end a phone call).
4. **AI tutor for unscripted practice.** Once a lesson is complete, learners can role-play the scenario in free-form chat/voice with the AI tutor.
5. **CEFR-honest progression.** Visible CEFR level, with transparent criteria for progression — not arbitrary "crowns".
6. **Castilian-authentic.** Vosotros, peninsular vocabulary, Iberian accents in audio.

---

## 5. User Journey (Happy Path)

```
Landing → Guest onboarding (3 questions: why learning, prior exposure, goals)
       → Placement test (~10 min, adaptive, outputs CEFR level)
       → Personalized learning path generated
       → Daily session: 1 scenario lesson (15–20 min) + SRS review (5 min)
       → Optional AI tutor role-play
       → Weekly progress dashboard review
       → Periodic re-assessment → level adjustment
```

Guest users can do everything for the first 7 days. After 7 days they're prompted (not forced) to create an account to persist progress.

---

## 6. Feature Specifications

### 6.1 Onboarding & Placement Test

**Onboarding (pre-test):** 3 questions max.
- Why are you learning? (multi-select: moving to Spain / already there / work / family / other)
- Have you studied Spanish before? (none / a little / some / a lot)
- Daily time commitment? (5/15/30/60 min)

**Placement test:** Adaptive, ~10 minutes, terminates early once a confident CEFR estimate is reached.
- Mix of: multiple choice grammar, listening comprehension (audio clip → question), short writing prompt (1–2 sentences, scored by Claude), one short speaking prompt (transcribed + scored).
- Starts at A2 questions; branches up to C1 or down to A1 based on accuracy.
- Output: CEFR level + skill breakdown (e.g., A2 overall, but B1 reading / A1 speaking).
- Result feeds the initial learning path.

**Re-assessment:** Triggered automatically every ~30 completed lessons, or manually by the user.

### 6.2 Learning Path

A linear-but-adaptive sequence of **scenario lessons** at the user's CEFR level.

- Each CEFR level has ~12–16 scenario lessons across the four life domains.
- The system picks the next lesson based on: weak skills detected, scenarios not yet covered, user's stated goals.
- Users can see the next ~3 lessons and optionally swap order.

### 6.3 Lesson Structure (consistent across all lessons)

Every lesson follows this structure (~15–20 min total):

1. **Set the scene** (~30s) — text + image describing the real situation
2. **Listen** (~3 min) — dialogue audio in Castilian Spanish, native speed, with optional slowed version and transcript toggle
3. **Comprehension check** (~2 min) — 3–5 questions on the dialogue
4. **Vocab in context** (~3 min) — 6–10 key terms from the dialogue, with example sentences
5. **Grammar focus** (~3 min) — one grammar point relevant to the scenario, with explanation + 3 practice items
6. **Write** (~3 min) — short writing prompt (e.g., "Reply to the landlord"), scored by Claude with feedback
7. **Speak** (~3 min) — record yourself doing one turn of the dialogue; scored on pronunciation + accuracy
8. **Cultura** (~1 min) — cultural note tied to the scenario
9. **Optional AI role-play** — extend the scenario into free-form practice with the AI tutor

### 6.4 AI Tutor (Claude-powered)

Five capabilities, all powered by the Anthropic API (Claude Sonnet for most, Haiku for lightweight tasks):

| Capability | When invoked | Implementation notes |
|---|---|---|
| **Conversational role-play** | After a lesson, or from "Practice" tab | Claude with a per-scenario system prompt; user can text or voice (STT → Claude → TTS); persists session per scenario |
| **Pronunciation feedback** | Speaking exercises | STT transcription compared to target; Claude scores fluency/accuracy and gives 1–2 specific corrections |
| **Grammar explanation on demand** | "Why?" button next to any sentence | Claude generates an explanation calibrated to user's CEFR level |
| **Personalized path / weak-spot detection** | Background, after every lesson | Lightweight Claude call summarises mistakes into "weak tags" (e.g., `ser-vs-estar`, `subjunctive-trigger-cuando`) stored on user profile; influences lesson selection |
| **Cultural context tips** | Inline in lessons + ad-hoc questions | Pre-written for core lessons; Claude-generated for ad-hoc user questions |

**Guardrails for AI tutor:**
- System prompt restricts to Spanish learning topics.
- Tutor maintains the user's current CEFR level in its replies (no C2 vocab for an A1 learner).
- All exchanges are logged for weak-spot detection.

### 6.5 Grammar & Tips Library

Browsable reference, not a feed.
- Organised by CEFR level and by grammar topic.
- Each entry: short explanation, 3+ examples in Spain-specific contexts, common mistakes, related lessons.
- Pulled in contextually when a lesson uses a topic (link from lesson → reference).

### 6.6 Spaced Repetition System (SRS)

- Every vocab item and grammar pattern introduced in a lesson enters the user's SRS deck.
- Algorithm: SM-2 (simple, well-understood) for MVP. Can swap to FSRS later.
- Daily review session (~5 min) surfaces due items.
- Mix of recognition (read/hear → meaning), production (meaning → produce), and contextual (fill in a sentence) prompts — drawn from the original lesson context, not isolated flashcards.
- Reminders: email or push (post-MVP); for web MVP, just a visible "X items due" indicator on dashboard.

### 6.7 Progress Dashboard

The only "engagement" surface in the app (per your decision: no gamification).

Shows:
- Current CEFR level with skill breakdown (reading / listening / writing / speaking)
- Lessons completed this week / month / total
- Scenarios mastered (by life domain)
- SRS retention rate
- Weak spots (top 3, with "Practice this" links)
- Time-on-task this week
- Next placement re-assessment due in N lessons

No streaks. No XP. No badges.

### 6.8 Authentication

- **Guest mode by default.** New users start learning immediately with progress stored in a server-side session keyed to a cookie.
- After 7 days OR 10 completed lessons (whichever first), a soft prompt: "Save your progress — create an account."
- Sign-up methods: email/magic-link only for MVP (no password). Google/Apple SSO is post-MVP.
- Guest → account conversion preserves all progress.

### 6.9 Free Speaking Sessions (Conversaciones)

Open-topic speaking practice with La Profesora. Users pick any topic, hold a free-form conversation at their CEFR level, receive in-line tips when warranted, and get a recap at the end that feeds the SRS and weak-spot system.

**Full specification:** see `FEATURE_spec_conversaciones.md`. Key points relevant to this PRD:
- Same Profesora persona as the in-lesson role-play, different system prompt and constraints.
- Text-only MVP built in Phase 2; voice (Azure STT + ElevenLabs TTS + pronunciation assessment) added in Phase 3.
- One Claude Sonnet call per turn does both assessment and reply (structured JSON output).
- Default behaviour: only show a tip when the error affects meaning, is in the user's known weak spots, or is a level-appropriate teachable moment. No nitpicking.
- Session ends with a recap that contributes to the Adaptive Level Algorithm (§6.10).

### 6.10 Adaptive Level Assessment

The CEFR level set at placement is the *starting point*, not a fixed verdict. The app continuously infers whether the learner is operating above, at, or below their stated level, and adjusts when the evidence is strong and sustained.

This section defines the algorithm. Goals:
1. **Honest.** A level change reflects real ability, not gamified progression.
2. **Stable.** No level thrashing — small fluctuations don't move the level.
3. **Skill-aware.** Reading, listening, writing, and speaking are tracked separately. Overall level is conservatively defined.
4. **Anti-gameable.** Users can't grind below-level content to inflate their level.
5. **Respectful.** Level-down events are framed as calibration, with a re-test offered before any change takes effect.

#### 6.10.1 Per-skill rolling estimate

For each user, for each of the four skills (reading, listening, writing, speaking), maintain:

- `current_level` — CEFR enum (A1–C2)
- `confidence` — float 0.0–1.0
- `last_changed_at` — timestamp of the most recent auto level change
- A rolling window of **evidence records** from the last 30 days

Numeric encoding for arithmetic: `A1 = 1.0, A2 = 2.0, B1 = 3.0, B2 = 4.0, C1 = 5.0, C2 = 6.0`. Fractional values (e.g., 2.4) represent "between A2 and B1, leaning A2".

#### 6.10.2 Evidence sources

| Source | Per-skill mapping | Weight | Notes |
|---|---|---|---|
| Placement test | All 4 skills (from `skill_breakdown`) | **1.0** | Highest weight; the ground truth at that moment |
| Manual re-test | All 4 skills | **1.0** | Triggered by user; same weight as placement |
| Lesson score (per-skill) | Maps to skill of exercise | 0.3–0.9 (see below) | Most common signal |
| Conversation `estimated_cefr_this_session` | Speaking (+ listening at 0.5x) | **0.4** | Inherently noisy; conservative weight |
| SRS retention rate (rolling 14d) | Vocab side of reading + writing | **0.3** | Weak but persistent signal |

**Lesson weight is a function of difficulty vs current level:**

```
let delta = lesson_level_numeric - current_level_numeric

if delta >= 1:    weight = 0.9 if score > 0.80 else 0.6   // above level: strong signal
if delta == 0:    weight = 0.7 if score > 0.85 else 0.5   // at level: moderate
if delta == -1:   weight = 0.3 if score > 0.90 else 0.15  // below level: weak
if delta <= -2:   weight = 0.0                            // ignored — anti-grind
```

This means a user who aces an above-level lesson moves the needle quickly; a user who aces twelve A1 lessons after being placed at A2 doesn't budge.

**Implied level per evidence:**
- Lesson at level X, score s: `implied = X + (s - 0.70) * 1.5` (so a 100% score implies 0.45 above the lesson level; 70% implies exactly the lesson level; below 50% pushes below)
- Conversation: `implied = estimated_cefr_this_session_numeric`
- SRS: `implied = current_level + (retention_rate - 0.80) * 2.5`

#### 6.10.3 Daily aggregation

A background job runs once per day for each active user:

```
for each skill in [reading, listening, writing, speaking]:
    evidence = load_records(user, skill, last_30_days)
    drop records older than 30 days
    
    if len(evidence) < 3:
        skip — not enough data
    
    # Time decay: recent evidence weighted more
    for each record:
        age_days = today - record.timestamp
        time_factor = exp(-age_days / 14)   # half-life ~10 days
        record.effective_weight = record.weight * time_factor
    
    weighted_avg = sum(r.implied_level * r.effective_weight) / sum(r.effective_weight)
    confidence = min(1.0, sum(r.effective_weight) / 5.0)   # ~5 weighted points = full confidence
    
    store rolling_estimate = {weighted_avg, confidence, evidence_count}
```

#### 6.10.4 Level-change rules

After the daily aggregation, decide whether to change the skill's `current_level`:

**Bump UP if all of:**
- `weighted_avg >= current_level_numeric + 0.6`
- `confidence >= 0.6`
- `evidence_count >= 5` in the last 14 days
- At least 14 days since `last_changed_at`
- At least 1 piece of evidence at level `current_level + 1` or above

**Bump DOWN if all of:**
- `weighted_avg <= current_level_numeric - 0.8` (asymmetric: bumping down requires stronger evidence)
- `confidence >= 0.7` (higher confidence required than bumping up)
- `evidence_count >= 5` in the last 14 days
- At least 21 days since `last_changed_at`

**Otherwise:** stay.

Bumping down is gated by an extra UX step (see §6.10.6): the user is offered a quick re-check test before any level decrease is applied. If they pass, no change. If they decline or fail, the change applies.

#### 6.10.5 Overall level

The user's user-facing `cefr_level` is set to **the minimum of the four skill levels**.

This follows the CEFR convention used by the Council of Europe and Instituto Cervantes: your level is the level you can sustain across all skills, not the level of your strongest skill. It's honest and prevents users from claiming a level they can't actually perform at.

The dashboard always shows the per-skill breakdown alongside the overall, so users see exactly which skill is holding them back and what to work on.

#### 6.10.6 User-facing experience

**Level-up:**
- User sees a one-screen moment on next app open: "You've moved up to A2. Here's what that unlocks."
- Brief, warm, no confetti — matches the no-gamification ethos of the app.
- New content domains, lessons, and conversation suggestions tagged at the new level become available immediately.

**Level-down (with re-check):**
- User sees a gentle prompt: "We've noticed you've been finding things tricky lately. Want to take a 5-minute check-in to make sure your level still fits?"
- If they take it and pass: no level change, evidence window is reset (treat as a fresh placement).
- If they take it and fail, or decline: level is adjusted, framed positively: "We've moved you back to A1 for now so the content stays helpful. You can re-test any time from settings."
- Never silently demote.

**Manual re-test (always available):**
- A 5–8 minute targeted re-test, available from the dashboard and settings.
- Tests around the user's *current* level and the two adjacent levels (one up, one down).
- Result fully overrides the rolling estimate (weight 1.0).
- Cooldown: at most once per 14 days, to prevent obsessive re-testing.

**Auto re-test offer:**
- Triggered automatically after 30 completed lessons OR if confidence has been below 0.4 for 7+ days.
- Soft prompt, not forced.

#### 6.10.7 Anti-gaming guards

- Lessons more than one level below current level contribute **zero weight** (see §6.10.2).
- A single perfect score doesn't move the needle — need at least 5 weighted evidence points.
- Conversations alone can't bump a level up: at least 40% of the evidence weight must come from sources other than conversations.
- SRS retention alone can't change a level: it's a confidence modifier, not a primary signal.

#### 6.10.8 Special triggers

Beyond the daily job, certain patterns trigger immediate offers:

- **Hot streak:** 5 consecutive lessons above current level with score >0.90 → offer a fast-track re-test.
- **Struggling:** 5 consecutive lessons at current level with score <0.50 → offer the gentle "want a check-in?" flow.
- **Stale level:** No level change in 60 days → suggest a manual re-test ("Curious if you've levelled up? Take a quick test.").

#### 6.10.9 Persistence and audit

Every level change writes a `level_change` audit row (see §9.2) with:
- The previous and new levels per skill
- The evidence snapshot that triggered the change
- The trigger type (auto, re-test, manual)

This lets the founder audit edge cases ("why did this user go from B1 → A2?") and supports a user-facing "level history" view post-MVP.

---

## 7. CEFR Framework Mapping

Visible levels: A1, A2, B1, B2, C1, C2. Each level has measurable criteria.

For MVP, build content for **A1, A2, B1, B2** (covers ~95% of expat learners). C1/C2 stub-only.

| Level | Lessons in MVP | Focus |
|---|---|---|
| A1 | 16 | Survival: greetings, ordering, basic transactions |
| A2 | 16 | Daily routines, simple narratives, plans |
| B1 | 14 | Opinions, work scenarios, problem-solving |
| B2 | 12 | Nuanced opinions, complex bureaucratic interactions, abstract topics |
| C1 | 4 (sample) | Idioms, register-switching |
| C2 | 4 (sample) | Subtle cultural nuance |

Total MVP lesson count: **~66 lessons**, each ~15–20 minutes.

---

## 8. Content Strategy: Hybrid

**Curated core (written by a human Castilian Spanish teacher, reviewed):**
- All ~66 lesson scenarios and dialogues
- Grammar reference library entries
- Cultura notes for core lessons
- Placement test item bank (~80 items)

**AI-generated on demand (Claude):**
- Role-play extensions of any lesson scenario
- Ad-hoc grammar explanations
- Writing/speaking feedback
- Variant practice exercises when SRS needs more material
- Cultural context answers to free-form questions

**Audio:**
- Core lesson dialogues: professionally recorded by native Castilian speakers (budget item — alternative: ElevenLabs voices with Spanish-Spain accent for MVP, replace with human recordings post-launch).
- TTS for ad-hoc AI tutor responses: ElevenLabs Castilian voices or Azure TTS.

**Speech-to-text:**
- OpenAI Whisper (large-v3) or Azure Speech with Spanish-Spain locale (`es-ES`).
- Used for placement test, speaking exercises, and voice role-play.

---

## 9. Technical Architecture

### 9.1 Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14+ (App Router) + React + TypeScript + Tailwind** | Fastest path to web MVP; easy to wrap in Capacitor or rebuild in React Native for mobile v2 |
| UI components | **shadcn/ui** | Clean, accessible, no design lock-in |
| Backend | **Next.js API routes + Server Actions** | One codebase; sufficient for MVP scale |
| Database | **Postgres via Supabase** | Includes auth, storage, realtime if needed; generous free tier |
| Auth | **Supabase Auth** with anonymous sessions + magic link | Handles guest → registered conversion natively |
| ORM | **Drizzle ORM** | Type-safe, lightweight, plays well with Next.js |
| AI | **Anthropic API (Claude Sonnet 4.5 + Haiku 4.5)** | Sonnet for tutor & feedback; Haiku for cheap calls like weak-spot tagging |
| STT | **OpenAI Whisper API** (`es` locale) | Best Spanish accuracy at low cost |
| TTS | **ElevenLabs** (Castilian voices) | High-quality Iberian accent |
| Audio storage | **Supabase Storage** | Co-located with auth/DB |
| Hosting | **Vercel** | Native Next.js host |
| Analytics | **PostHog** (self-host option) | Event tracking + session replay |

### 9.2 Data Model (core tables)

```
users
  id (uuid)
  email (nullable, for guest mode)
  is_guest (bool)
  created_at
  cefr_level (enum: A1..C2)
  skill_levels (jsonb: {reading, listening, writing, speaking})
  goals (jsonb)
  daily_minutes_target (int)

lessons
  id
  slug
  cefr_level
  domain (enum: daily_life | work | social | housing)
  title
  scenario_description
  dialogue_script (jsonb)
  vocab_items (jsonb)
  grammar_focus_id (fk grammar_topics)
  cultura_note (text)
  order_hint (int)

grammar_topics
  id
  slug
  cefr_level
  title
  explanation_md
  examples (jsonb)
  common_mistakes_md

user_lesson_progress
  user_id
  lesson_id
  started_at
  completed_at
  scores (jsonb: {comprehension, writing, speaking, vocab})
  ai_feedback (jsonb)

srs_items
  id
  user_id
  source_lesson_id
  item_type (enum: vocab | grammar_pattern)
  prompt
  answer
  ease_factor (float)
  interval_days (int)
  due_at (timestamp)
  repetitions (int)
  last_reviewed_at

weak_spots
  id
  user_id
  tag (string, e.g. 'ser-vs-estar')
  evidence_count (int)
  last_seen_at
  resolved_at (nullable)

placement_attempts
  id
  user_id
  type (enum: initial | manual_retest | auto_retest)
  started_at
  completed_at
  items (jsonb: array of {item_id, response, correct})
  estimated_cefr
  skill_breakdown (jsonb)

ai_sessions
  id
  user_id
  type (enum: roleplay | grammar_q | feedback)
  lesson_id (nullable)
  messages (jsonb)
  started_at
  ended_at

-- Adaptive Level Assessment (§6.10) --

level_evidence
  id
  user_id
  skill (enum: reading | listening | writing | speaking)
  source (enum: placement | manual_retest | auto_retest | lesson | conversation | srs_summary)
  source_ref_id (uuid, fk to source row)
  implied_level_numeric (float)   -- e.g., 2.4
  weight (float)                  -- 0.0–1.0 at insertion
  created_at

level_estimates
  user_id (pk)
  skill (enum, pk)
  current_level (CEFR enum)
  weighted_avg (float)
  confidence (float)
  evidence_count_30d (int)
  last_changed_at
  updated_at

level_changes
  id
  user_id
  trigger (enum: daily_job | manual_retest | auto_retest | placement)
  changed_at
  previous_levels (jsonb: {reading, listening, writing, speaking, overall})
  new_levels (jsonb: same shape)
  evidence_snapshot (jsonb)
  user_acknowledged (bool, default false)

-- Conversaciones (§6.9, full schema in FEATURE_spec_conversaciones.md §6) --

conversation_sessions
  id
  user_id
  topic_user_input (text)
  topic_normalised (text)
  cefr_level_at_start
  started_at
  ended_at
  duration_seconds
  user_turn_count
  user_word_count
  profesora_word_count
  estimated_cefr_this_session
  cost_usd (numeric)
  recap_json (jsonb)
  flagged_by_user (bool)
  flag_reason (text, nullable)

conversation_turns
  id
  session_id
  turn_number
  speaker (enum: user | profesora)
  text_es
  text_en_translation (nullable)
  audio_url (nullable)
  stt_confidence (float, nullable)
  pronunciation_scores (jsonb, nullable)
  assessment_json (jsonb, nullable)
  tip_shown (bool)
  created_at
```

### 9.3 Key API Routes

```
POST /api/onboarding/start       → creates guest user, returns session
POST /api/placement/next-item    → adaptive: returns next placement question
POST /api/placement/submit       → finalizes test, sets CEFR + skill_levels
GET  /api/path                   → returns next 3 lesson recommendations
GET  /api/lessons/[slug]         → lesson content
POST /api/lessons/[slug]/score-writing   → Claude scores writing input
POST /api/lessons/[slug]/score-speaking  → Whisper → Claude scores
POST /api/lessons/[slug]/complete        → records progress, updates SRS, tags weak spots, writes level_evidence
POST /api/tutor/roleplay         → streams Claude responses for free-form scenario
POST /api/tutor/explain          → grammar explanation on demand
GET  /api/srs/due                → returns due SRS items
POST /api/srs/review             → submit review result, update scheduling
GET  /api/dashboard              → aggregated stats for dashboard
POST /api/auth/upgrade-guest     → converts guest → registered user, preserves data

-- Conversaciones (§6.9) --
POST /api/conversations/start             → create session, return setup turn
POST /api/conversations/[id]/turn         → submit user turn (audio or text), get assessor+responder output (streamed)
POST /api/conversations/[id]/end          → end session, generate recap, write level_evidence
GET  /api/conversations/[id]/recap        → fetch recap
GET  /api/conversations/history           → list user's past sessions
POST /api/conversations/[id]/flag         → user flags an issue
GET  /api/conversations/suggested-topics  → 4 level-appropriate topic chips

-- Adaptive Level Assessment (§6.10) --
GET  /api/level/state                     → current per-skill levels, confidence, rolling stats
POST /api/level/retest/start              → start a manual or auto re-test
POST /api/level/retest/submit             → finalize re-test, apply level changes
POST /api/level/acknowledge-change/[id]   → user dismisses the level-change notification
GET  /api/level/history                   → audit log of past changes (post-MVP UI)
```

### 9.4 AI Prompt Architecture

Maintain a `/prompts` directory with versioned, structured prompts:

```
/prompts
  /tutor
    roleplay-system.md
    pronunciation-feedback.md
    grammar-explain.md
  /scoring
    writing-rubric.md
    speaking-rubric.md
  /placement
    item-grader.md
  /tagging
    weak-spot-tagger.md
```

Each prompt accepts structured input (user CEFR, scenario, etc.) and returns structured JSON output (via Claude tool use / structured outputs) where applicable.

### 9.5 Folder Structure (suggested)

```
/app                    # Next.js App Router
  /(marketing)
  /(app)
    /onboarding
    /placement
    /learn
    /tutor
    /grammar
    /dashboard
    /settings
  /api
/components
  /ui                   # shadcn primitives
  /lesson               # lesson-specific UI
  /tutor                # chat UI
/lib
  /ai                   # Anthropic, Whisper, ElevenLabs clients
  /srs                  # SM-2 implementation
  /cefr                 # level helpers
  /db                   # Drizzle schema + queries
/prompts                # versioned AI prompts
/content                # curated lesson content (MDX or JSON)
  /lessons
    /a1
    /a2
    ...
  /grammar
/tests
```

---

## 10. Non-Functional Requirements

- **Performance:** First Contentful Paint < 1.5s on 4G; lesson interactions feel instant (<200ms perceived latency for UI; AI calls show streaming).
- **Accessibility:** WCAG 2.1 AA. All audio has transcript fallback. Speaking exercises have a text-input alternative.
- **Privacy:** Voice recordings are processed in-flight and not stored beyond the session unless the user opts in to review. GDPR-compliant (users are EU-based by definition).
- **Cost ceiling:** Average cost per active user per day must stay under €0.25 (mostly AI + STT/TTS for Conversaciones). Use Haiku for cheap calls; cache TTS for core lessons; enforce per-user daily Conversación caps.
- **Offline:** Not required for MVP, but lesson content should be cacheable via Service Worker for poor-connection use.
- **Internationalization of UI:** UI in English for MVP. Lesson content is bilingual EN/ES by design.

---

## 11. MVP Scope & Phasing

### Phase 0: Foundations (Week 1–2)
- Repo setup, Next.js + Supabase + Drizzle scaffolding
- Auth flow (guest + magic link)
- Database schema deployed (including level_evidence, level_estimates, conversation_*)
- Anthropic, Whisper, Azure Speech, ElevenLabs clients wired up with smoke tests

### Phase 1: Placement & First Lesson (Week 3–4)
- Onboarding flow
- Placement test (item bank auto-generated by Spanish Professor agent — see `AGENT_spec_spanish_professor.md` §7)
- Single end-to-end A2 lesson (all 9 steps working)
- Basic dashboard skeleton
- Spanish Professor content pipeline operational (Planner + Writer + Reviewer)

### Phase 2: Learning Loop (Week 5–8)
- ~30 lessons content-ready (across A1/A2/B1, all four domains) via the content pipeline
- SRS system live (SM-2)
- AI tutor role-play in lessons (text only)
- **Conversaciones (text-only MVP)** — topic input, assessor-responder agent, recap generation (see `FEATURE_spec_conversaciones.md`)
- Weak-spot tagging
- **Adaptive Level Assessment** — daily job, level_evidence pipeline, level-change rules, manual re-test
- Grammar library (read-only)

### Phase 3: Voice & Polish (Week 9–11)
- Speaking exercises in lessons (Whisper + Claude scoring)
- **Voice-mode Conversaciones** — Azure STT + Pronunciation Assessment + ElevenLabs TTS streaming
- Full ~66-lesson content set generated and spot-checked
- Auto re-test offers (hot streak / struggling triggers)
- Dashboard complete (level history, confidence, breakdowns)

### Phase 4: Pre-launch (Week 12–13)
- Closed beta with 20 expats
- Analytics instrumented
- Iteration based on feedback
- Production launch

---

## 12. Acceptance Criteria (MVP done = these are true)

- [ ] A new user can land, take the placement test, and start their first lesson in under 12 minutes.
- [ ] All four life domains have lesson content at A1, A2, and B1.
- [ ] Every lesson exercises all four skills (read, listen, write, speak).
- [ ] AI tutor responds in role-play mode at the user's CEFR level.
- [ ] Pronunciation scoring returns a result within 5 seconds of recording.
- [ ] SRS surfaces due items daily and uses SM-2 scheduling correctly.
- [ ] Weak-spot detection demonstrably influences next-lesson selection.
- [ ] A user can start a Conversación on any topic and complete a 10+ turn exchange at their CEFR level.
- [ ] Conversación tips appear only when warranted by the rubric (no nitpicking) and the recap accurately reflects what happened in the session.
- [ ] Voice-mode Conversaciones return assessor-responder output within 4 seconds of user turn end.
- [ ] The daily level-assessment job runs, writes `level_evidence`, and applies level changes only when the rules in §6.10.4 are met.
- [ ] A user can trigger a manual re-test from the dashboard and have it override the rolling estimate.
- [ ] No silent level-downs — every level-down is gated by the gentle re-check flow.
- [ ] Lessons more than one level below current contribute zero weight to the level estimate (anti-gaming).
- [ ] Guest users can complete 10 lessons without an account, then convert without data loss.
- [ ] Dashboard shows skill breakdown, lessons completed, scenarios mastered, SRS retention, weak spots, and current level confidence.

---

## 13. Open Questions / Decisions Deferred Post-MVP

1. **Monetization model.** Marked "decide later". Likely landing point: freemium (free placement + ~10 lessons + limited AI; subscription for full library + unlimited AI). Revisit after beta usage data.
2. **Mobile.** Wrap with Capacitor for fast Android/iOS, or rebuild key flows in React Native? Decide once web MVP is in beta.
3. **Bureaucracy domain.** Add as a fifth life domain in v1.1.
4. **Community features.** Language-exchange matching, study groups — not before v2.
5. **Regional Spanish exposure.** Add an optional "Accents of Spain" track post-MVP.
6. **C1/C2 content.** Stubbed in MVP; build out after data shows demand.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI cost overrun | Use Haiku for cheap calls; cache aggressively; per-user daily caps on AI tutor minutes |
| Pronunciation scoring feels harsh/wrong | Calibrate carefully in beta; always pair score with specific positive feedback |
| Content authenticity questioned by native speakers | Have all core content reviewed by a Spain-based qualified Spanish teacher before launch |
| Whisper mis-transcribes accented learners | Always show transcript so users can spot errors; allow re-record |
| Guest data lost on cookie clear | Show clear "save your progress" prompts after lesson 3 and lesson 7 |

---

## 15. Appendix: Notes for Claude Code

When building from this PRD:

- Start with **Phase 0 → Phase 1** before any other work. A working placement test + one complete lesson is the smallest demonstration of the full thesis.
- Treat `/prompts` as a first-class part of the codebase, not an afterthought. Version it.
- Stub all AI calls behind a single client interface so they can be swapped (`AIProvider`) — useful for cost control and testing.
- Write the lesson schema as MDX or JSON with a strict Zod schema validator; content should be type-checked at build time.
- Build the AI tutor role-play as **streaming** from day one — it dramatically affects perceived quality.
- The dashboard is the heart of the engagement model since there's no gamification. Make it beautiful, not utilitarian.
