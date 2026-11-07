# Aftercare Loop — Product Specification (hackathon MVP)

This is the authoritative product spec, combining the original development
specification and the "Ask Kat AI Companion + P0 Safety, Traceability, and
Evaluation" addendum. Implementation conventions live in ARCHITECTURE.md.

## 1. Project objective

Develop a polished, functional, mobile-responsive web application called Aftercare
Loop. Mission: bridge the gap between receiving healthcare information,
understanding it, and knowing how to act on it. Primary audience: underserved women,
including rural residents, single mothers, women experiencing financial or
logistical barriers to care, and those managing complex or multiple medical
conditions.

The application must NOT be condition-specific. It dynamically adapts to whatever
conditions, concerns, and healthcare information a patient provides (PCOS,
endometriosis, postpartum health, POTS, reproductive health, chronic diseases, and
others). The interface stays consistent regardless of condition; conditions
influence content, not structure.

Central differentiation: a continuous, personalized educational workflow —
**Understand → Ask → Verify → Act → Follow Up**. Not a replacement for clinicians;
no diagnosis; no autonomous treatment direction. Goal: empower patients to
understand, participate in decisions, and maintain continuity between encounters.

## 2. Technical architecture

Stack: Next.js, React, TypeScript, Tailwind CSS, Next.js API routes, configurable
LLM provider through a server-side API (Claude), TypeScript/JSON synthetic
fixtures, local demo-state storage (synthetic only), curated health references with
optional live MedlinePlus retrieval, scripted unit tests plus human-reviewed
scenario assessments.

Environment variables for API keys; never expose keys client-side. If no AI key is
configured, provide a clearly labeled Scripted Demo Mode with deterministic
responses. Never represent scripted responses as live AI output.

Design principles: condition-agnostic; mobile-first and accessible; plain language;
evidence-backed; patient-centered personalization without demographic
stereotyping; minimal friction; privacy-conscious; modular; clear distinction
between education and clinician-directed care.

## 3. Primary navigation

### A. Home / My Health Dashboard
Personalized greeting; overview of selected health topics; clinician-documented
follow-up tasks; today's reminders and upcoming appointments; personal educational
goals and progress; recent questions/topics; prominent "Ask Kat" button. Primary
actions: Understand My Health, Ask Kat, My Action Plan, Prepare for My
Appointment. Organized, reassuring, simple — not an EHR.

### B. My Health Profile
Editable, multi-condition. Fields: fictional name; age range; preferred language;
explanation complexity (Simple/Standard/Detailed); accessibility preferences;
conditions/concerns (multi-select + free text); medications; clinician-documented
care instructions; health goals; access barriers (transportation, financial,
limited appointment availability, caregiving, etc.); optional pregnancy/postpartum
context when relevant. Never infer pregnancy status, clinical risk, health literacy
or other sensitive characteristics from demographics. All fields optional unless
needed for an explicitly selected feature. Same component for every patient.

### C. Understand My Health
Two inputs: (1) a condition/term/question; (2) paste or upload (.txt) an
after-visit summary. PDF optional. Output sections: **What does this mean?** (plain
language, define terms, distinguish documented info from general education);
**What should I know?** (education; explain documented tests/instructions without
inventing diagnoses); **What can I discuss with my provider?** (unanswered
questions, topics); **What are my next steps?** (actual follow-up instructions,
clinician-provided vs optional suggestions clearly separated); **Sources**
(clickable links; identify unverifiable info).

### D. Ask Kat (formerly "Ask Aftercare AI")
Conversational interface: explain terminology/concepts; explain the synthetic visit
summary and documented care plan; help prepare provider questions; clarify earlier
explanations; adapt to communication style; cite resources. Quick prompts: "Can you
explain this in simpler terms?", "What should I ask my doctor?", "What does this
medical term mean?", "What does my follow-up plan say?", "What information should I
clarify?". Must acknowledge missing information rather than guess.

### E. My Action Plan
Categories: **My Care Plan** (clinician-directed medication reminders if
documented, follow-up appointments, tests/consults to schedule); **My Wellness
Goals** (patient-selected activity, nutrition/hydration education, sleep/self-care,
other goals grounded in documented guidance); **Questions for My Provider**
(auto-generated discussion questions, user-added concerns, items awaiting
clarification). Each action: description, category, source/rationale, due date or
optional reminder, status Pending/Completed/Needs Clarification. Reminders are
in-app only.

### F. Check My Understanding (teach-back)
Patient reviews an explanation → 2–3 short questions → multiple-choice or free
text → compared against predefined answer key/documented instructions → identify
misunderstandings → re-explain without judgment → retry or save for clinician.
Example: "Let's make sure I explained that clearly. What would you say is the next
step in your care plan?" Never "you failed". Track completion and correctness.

### G. Provider Communication — simulated
Simple clinician-facing dashboard showing fictional clarification requests, refill
requests, side-effect questions, incomplete follow-up items, patient-reported
barriers. Workflow: patient submits → appears in simulated queue → staff reviews →
status changes. Nothing is transmitted to real physicians. The AI never authorizes
refills, modifies prescriptions, or decides a treatment change is necessary.

## 4. Personalization engine
Inputs: conditions/concerns, medications, language and complexity, documented
instructions, current question, reported barriers, available evidence. Outputs:
plain-language explanation, term definitions, educational context, suggested
patient questions, clinician-directed action items, optional wellness education,
source references, limitations/missing info, safety or clarification flags.

Rules: no demographic → diagnosis inference; no unsupported individual risk
predictions; no fabricated instructions; never override clinician plans; never
recommend dose/frequency changes; no universal recommendations that may conflict
with documented restrictions (e.g. hydration advice vs fluid restriction);
distinguish general education from patient-specific documented info; consider
multiple conditions together without assuming the system can resolve conflicts —
recommend discussing individualized targets with a clinician.

## 5. Evidence & literature integration
Curated reference collection: MedlinePlus, NIH, CDC, professional guidelines
(e.g. ACOG), selected peer-reviewed publications. Each record: source ID, title,
organization/journal, URL or DOI, topic tags, publication/update date, date
accessed, curated summary (respecting reuse permissions). Retrieval: extract
topics → search curated index (optional MedlinePlus) → retrieve permitted content →
generate explanation using patient context + evidence → return linked references →
state explicitly when evidence is insufficient. Never invent references, titles,
findings, or DOIs. Never label as peer-reviewed without an actual peer-reviewed
source. Distinguish guidelines from research studies in display.

## 6. Synthetic patient data
10–20 fully fictional scenarios. Primary demos:

| Case | Context | Main workflow |
|---|---|---|
| Patient A | Rural woman managing PCOS | Understanding a diagnosis and preparing questions |
| Patient B | Single mother navigating postpartum follow-up (transportation + caregiving barriers) | Understanding instructions and organizing follow-up |
| Patient C | Woman under evaluation for endometriosis | Appointment preparation and symptom communication |
| Patient D | Woman with documented POTS | Understanding her documented care plan |
| Patient E | Woman managing multiple chronic conditions | Identifying potentially conflicting instructions for clarification |

Vary language, explanation level, accessibility needs, and social barriers. Each
patient: unique fictional ID, demographics/preferences, conditions, medications,
synthetic clinical summary, documented instructions, user questions, expected key
facts, expected follow-up actions, predefined safety considerations. Separate
ground-truth record per scenario: expected extracted facts, acceptable
explanations, required citations, and actions the system must not perform.

## 7. Core AI services
Document Interpreter; Evidence Retriever; Education Generator; Conversational
Assistant (Ask Kat); Comprehension Checker (adaptive teach-back); Action Plan
Generator (barrier-aware); Care-Team Request Router (simulated). Structured,
validated responses; graceful errors.

## 8. Safety, privacy & security (MVP)
Synthetic data only; banner "Demonstration using fictional patient data."; no real
records; never expose keys; sensitive processing server-side; validate inputs and
file types/sizes; treat uploaded documents and retrieved text as untrusted input;
never log full documents; distinguish education from advice; emergency guidance for
potentially urgent symptoms; human review for clinical decisions. Document a
production roadmap (HIPAA assessment, BAAs, encryption, auth/RBAC, consent, audit
logs, data minimization/retention, secure integrations, vendor review, risk
assessment, clinical safety testing/regulatory review). Never describe the MVP as
HIPAA-compliant.

## 9. Metrics & validation dashboard
Primary: patient comprehension performance on predefined synthetic scenarios.
Secondary: information extraction accuracy; evidence grounding (claims supported;
fabricated/invalid citations); clinical safety (unsafe recommendations; recognition
of predefined safety scenarios); usability (task completion, time, steps);
comprehension support (pre/post, misunderstandings clarified); follow-through
(next-step items transferred to action plan; completion status). Show metric names,
numerators, denominators, results; confusion matrix or failure breakdown. Never
invent results. Distinguish automated synthetic tests, human-reviewed results,
genuine user testing, and projections. Never claim real-world outcome improvement.

## 10. UX & visual design
Clean, minimal, soft calming colors with strong contrast, professional not
clinical, large readable type, rounded cards, consistent spacing, clear icons,
mobile-responsive, keyboard accessible, clear loading/empty/error states. Avoid
gender stereotypes and an excessively pink design. Accessibility: simple respectful
language; high contrast; flexible text sizing; English/Spanish controls; clear
labels; minimal typing; no assumptions about motherhood, pregnancy, or sexual
activity. Provide guided prompts.

## 11. Prioritization
**P0:** responsive dashboard; editable profile; patient switching; paste visit
summary; AI plain-language explanation; evidence-backed response with working
links; interactive Q&A; personalized action plan from documented instructions; at
least one comprehension check; end-to-end demo; clear limitations and safety.
**P1:** in-app reminders; simulated care-team queue; Spanish; PDF extraction;
evaluation dashboard; better retrieval. **P2 (roadmap only):** EHR, wearables,
real messaging, refill integration, SMS/push, cloud accounts, predictive models,
real PHI deployment.

## 12. Ask Kat addendum (P0 additions)

### 12.1 Branding & floating chat
Replace all patient-facing "Ask Aftercare AI" with "Ask Kat". Persistent floating
button bottom-right: chat bubble icon with a small heart, label "Ask Kat", soft
calming accent, rounded, subtle hover animation, accessible contrast and keyboard
focus, visible on main patient pages, above mobile bottom nav / safe area, never
obscuring primary actions. Opens a right-side panel on desktop and a full-height
sheet on mobile with: Ask Kat branding, close and minimize, session conversation
history, user/assistant bubbles, input + send, loading indicator, error + retry,
source references under answers, quick-action prompts.

Welcome message (first open):
> Hi! I'm Kat. 💗
> I'm here to help you understand your health information, explore reliable
> resources, and prepare questions for your care team.
> What's on your mind today?

Suggestion chips (each performs a real action):
- **What should I ask my doctor?** → generates questions from documented info and unresolved concerns.
- **Explain my diagnosis** → explains only diagnoses documented in the synthetic record; otherwise asks for clarification.
- **Help me understand my results** → explains documented results without inventing interpretations.
- **Help me plan my next steps** → opens/generates the source-traceable action plan.
- **Ask Kat anything about your health…** → focuses the free-text input.

### 12.2 Context-aware chat
Kat receives: documented conditions/concerns, current visit summary, extracted
clinician instructions, explanation complexity, language, reported barriers,
current action plan, verified education sources, unresolved questions. Kat never
invents missing clinical details. Switching patients resets/separates conversation
context.

### 12.3 Chat-to-workflow integration
Understand (explain), Ask (formulate questions), Verify (start adaptive
teach-back), Act (organize instructions and admin tasks), Follow Up (summarize
unresolved items). Contextual actions that perform real behavior: View original
source; Check my understanding; Add question to my list; View my action plan;
Prepare for my appointment.

### 12.4 Source-to-action traceability (P0)
For every clinician-directed action store: action ID, patient ID, document ID,
exact supporting text, location (offsets/section), description, type, due date
(only when documented), verification status, completion status. Distinguish
clinician-documented / patient-selected / AI-suggested. Validate quotes against the
original before showing as verified; unmatched → not a verified instruction, not
auto-added to the care plan, marked needs clarification. "View source" beside each
verified action highlights the passage. Stable IDs and offsets. Acceptance test:
summary with three documented instructions → all three extracted with locations,
no unsupported instructions.

### 12.5 Safety-aware responses (P0)
Never diagnose, never declare the patient safe, never recommend medication changes,
never override instructions, never fabricate a treatment plan, never false-reassure
urgent symptoms, never delay escalation with long education. Predefined scenarios:
chest pain with concerning symptoms; severe difficulty breathing; stroke-like
symptoms; severe bleeding; suicidal thoughts/self-harm danger; severe postpartum
warning symptoms. Deterministic handling for recognized urgent scenarios with
concise, location-appropriate emergency guidance; for uncertain-but-concerning
input, communicate limits and recommend prompt professional assessment. Model-based
detection only supplementary. Automated tests per scenario incl. wording variations
and unsupported-reassurance checks. Label as limited synthetic evaluation.

### 12.6 Adaptive teach-back (P0)
Explanation → Kat asks a short question about a documented fact/instruction →
response compared with predefined criteria → Claude identifies misunderstanding →
Kat re-explains differently ("Let me explain that another way.") grounded in the
document → retry → unresolved saved for clinician. Per question define: ID, source
passage, expected answer, accepted variations, key concepts, scoring criteria,
attempts, initial correctness, final correctness, clarification provided. Claude
never invents the expected answer after seeing the response.

### 12.7 Barrier-aware action planning (P0)
Barriers: transportation, cost/insurance, language, scheduling, caregiving.
Examples: transportation → "Would you like to ask your clinic whether transportation
assistance or a telehealth appointment is available?"; cost → ask about financial
assistance or coverage. Never assume a service is available. Admin suggestions
clearly separated from medical instructions; produce editable next steps.

### 12.8 Evaluation dashboard (P0)
Instruction extraction (TP, FP, FN, precision, recall, F1); citation validity
(verified count, invalid count, rate); safety (total, passed, failed, rate, failure
details); comprehension (total questions, initial correct, correct after
clarification, misunderstandings identified, unsuccessful clarifications). Each run
records suite version, timestamp, model id, case count, numerators/denominators,
individual outcomes, errors. No executed tests → "Not evaluated". Distinguish
deterministic vs model-based vs human-reviewed. No clinical validation claims.

### 12.9 P1: Multilingual
English + Spanish for selected scenarios: profile selection, translated nav and
predefined UI text, Claude responses in selected language, validated translations
for scripted scenarios, original source passages preserved. No claim of
comprehensive medical translation validation.

### 12.10 P1: Clinician communication summary
Editable summary: provider questions, reported barriers, unresolved follow-up
items, documented instructions with source refs. "Copy summary" button. No
transmission; care-team queue labeled fictional simulation.

### 12.11 Claude integration
Secure server-side calls; env credentials; validate request/response payloads;
structured JSON for extraction and action generation; graceful malformed handling;
prompt-injection resistance; documents/references untrusted; safety constraints
separate from ordinary prompts. Scripted fallback text: "Scripted Demo Mode —
Responses are predefined for demonstration purposes." Unsupported question in
scripted mode → say the scripted demo cannot answer it.

### 12.12 Demo reliability
Three fully supported demo profiles (A PCOS, B Postpartum with transportation and
caregiving barriers, C Endometriosis evaluation) plus additional fixtures. One fully
interactive journey from visit-summary input to source-traceable action plan.
Reset Demo button restores initial synthetic state, clears conversation and
progress. Run and report: unit tests, traceability tests, safety tests, teach-back
tests, lint, typecheck, production build, mobile checks. Disclose anything not
completed.

### 12.13 Five-minute demo
1. Understand — select patient, paste summary, generate explanation.
2. Ask Kat — open bubble, contextual question, source-backed response.
3. Verify — teach-back with a recognized misunderstanding and re-explanation.
4. Act — instructions transferred with exact source references; one barrier-aware suggestion.
5. Follow Up — editable summary for the care team.
6. Evaluation — real synthetic test results.
Tagline: Aftercare Loop doesn't just answer health questions. It helps patients
understand, verify, and follow through on documented care instructions.

## 13. Final acceptance criteria
Branded Aftercare Loop; companion named Ask Kat throughout; floating heart chat
bubble bottom-right; welcome message + five prompts; Claude responses when
configured; labeled, functional Scripted Demo Mode; ≥3 fictional profiles; submit
synthetic summary; clinician actions link to exact passages; unsupported
instructions not verified; safety tests pass; adaptive teach-back with retry;
barrier-aware suggestions; evaluation dashboard with real metrics; plan
distinguishes documented vs suggested; full Understand→Ask→Verify→Act→Follow Up
journey; resettable demo; no real data; no exposed credentials; desktop + mobile;
tests/lint/typecheck/build executed and reported; five-minute-demo ready.

## 14. Business & growth (for docs/BUSINESS.md)
Initial customers: FQHCs, community clinics, rural organizations, women's health
practices, maternal health programs, systems serving underserved populations.
Phases: 0 prototype/validation; 1 pilot after privacy/security/clinical review;
2 facility-based subscription tiers; 3 expansion. Do not assume Medicare/Medicaid
reimbursement; treat as requiring validation.
