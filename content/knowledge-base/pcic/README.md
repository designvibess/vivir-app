# PCIC Knowledge Base

This directory holds cached extracts from the **Plan Curricular del Instituto Cervantes (PCIC)** — the official Spanish curriculum at https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/

## Legal note
PCIC content is © Instituto Cervantes. Files here are for **internal agent reference only** — never republish PCIC text verbatim in user-facing content. The Spanish Professor pipeline uses PCIC as a *specification* and produces original lesson content.

## Structure
```
pcic/
  a1/   01-objetivos.md through 12-habilidades.md
  a2/   (same)
  b1/   (same)
  b2/   (same)
```

## How to populate
Run the fetch script:
```bash
pnpm tsx scripts/fetch-pcic.ts
```

This scrapes the 12 inventories × 4 levels = 48 pages and saves them here. One-time operation; re-run if PCIC is updated.

## Inventories
| # | Name | Purpose |
|---|---|---|
| 01 | Objetivos generales | High-level can-do per level |
| 02 | Gramática | Required grammar structures |
| 03 | Pronunciación y prosodia | Pronunciation focus |
| 04 | Ortografía | Spelling/writing conventions |
| 05 | Funciones | Communicative functions |
| 06 | Tácticas y estrategias pragmáticas | Pragmatics |
| 07 | Géneros discursivos | Text types |
| 08 | Nociones generales | General concept vocabulary |
| 09 | Nociones específicas | Domain-specific vocabulary |
| 10 | Referentes culturales | Cultural references |
| 11 | Saberes y comportamientos socioculturales | Sociocultural behaviours |
| 12 | Habilidades y actitudes interculturales | Intercultural skills |
