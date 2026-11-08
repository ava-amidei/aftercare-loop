# Aftercare Loop — Pitch deck

- **Deck (claude.ai Slides, 16 slides, 16:9, speaker notes), source of truth:** https://claude.ai/artifact/N7aWepRV4jH6gVm9RrYCZu
- Design: team palette (primary #FBA17E; #F7D794 #FF9A00 #EE6200), Montserrat, pill shapes, no outlines, logo on cover/closing. Every stat slide carries a citation footer sourced from `docs/research/EVIDENCE-BRIEF.md`.

## Files in this folder

| File | What it is |
|---|---|
| `aftercare-loop-pitch.pptx` | Editable PowerPoint (16 slides, 16:9). Every text element is a real text box; speaker notes on every slide. Theme fonts and colors are set, so restyling the theme restyles the deck. Montserrat must be installed for the intended look (Google Fonts). |
| `aftercare-loop-pitch.pdf` | PDF export of the PowerPoint (LibreOffice), 16 pages. |
| `SLIDES.md` | Slide-by-slide text and speaker notes in markdown, generated from the artifact. |

If you edit the claude.ai deck, re-export or update the PowerPoint and `SLIDES.md` so the three stay in step.

## Change log

**2026-11-08** — judge-panel fixes 4, 9 and 16 from `docs/VALIDATION-REPORT.md`, applied to the artifact and the exports:
- Roadmap (slide 13): "Scripted Demo Mode covers 7 of 12 patients (2 in Spanish)"; clinician communication summary moved to Today (it ships at `/follow-up`); P1 is now "PDF extraction, broader Spanish, human-reviewed output sample".
- Sample Kat question changed from "Why do I need a fasting blood test?" to the scripted key "Can I drink water before my blood test?" (slides 6 and 7 and their notes); Kat's reply now quotes the scripted pt-a answer.
- Evaluation (slide 11): footer is now "Run eval-2026-11-08 · suite 1.0.0 · deterministic synthetic suite, Scripted Demo Mode · 154 cases · fictional patients, not clinical validation"; added caption "Three of four suites measure the pipeline, not model accuracy; see docs/VALIDATION-REPORT.md". Pill radii fixed from 50% to 999px.
- New slide 14 "Pilot design (hypothesis)": one FQHC site, 8–12 weeks, ~50 consenting patients; primary KPI, secondary measures; Rodin 2019 baseline footer.
- New slide 15 "Distribution & pricing (hypothesis)": Today / Pilot / Phase 3 channels, pricing unit, budget owners, reimbursement not assumed.
- Added `aftercare-loop-pitch.pptx`, `aftercare-loop-pitch.pdf` and `SLIDES.md`.

**2026-11-07** — slide 11 numbers filled from `aftercare-loop-app/eval-results/latest.json` (deterministic synthetic suite, 154 cases, Scripted Demo Mode): extraction P 100% / R 100% / F1 1.00 (54 TP, 0 FP, 0 FN); citation validity 58/58; safety 48/48 (38/38 emergencies caught, 10/10 benign not escalated); comprehension 36/36 misunderstandings clarified. Re-run `npm run eval` and update the slide if the suite changes.

## Team

Team HW1: Stephanie Kim, Ava Amidei, Kemigisha Sherifah Muzungu M, Payton Mendygral. Mentors: Rhea John, Pavel Stepanov.
