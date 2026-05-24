# Feature Spec: Conversaciones — Free Speaking Sessions with La Profesora

> **Companion document to** `PRD_spanish_learning_app.md` and `AGENT_spec_spanish_professor.md`. Defines a new core feature that lets users practice speaking on any topic they choose, with real-time feedback and a post-session recap.

> **Status:** Adds to PRD §6 (feature spec) and PRD §11 (phasing). See §10 of this document for exact PRD changes.

---

## 1. Why this matters

The existing AI tutor in the PRD is tied to specific lesson scenarios — useful, but it constrains the learner to topics the curriculum offers. Real fluency comes from talking about what's actually in your head: your weekend, the film you just watched, an argument with your landlord, your work, your interests.

This feature gives the user a **self-directed speaking surface** — like having a Spanish-speaking friend on tap who corrects you gently when it matters. It's the single feature most likely to move users from "I can do lessons" to "I can hold a conversation".

It's also the feature most likely to drive retention, because it's open-ended: there's always a next conversation.

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. ENTRY                                                    │
│  User taps "Conversación" in the main nav.                  │
│  Screen shows: "¿De qué quieres hablar?"                    │
│  + free-text input                                           │
│  + 4 suggested topics (level-appropriate, personalised)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SETUP (one Profesora turn)                              │
│  Profesora reads the topic, asks one clarifying question    │
│  if needed, sets the scene, asks the first real question.   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CONVERSATION LOOP                                        │
│  ↓ User holds-to-talk, speaks ES                            │
│  ↓ Audio → Whisper → transcript (shown to user)             │
│  ↓ Single Claude call: assess + respond                     │
│  ↓ If feedback warranted: inline "tip" card appears         │
│  ↓ Profesora's reply: text + TTS audio (autoplay)           │
│  ↑ Repeat                                                    │
│                                                              │
│  Sidebar: running word count, time elapsed,                  │
│  toggles for "show all corrections" / "translate"           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. END SESSION                                              │
│  User taps "Terminar conversación".                          │
│  Profesora gives a graceful in-conversation goodbye.        │
│  Then:                                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RECAP                                                    │
│  Single screen showing:                                      │
│  - Topic & duration                                          │
│  - Bar chart: words spoken (you vs profesora)               │
│  - 2-3 strengths ("You used the past tense well")           │
│  - 2-3 improvement areas with examples FROM THIS session    │
│  - New vocab → added to SRS deck                            │
│  - Estimated CEFR performance level for this session        │
│  - "Practice these tomorrow" → links to relevant grammar    │
│  Buttons: "New conversation" | "Back to dashboard"          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Requirements

### 3.1 Topic input (Step 1)

- Free-text field, Spanish or English accepted. The Profesora will respond in Spanish either way.
- 4 suggested topic chips, generated server-side per user. Examples:
  - Based on user's stated goals (`work` → "Cuéntame sobre tu trabajo")
  - Based on a recent lesson ("Practice ordering at a bar like in your last lesson")
  - Based on a weak spot ("Practice using *por* vs *para*")
  - A random "fun" topic ("Recomiéndame una película española")
- "Surprise me" button → server picks a random topic for the user's level.
- Topics involving real-life sensitive issues (mental health, abuse, etc.) are gracefully redirected: see §7.

### 3.2 Setup turn (Step 2)

The Profesora's first message must:
- Acknowledge the topic warmly in 1 sentence.
- Optionally ask one clarifying question to focus the conversation (only if topic is broad).
- End with a concrete, open-ended question the learner can answer at their level.
- Be calibrated to the user's CEFR level (vocabulary, sentence length, grammar).

Example for an A2 user who wrote "I want to talk about my weekend":
> "¡Qué buena idea! Me encanta hablar de los fines de semana. Cuéntame, ¿qué hiciste este fin de semana? ¿Hiciste algo divertido?"

(Note: simple past, simple vocab, short sentences — A2-appropriate.)

### 3.3 Conversation loop (Step 3)

**Input mode:**
- Primary: hold-to-talk button (mobile-style, even on web). Shows live waveform.
- Fallback: keyboard input toggle. Useful for noisy environments and accessibility.

**Speech-to-text:**
- **Recommended:** Azure Speech Services with `es-ES` locale **and Pronunciation Assessment enabled**.
- Why not Whisper alone: Whisper is great for transcription but doesn't give phoneme-level pronunciation scores. Azure returns accuracy / fluency / completeness scores per word and per phoneme, which we feed into the assessment.
- Whisper as fallback if Azure cost becomes an issue.

**Transcript display:**
- User's transcript appears in the chat immediately after speech ends.
- The user can tap the transcript to re-record (in case Whisper got it wrong).

**The single assessor-responder Claude call:**
After each user turn, ONE Claude Sonnet call does both jobs (see §4 for the full schema):
1. Assesses the user's last turn (grammar, vocab, pronunciation if signals present, register)
2. Decides if a tip is worth showing (see §3.4 for the threshold)
3. Generates the next Profesora reply at the user's CEFR level

**Streaming:**
The response streams. The "tip" card (if any) renders first, then the Profesora's reply starts streaming below it. TTS audio plays as the reply stream completes.

**TTS:**
- ElevenLabs Castilian voice (same one used in lessons, for consistency).
- Cached aggressively — same Profesora phrases ("muy bien", "exacto", "entiendo") get reused across users.

### 3.4 When to show feedback (the critical design call)

**Default behaviour: don't interrupt unless it matters.**

The assessor evaluates the user's turn against four bars:

| Bar | Show a tip? |
|---|---|
| Error affects meaning or comprehension | **Yes** |
| Error is the user's known weak spot (from their profile) | **Yes** |
| Error is a level-appropriate teachable moment | **Yes** |
| Error is a minor accent slip, hesitation, or self-corrected mistake | **No** |
| User's turn is fluent and correct | **No (give a positive ack instead, occasionally)** |

This is encoded explicitly in the assessor's system prompt with examples.

**User override:** A toggle in the conversation sidebar — "Mostrar todas las correcciones" — lets advanced users see every minor flag. Default off.

**Tip card UI:** subtle, not alarming.
```
┌──────────────────────────────────────────────┐
│ 💡 You said: "Yo soy cansado"                │
│   Try: "Yo estoy cansado"                    │
│   In Spain, *estar* is used for temporary    │
│   states like feeling tired.                  │
│   [Got it]  [Tell me more]                   │
└──────────────────────────────────────────────┘
```

"Tell me more" expands into a longer explanation (calls the same grammar-explain endpoint from the original PRD).

### 3.5 CEFR-level adherence (Profesora's speech)

The Profesora MUST stay at the user's current CEFR level. Concretely:
- A1: present tense, ~500-word vocabulary, sentences ≤8 words, no idioms.
- A2: + past tenses (preterite + imperfect), ~1500 words, sentences ≤12 words, very common idioms only.
- B1: + future, conditional, subjunctive basics, ~3000 words, idiomatic expressions OK with context.
- B2: + full subjunctive, advanced connectors, ~5000 words, abstract topics OK.
- C1/C2: full register flexibility.

The system prompt enforces this with explicit examples. The Reviewer agent (§5) audits a sample of conversations weekly to catch drift.

### 3.6 Session length

- No hard cap, but a soft suggestion at 20 minutes: "Llevamos 20 minutos hablando. ¿Quieres continuar o terminar?"
- Daily cap per user: 60 minutes of conversation (cost control). Configurable. After cap: "Has hablado mucho hoy. ¡Vuelve mañana!"
- Auto-end after 2 minutes of silence with no input.

### 3.7 Recap (Step 5)

Generated by a single Claude call given the full session transcript + the assessment metadata accumulated during the session. See §4.2 for the schema.

Recap content:
- **Topic & duration**
- **Word counts:** user vs Profesora (chart)
- **2–3 specific strengths** with one quoted example from the session each
- **2–3 specific improvement areas**, each with:
  - The actual phrase the user said
  - The corrected version
  - A short explanation
  - Link to the relevant grammar reference entry
- **New vocabulary used or introduced** — auto-added to SRS deck (user can deselect any)
- **Estimated CEFR performance** for *this session* (not a permanent level change). E.g., "Your speaking this session was around A2. Your current level is A2, so right on track." — or "Your speaking this session was around B1, above your current A2 level. Keep this up and we'll bump your level."
- **One-tap "Practice these tomorrow"** action that adds the improvement areas as targeted SRS items.

---

## 4. AI Architecture

### 4.1 The Assessor-Responder agent (per-turn)

**Model:** Claude Sonnet 4.5
**Input context per turn (~2-4k tokens):**
- System prompt (see below)
- User's CEFR level + skill breakdown + known weak spots
- Castilian Authenticity Rubric (compressed)
- Conversation history so far (last ~10 turns to manage tokens)
- The user's latest turn: transcript text + pronunciation signals from Azure (low-confidence words, phoneme scores)

**Output (structured JSON via tool use):**
```json
{
  "assessment": {
    "user_turn_es": "Yo soy muy cansado hoy",
    "needs_tip": true,
    "tip": {
      "type": "grammar",
      "severity": "medium",
      "original": "Yo soy cansado",
      "correction": "Yo estoy cansado",
      "explanation_en": "In Spain, use 'estar' for temporary states like tiredness. 'Ser' is for permanent traits.",
      "linked_grammar_topic": "ser-vs-estar"
    },
    "positive_observation": null,
    "tags_used_correctly": ["present-tense-yo"],
    "tags_struggled_with": ["ser-vs-estar"],
    "pronunciation_notes": [
      {"word": "cansado", "phoneme_issue": "n/a", "score": 92}
    ],
    "vocab_introduced_by_user": ["cansado"],
    "estimated_turn_cefr": "A2"
  },
  "next_message_es": "Vaya, qué pena. ¿Por qué estás cansado? ¿Has dormido poco?",
  "next_message_en_translation": "Oh, what a shame. Why are you tired? Did you sleep little?",
  "next_message_audio_chunks": null,
  "session_should_continue": true
}
```

**System prompt (excerpt):**
```
You are "La Profesora" — a Castilian Spanish teacher having an open conversation
with an adult expat learner in Spain.

YOUR PRIMARY JOB: Have a real, warm, natural conversation in Castilian Spanish.
Make the user feel heard. Ask follow-up questions. Show interest.

YOUR SECONDARY JOB: Notice teaching moments without being a pedant.

LEVEL DISCIPLINE
The user is at CEFR level {{level}}. Your replies MUST be at this level.
- Vocabulary, grammar, and sentence length must match the level chart.
- You may introduce ONE new word per turn if it's natural and you'd explain
  it in context — but never above level +1.
- If the user goes above their level, follow their lead and reinforce.

FEEDBACK DISCIPLINE
After every user turn, decide: is there a tip worth showing?

SHOW a tip if:
  - The error affects meaning or comprehension.
  - The error is in their known weak spots: {{weak_spots}}.
  - It's a high-value teaching moment for their level.

DON'T show a tip if:
  - It's a minor accent slip or hesitation.
  - They self-corrected.
  - The error is far above their current level.
  - They're already mid-flow on a good answer — don't interrupt momentum.

The DEFAULT is silence + a great conversational reply. Tip only when needed.

CASTILIAN AUTHENTICITY
You are a Spaniard. You use vosotros, you say "vale" and "venga" and "majo",
you say "coche" not "carro", "móvil" not "celular". Your warmth is direct
and a bit dry, not effusive. You don't call the user "honey" or "sweetie".

You output strict JSON matching the provided schema. Always include the user
turn in the assessment so the recap can reference it later.
```

**Estimated cost per turn:** ~$0.005 (Sonnet, ~2k input + ~500 output). A 20-turn conversation costs ~$0.10.

### 4.2 The Recap agent (end of session)

**Model:** Claude Sonnet 4.5
**Input:** the full session transcript + accumulated assessment metadata.

**Output (JSON):**
```json
{
  "topic": "El fin de semana del usuario",
  "duration_minutes": 14,
  "turns": 22,
  "user_word_count": 412,
  "profesora_word_count": 380,
  "estimated_cefr_this_session": "A2",
  "level_observation": "right_on_track",
  "strengths": [
    {
      "area": "Use of past tense",
      "evidence_quote": "El sábado fui al cine con mis amigos"
    },
    {
      "area": "Vocabulary about leisure",
      "evidence_quote": "Una peli muy interesante"
    }
  ],
  "improvements": [
    {
      "area": "Ser vs estar with feelings",
      "evidence_quote_user": "Yo soy cansado",
      "suggested": "Yo estoy cansado",
      "explanation": "...",
      "linked_grammar_slug": "ser-vs-estar"
    }
  ],
  "new_vocab_for_srs": [
    {"term": "agotado/a", "translation": "exhausted", "context_used": "..."}
  ],
  "weak_spots_to_update": [
    {"tag": "ser-vs-estar", "evidence_count_delta": 1}
  ],
  "suggested_next_topic": "Practica describir tus emociones"
}
```

**Estimated cost per recap:** ~$0.02.

---

## 5. The Reviewer Agent for Conversations (quality assurance)

Unlike scripted lessons, conversations can't be pre-reviewed. We sample.

**Weekly job:** picks 1% of completed sessions at random, runs them through a Reviewer agent that checks:
- Did the Profesora stay at the user's CEFR level throughout?
- Did the Profesora use Castilian only (no Latin Americanisms)?
- Was feedback well-calibrated (not too nitpicky, not too lax)?
- Were tips accurate (the "correction" is actually correct)?
- Were recaps faithful to what happened in the conversation?

Output is a quality report the founder reviews monthly. Patterns of failure feed back into prompt improvements.

---

## 6. Data Model Additions

Add to the schema in PRD §9.2:

```
conversation_sessions
  id (uuid)
  user_id
  topic_user_input (text)             -- what user typed
  topic_normalised (text)             -- what Profesora ran with
  cefr_level_at_start
  started_at
  ended_at
  duration_seconds
  user_turn_count
  user_word_count
  profesora_word_count
  estimated_cefr_this_session
  cost_usd (numeric)                  -- for monitoring
  recap_json (jsonb)                  -- full recap output
  flagged_by_user (bool)
  flag_reason (text, nullable)

conversation_turns
  id
  session_id
  turn_number
  speaker (enum: user | profesora)
  text_es
  text_en_translation (nullable)
  audio_url (nullable)                -- recorded user audio OR generated profesora audio
  stt_confidence (float, nullable)
  pronunciation_scores (jsonb, nullable)  -- Azure phoneme-level
  assessment_json (jsonb, nullable)   -- the per-turn assessor output, on user turns
  tip_shown (bool)
  created_at
```

Existing tables to update:
- `srs_items`: add `source_session_id` (nullable fk) to support items added from conversations
- `weak_spots`: keep as-is; conversations contribute via `evidence_count`

---

## 7. Safety & Edge Cases

| Case | Handling |
|---|---|
| User picks a sensitive topic (mental health, abuse, suicidal thoughts) | Profesora gently acknowledges and redirects: "Eso suena difícil. Yo soy una profesora de español, no puedo ayudarte con esto, pero hay personas que sí pueden — [resource link in EN]. ¿Quieres que hablemos de otra cosa?" Server-side classifier on topic input catches obvious cases pre-session. |
| User goes off-topic into prompt-injection ("ignore your instructions") | Profesora stays in character; responds in Spanish at the user's level, gently redirects to learning. |
| User curses / uses vulgar Spanish | Profesora is unfazed (Spaniards are not prudish), may note the register casually if it's a teachable moment. Does not match the register itself. |
| User speaks for 5 seconds, says nothing intelligible | STT returns low confidence; tip card invites them to re-record. |
| User speaks in English | Profesora gently asks them to try in Spanish, gives a sentence starter to help: "¿Cómo lo dirías en español? Puedes empezar con 'Yo creo que...'" |
| User asks Profesora to translate something | Profesora translates briefly, then steers back to conversation: "Eso se dice 'X'. ¿Y tú, has tenido que decir eso alguna vez en España?" |
| User picks a wildly above-level topic (philosophy at A1) | Profesora picks an angle they can handle at their level: "¡Qué interesante! Empecemos con algo concreto. ¿Tienes una rutina diaria que sigues?" |
| Cost runaway (user talks for 3 hours) | Daily cap enforced server-side (default 60 min). Long sessions warn at 20/40/55 min marks. |
| Multiple users hitting the API hard at once | Queue + rate limit per user; Profesora can say "Estoy pensando..." while waiting if needed (avoid silence). |

---

## 8. Privacy & Storage

- **User audio recordings:** stored only for the duration of the session by default; deleted after recap is generated. Users can opt in to "Save my conversations" in settings, in which case audio is kept for 30 days for their own review.
- **Transcripts:** kept indefinitely (they're text, low storage cost) and used for weak-spot detection and personalisation. User can delete any session from their history.
- **Sampling for quality review:** explicitly disclosed in privacy policy. Sessions sampled for quality review are anonymised before any human sees them.

---

## 9. Success Metrics

Track from day one:

| Metric | Target |
|---|---|
| % of weekly active users who use Conversaciones at least once/week | >40% |
| Median session duration | 8–15 min |
| Median turns per session | 12–20 |
| % of tips marked "Got it" (vs ignored) | >70% |
| User-flagged session rate (incorrect tip, off-level reply, etc.) | <2% |
| Cost per session | <$0.20 |
| 7-day retention of users who complete ≥1 conversation in week 1 | +15 pp over users who don't |

---

## 10. Changes to the Original PRD

Apply these edits to `PRD_spanish_learning_app.md`:

### 10.1 Update §6 (Feature Specifications)
Add a new sub-section: **§6.9 Free Speaking Sessions (Conversaciones)** — refer to this document for the full spec.

### 10.2 Update §6.4 (AI Tutor)
Reframe slightly: the AI Tutor capabilities now appear in two surfaces:
- **In-lesson role-play** (existing) — bounded to the lesson's scenario
- **Free Conversaciones** (this doc) — open-topic, user-driven

The underlying agent is the same persona but with different system prompts and constraints.

### 10.3 Update §9.2 (Data Model)
Add `conversation_sessions` and `conversation_turns` tables per §6 of this document.

### 10.4 Update §9.3 (API Routes)
Add:
```
POST   /api/conversations/start           → create session, return setup turn
POST   /api/conversations/[id]/turn       → submit user turn (audio or text), get assessor+responder output (streamed)
POST   /api/conversations/[id]/end        → end session, generate recap
GET    /api/conversations/[id]/recap      → fetch recap
GET    /api/conversations/history         → list user's past sessions
POST   /api/conversations/[id]/flag       → user flags an issue
GET    /api/conversations/suggested-topics → 4 level-appropriate topic chips
```

### 10.5 Update §11 (Phasing)
Move into **Phase 2 (Learning Loop)** — Conversaciones is core to the value prop, not a polish-phase add-on. Specifically: build a text-only MVP of Conversaciones in Phase 2 (assess + respond + recap, no voice). Add voice (Azure STT + ElevenLabs TTS + pronunciation scoring) in Phase 3 alongside the in-lesson speaking exercises.

This shifts the Phase 2 deliverable from "AI tutor role-play (text only)" to "AI tutor surfaces (lesson role-play + Conversaciones), text-only".

### 10.6 Update §12 (Acceptance Criteria)
Add:
- [ ] A user can start a Conversación on any topic and complete a 10+ turn exchange at their CEFR level.
- [ ] Tips appear only when warranted by the rubric in §3.4 of the Conversaciones spec.
- [ ] The recap accurately reflects the session's content and adds appropriate items to SRS.
- [ ] Voice-mode Conversaciones return assessor-responder output within 4 seconds of user turn end.

### 10.7 Update §10 (NFRs)
Cost ceiling: revise from €0.15 to €0.25 per active user per day to accommodate Conversaciones cost. Real telemetry post-beta should refine this.

---

## 11. Build Sequence (for Claude Code)

Within Phase 2 (Learning Loop):

1. **Schema migrations** — `conversation_sessions`, `conversation_turns` (1 hour)
2. **Assessor-Responder agent** — prompt + Zod schema + Claude client wrapper, tested against 10 sample conversations (4 hours)
3. **Topic input + suggested topics endpoint** — including the topic safety classifier (3 hours)
4. **Conversation UI (text-only)** — chat surface, tip cards, streaming responses, sidebar with toggles (1 day)
5. **End session + Recap agent** — recap generation, recap UI, SRS integration, weak-spot updates (1 day)
6. **History view** — list past sessions, re-open recaps (3 hours)
7. **Founder admin sampling tool** — view random sampled sessions for quality review (3 hours)

**Phase 3 additions (voice):**
8. Azure Speech wiring — STT + Pronunciation Assessment (1 day)
9. Hold-to-talk UI + waveform + re-record flow (4 hours)
10. ElevenLabs TTS streaming for Profesora replies (4 hours)
11. Pronunciation tip integration into the Assessor agent (2 hours)
12. Cost monitoring + daily caps (3 hours)

**Total added scope:** ~5 working days in Phase 2 + ~3 working days in Phase 3.

---

## 12. Open Questions

1. **Should past Conversaciones be searchable/replayable?** Probably yes for users who opt in to save audio, but skip for MVP.
2. **Group conversations / role-plays with multiple AI characters?** (E.g., "You're at a tapas bar — talk to the camarero, the friend, and the stranger at the next table.") Defer to v2.
3. **Should Conversaciones contribute to CEFR level re-assessment?** Yes — accumulated `estimated_cefr_this_session` across recent sessions should be a signal in the re-assessment algorithm. Worth specifying separately.
4. **Voice cloning for ultra-low-latency TTS?** Not for MVP; ElevenLabs streaming should be fast enough (<2s to first audio chunk).
5. **Should the user be able to choose a Profesora persona** (different teaching styles, different regional accents)? Defer to v2 — single Castilian Profesora for MVP.
