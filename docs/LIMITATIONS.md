# Aftercare Loop — Known Limitations & Roadmap

Aftercare Loop is a hackathon MVP. It provides health education using fictional patient data. It is
not medical advice, not a medical device, and not HIPAA-compliant (see `SECURITY-ROADMAP.md`).

## Data and scope

- **Synthetic data only.** There are twelve fictional patients (`src/data/patients/`). None are
  based on real people or records.
- **Scripted Demo Mode covers 7 of the 12 patients (2 in Spanish).** Predefined responses exist
  for patients A–E and for the two Spanish-language patients F and I (`src/data/scripted/`). The
  other five fixtures need live mode for AI-shaped content. In scripted mode, questions outside the script get a fixed "can't answer that" message instead of a
  guess.
- **Live mode depends on an external model.** With `ANTHROPIC_API_KEY` set, output is model
  generated. It is schema-validated and source-checked, but not reviewed by a clinician. Wording
  can vary between runs.
- **One visit document per patient.** Fixtures come with a single after-visit summary. Users can
  paste text or upload a `.txt` file of up to 20,000 characters. PDF extraction isn't implemented.

## Evidence

- **Small curated index.** Retrieval uses tag and keyword scoring over a hand-curated list of 54
  references (`src/data/evidence/`). It isn't comprehensive. When nothing relevant is found, the
  app says so instead of citing something loosely related.
- **Summaries are our own words.** Curated summaries paraphrase each source. Links were checked on
  the accessed date recorded in each reference, but they can change.
- **Live MedlinePlus Connect is optional and off by default.** `AFTERCARE_ENABLE_MEDLINEPLUS_LIVE`
  enables the client in `src/lib/evidence/medlineplus.ts`.

## Safety

- **Rule-based detection is limited.** Deterministic phrase and regex rules cover six predefined
  scenarios (chest pain, severe breathing difficulty, stroke-like symptoms, severe bleeding,
  suicidal thoughts or self-harm, severe postpartum warning signs), with negation handling. Unusual
  wording, misspellings or other urgent situations may be missed. Model-based detection only adds
  to the rules.
- **Guidance is US-centric.** Emergency guidance references 911 and the 988 Suicide & Crisis
  Lifeline.
- **No real escalation.** Nothing reaches a real clinician. The clinician communication summary
  ships today at `/follow-up`: the patient can review, edit and copy it, but nothing is transmitted.
  The care-team queue is a simulation.

## Evaluation

- **Automated synthetic-case tests only.** `npm run eval` scores instruction extraction, citation
  validity, safety rules and teach-back scoring against ground truth written by the same team that
  wrote the fixtures. It is not clinical validation and involves no real users.
- **Scripted runs mostly test the pipeline.** In Scripted Demo Mode, extraction output is predefined,
  so high scores show that the content and the traceability checks agree. They don't show model
  accuracy. A live run (`kind: model_based`) measures the model on the same small set.
- **Comprehension is simulated.** The suite checks that accepted answers score correct, that a wrong
  answer is caught, and that the retry after a clarification scores correct. It does not measure
  real patient understanding.
- **Not yet done:** human-reviewed results, genuine user testing, usability metrics (task
  completion, time, steps) and follow-through outcomes. The dashboard shows "None yet" for these.

## Product and platform

- **State stays in the browser.** Demo state is stored in `localStorage` on one device. There are no
  accounts, no sync and no backup. **Reset Demo** restores the fixtures.
- **Reminders are in-app only.** There are no SMS, email or push notifications.
- **Spanish is partial.** UI strings and selected scripted scenarios are translated. This is not a
  professionally validated medical translation. Original source passages are never translated.
- **Accessibility is not audited.** The app aims for keyboard access, visible focus, 44 px targets
  and readable contrast, but no formal WCAG audit or screen-reader user testing has been done.

## Roadmap

**Shipped today (MVP):** Understand, Ask Kat, teach-back, the action plan with source links, in-app
reminders, the clinician communication summary at `/follow-up`, the simulated care-team queue, the
evaluation dashboard, and Scripted Demo Mode for 7 of 12 patients (2 in Spanish).

**P1 (next):** PDF extraction, broader Spanish, and a human-reviewed sample of outputs. After that:
better retrieval (more curated sources, optional live MedlinePlus), a recorded model-based
evaluation run, and moderated usability sessions.

**P2 (roadmap only, not built):** EHR integration, wearables, real clinician messaging, refill
integration, SMS/push reminders, cloud accounts, predictive models, and any real-PHI deployment.
Each of these requires the controls in `SECURITY-ROADMAP.md` first.
