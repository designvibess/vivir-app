# Vivir — Project Kickoff for Claude Code

This is the starting point for building the Vivir Spanish learning app. Read this file first, then the three spec documents in the order below.

---

## Document Set

| # | Document | Purpose |
|---|---|---|
| 1 | `PRD_spanish_learning_app.md` | Main PRD: vision, features, data model, API surface, tech stack, phasing |
| 2 | `AGENT_spec_spanish_professor.md` | How AI generates all curated lesson content (lessons, placement test, grammar library) |
| 3 | `FEATURE_spec_conversaciones.md` | Free-form speaking practice feature: per-turn assessor + recap |

Read them in order. The PRD is the authoritative source; the other two expand specific subsystems referenced in the PRD.

---

## Tech Stack Summary

- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui
- **Database & auth:** Supabase (Postgres + Auth with anonymous sessions + magic link)
- **ORM:** Drizzle
- **AI:** Anthropic Claude (Sonnet 4.5 for quality calls, Haiku 4.5 for cheap calls)
- **STT:** Azure Speech Services (`es-ES`) with Pronunciation Assessment — primary; Whisper as fallback
- **TTS:** ElevenLabs Multilingual v2, Castilian voices
- **Hosting:** Vercel
- **Analytics:** PostHog

---

## Prerequisites the Founder Must Provide

Before Phase 0 can complete, the founder needs to obtain and supply these as environment variables:

```
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AZURE_SPEECH_KEY
AZURE_SPEECH_REGION
ELEVENLABS_API_KEY
POSTHOG_KEY
```

Plus:
- Vercel account
- Supabase project (free tier is fine for MVP)
- ElevenLabs voice ID(s) for chosen Castilian voices (test 4–6, pick 2–3 best — see `AGENT_spec_spanish_professor.md` §9)

The founder also needs to write the **Castilian Authenticity Rubric** (`/prompts/spanish-professor/castilian-rubric.md`) and the **Scenario Bank** (`/content/knowledge-base/scenarios.json`) — see `AGENT_spec_spanish_professor.md` §3.2 and §3.3. Both are non-technical and take ~3–4 hours total.

---

## Build Order (the 30-second version)

1. **Phase 0 (Weeks 1–2):** Scaffold + auth + schema + AI client wrappers
2. **Phase 1 (Weeks 3–4):** Spanish Professor content pipeline → generate placement test + 1 lesson → onboarding + placement + first lesson e2e
3. **Phase 2 (Weeks 5–8):** Generate ~30 lessons, SRS, lesson role-play, **text-only Conversaciones**, **Adaptive Level Algorithm**, weak-spot tagging, grammar library
4. **Phase 3 (Weeks 9–11):** Voice (speaking in lessons + voice Conversaciones), full ~66-lesson set, dashboard complete
5. **Phase 4 (Weeks 12–13):** Beta with 20 expats, iterate, launch

---

## Working Principles

- **Streaming everywhere AI is involved.** Perceived speed is a feature.
- **One client interface per external service** (`AIProvider`, `STTProvider`, `TTSProvider`) so they can be swapped and mocked.
- **Versioned prompts in `/prompts`** — treat as first-class code with tests.
- **Zod schemas on every AI structured output** — never trust a raw model response.
- **Content as data.** Lessons live in `/content/lessons/*.json` with a strict schema validator. The Spanish Professor pipeline writes here.
- **Daily cron jobs** for: level algorithm, weak-spot decay, SRS scheduling, weekly content quality sampling.
- **Per-user cost caps** for Conversaciones (default 60 min/day) and AI tutor (default 30 calls/day).

---

## When to Ask the Founder

Don't ask for clarification on:
- Tech stack choices (decided in PRD §9)
- Feature scope (decided in PRD §6, with extensions in the two companion docs)
- Phasing (decided in PRD §11)

Do ask the founder when:
- A specific API key or service account is needed and not yet provided
- A design choice on the Castilian rubric or scenario bank is ambiguous
- An open question marked in the PRD §13 needs resolving to unblock progress
- A cost projection suggests we'll exceed the €0.25/active-user/day ceiling

---

## Definition of MVP Done

See `PRD_spanish_learning_app.md` §12 — the full acceptance checklist. Ship when those are green and 20 beta users have completed at least 3 lessons + 1 Conversación each without blocking bugs.

Good luck. Build something an expat in Madrid will thank you for.
