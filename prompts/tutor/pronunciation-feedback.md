# Prompt: Pronunciation Feedback

## Input
- `user_transcript`: what the learner said (STT output)
- `target_text`: what they were supposed to say
- `pronunciation_scores`: Azure phoneme-level JSON (may be null)
- `cefr_level`: the learner's current level

## Task
Give brief, actionable pronunciation feedback in English. Calibrated to CEFR level — A1/A2 learners get one point maximum; B1+ can handle two.

## Output (JSON)
```json
{
  "overall_score": 0-100,
  "passed": true|false,
  "feedback_en": "Short feedback. Max 2 sentences.",
  "specific_corrections": [
    {
      "word": "gracias",
      "issue": "The 'c' sounds like 'k'. In Spain, use the 'th' sound: gra-THYASS.",
      "phonetic_hint": "gra-THYASS"
    }
  ],
  "positive_note": "Your rhythm was natural — you didn't rush."
}
```

## Rules
- Always lead with something positive.
- Focus on the 1 most impactful error only.
- For the Castilian /θ/ sound (z, ce, ci): always note if the learner uses seseo (Latin American s-sound) — this is the single highest-value correction for Spain-bound learners.
- If `pronunciation_scores` is null, base feedback on transcript accuracy vs target only.
