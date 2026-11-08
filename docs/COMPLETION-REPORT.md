# Aftercare Loop — Completion Report

Date: 2026-11-07. Repository: `aftercare-loop/` (monorepo). Core application: `aftercare-loop-app/`
(Next.js 16.4.5, App Router, TypeScript, Tailwind v4). Everything in this report was checked against
the repository as it stands at commit `62561cb` plus the uncommitted `eval-results/` update from the
final check run. All patients are fictional; nothing here is clinical validation.

## Repository layout

| Path | Contents |
|---|---|
| `aftercare-loop-app/` | The web application (routes, components, services, safety rules, fixtures, evaluation runner, tests). Run every `npm` command from here. |
| `docs/` | `ARCHITECTURE.md`, `SPEC.md`, `DEMO-SCRIPT.md`, `SECURITY-ROADMAP.md`, `LIMITATIONS.md`, `BUSINESS.md`, `DESIGN.md`, `GEMINI-NOTES.md`, `research/EVIDENCE-BRIEF.md`, this report. |
| `aftercare-loop-mobile/` | Capacitor iOS/Android shell that loads the deployed web app by URL. |
| `aftercare-loop-media/` | Demo-video narration draft and a TTS script (`video/`); `pitch/` is empty. |
| `aftercare-loop-assets/` | Local-only credentials and design assets. Git-ignored; not part of the deliverable. |

Git history (`git log --oneline`, newest first):

```
62561cb Phase 5: fix-round 2 integration gate (Kat output guard, advice guards, safety rules, focus trap, service hardening)
550d16d Phase 4: fix-round integration gate (safety context, Spanish scripted demos, UI/a11y fixes)
b85773e Add pitch deck link and align narration patient name with fixture
20670af Add Gemini API notes and TTS narration generator
9acca90 Phase 3: feature pages integrated (dashboard, profile, understand, Ask Kat, action plan, teach-back, follow-up, care team, evaluation) + e2e journey
5b50034 Add team design brief and logo
68c36be Add Capacitor mobile shell scaffold, media folder with narration draft, team credits
947edda Phase 2: services, scripted demo content, API routes, evaluation runner integrated
3dfad5e Phase 1: foundation modules integrated (fixtures, ground truth, evidence, safety, AI client, store, i18n, UI kit, app shell, API handler)
91c1598 Add cross-module stubs for parallel agent build
05e01e4 Scaffold Aftercare Loop monorepo: Next.js 16 app, type contract, architecture + spec docs
```

## 1. Summary of implemented functionality

### Shared foundation

- 12 fictional patients in `src/data/patients/` (A–L; `pt-f-gdm-es` and `pt-i-anemia-es` are
  Spanish-language), each with one after-visit summary and a matching ground-truth record in
  `src/data/ground-truth/` (expected instructions, teach-back questions, safety considerations,
  forbidden actions). `safety-cases.ts` holds the 48-case safety suite.
- Curated evidence index of 50 references (`src/data/evidence/references.ts`) with tag/keyword
  retrieval (`src/lib/evidence/retriever.ts`) and an optional MedlinePlus Connect client that is off
  by default.
- Deterministic safety layer (`src/lib/safety/`): `evaluateSafety` regex/phrase rules with negation,
  resolved-symptom and hypothetical handling for the six predefined scenarios in English and Spanish;
  `sanitizeDocumentText` / `wrapUntrusted` / `detectInjectionMarkers`; `safetyContextOf(profile)` as
  the single source for pregnancy/postpartum context; `advice-guards.ts` (documented fluid/diet
  restrictions, generic hydration/diet text, medication-change directives).
- Claude client (`src/lib/ai/client.ts`): `getAiMode()` returns `live_claude` only when
  `ANTHROPIC_API_KEY` is set and `AFTERCARE_FORCE_SCRIPTED !== "true"`; structured outputs validated
  with zod; prompts wrap documents as untrusted data. Scripted Demo Mode content for patients
  A–E (English) and F, I (Spanish) in `src/data/scripted/`.
- Client state: zustand store persisted to `localStorage` (`aftercare-loop-demo-v1`), strictly
  per patient, with `resetDemo()`.
- UI kit, `AppShell` (header with patient switcher, EN/ES toggle, Reset Demo; bottom nav on mobile,
  side nav on desktop), demo banner on every page, English and Spanish dictionaries via `useT()`,
  `<html lang>` follows the active patient's language, saved accessibility preferences
  (larger text, high contrast, reduced motion) applied on every route.
- API routes (all `POST` except the last, zod-validated, never trusting client-supplied mode):
  `/api/interpret`, `/api/ask-kat`, `/api/teach-back`, `/api/action-plan`, `/api/eval/latest` (GET).

### Understand (`/understand`)

- Paste or load the fixture after-visit summary, or upload a `.txt` file (capped at 20,000
  characters). A term/question panel is also available.
- `interpretDocument` runs safety rules on the document, extracts instructions (scripted content,
  live Claude, or a deterministic heuristic fallback), verifies every source quote by exact offsets,
  and returns the sections "What does this mean?", "Words to know", "What should I know?", "What can
  I discuss with my provider?", "What are my next steps?" and "Sources".
- Instructions whose quote does not match the document are marked `unverified` and routed to
  "Needs clarification". Lines containing prompt-injection markers lose their reference and are
  flagged `suspectedInjection`. Descriptions that add a medication change not present in the quote
  are replaced by the quote. Verified text that conflicts with a documented fluid restriction is
  marked as a conflict instead of a directive.
- A mode badge labels every AI-shaped result as live or scripted.

### Ask (Ask Kat)

- Floating button bottom-right (chat bubble with heart; icon-only below `md`, labelled pill on
  desktop; sits above the mobile bottom nav and `<main>` is padded so it does not cover content).
  Opens a right-side panel on desktop and a full-height modal sheet on mobile.
- Welcome message ("Hi! I'm Kat. 💗 …") and the five suggestion chips: What should I ask my doctor?,
  Explain my diagnosis, Help me understand my results, Help me plan my next steps, and a free-text
  chip that focuses the input. Chips run deterministic builders over documented content.
- `askKat` runs safety rules first; emergencies return concise guidance (911 / 988 in the US) with no
  lengthy education; concerning input returns a limits statement plus the model/scripted reply.
- Contextual actions that perform real behaviour: View source, Check my understanding (deep-links to
  the specific teach-back question when known), Add question to my list, View my action plan,
  Prepare for my appointment.
- Live replies pass through `kat-output-guard.ts`: medication-change directives and false
  reassurance are replaced with fixed sentences regardless of safety level.
- Conversation history is per patient; switching patients switches context.

### Verify (`/check`, teach-back)

- 3 questions per patient (36 total) defined in ground truth with source passage, expected answer,
  accepted variations, key concepts and a wrong option. `scoreTeachBack` is pure and deterministic.
- On a wrong answer the UI shows "Let me explain that another way." and a clarification (scripted,
  live Claude with judgmental-language and medication-directive guards, or a deterministic template
  quoting the passage); the patient can retry or save the question for the clinician. Attempts,
  initial and final correctness and clarification mode are recorded per session.

### Act (`/action-plan`)

- `buildActionPlan` turns verified instructions into `clinician_documented` items in My Care Plan
  (with "View source" highlighting the exact passage), keeps unverified items in Needs clarification,
  adds `patient_selected` wellness goals from the profile and `ai_suggested` barrier-aware
  suggestions phrased as questions to the clinic (transportation, cost, language, scheduling,
  caregiving). Generic hydration or diet advice is suppressed when the document or profile records a
  restriction, and replaced with a question about individualized targets.
- Each item has description, category, origin badge, source/rationale, optional due date (only when
  documented), optional in-app reminder, and status Pending / Completed / Needs clarification.
  Users can add their own items. Barrier suggestions saved to "my questions" use a clinic-facing
  phrasing.

### Follow Up (`/follow-up`, `/care-team`)

- Editable communication summary (provider questions, reported barriers, unresolved items,
  documented instructions with quoted sources) with "Copy summary". Questions carry an origin label.
- "Send to my care team (simulated)" creates a request in a fictional queue; `/care-team` is the
  clinician-side view with the state machine submitted → in review → responded → closed. Nothing is
  transmitted anywhere.

### Dashboard and profile

- `/` shows greeting, health topics, clinician-documented tasks, reminders/upcoming items, goals,
  recent questions and the primary actions. `/profile` edits name, age range, language, explanation
  complexity, accessibility preferences, conditions, medications, instructions, goals, barriers and
  optional pregnancy/postpartum context with the same component for every patient.

### Evaluation (`/evaluation`, `npm run eval`)

- `scripts/run-eval.ts` scores four suites against ground truth and writes
  `eval-results/latest.json` plus a timestamped copy. The page reads the file through
  `/api/eval/latest`, shows "Not evaluated" when absent, labels the evidence type, and never
  hardcodes numbers. Results are in section 5.

## 2. Launch instructions

Requirements: Node.js 20+ and npm.

```bash
cd aftercare-loop/aftercare-loop-app
npm install
cp .env.example .env.local        # optional: add ANTHROPIC_API_KEY for live Claude responses
npm run eval                      # writes eval-results/latest.json for the /evaluation page
npm run dev                       # http://localhost:3000
```

Other commands (all from `aftercare-loop-app/`): `npm run build && npm start` (production),
`npm run lint`, `npm run typecheck`, `npm test`, `npm run check` (lint + typecheck + test + build),
`npx playwright install` once then `npx playwright test` (E2E, desktop and iPhone 13 projects).

Demo: click Reset Demo, select Maya Thompson (`pt-a-pcos`), then follow `docs/DEMO-SCRIPT.md`.
Without an API key every AI-shaped response is labelled Scripted Demo Mode.

## 3. Required environment variables

None are required to run the demo. All are read server-side only (`src/lib/ai/client.ts`,
`src/lib/evidence/medlineplus.ts`); there are no `NEXT_PUBLIC_` secrets.

| Variable | Default | Effect |
|---|---|---|
| `ANTHROPIC_API_KEY` | empty | Empty → Scripted Demo Mode. Set → live Claude responses. |
| `AFTERCARE_MODEL` | `claude-opus-5-5` | Model id for live responses. |
| `AFTERCARE_FORCE_SCRIPTED` | `false` | `true` forces Scripted Demo Mode even with a key. |
| `AFTERCARE_ENABLE_MEDLINEPLUS_LIVE` | `false` | `true` enables live MedlinePlus Connect lookups. |

`aftercare-loop-media/video/tts.mjs` separately reads `GEMINI_API_KEY` for narration audio; it is
not used by the application.

## 4. Automated test results (final check run)

| Check | Result |
|---|---|
| lint | PASS: `npm run lint` (eslint) exited 0 with no warnings or errors. |
| typecheck | PASS: `npm run typecheck` (tsc --noEmit) exited 0 with no errors. |
| unitTests | PASS: `npx vitest run` reported "Test Files 71 passed (71)" and "Tests 1351 passed (1351)", exit 0. |
| build | PASS: `npm run build` (Next.js 16.4.5, Turbopack) compiled successfully and generated 15/15 static pages, exit 0. Routes: /, /action-plan, /care-team, /check (dynamic), /evaluation, /follow-up, /profile, /understand, and the APIs /api/action-plan, /api/ask-kat, /api/eval/latest, /api/interpret and /api/teach-back. |
| evalRun | PASS: `npm run eval` exited 0. Extraction F1 108/108 = 100.0%. Citation validity 58/58 = 100.0%. Safety 48/48 = 100.0% (no emergency missed 38/38; non-emergency not escalated 10/10). Comprehension 36/36 initial correct and 36/36 correct after clarification. It wrote eval-results/latest.json and eval-results/eval-2026-11-07T23-15-04-792Z.json and printed the disclaimer "Limited synthetic evaluation on fictional data — not clinical validation." |
| e2e | PASS: `npx playwright test` reported "2 passed (2.6s)", exit 0. The test was 'primary journey: understand → ask kat → check → plan → follow up → evaluation' in both the desktop and mobile projects. Caveat: playwright.config.ts uses reuseExistingServer: true, and a next dev server (PID 86863) was already running on :3000, so the e2e run went against that existing server, not a fresh one. |
| allGreen | true |

Notes from the check run: All six checks passed, run from
`/Users/avaamidei/aftercare-loop/aftercare-loop-app`. One step was not done: I tried to stop the
leftover next dev server (PID 86863, next-server v16.4.5, on port 3000) so the e2e tests would run
against a fresh server, but the auto-mode permission classifier blocked the kill. That server is
still running, and I could not confirm which directory it was started from. If it was started before
the app moved into aftercare-loop-app, it may be serving old code, and the e2e pass should be
re-checked after stopping it (kill 86863, then rerun `npx playwright test`). The build and the other
checks do not depend on that server. No source code was changed. The eval run updated
`/Users/avaamidei/aftercare-loop/aftercare-loop-app/eval-results/latest.json` and added
`/Users/avaamidei/aftercare-loop/aftercare-loop-app/eval-results/eval-2026-11-07T23-15-04-792Z.json`.
The build refreshed .next. Nothing was committed.

Mobile checks: the Playwright mobile project (iPhone 13) ran the full journey. Reviewer probes at
375 px during fix rounds drove the Button wrapping, header, FAB and nav fixes listed in section 7;
no formal device-lab test was done.

## 5. Evaluation dashboard results

Source: `aftercare-loop-app/eval-results/latest.json`, run `eval-2026-11-07T23-15-04-792Z`, suite
version 1.0.0, timestamp 2026-11-07T23:15:04.792Z, mode `scripted_demo`, kind
`deterministic_synthetic`, model id none, 154 cases, 0 failed cases, 0 errors.

These are automated deterministic tests on synthetic data written by the same team that wrote the
fixtures. They are not clinical validation, involve no real users and do not show real-world
outcomes. In Scripted Demo Mode, extraction output for patients A–F and I is predefined, so those
cases test the traceability pipeline rather than model accuracy; patients G, H, J, K and L were
extracted with the deterministic heuristic.

Instruction extraction (12 patients):

| Metric | Numerator / denominator | Value |
|---|---|---|
| Patients evaluated | 12 / 12 | 12 |
| True positives | 54 / 54 | 54 |
| False positives | 0 / 58 | 0 |
| False negatives | 0 / 54 | 0 |
| Precision | 54 / 54 | 1.00 |
| Recall | 54 / 54 | 1.00 |
| F1 | 108 / 108 | 1.00 |
| Optional instructions extracted (not counted as FP) | 4 / 58 | 4 |

Confusion: TP 54, FP 0, FN 0.

Citation validity:

| Metric | Numerator / denominator | Value |
|---|---|---|
| Verified citations checked | 58 / 58 | 58 |
| Valid citations | 58 / 58 | 58 |
| Invalid citations | 0 / 58 | 0 |
| Citation validity rate | 58 / 58 | 1.00 |
| Unverified instructions (routed to Needs clarification) | 0 / 58 | 0 |

Safety (deterministic rules only):

| Metric | Numerator / denominator | Value |
|---|---|---|
| Safety cases evaluated | 48 / 48 | 48 |
| Passed | 48 / 48 | 48 |
| Failed | 0 / 48 | 0 |
| Pass rate | 48 / 48 | 1.00 |
| No emergency missed (expected emergency ⇒ got emergency) | 38 / 38 | 1.00 |
| Non-emergency inputs not escalated to emergency | 10 / 10 | 1.00 |

Confusion: TP 38, FP 0, FN 0, TN 10.

Comprehension (teach-back scoring, simulated answers):

| Metric | Numerator / denominator | Value |
|---|---|---|
| Total questions | 36 / 36 | 36 |
| Initial correct (expected answer and all accepted variations) | 36 / 36 | 1.00 |
| Accepted variations scored correct | 146 / 146 | 1.00 |
| Wrong answers scored incorrect | 36 / 36 | 1.00 |
| Misunderstandings identified | 36 / 36 | 1.00 |
| Correct after clarification | 36 / 36 | 1.00 |
| Unsuccessful clarifications | 0 / 36 | 0 |

Human-reviewed results, genuine user testing, usability metrics and follow-through outcomes: none
(the dashboard shows "None yet").

## 6. Acceptance criteria (SPEC §13)

| Criterion | Status | Evidence |
|---|---|---|
| Branded Aftercare Loop | ✅ | Product name in shell, README, metadata; logo in `public/brand/logo.svg`. |
| Companion named Ask Kat throughout | ✅ | No "Ask Aftercare AI" string anywhere in `src/`. |
| Floating heart chat bubble bottom-right | ✅ | `KatFab.tsx`: `MessageCircle` + `Heart` overlay, fixed bottom-right above the mobile nav. |
| Welcome message + five prompts | ✅ | `askKat.welcome` matches the spec text; five chips keyed by `QuickPromptId` (four actions + free text). |
| Claude responses when configured | ⚠️ partial | Live path implemented (`client.ts`, `messages.parse` + zod, refusal and SDK error handling) but no live run was performed in this check cycle (no key configured). |
| Labelled, functional Scripted Demo Mode | ✅ | `ModeBadge` shows the required sentence; unsupported questions return the required "can't answer" text; scripted content for 7 of 12 patients. |
| ≥3 fictional profiles | ✅ | 12 fixtures, 2 in Spanish. |
| Submit synthetic summary | ✅ | Paste, load sample, or `.txt` upload on `/understand`. |
| Clinician actions link to exact passages | ✅ | `SourceRef` offsets verified by `slice(start,end) === quote`; "View source" highlights the passage; citation validity 58/58. |
| Unsupported instructions not verified | ✅ | Unverified → "Needs clarification"; injection-marked lines lose their ref; tests in `instruction-extraction.test.ts`, `document-interpreter.test.ts`. |
| Safety tests pass | ✅ | 48/48 in the eval suite plus `rules.test.ts`, `advice-guards.test.ts`, `kat-output-guard.test.ts` in the 1351 passing unit tests. |
| Adaptive teach-back with retry | ✅ | `/check`: wrong answer → misunderstanding named → "Let me explain that another way." → retry or save for clinician; 36/36 in the comprehension suite. |
| Barrier-aware suggestions | ✅ | `barriers.ts` covers transportation, cost, language, scheduling, caregiving; labelled `ai_suggested`, phrased as questions to the clinic. |
| Evaluation dashboard with real metrics | ✅ | `/evaluation` reads `latest.json` via `/api/eval/latest`; numerators/denominators shown; "Not evaluated" when absent. |
| Plan distinguishes documented vs suggested | ✅ | `OriginBadge` (clinician / patient / AI) on every item; AI suggestions never enter My Care Plan. |
| Full Understand→Ask→Verify→Act→Follow Up journey | ✅ | Playwright `journey.spec.ts` passes on desktop and mobile. |
| Resettable demo | ✅ | Reset Demo button with confirmation; `resetDemo()` restores all fixtures and clears chats, plans and progress. |
| No real data | ✅ | All fixtures fictional; banner "Demonstration using fictional patient data." in the shell. |
| No exposed credentials | ✅ | Env read only server-side; `.env*` git-ignored; `aftercare-loop-assets/` git-ignored. Gemini variables in the app's `.env.local` are unused by the app (hygiene item, section 8). |
| Desktop + mobile | ✅ | Responsive shell; iPhone 13 Playwright project passes; mobile header, FAB, button wrapping and nav fixed in Phases 4–5. |
| Tests/lint/typecheck/build executed and reported | ✅ | Section 4. |
| Five-minute-demo ready | ⚠️ partial | `DEMO-SCRIPT.md` is complete and the journey passes, but Scene 4 step 3 points to a "Needs clarification" section that is empty for the scripted patients, and the e2e pass was against a pre-existing dev server (section 4 caveat). |

## 7. Known limitations

- Synthetic data only; one visit document per patient; no PDF extraction; `.txt` capped at 20,000
  characters.
- Scripted Demo Mode content exists for patients A–E, F and I. The other five patients fall back to
  the deterministic heuristic for interpretation and to fixed "can't answer" / template text for Kat
  and teach-back clarifications in scripted mode.
- Live mode output is schema-validated, source-checked and passed through deterministic guards, but
  not clinician-reviewed, and was not exercised in the final check run.
- Safety detection is rule-based for six predefined scenarios in English and Spanish; unusual
  wording or other urgent situations can be missed. Emergency guidance is US-centric (911, 988).
- Curated evidence index of 50 references; Spanish synonym coverage is thin (the Spanish anemia
  fixture retrieves fewer matches than English fixtures). Live MedlinePlus is off by default.
- Evaluation is automated and deterministic on synthetic cases; in scripted mode extraction scores
  measure the traceability pipeline, not model accuracy. No human review, user testing, usability or
  follow-through metrics.
- Demo state is browser `localStorage` only: no accounts, sync or backup. Reminders are in-app only.
- Spanish covers UI strings and scripted content for two patients; not a validated medical
  translation. Some shared components still render English (section 8).
- No formal WCAG audit or screen-reader user testing. Not HIPAA-compliant; see
  `docs/SECURITY-ROADMAP.md`.
- The Capacitor mobile shell is a scaffold pointing at a deployment URL that does not currently exist.

## 8. Incomplete acceptance criteria

- **Claude responses when configured** — implemented but unverified in this cycle: no run with
  `ANTHROPIC_API_KEY` set was performed, so live-mode behaviour (structured output parsing, refusal
  handling, output guards on real model text) is covered by unit tests with mocked responses only.
- **Five-minute demo** — `DEMO-SCRIPT.md` Scene 4 step 3 tells the presenter to point out "Needs
  clarification", which never renders for patients A, B or C in scripted mode (all scripted
  instructions match exactly). Reword the script or add a deliberately unmatched instruction to a
  non-primary fixture. The e2e pass should be re-run after stopping the leftover dev server.

## 9. Review findings skipped or deferred

Two review rounds produced 60 findings. Phases 4 and 5 (`550d16d`, `62561cb`) addressed the safety
rule gaps (past-tense overdose, indirect suicidal ideation, pad-count bleeding, chest adverbs,
Spanish "mucho sangrado", "presión muy fuerte en el pecho", "se me durmió la cara" / "hablo raro"),
prompt-injection handling in extraction and interpretation, the shared `safetyContextOf` helper, the
Kat/teach-back output guards for medication directives and false reassurance, the medication-change
and fluid-restriction guards in the interpreter, the "Explain my diagnosis" heuristic placeholder,
Spanish scripted content, barrier clinic-facing phrasing and saved-question provenance, the
check-understanding `questionId`, focus-trap Escape handling on `document`, `AppShell` translation
and `<html lang>`, `AccessibilityPrefsSync` mounting, Button label wrapping, the non-sticky mobile
header, the icon-only mobile FAB with `<main>` padding, mobile nav label wrapping, narration patient
name, and deletion of the reviewer scratch tests. The following were verified as still open in the
current tree:

| Severity | Area | File | Finding | Status |
|---|---|---|---|---|
| minor | safety | `src/lib/safety/rules.ts` (PRESENT_OVERRIDE) | "I had chest pain this morning but it's gone now" still evaluates to `emergency`; "this morning/afternoon/evening" cancel the resolved-symptom downgrade. Over-escalates (safe direction). | Deferred |
| minor | services | `src/lib/services/action-plan.ts` `isVerifiedRef` | No `ref.end <= document.text.length` bound (other verifiers have it); `existing` items from the client are re-emitted without re-verification; route comment overstates this. Only reachable via tampered requests or stale persisted state. | Deferred |
| minor | services | `src/lib/services/action-plan.ts` `instructionActionId` | Action ids are keyed by quote text, so two verified instructions with identical text at different offsets collapse into one item. No fixture triggers it. | Deferred |
| minor | services | `src/lib/services/action-plan.ts` `passesRestrictionGuard` | A clarification *question* mentioning "drink plenty of water" is still suppressed by the hydration guard (pt-e conflict question is dropped from the plan; Kat still offers it via add_question). | Deferred |
| minor | services | `src/app/api/action-plan/route.ts` | Building a plan before Understand has run yields an empty My Care Plan with no hint; no fallback to scripted interpretation for fixture documents. | Deferred |
| minor | ask-kat | `src/lib/services/ask-kat.ts` / `src/data/scripted/*.ts` | Per-patient scripted `quickPrompts` content is unreachable from chips (deterministic builders run first); the typed chip label routes to the scripted text instead. | Deferred |
| minor | ask-kat | `src/components/ask-kat/KatPanel.tsx` | Initial focus on open lands on "Minimize Ask Kat" (Sheet `initialFocusRef` not passed); description wrapped in `hidden sm:inline` so mobile `aria-describedby` points at empty text. | Deferred |
| minor | ask-kat | `src/components/ask-kat/use-kat-chat.ts` | Persisted welcome message is not re-localized when the language toggles after first open. | Deferred |
| minor | ui | `src/components/ui/SourceQuote.tsx` | Status captions ("Matches your document", "Not verified — needs clarification", "View source" default) are hardcoded English. | Deferred |
| minor | ui | `src/components/ui/ModeBadge.tsx` | English-only badge; `common.mode.*` dictionary keys unused. ARCHITECTURE §2.9 mandates the exact English sentence, so this may be intentional. | Deferred |
| minor | ui | `src/components/ui/OriginBadge.tsx` / `SummarySections.tsx` | Saved questions still get the default "A goal you chose for yourself." tooltip; the `description` override prop exists but is not passed. | Deferred |
| minor | ui | `src/components/follow-up/SummarySections.tsx` | "Instructions from my visit summary" shows quotes but no "View source" control (`onViewSource` not wired). | Deferred |
| minor | ui | `src/components/ui/Toast.tsx` | Toast fixed at `top 4.5rem` assumes a one-row header; mobile header is now non-sticky, so it only overlaps at scroll top. | Deferred |
| minor | ui | `src/components/layout/AppShell.tsx` desktop nav | Desktop side-nav labels still `truncate` ("Care Team (simulated)" at 15rem). | Deferred |
| minor | a11y | `LanguageToggle.tsx`, `ResetDemoButton.tsx`, `VisitSummaryCard.tsx` | EN/ES buttons `min-h-10`, icon-only Reset Demo on mobile and dashboard "Open" link are below the 44 px target floor. | Deferred |
| minor | a11y | `src/app/globals.css` `--color-border-strong` | `#a8a29e` on white is 2.52:1, below WCAG 1.4.11's 3:1 for control boundaries (high-contrast mode passes). | Deferred |
| minor | ui | `src/data/scripted/pt-b-postpartum.ts` | pt-b clarifications open with "Let me say that another way." so the card shows a doubled opener after the i18n heading. | Deferred |
| minor | eval | `src/lib/i18n/en/evaluation.ts` | Extraction card has no on-page note that scripted-mode extraction output is predefined (stated in `LIMITATIONS.md` and this report only). | Deferred |
| minor | eval | `tests/e2e/journey.spec.ts` | Only `pt-a-pcos` covered end to end; no e2e for patient switching, a Spanish patient or Reset Demo. | Deferred |
| minor | services | `src/lib/evidence/retriever.ts` | `TOPIC_SYNONYMS` and the ICD-10 map live in lib code rather than `src/data`; Spanish synonym coverage thin. Lookup tables only, no condition branching. | Deferred |
| minor | api | `src/app/api/teach-back/route.ts` | Client-supplied `correct` / `clarificationMode` on prior attempts are echoed back; new attempt is decided server-side. Affects only the caller's own local history. | Deferred |
| minor | docs | `docs/DEMO-SCRIPT.md` Scene 4.3 | "Needs clarification" section never renders for the scripted primary patients. | Deferred |
| minor | docs | `aftercare-loop-mobile/README.md`, `capacitor.config.json`, `www/index.html` | PWA claim with no manifest; default `server.url` points at a non-existent deployment; fallback page names `capacitor.config.ts` (file is `.json`). | Deferred |
| minor | docs | `aftercare-loop-app/.env.local`, `docs/GEMINI-NOTES.md` | Gemini variables live in the app's `.env.local` (git-ignored) though only `aftercare-loop-media/video/tts.mjs` reads them. | Deferred |
| minor | data | `aftercare-loop-app/package.json` | `firebase` declared but never imported. Requires a lockfile change by the gate agent. | Skipped |
| minor | eval | `aftercare-loop-app/.gitignore`, `eval-results/` | Timestamped eval archives are tracked (five committed, one new) and accumulate per run. | Skipped |
| minor | data | `aftercare-loop-app/public/` | create-next-app boilerplate SVGs (`file`, `globe`, `next`, `vercel`, `window`) still shipped. | Skipped |
| minor | docs | `README.md` (root) | Describes `aftercare-loop-media/` as a full video pipeline with pitch materials; `pitch/` is empty. | Skipped |

Findings not listed above were verified as fixed in the current tree (for example, probing
`evaluateSafety` now returns `emergency` for "I've gone through four pads in the last two hours",
"I took all my pills tonight and I don't want anyone to find me", "my chest is really tight",
"Tengo mucho sangrado y me siento mareada", "Siento una presión muy fuerte en el pecho" and
"se me durmió la mitad de la cara y hablo raro", and `concerning` for "I don't see the point of any
of this anymore", which is the downgrade-only behaviour the review suggested).

## 10. Ship phase

Integration gate run on 2026-11-08 over commit `c5108d7` plus the sibling working-tree changes
listed in `git status` at commit time. All patients are fictional; nothing below is clinical
validation.

### Provider status

- **Selection** (`src/lib/ai/providers/index.ts`): `AFTERCARE_FORCE_SCRIPTED=true` always wins →
  Scripted Demo Mode; otherwise `AFTERCARE_PROVIDER=auto|gemini|anthropic|scripted` (auto = Gemini if
  `GEMINI_API_KEY`, else Claude if `ANTHROPIC_API_KEY`, else scripted). Keys are read server-side only
  (`providers/gemini.ts`, `providers/anthropic.ts`); `NEXT_PUBLIC` occurrences in `src/`: 0.
- **Gemini** (`gemini-3.8-flash` default, `interactions.create` per `docs/GEMINI-NOTES.md`): timeouts
  are now mapped to `aiFailure("api")` (`isTimeoutError` / `mapGeminiError`), so a slow call degrades
  to the scripted/heuristic fallback; `AFTERCARE_GEMINI_TIMEOUT_MS` (default 120 000) is documented in
  `.env.example` as 15000. Covered by `gemini.test.ts` and `degrade.test.ts` with mocked responses.
- **Stage configuration**: the app's `.env.local` (git-ignored) sets `AFTERCARE_PROVIDER=gemini`,
  `AFTERCARE_FORCE_SCRIPTED=true` and `AFTERCARE_GEMINI_TIMEOUT_MS=15000`, so the stage build is
  pinned to Scripted Demo Mode. `DEMO-SCRIPT.md` "Before you start" step 2 tells the presenter to
  confirm this and check for the yellow badge.
- **Live runs in this gate**: none. `tests/e2e/live-journey.spec.ts` (16 tests) skipped because no
  provider key was in the test process and the server was scripted. `npm run eval` ran
  `scripted_demo` / `deterministic_synthetic`; no `model_based` eval run has been archived. The only
  live measurements on record are the judge panel's `scripts/ai-smoke.mjs` runs
  (`docs/VALIDATION-REPORT.md` §1: structured call 50–98 s, text call 35 s or HTTP 503).

### Demo video

- Path: `aftercare-loop-media/video/out/aftercare-loop-demo.mp4` (git-ignored, with captions
  `aftercare-loop-demo.srt`; pipeline in `aftercare-loop-media/README.md`, `video/assemble.mjs`,
  `video/record.spec.ts`, `video/tts.mjs`).
- `ffprobe` (this gate): H.264 High 1920×1080 30/1 fps (~955 kb/s) + AAC LC 48 kHz stereo
  (~184 kb/s); duration 132.733292 s; size 19 044 080 bytes; SHA-256
  `10b9dd1322d837c8031d3a8a58251a8e1322c39e0b1c5bdd8315b89bc9e93cae`.
- Stale relative to the script: the file is dated 2026-11-07 23:18. `video/narration.md` was changed
  afterwards (shot 5 now switches to Priya Shah for the "Needs clarification" beat, ~4 s longer), and
  the narration notes say the MP4 predates the change. Audio and clips need to be regenerated, and
  the video trimmed toward 118–120 s (validation fix #11), before upload.

### Security fixes (verifiable in the tree)

- HTTP headers on every route (`src/lib/security/headers.ts`, `next.config.ts`): CSP
  (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `connect-src 'self'`; adds
  `'unsafe-eval'`/`ws:` in dev only), `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, COOP `same-origin`, HSTS
  in production only; `poweredByHeader: false`. Confirmed with `curl -I` against `next start`.
- Per-route, per-IP fixed-window rate limit, 30 requests/min (`src/app/api/_lib/rate-limit.ts`).
  Probe: 32 POSTs to `/api/teach-back` returned 30 × 400 (invalid body) and then 2 × 429.
- Medication-change requests ("double my metformin", missed/forgot/make-up dose, Spanish variants)
  are caught before any scripted lookup (`isMedicationChangeRequest` in `src/lib/services/ask-kat.ts`).
  Single-word scripted keywords no longer prefix-match ("fast" ≠ "faster", `tokenMatchesKeyword` in
  `src/lib/ai/scripted.ts`). Tests are in `ask-kat.test.ts` and `scripted.test.ts`.
- Prompt rules (`src/lib/ai/prompts.ts`): never presume a service/benefit exists; instruction quotes
  copied character for character; descriptions restate only the quote; teach-back clarifications
  use only facts from the answer key's source passage or the document.
- Key hygiene: before commit, no key-shaped strings (`AIza…`, `sk-ant-…`) in any tracked or
  to-be-added file, and the only `.env*` file to be committed is `.env.example`.

### Validation scorecard (summary of `docs/VALIDATION-REPORT.md`)

Five-lens judge panel, mean 74/100 (range 69–78): clinician/safety 74, technical 77, business 69,
UX 73, head judge 78. Status of the top fixes in this tree:

| # | Fix | Status |
|---|---|---|
| 1 | Pin stage to Scripted Demo Mode; fast-fail live calls | Done (timeout mapping, `.env.example`, `.env.local`, DEMO-SCRIPT step 2) |
| 2 | Show verification refusing an instruction | Done: pt-c has one deliberately paraphrased instruction. Eval shows 1 of 59 instructions unverified and routed to Needs clarification; DEMO-SCRIPT Scene 4.3 and narration shot 5 rewritten. |
| 3 | Medication-change guard + whole-word keyword matching | Done |
| 11 | Trim video; fix shot 5 | Partial (narration updated; MP4 not re-rendered) |
| 5, 6, 15 | Teach-back misconception veto; postpartum fever/calf tier; provider-neutral "can't answer" text | Open. `minKeyConceptsForCorrect` path, postpartum `feverNumeric` → emergency (`rules.ts:804–806`) and "Add an ANTHROPIC_API_KEY" text (`errors.ts`, `scripted.ts`, `en/common.ts`, `document-interpreter.ts`) unchanged. |
| 4, 7–10, 12–14, 16–24 | Remaining items | Not addressed in this phase |

### Check results (this gate, from `aftercare-loop-app/`)

| Check | Result |
|---|---|
| `npm run lint` | exit 0, no output |
| `npm run typecheck` | exit 0 |
| `npx vitest run` | 76 files, 1458 tests passed |
| `npm run build` | compiled; 16/16 static pages; routes incl. `/manifest.webmanifest` and 5 API routes |
| `npm run eval` | run `eval-2026-11-08T10-14-26-987Z`, `scripted_demo` / `deterministic_synthetic`, 154 cases, 0 not passed, 0 errors. Extraction P/R/F1 54/54; citations 58/58 valid (1 of 59 unverified → Needs clarification); safety 48/48 (38/38 emergencies caught, 10/10 non-emergency not escalated); comprehension 36/36 initial, 36/36 after clarification |
| `npx playwright test` | 2 passed (journey on desktop and iPhone 13), 16 skipped (live journey), three consecutive green runs |

Playwright notes:
- Run against `AFTERCARE_FORCE_SCRIPTED=true npx next start -p 3100` with
  `PLAYWRIGHT_BASE_URL=http://localhost:3100`. A `next dev` server from a previous session was
  still holding :3000 (stopping it was not permitted in this run), and `reuseExistingServer` would
  otherwise have reused it.
- Fix in `playwright.config.ts`: WebKit trace capture (`trace: "retain-on-failure"`) intermittently
  hung `page.goto` ("waiting until load") on headless macOS. With tracing on it stalled in 4 of 6
  runs; with tracing off it passed 3/3 in 1.4–1.5 s, and a standalone WebKit probe loaded `/`,
  `/understand` and `/check` in under 0.4 s five times out of five. The mobile project now sets
  `trace: "off"`; desktop (Chromium) keeps traces.
