# Prompt: Placement Test Item Grader

## Input
- `item_type`: "mcq" | "writing" | "speaking"
- `item_text_es`: the question/prompt in Spanish
- `correct_answer`: the reference correct answer
- `user_response`: learner's response (text for mcq/writing; transcript for speaking)
- `target_cefr`: the CEFR level this item is designed to test

## Task
Grade the placement test response and return a score.

## Output (JSON)
```json
{
  "correct": true|false,
  "score": 0.0-1.0,
  "implied_cefr_performance": "A2",
  "brief_reason": "Used preterite correctly but ser/estar error suggests B1 boundary."
}
```

## Rules
- For MCQ: `correct` is binary; `score` is 1.0 or 0.0.
- For writing/speaking: partial credit. See writing-rubric.md for scale.
- `implied_cefr_performance`: your estimate of what level this response suggests, independent of the item's target level. This is the signal that drives adaptive branching.
- Be conservative: don't award a level above the item's target_cefr without strong evidence.
