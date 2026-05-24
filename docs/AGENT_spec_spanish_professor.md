# Agent Specification: La Profesora — AI Spanish Professor System

> **Companion document to** `PRD_spanish_learning_app.md`. This replaces the "human Castilian Spanish teacher" assumption in Section 8 of that PRD and removes that as a launch blocker.

> **Purpose:** Define a multi-agent AI system that authors and reviews all curated lesson content for the Vivir app, grounded in the official Spanish curriculum. Output: ~66 production-quality lessons across A1–B2, plus the grammar reference library and placement test item bank, generated without a human Spanish teacher in the loop.

---

## 1. The Core Insight

We don't need a human Spanish teacher because we have the next best thing: **the curriculum a qualified Spanish teacher would follow**.

The **Plan Curricular del Instituto Cervantes (PCIC)** is the official curriculum published by Spain's national cultural institute. It explicitly defines, for each CEFR level (A1–C2), exactly which:
- Grammatical structures must be taught
- Functions (apologising, complaining, asking for directions...) must be covered
- Lexical fields (vocabulary domains) belong at that level
- Cultural references are expected
- Pragmatic/discourse skills are required

It's organised into **12 inventories per level**, freely accessible at `cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/`.

The PCIC is what any Spanish teacher in the world is *supposed* to teach to. If we ground our agent in the PCIC, the agent has more curricular precision than most human teachers do day-to-day.

---

## 2. Architecture: A Three-Agent Pipeline

Rather than one giant prompt, content is produced by a pipeline of specialised Claude calls. Each call has a narrow job and a clear contract. This is more reliable than a monolithic agent.

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  1. PLANNER        │ →  │  2. WRITER         │ →  │  3. REVIEWER       │
│  (Claude Haiku)    │    │  (Claude Sonnet)   │    │  (Claude Sonnet)   │
│                    │    │                    │    │                    │
│  Picks PCIC items, │    │  Generates the     │    │  Validates against │
│  builds lesson     │    │  full lesson:      │    │  PCIC + Castilian  │
│  outline           │    │  dialogue, vocab,  │    │  authenticity      │
│                    │    │  grammar, cultura  │    │  rubric            │
└────────────────────┘    └────────────────────┘    └────────────────────┘
                                                              │
                                            ┌─────────────────┴──────────────┐
                                            ▼                                ▼
                                   ┌─────────────────┐              ┌─────────────────┐
                                   │   PASS → save   │              │   FAIL → loop   │
                                   │   to content/   │              │   back to Writer│
                                   │   directory     │              │   with feedback │
                                   └─────────────────┘              └─────────────────┘
```

A fourth agent — **Cultural Authenticity Checker** — runs in parallel with the Reviewer and is specifically tuned to catch Latin-Americanisms and non-Spain expressions.

---

## 3. Knowledge Base: What the Agents are Grounded In

Before any lesson generation, build a small knowledge base in `/content/knowledge-base/`:

### 3.1 PCIC extracts (scraped/copy-pasted, cached locally)

For each CEFR level A1–B2, fetch and store the relevant inventories from Centro Virtual Cervantes:

| Inventory | URL pattern | Purpose |
|---|---|---|
| 1. Objetivos generales | `.../01_objetivos_relacion.htm` | High-level can-do per level |
| 2. Gramática | `.../02_gramatica_inventario.htm` | Required grammar |
| 3. Pronunciación y prosodia | `.../03_pronunciacion.htm` | Pronunciation focus |
| 4. Ortografía | `.../04_ortografia.htm` | Spelling/writing conventions |
| 5. Funciones | `.../05_funciones_inventario.htm` | Communicative functions |
| 6. Tácticas y estrategias pragmáticas | `.../06_tacticas.htm` | Pragmatics |
| 7. Géneros discursivos y productos textuales | `.../07_generos.htm` | Text types |
| 8. Nociones generales | `.../08_nociones_generales.htm` | General concepts vocab |
| 9. Nociones específicas | `.../09_nociones_especificas.htm` | Domain-specific vocab |
| 10. Referentes culturales | `.../10_referentes_culturales.htm` | Cultural references |
| 11. Saberes y comportamientos socioculturales | `.../11_saberes_y_comportamientos.htm` | Sociocultural behaviours |
| 12. Habilidades y actitudes interculturales | `.../12_habilidades_y_actitudes.htm` | Intercultural skills |

Store each as plain text/markdown under `/content/knowledge-base/pcic/{level}/{inventory-number}.md`.

> **Legal note:** PCIC content is © Instituto Cervantes. Cache it for the agent to reference, but **do not republish PCIC text verbatim** in user-facing app content. The agent uses PCIC as a *specification* of what to teach, and produces *original* lesson content from that spec.

### 3.2 Castilian Authenticity Rubric

A hand-curated reference list in `/content/knowledge-base/castilian-rubric.md` covering:

- **Always use:** vosotros (not ustedes for informal plural), tú (not vos), peninsular pronunciation cues
- **Spain vocabulary vs Latin America:** coche (not carro), móvil (not celular), ordenador (not computadora), patata (not papa), zumo (not jugo), piso (not departamento), conducir (not manejar), aparcar (not estacionar), etc. — a list of ~80 high-frequency divergences
- **Distinctively Spanish expressions:** vale, venga, guay, majo, currar, mola, qué fuerte, hostia (use carefully), de puta madre (vulgar but common), ya te digo, en plan, a ver, hala
- **Verb forms:** correct vosotros conjugations, present perfect preferred for recent past (he comido, not comí, for "I ate today")
- **Address patterns:** when tú vs usted is expected (Spain leans tú heavily; usted only for elderly, formal contexts, certain regions)
- **Phonetic features to note for audio:** ceceo/distinción (z and c+e/i pronounced as /θ/), aspiration of /s/ in southern regions (note but don't teach as standard)

This rubric is the spine of the Cultural Authenticity Checker agent.

### 3.3 Scenario Bank

A list of ~80 lesson scenario seeds, organised by domain × CEFR level. Each seed is a 1–2 sentence situation. Examples:

- *A1 / Daily life:* "You walk into a bar in Madrid at 11am and want a coffee and a small breakfast."
- *A2 / Housing:* "Your washing machine has broken. You need to write a WhatsApp to your landlady."
- *B1 / Work:* "You're freelance (autónomo) and need to ask your gestor a question about your trimestral tax filing."
- *B2 / Social:* "You're invited to a friend's family Sunday lunch and your friend's grandmother is interrogating you politely."

The founder writes/edits this list once. ~2 hours of work. It's the only "human input" the system needs and it requires no Spanish expertise — just life-in-Spain knowledge.

### 3.4 External corpora (optional but recommended)

For grounding cultural and linguistic authenticity, the agents can be given access to (via RAG or context injection):

- **Practica Español** by EFE news agency (`practicaespanol.com`) — free, designed for learners, written by Spanish journalists. Excellent for B1+ scenarios.
- **RTVE A la Carta** transcripts — Spain's public broadcaster (license check required before using audio).
- **Notes in Spanish** podcast (Spain-based, free intro episodes) — natural Madrid Spanish.
- **Real Academia Española (RAE)** dictionary `dle.rae.es` for definitional truth.
- **Fundéu RAE** (`fundeu.es`) for usage and style.

These are reference sources for the agent, not content to redistribute.

---

## 4. The Three Agents

### 4.1 Agent 1: The Curriculum Planner

**Model:** Claude Haiku 4.5 (cheap, fast, structured output)

**Job:** Given a scenario seed + CEFR level, produce a structured lesson outline that picks specific items from the PCIC inventories.

**Inputs:**
- Scenario seed (1–2 sentences)
- Target CEFR level (e.g., A2)
- Life domain (daily / work / social / housing)
- PCIC inventories for that level (provided in context)
- List of already-covered grammar/vocab (so we don't repeat)

**Output (JSON):**
```json
{
  "lesson_slug": "a2-housing-landlord-washing-machine",
  "title": "La lavadora está rota",
  "domain": "housing",
  "cefr_level": "A2",
  "objectives_pcic": [
    "Función 4.2: Pedir y dar ayuda",
    "Función 5.4: Expresar un problema"
  ],
  "grammar_focus": {
    "pcic_ref": "Gramática A2 §8.3",
    "topic": "estar + participio (resultado)",
    "rationale": "Needed to say 'is broken', 'is finished', etc."
  },
  "key_vocab_targets": [
    {"term": "la lavadora", "domain_field": "9.7 vivienda"},
    {"term": "estropearse / estar estropeado", "domain_field": "9.7 vivienda"},
    {"term": "el casero / la casera", "domain_field": "9.7 vivienda"},
    "..."
  ],
  "cultural_focus_pcic": [
    "Referente cultural §10.4: comunicación en la comunidad de vecinos",
    "Saber sociocultural §11.3: la mensajería instantánea con caseros (uso del WhatsApp)"
  ],
  "speaking_target": "Producir un audio breve explicando el problema",
  "writing_target": "Escribir un mensaje de WhatsApp a la casera"
}
```

**System prompt (excerpt):**
```
You are a curriculum planner for a Spanish-for-expats web app.
Your job is to produce a lesson outline grounded in the Plan Curricular del 
Instituto Cervantes (PCIC). 

You must:
1. Reference specific PCIC inventory items by section number.
2. Choose grammar appropriate to the target CEFR level — never above it.
3. Pick vocab that is high-frequency in Spain-specific contexts.
4. Identify one cultural element worth teaching.
5. Output strict JSON matching the schema provided.

You must not:
- Invent PCIC sections that don't exist (if unsure, omit the reference).
- Choose grammar above the learner's current level.
- Include Latin American vocabulary.
```

### 4.2 Agent 2: The Writer (La Profesora)

**Model:** Claude Sonnet 4.5

**Job:** Take the outline from the Planner and write the full lesson content.

**Inputs:**
- Planner output (the lesson outline JSON)
- PCIC extracts for the level
- Castilian Authenticity Rubric
- Lesson template (the 9-step structure from PRD §6.3)

**Output (JSON):** Full lesson content matching the lesson schema in `PRD §9.2`:
- Scene-setting text (EN + ES)
- Dialogue script with turn-by-turn ES text, EN translation, and pronunciation notes where relevant
- 3–5 comprehension questions with answers
- 6–10 vocab items with example sentences, gender/conjugation notes, and a Spain-specific usage note where the word differs from Latin America
- Grammar explanation in plain English (calibrated to the level — A1 explanations use no jargon; B2 can use "subjunctive trigger" etc.)
- 3 grammar practice items
- Writing prompt + a model answer + 3–5 things the grader should look for
- Speaking prompt + a model answer (used as reference for STT-based scoring)
- Cultura note (~80 words, ES facts in EN narrative voice)

**System prompt (excerpt):**
```
You are "La Profesora" — a Castilian Spanish teacher writing original lesson 
content for adult expat learners in Spain.

You teach Spanish-of-Spain only. Never use:
- vos or voseo
- ustedes for informal plural (use vosotros)
- Latin American vocabulary (see the Castilian Rubric)

Your dialogues sound like real Spaniards talking. They include the natural 
fillers (vale, venga, en plan, a ver), the regional rhythm, and the directness 
of Spanish communication. Avoid the over-polite register of textbook Spanish.

Your explanations of grammar are short, clear, and never above the learner's 
CEFR level. You write English explanations for English-speaking adults — 
intelligent, not condescending.

For every Spanish dialogue line, include:
- The natural Castilian text
- A natural English translation (not literal)
- Where relevant, a pronunciation hint (e.g., "the 'c' in 'gracias' sounds 
  like 'th' in 'think' here in Spain")

Cultura notes explain the *why* behind a Spanish habit — not the surface 
fact. Aim for the kind of insight that makes an expat go "oh, THAT's why 
they do that."
```

### 4.3 Agent 3: The Reviewer + Cultural Authenticity Checker

**Model:** Claude Sonnet 4.5

**Job:** Audit the Writer's output. Returns either `pass` with the lesson, or `fail` with specific issues that the Writer must fix.

**Inputs:**
- The full lesson content from the Writer
- The original planner outline (to check fidelity)
- Castilian Authenticity Rubric

**Checks (structured rubric):**

| # | Check | Pass criteria | Failure example |
|---|---|---|---|
| 1 | CEFR level adherence | All grammar in lesson is at or below target level | A2 lesson uses subjunctive |
| 2 | PCIC fidelity | Lesson covers the grammar_focus and key_vocab_targets from outline | Outline said "estar + participio", lesson teaches "ser + participio" |
| 3 | Castilian-only vocab | No Latin Americanisms in dialogue or vocab list | Uses "carro" instead of "coche" |
| 4 | Vosotros usage | If plural informal address appears, uses vosotros | Says "ustedes son" to a group of friends |
| 5 | Authenticity of dialogue | Dialogue uses natural fillers, doesn't sound like a textbook | All-formal back-and-forth like a phrasebook |
| 6 | Translation accuracy | English translations are natural, not literal | "Estoy en plan cansado" → "I'm in plan tired" |
| 7 | Cultura note depth | Note explains the *why*, not just the *what* | "Spaniards eat lunch late." (no why) |
| 8 | Writing/speaking rubric quality | Model answers exist and feedback criteria are specific | Generic "check for grammar" |
| 9 | Length & pacing | Lesson is 15–20 min of content | Dialogue is 40 turns long |
| 10 | Factual accuracy about Spain | References to Spanish life are correct | "Spaniards use Venmo" |

**Output (JSON):**
```json
{
  "verdict": "fail",
  "issues": [
    {
      "check": 3,
      "location": "vocab[5]",
      "found": "la papa",
      "expected": "la patata",
      "severity": "high",
      "suggestion": "Replace 'papa' with 'patata' — 'papa' is Latin American."
    },
    {
      "check": 7,
      "location": "cultura_note",
      "found": "Spaniards eat dinner at 9pm.",
      "severity": "medium",
      "suggestion": "Add the cultural reason: family schedules, working hours, late sunset in Spain's timezone."
    }
  ]
}
```

If `verdict: pass`, the lesson is saved. If `fail`, the Writer is called again with the issues array as input ("Fix these specific problems:") and the loop repeats up to 3 times. After 3 failures, the lesson is flagged for human spot-check.

---

## 5. The Pipeline (Operational View)

A single script `scripts/generate-lesson.ts` orchestrates one lesson:

```typescript
async function generateLesson(seed: ScenarioSeed): Promise<Lesson> {
  // 1. Plan
  const outline = await callPlanner(seed, getPcicExtracts(seed.level));
  
  // 2. Write + Review loop (up to 3 attempts)
  let lesson, review;
  for (let attempt = 0; attempt < 3; attempt++) {
    lesson = await callWriter(outline, review?.issues);
    review = await callReviewer(lesson, outline);
    if (review.verdict === 'pass') break;
  }
  
  if (review.verdict === 'fail') {
    await flagForHumanReview(lesson, review);
    return null;
  }
  
  // 3. Save
  await saveLesson(lesson);
  return lesson;
}
```

A batch script `scripts/generate-all-lessons.ts` iterates the full ~66-lesson scenario bank, generating in parallel with rate limiting.

**Cost estimate (one-time, full content set):**
- 66 lessons × ~$0.15 per lesson (Planner + ~1.5 Writer attempts + Reviewer) ≈ **$10 total**.
- Even with 10× retries the whole content base costs under $100. The constraint isn't money; it's the founder's spot-check time.

---

## 6. Spot-Check Workflow (the only human-in-the-loop step)

Even with the Reviewer agent, the founder should spot-check **at least 30% of generated lessons** before launch. This is not for Spanish expertise — it's for:
- Tone fit (does this sound like *your* app's voice?)
- Scenario realism (does the situation match what expats actually face?)
- Cultural balance (is the lesson Spain-positive without being touristy?)

A simple review UI in the admin panel:
- One lesson at a time, rendered as the learner would see it
- "Approve" / "Reject" / "Approve with edits" buttons
- A free-text comment field that flows back to the Reviewer's rubric (so common issues become rules over time)

After launch, in-app user flags ("This lesson seems wrong") feed the same workflow.

**For users who want a real teacher review later:** the architecture cleanly supports plugging a human reviewer into the pipeline as a fourth stage. Day one doesn't need it.

---

## 7. Placement Test Item Generation

The same pipeline generates the placement test item bank, with a different system prompt:

- Each item has a target CEFR level (the level it's testing for)
- Each item has a known answer
- Items come in types: MCQ grammar, listening comprehension (script + question), short writing prompt (with rubric), short speaking prompt
- Generate ~30 items per CEFR level (A1–B2), so ~120 items total
- Same Reviewer audit applies

---

## 8. Grammar Reference Library Generation

Generate one entry per PCIC grammar item per level (~200 entries total).

Each entry:
- Title (the grammar topic)
- One-paragraph plain-English explanation calibrated to that level
- 3 example sentences in Spain-Spanish contexts
- "Common mistakes English speakers make" section (2–3 items)
- Links to the lessons that use this grammar

Generation cost: ~$15 total.

---

## 9. Audio Strategy (Replacing Human Voice Actors)

Same problem as content: no human Spanish speakers available. Same solution: ground in authenticity.

**MVP plan: ElevenLabs Multilingual v2 with Castilian voices.**

- Voices: choose 4–6 distinct ElevenLabs voices tagged as Spanish (Spain). Test each for Castilian features (clear /θ/ for ce/ci/z, lack of seseo).
- Generate audio at lesson-generation time and cache in Supabase Storage.
- Each dialogue turn is a separate audio file (lets us highlight as it plays).
- Include a "Slow" version for each line by lowering ElevenLabs speed parameter to 0.8.
- Cost: ~$0.30 per minute of generated audio × ~3 min per lesson × 66 lessons ≈ **$60 total** for the core lesson audio.

**Quality watch-out:** AI Spanish voices can subtly drift to Latin American intonation. Generate samples first, listen with a native speaker friend if possible, and standardise on the 2–3 voices that pass the ear test.

**Upgrade path:** Once the app has revenue, hire a Spanish voice actor on Voice123/Voquent (€100–€500 per hour of audio) to re-record the core lessons. The data model already supports swapping audio without touching content.

---

## 10. Quality Assurance Process

| Stage | Quality gate | Owner |
|---|---|---|
| Generation | Reviewer agent rubric (10 checks) | Automated |
| Pre-launch | Founder spot-check ≥30% of lessons | Founder |
| Pre-launch | Native speaker ear test of audio samples (one friend, one evening) | Founder + friend |
| Beta | 20 expat beta users flag issues in-app | Users |
| Post-launch | Monthly review of flagged content | Founder |
| Quarterly | Re-run Reviewer on random 10% sample as the agent improves | Automated |

---

## 11. Failure Modes & Mitigations

| Failure mode | Likelihood | Mitigation |
|---|---|---|
| Agent generates plausible-but-wrong PCIC references | Medium | Reviewer checks; section-number validation against cached PCIC index |
| Subtle Latin-Americanism slips through (e.g., "tomar" where "coger" is more Spain-natural) | Medium | Expand Rubric over time from user flags; periodic full-corpus audit |
| Cultural notes feel touristy / outdated | Medium | Founder spot-check explicitly looks for this; rotate Cultura prompts |
| ElevenLabs voice sounds Latin American on certain phrases | High | Pre-launch ear test; pin to 2–3 best voices; flag/regen any line a user reports |
| Grammar explanations too dense for A1/A2 learners | Medium | Reviewer check #1 + a level-specific style guide for Writer prompt |
| Two lessons feel repetitive (same vocab/grammar) | Low | Planner is given list of already-covered items |
| User asks "who wrote this?" | Certain | Be honest: "Our lessons are AI-authored using the Instituto Cervantes curriculum framework, reviewed by our team." Don't claim a human teacher you don't have. |

---

## 12. Files Claude Code Should Create

```
/agents
  /spanish-professor
    planner.ts                # callPlanner()
    writer.ts                 # callWriter()  
    reviewer.ts               # callReviewer()
    pipeline.ts               # orchestration
    schemas.ts                # zod schemas for all agent I/O
/prompts
  /spanish-professor
    planner-system.md
    writer-system.md
    reviewer-system.md
    castilian-rubric.md       # the authenticity rubric in §3.2 above
/content
  /knowledge-base
    /pcic                     # cached PCIC extracts (one file per inventory per level)
    /scenarios.json           # the ~80 scenario seeds
  /lessons                    # output: generated lessons
    /a1
    /a2
    /b1
    /b2
  /grammar                    # output: generated grammar reference
/scripts
  fetch-pcic.ts               # one-time: scrape & cache PCIC inventories
  generate-lesson.ts          # one lesson on demand
  generate-all.ts             # batch the whole content set
  regenerate-flagged.ts       # re-run on user-flagged content
/admin
  /review                     # founder spot-check UI
```

---

## 13. What to Tell Users

Be transparent. On the "About" page:

> "Our lessons are written by an AI system grounded in the *Plan Curricular del Instituto Cervantes* — the official Spanish curriculum used by Spain's national language institute. Every lesson is auto-reviewed for CEFR accuracy and Castilian authenticity, then spot-checked by our team. We're building feedback into the app so you can flag anything that doesn't feel right — your corrections improve the next version for everyone."

This is honest, frames the AI authorship as a strength (curriculum-grounded), and invites users into the QA loop.

---

## 14. Sequence for Claude Code

Build in this order — each step is independently testable:

1. **`fetch-pcic.ts`** — scrape and cache the 12 inventories × 4 levels = 48 PCIC pages. Validate that each cached file is non-empty and has expected section structure. (Time: 1 hour)
2. **Castilian Rubric** — write the rubric file (`/prompts/spanish-professor/castilian-rubric.md`). Founder edits. (Time: 1–2 hours)
3. **Scenario bank** — write `/content/knowledge-base/scenarios.json` with ~80 seeds. (Time: 2 hours)
4. **Planner** — implement, test with 5 sample seeds, verify JSON outputs are sensible. (Time: 2 hours)
5. **Writer** — implement, test with the 5 planner outputs, eyeball quality. (Time: 3 hours)
6. **Reviewer** — implement, run on Writer outputs, verify it catches injected errors (e.g., manually break "patata" → "papa" and confirm Reviewer flags it). (Time: 3 hours)
7. **Pipeline** — wire all three together with retry loop. (Time: 1 hour)
8. **Audio generation** — wire ElevenLabs, generate audio for 5 lessons, ear-test. (Time: 2 hours)
9. **Batch run** — generate the full ~66-lesson set. Founder spot-checks 20. (Time: 1 day including spot-check)
10. **Admin review UI** — build the founder review interface. (Time: 1 day)
11. **Placement test items + Grammar reference** — same pipeline, different prompts. (Time: half day to set up, automated runs)

**Total to a full content set:** ~5 working days for Claude Code, plus ~1 day of founder spot-checking. End state: ~66 lessons, 120 placement items, ~200 grammar entries, all audio, all reviewed.

---

## 15. Why This Works (the meta-argument)

A human Castilian Spanish teacher, asked to design a CEFR-aligned curriculum for expats, would:
1. Pull out their copy of the PCIC,
2. Decide which scenarios fit each level,
3. Write the dialogues, vocab, grammar notes, and cultural tips,
4. Review their own work,
5. Have a colleague proof-check it.

That's exactly what this pipeline does — with the PCIC in context, with a writing agent, a review agent, and a founder doing colleague-proof spot-checks. The output quality won't beat a great human teacher, but it will exceed a mediocre one and **vastly exceed the alternative (a typical app whose content is written by someone who once took a Spanish class).**

The bigger advantage is iteration speed: when users flag issues, the Rubric gets updated and the next batch is better. A human teacher can't be retrained every week.
