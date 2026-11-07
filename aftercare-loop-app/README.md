# Aftercare Loop — web app

> Demonstration using fictional patient data. Educational information, not medical advice.
> This MVP is **not HIPAA-compliant** and must not be used with real patient information.

Aftercare Loop helps patients move through **Understand → Ask → Verify → Act → Follow Up** after a
visit, with **Ask Kat** as the conversational companion. This folder (`aftercare-loop-app/`) is the
core application. Product and engineering docs live one level up in [`../docs`](../docs):

| Doc | Purpose |
|---|---|
| [`SPEC.md`](../docs/SPEC.md) | Product specification |
| [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md) | Binding engineering contract |
| [`DEMO-SCRIPT.md`](../docs/DEMO-SCRIPT.md) | Five-minute demo, click by click |
| [`SECURITY-ROADMAP.md`](../docs/SECURITY-ROADMAP.md) | What the MVP does today and what production would need |
| [`LIMITATIONS.md`](../docs/LIMITATIONS.md) | Known limitations and P1/P2 roadmap |
| [`BUSINESS.md`](../docs/BUSINESS.md) | Customers and growth phases |

## Setup

Requirements: Node.js 20+ and npm. Run every command from this folder.

```bash
cd aftercare-loop-app
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live Claude responses
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.example`)

| Variable | Default | Effect |
|---|---|---|
| `ANTHROPIC_API_KEY` | empty | Server-side only (read in `src/lib/ai/client.ts`). Empty → Scripted Demo Mode. |
| `AFTERCARE_MODEL` | `claude-opus-5-5` | Claude model id used for live responses. |
| `AFTERCARE_FORCE_SCRIPTED` | `false` | `true` forces Scripted Demo Mode even when a key is set. |
| `AFTERCARE_ENABLE_MEDLINEPLUS_LIVE` | `false` | `true` enables the optional MedlinePlus Connect client in `src/lib/evidence/medlineplus.ts`. |

Never put secrets in `NEXT_PUBLIC_*` variables. `.env.local` is git-ignored.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit + component tests (run once) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run eval` | Synthetic evaluation → `eval-results/latest.json` |
| `npm run check` | lint + typecheck + test + build |

## Scripted Demo Mode vs Live mode

- **Scripted Demo Mode** (no key, or `AFTERCARE_FORCE_SCRIPTED=true`): AI-shaped responses come
  from predefined content in `src/data/scripted/` for the fictional patients. Every such response
  is labeled "Scripted Demo Mode — Responses are predefined for demonstration purposes." Questions
  outside the script get: "This scripted demonstration can't answer that question. Add an
  ANTHROPIC_API_KEY to enable live responses."
- **Live mode** (`ANTHROPIC_API_KEY` set): server routes under `src/app/api/` call Claude with
  structured outputs validated by zod. The UI labels these responses as live.
- In both modes, deterministic safety rules (`src/lib/safety/`) run before any model call, and a
  clinician-documented instruction is shown as verified only when its quote matches the document
  text at the stored offsets.

## Evaluation and tests

```bash
npm run eval                       # writes eval-results/latest.json and eval-results/<runId>.json
npm test                           # all vitest suites
npx vitest run src/lib/safety      # one area
npx playwright install             # first time only, for E2E
npx playwright test                # E2E (desktop + iPhone 13 projects; specs in tests/e2e/)
```

The evaluation runner (`scripts/run-eval.ts`) scores four suites on the synthetic fixtures:
instruction extraction (TP/FP/FN, precision/recall/F1), citation validity, safety, and
comprehension (teach-back scoring). Without an API key the run is `deterministic_synthetic` and
makes no network calls. The `/evaluation` page reads the latest run through `GET /api/eval/latest`;
it shows "Not evaluated" until `npm run eval` has been run, and never hardcodes numbers. These are
automated synthetic-case tests, not clinical validation, and involve no real users.

## Project structure

```
aftercare-loop-app/
├── src/app/                 routes: / /profile /understand /action-plan /check /follow-up
│                            /care-team /evaluation, plus API routes in src/app/api/
├── src/components/          ui/ layout/ ask-kat/ and one folder per feature
├── src/lib/types/index.ts   shared domain types (import from "@/lib/types")
├── src/lib/ai/              Claude client, zod schemas, prompts, scripted-mode router
├── src/lib/services/        server-side services (interpretation, Ask Kat, teach-back, plan…)
├── src/lib/safety/          deterministic safety rules + document sanitizer
├── src/lib/evidence/        retriever over the curated reference index
├── src/lib/eval/            evaluation harness used by scripts/run-eval.ts
├── src/lib/store/           client demo state (zustand, persisted to localStorage)
├── src/lib/i18n/            English/Spanish dictionaries + useT()
├── src/data/                fictional patients, ground truth, curated evidence, scripted responses
├── scripts/run-eval.ts      evaluation runner
├── eval-results/            evaluation output (latest.json)
└── tests/                   tests/unit (vitest) and tests/e2e (Playwright)
```

## Demo patients (all fictional)

| Id | Name | Language | Scenario |
|---|---|---|---|
| `pt-a-pcos` | Maya Thompson | en | Rural; learning about a new PCOS diagnosis (primary demo) |
| `pt-b-postpartum` | Lena Brooks | en | Single mother; postpartum follow-up with transportation and caregiving barriers |
| `pt-c-endometriosis` | Priya Shah | en | Under evaluation for endometriosis; preparing to describe symptoms |
| `pt-d-pots` | Hannah Okafor | en | Understanding a documented POTS care plan |
| `pt-e-multi` | Gloria Bennett | en | Several chronic conditions; advice that may conflict |
| `pt-f-gdm-es` | Ana Lucía Morales | es | Follow-up after gestational diabetes |
| `pt-g-hypothyroid` | Claire Donovan | en | Newly started on thyroid medicine |
| `pt-h-migraine` | Tasha Reed | en | Migraines on a tight budget |
| `pt-i-anemia-es` | Rosa Delgado | es | Starting iron treatment for anemia and heavy periods |
| `pt-j-perimenopause` | Denise Walker | en | Perimenopause symptoms; comparing options |
| `pt-k-asthma-pregnancy` | Mei Lin Park | en | Asthma during a documented pregnancy |
| `pt-l-t2d-htn` | Patricia Hall | en | Type 2 diabetes and high blood pressure with cost and travel barriers |

Each fixture lives in `src/data/patients/` with a matching ground-truth record in
`src/data/ground-truth/`. Scripted Demo Mode content currently exists for patients A–E
(`src/data/scripted/`). **Reset Demo** in the header restores every patient to its starting state.
