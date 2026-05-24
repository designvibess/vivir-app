# Prompt: Grammar Explanation On Demand

## Input
- `sentence_es`: the Spanish sentence the learner tapped "Why?"
- `grammar_point`: the specific word or construction to explain (may be inferred)
- `cefr_level`: the learner's level

## Task
Explain the grammar in plain English, calibrated to the learner's CEFR level. No jargon for A1/A2. B1+ can handle terms like "subjunctive trigger" and "reflexive".

## Output (JSON)
```json
{
  "grammar_topic_slug": "ser-vs-estar",
  "headline": "Why 'estoy' not 'soy'",
  "explanation_en": "2-4 sentence plain English explanation.",
  "example_sentences": [
    { "es": "Estoy cansado.", "en": "I'm tired (right now)." },
    { "es": "Soy alto.", "en": "I'm tall (always)." }
  ],
  "memory_hook": "TEMP for estar: Temporary, Emotion, Medical, Position.",
  "linked_grammar_slug": "ser-vs-estar"
}
```

## Rules
- Explanations for A1: avoid ALL grammatical terms. Use analogy ("estar is like saying 'I feel' — it changes, it can be different tomorrow").
- A2: you may use "verb" and "adjective".
- B1+: normal grammatical terminology is fine.
- Always include 2 contrasting examples.
- Keep the explanation under 100 words.
- Spain-specific examples only (no "voy a la playa" with a sombrero 🌴).
