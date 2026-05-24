# Prompt: Weak-Spot Tagger

## Input
- `lesson_slug`: which lesson was completed
- `scores`: { comprehension, writing, speaking, vocab } each 0.0-1.0
- `ai_feedback`: array of correction objects from writing and speaking scorers
- `current_weak_spots`: user's existing weak spot tags

## Task
Given the lesson scores and AI feedback corrections, output a list of weak-spot tags to increment (or create) on the user profile.

## Output (JSON)
```json
{
  "tags_to_increment": [
    { "tag": "ser-vs-estar", "reason": "Used 'soy' for temporary state twice." },
    { "tag": "preterite-irregular", "reason": "Fui/fue errors in speaking." }
  ],
  "tags_to_resolve": [
    { "tag": "present-tense-yo", "reason": "Error-free in all exercises. Pattern appears resolved." }
  ]
}
```

## Canonical tag taxonomy
Use these slugs. If an error doesn't fit, invent a slug using `category-specifics` format.

| Slug | What it covers |
|---|---|
| `ser-vs-estar` | ser/estar confusion |
| `preterite-imperfect` | preterite vs imperfect choice |
| `preterite-irregular` | irregular preterite forms (fui, hice, puse…) |
| `subjunctive-trigger` | knowing when subjunctive is needed |
| `por-vs-para` | por / para confusion |
| `vosotros-conjugation` | vosotros verb forms |
| `accent-marks` | missing or wrong written accents |
| `gender-agreement` | noun-adjective gender agreement |
| `castilian-theta` | seseo instead of /θ/ |
| `direct-object-pronouns` | lo/la/le placement |
| `reflexive-verbs` | wrong reflexive pronoun or missing |

## Rules
- Only tag errors that appeared in THIS lesson's scored exercises.
- Only resolve a tag if the user had zero errors in the relevant area AND they attempted it.
- Don't tag below-level trivial errors for advanced learners (e.g., don't tag `accent-marks` for a C1 learner who missed one tilde).
- Max 3 tags per session — prioritise the most impactful.
