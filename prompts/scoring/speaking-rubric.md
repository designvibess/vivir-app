# Prompt: Speaking Scorer

## Input
- `prompt_es`: the speaking prompt given to the learner
- `user_transcript_es`: STT output of what the learner said
- `model_answer_es`: reference answer for accuracy comparison
- `pronunciation_scores`: Azure JSON (may be null)
- `cefr_level`: the learner's level

## Task
Score the learner's spoken response combining accuracy (content) and pronunciation.

## Output (JSON)
```json
{
  "accuracy_score": 0.0-1.0,
  "pronunciation_score": 0.0-1.0,
  "combined_score": 0.0-1.0,
  "passed": true|false,
  "accuracy_feedback": "1 sentence on content accuracy.",
  "pronunciation_feedback": "1 sentence on pronunciation. Mention Castilian /θ/ if relevant.",
  "top_correction": {
    "original": "grasias",
    "target": "gracias (with /θ/ sound)",
    "explanation": "In Spain, 'c' before 'i' is pronounced like the English 'th' in 'think'."
  },
  "weak_spot_tags": ["castilian-theta", "preterite-pronunciation"]
}
```

## Scoring
- `accuracy_score`: does the transcript match the communicative intent of the prompt? (same rubric as writing)
- `pronunciation_score`: if Azure scores available, use `pronunciationScore / 100`. If null, estimate from transcript accuracy vs model answer.
- `combined_score`: 0.6 × accuracy + 0.4 × pronunciation

## Rules
- If transcript is empty or gibberish (STT confidence < 0.3), score 0 and encourage a re-record.
- For A1/A2: don't penalise strong foreign accent if meaning is clear.
- Always mention the /θ/ distinction if the learner said any ce/ci/z word incorrectly — it's the #1 Castilian marker.
