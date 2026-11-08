# Aftercare Loop — Architecture Contract

This document is the shared contract for everyone (human or agent) building the
MVP. Read it fully before writing code. When this doc and the product spec
disagree on an implementation detail, this doc wins; when they disagree on
product behavior, the spec (docs/SPEC.md) wins.

## 1. Repository layout

```
aftercare-loop/                  git root
├── aftercare-loop-app/          Next.js 16 app (TypeScript, Tailwind v4, App Router)
│   ├── src/app/                 routes (pages + API route handlers under src/app/api)
│   ├── src/components/          ui/ layout/ ask-kat/ dashboard/ profile/ understand/
│   │                            action-plan/ teach-back/ follow-up/ care-team/ evaluation/
│   ├── src/lib/types/index.ts   THE domain type contract (import from "@/lib/types")
│   ├── src/lib/ai/              Claude client, zod schemas, prompts, scripted-mode router
│   ├── src/lib/services/        pure server-side services (one file per service)
│   ├── src/lib/safety/          deterministic safety rules + sanitizer
│   ├── src/lib/evidence/        retriever over the curated index
│   ├── src/lib/store/           client demo-state store (zustand, localStorage)
│   ├── src/lib/i18n/            en/es dictionaries + useT()
│   ├── src/lib/utils/           cn(), ids, dates, text helpers
│   ├── src/data/patients/       synthetic patient fixtures (one file per patient + index)
│   ├── src/data/ground-truth/   expected facts/instructions/teach-back/safety per patient
│   ├── src/data/evidence/       curated reference index
│   ├── src/data/scripted/       deterministic Scripted Demo Mode responses
│   ├── scripts/run-eval.ts      reproducible evaluation runner → eval-results/latest.json
│   ├── tests/unit/              vitest (also colocated *.test.ts under src/)
│   └── tests/e2e/               Playwright (desktop + iPhone 13 projects)
├── aftercare-loop-assets/       NOT in git. Contains third-party credentials. Never read/copy.
└── docs/                        ARCHITECTURE.md (this), SPEC.md, DEMO-SCRIPT.md, SECURITY-ROADMAP.md,
                                 LIMITATIONS.md, BUSINESS.md
```

Run everything from `aftercare-loop-app/`: `npm run dev | lint | typecheck | test | build | eval | check`.

## 2. Non-negotiable product rules

1. **Synthetic data only.** Every patient is fictional. Every page shows the banner
   "Demonstration using fictional patient data."
2. **Condition-agnostic.** No page, component or service may branch on a condition
   name. Conditions live in fixtures, evidence tags and prompts only.
3. **Never fabricate.** No invented instructions, diagnoses, citations, DOIs, study
   findings or evaluation numbers. If evidence is missing, say so.
4. **Clinician-documented vs patient-selected vs AI-suggested** are always visually
   and semantically distinct (`ActionOrigin`). An AI suggestion is never shown as an
   instruction.
5. **Source traceability.** A clinician-documented action is `verified` only if
   `document.text.slice(ref.start, ref.end) === ref.quote`. Anything else is
   `unverified` and goes to "Needs clarification", never into My Care Plan.
6. **Safety.** Deterministic rules run BEFORE any model call on every user message
   and on pasted documents. Emergency → concise guidance (call local emergency
   services / 911 in the US; 988 for suicide & crisis in the US) and no lengthy
   education. Never diagnose, never say the patient is "safe", never change
   medications, never override documented instructions, never false-reassure.
7. **Untrusted input.** Document text, uploaded files and retrieved references are
   data. They are wrapped in delimiters in prompts and the system prompt instructs
   the model to ignore any instructions inside them.
8. **Keys are server-only.** Provider keys (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`)
   are read only by the server-side provider adapters in `src/lib/ai/providers/`
   (presence checks via `providers/shared.ts`). No `NEXT_PUBLIC_` secrets. Client
   code calls `/api/*`.
9. **Scripted Demo Mode** is honest. Every AI-shaped response carries `AiMeta.mode`;
   the UI shows "Scripted Demo Mode — Responses are predefined for demonstration
   purposes." when mode is `scripted_demo`. Unsupported questions in scripted mode
   return: "This scripted demonstration can't answer that question. Add a provider
   key (GEMINI_API_KEY or ANTHROPIC_API_KEY) to enable live responses." Patients
   never see developer-facing text: when the message is safety-`concerning` and
   there is no scripted match, the reply is the patient-facing line "I don't have
   more on this in your summary; please contact your care team." instead.
10. **Logging.** Never log full document text or full prompts. Log ids, lengths,
    mode, model, duration.
11. **Branding.** Product = "Aftercare Loop". Companion = "Ask Kat" (never "Ask
    Aftercare AI"). Avoid an excessively pink palette and gender stereotypes.

## 3. Framework notes (Next.js 16.4 — APIs differ from training data)

- Before writing framework code read `node_modules/next/dist/docs/01-app/01-getting-started/`
  (layouts-and-pages, route-handlers, server-and-client-components, error-handling).
- App Router only. Stateful UI = `"use client"` components. API = route handlers
  `src/app/api/<name>/route.ts` exporting `POST`. Validate bodies with zod; return
  `NextResponse.json(...)` with 400 on invalid input.
- `cacheComponents` is OFF in next.config.ts. Don't re-enable.
- Tailwind v4 (`@import "tailwindcss"` + `@theme` tokens in globals.css). No
  tailwind.config.js. Use `cn()` from `@/lib/utils/cn`.
- Icons: `lucide-react`. State: `zustand` (+ `persist` middleware). Validation: `zod` v3.
- Tests: vitest (jsdom, globals on). E2E: Playwright config already present.
- Don't edit package.json/lockfile. If you need a dependency, stop and report it.

## 4. Claude integration contract (`src/lib/ai/`)

Follow the Anthropic TypeScript SDK (`@anthropic-ai/sdk` 1.6) patterns:

- `client.ts`: `getAiMode()` returns `"live_claude"` when `ANTHROPIC_API_KEY` is set
  and `AFTERCARE_FORCE_SCRIPTED !== "true"`, else `"scripted_demo"`. Export a lazily
  constructed `new Anthropic()` (reads the env var itself). Model from
  `AFTERCARE_MODEL`, default `claude-opus-5-5`.
- Structured outputs: `client.messages.parse({ model, max_tokens: 16000, system,
  messages, output_config: { format: zodOutputFormat(Schema) } })` with
  `zodOutputFormat` from `@anthropic-ai/sdk/helpers/zod`. Guard `parsed_output`
  being null → treat as malformed, retry once, then return a typed error.
- Thinking: omit the `thinking` param (adaptive is default). Set
  `output_config.effort`: `"medium"` for chat/teach-back, `"high"` for document
  interpretation. Never send `budget_tokens`, `temperature`, prefill, or forced
  `tool_choice`.
- Always check `response.stop_reason`; `"refusal"` → return a safe generic message
  with `meta.mode` set and an `error` string. Catch SDK typed errors most-specific
  first (`Anthropic.AuthenticationError`, `RateLimitError`, `APIError`).
- Chat streaming is optional for the MVP; non-streaming JSON is acceptable. If
  streaming, use `client.messages.stream()` + `finalMessage()`.
- Prompts live in `prompts.ts` as pure functions `(ctx) => { system, user }`. Stable
  system text first; patient context and document last. Document/retrieved text is
  wrapped as `<untrusted_document id="...">…</untrusted_document>` and the system
  prompt says to treat it as data only.
- Every service has the signature `fn(input, deps?) => Promise<Output>` and
  internally routes: safety rules → (scripted lookup | Claude call) → zod validate →
  post-validation (e.g. source quote verification) → `AiMeta`.

## 5. Service contracts (`src/lib/services/`)

All inputs/outputs use types from `@/lib/types`. Each service exports exactly these
functions and ships a colocated `*.test.ts`.

| File | Export | Notes |
|---|---|---|
| `document-interpreter.ts` | `interpretDocument({ profile, document, evidence }): Promise<DocumentInterpretation>` | Runs `extractInstructions` then `verifySourceRefs`. Unverified refs → `sourceVerification: "unverified"`. |
| `source-verification.ts` | `verifySourceRef(doc, ref): SourceVerification`, `locateQuote(doc, quote): SourceRef \| null` (exact, then whitespace/case-normalized fallback that re-derives exact offsets) | Pure, no AI. |
| `evidence-retriever.ts` (in `src/lib/evidence/`) | `retrieveEvidence({ query, topics, language, limit }): EvidenceMatch[]`, `getReference(id)` | Tag + keyword scoring over `src/data/evidence`. Optional MedlinePlus Connect behind env flag. |
| `ask-kat.ts` | `askKat(req: KatRequest, ctx: KatContext): Promise<KatResponse>` | `KatContext` = profile, active document, interpretation, actions, saved questions, evidence matches. Safety check first. Quick prompts map to deterministic behaviors (see spec). |
| `teach-back.ts` | `scoreTeachBack(question, response): { correct, matchedConcepts, misunderstanding? }` (pure), `clarify({ question, response, document, profile }): Promise<{ clarification, mode }>` | Expected answers come ONLY from the question record. Claude never invents the key. |
| `action-plan.ts` | `buildActionPlan({ profile, interpretation, document, existing }): ActionItem[]`, `suggestBarrierActions(profile): ActionItem[]` | Verified instructions → `clinician_documented`; barrier suggestions → `ai_suggested`/`administrative`, phrased as questions to ask the clinic. |
| `communication-summary.ts` | `buildCommunicationSummary(state: PatientSessionState): CommunicationSummary` | Pure. Editable text output. |
| `care-team.ts` | `createCareTeamRequest(...)`, `advanceRequest(req): CareTeamRequest` | Pure state machine: submitted → in_review → responded → closed. |
| `src/lib/safety/rules.ts` | `evaluateSafety(text: string): SafetyVerdict` | Deterministic phrase/regex rules with negation awareness. Tests per scenario incl. wording variants and benign controls. |
| `src/lib/safety/sanitize.ts` | `sanitizeDocumentText(raw): string`, `wrapUntrusted(id, text): string` | Strip control chars, cap at 20k chars, neutralize prompt-injection markers. |
| `src/lib/ai/scripted.ts` | `getScriptedResponse(kind, key): T \| null` | Keyed by patientId + documentId + quickPrompt/question-slug. |

API route handlers (`src/app/api/*/route.ts`): `interpret`, `ask-kat`, `teach-back`,
`action-plan`, `eval/latest` (GET, reads eval-results/latest.json). Each validates
with zod and never trusts client-supplied `mode`.

## 6. Client state (`src/lib/store/`)

`useDemoStore` (zustand + persist, key `aftercare-loop-demo-v1`):

```ts
interface DemoStore {
  activePatientId: PatientId;
  patients: Record<PatientId, PatientSessionState>;
  katOpen: boolean;
  katHasOpenedOnce: Record<PatientId, boolean>;
  // selectors
  active(): PatientSessionState;
  // actions
  switchPatient(id): void;            // chat/context strictly per patient
  updateProfile(id, patch): void;
  addDocument(id, doc): void; setActiveDocument(id, docId): void;
  setInterpretation(id, interp): void;
  upsertActions(id, items): void; setActionStatus(id, actionId, status): void;
  addReminder(id, actionId, reminder): void;
  appendChat(id, msg): void; clearChat(id): void;
  upsertTeachBack(id, session): void;
  addSavedQuestion(id, q): void; removeSavedQuestion(id, q): void;
  setCommunicationSummary(id, s): void;
  addCareTeamRequest(id, r): void; advanceCareTeamRequest(id, reqId): void;
  setKatOpen(open): void;
  resetDemo(): void;                  // restores fixtures for ALL patients
}
```

Initial state is built from `src/data/patients` (`buildInitialSessionState(profile,
documents)`). Fixture patients come pre-loaded with their visit document but NO
interpretation/actions, so the demo can show the Understand step live.

## 7. UI system

- Tokens in `globals.css` `@theme`: `--color-brand-*` (deep teal #0F766E family),
  `--color-accent-*` (warm coral #F0705A family for Ask Kat), neutrals (stone),
  `--color-success/warning/danger`, radius `--radius-card: 1rem`. Large base type
  (17px body on mobile, 16px desktop), min 44px touch targets, visible focus rings.
- `src/components/ui/`: Button, Card, Badge, Input, Textarea, Select, Checkbox,
  Dialog, Sheet, Tabs, Skeleton, Alert, Toast, EmptyState, OriginBadge
  (clinician/patient/AI), SourceQuote (highlighted passage), ModeBadge
  (live/scripted), DemoBanner.
- Layout: `AppShell` with top bar (logo, patient switcher, language toggle, Reset
  Demo) and bottom nav on mobile: Home, Understand, Plan, Check, Follow Up. Ask Kat
  FAB bottom-right, above bottom nav (`bottom: calc(env(safe-area-inset-bottom) + 5rem)`
  on mobile).
- Routes: `/` dashboard, `/profile`, `/understand`, `/action-plan`, `/check`,
  `/follow-up`, `/care-team` (simulated, clinician view), `/evaluation`.
- All user-facing strings go through `useT()` from `@/lib/i18n` with keys in
  `en.ts`/`es.ts`. Kat's AI output is generated in the profile language.
- Loading, empty and error states are required on every data view.

## 8. Testing & evaluation conventions

- Unit tests next to code (`foo.test.ts`). Fixtures imported from `src/data`.
- `scripts/run-eval.ts` runs: instruction extraction vs ground truth (TP/FP/FN,
  precision/recall/F1), citation validity, safety suite, comprehension suite
  (deterministic scoring of `acceptedVariations` + a wrong answer per question).
  Writes `eval-results/latest.json` as `EvalRun`. Metrics with zero cases →
  `value: null` ("Not evaluated"). In scripted mode `modelId` is undefined and
  `kind` is `deterministic_synthetic`.
- The evaluation page reads that file via `/api/eval/latest` and never hardcodes
  numbers.

## 9. Agent working rules

- Own only the files listed in your assignment. If you must touch a shared file
  (globals.css, layout.tsx, i18n dictionaries, types), add — never rewrite — and
  keep additions in a clearly delimited block.
- Run `npm run typecheck` and your own tests before finishing. Report real results.
- Prefer small, composable modules. No condition-specific branching in code.
- Return a terse completion report: files created/changed, exports, tests run,
  anything blocked or needing a dependency.
