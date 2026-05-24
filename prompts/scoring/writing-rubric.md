# Prompt: Writing Scorer

## Input
- `prompt_es`: the writing prompt given to the learner
- `user_response_es`: what the learner wrote
- `model_answer_es`: the model answer from the lesson
- `rubric_criteria`: array of strings — things the lesson spec says to check
- `cefr_level`: the learner's level

## Task
Score the learner's writing response and give specific feedback.

## Output (JSON)
```json
{
  "score": 0.0-1.0,
  "passed": true|false,
  "strengths": ["Used usted correctly for the landlord.", "Clear problem statement."],
  "corrections": [
    {
      "original": "La lavadora esta roto",
      "corrected": "La lavadora está rota",
      "explanation": "Missing accent on está; adjective must match feminine noun (rota, not roto)."
    }
  ],
  "overall_feedback_en": "1-2 sentence overall comment. Warm but honest.",
  "weak_spot_tags": ["ser-estar-adjective-agreement", "accent-marks"]
}
```

## Scoring scale
- **0.9–1.0**: Communicates clearly, minor surface errors only, appropriate register.
- **0.7–0.89**: Communicates but with noticeable errors. Message still gets through.
- **0.5–0.69**: Some communication but significant errors affect clarity.
- **< 0.5**: Doesn't achieve the communication goal of the prompt.

## Rules
- Score against the rubric_criteria first; then general correctness.
- For A1/A2: overlook C-level errors (subjunctive, complex clauses). Focus on agreement, tense, vocab.
- Never penalise for being brief — if the prompt asked for a WhatsApp message, a 2-sentence correct answer beats a 6-sentence broken one.
- Corrections: max 3. Pick the most important ones.
- weak_spot_tags: use the canonical tag slugs (e.g., "ser-vs-estar", "preterite-imperfect", "vosotros-conjugation").
