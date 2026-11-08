# Aftercare Loop — Pitch (slide text and speaker notes)

Source of truth: the claude.ai Slides artifact https://claude.ai/artifact/N7aWepRV4jH6gVm9RrYCZu (16 slides, 16:9).
Editable copies: `aftercare-loop-pitch.pptx` (PowerPoint) and `aftercare-loop-pitch.pdf`. All patients are fictional; not medical advice.

## 1. Aftercare Loop  (`cover`)

- Helping patients understand their care after the visit, and follow through on it.
- Understand → Ask → Verify → Act → Follow Up
- Team HW1 · Hackathon pitch
- Demonstration using fictional patient data. Not medical advice.

**Speaker notes**

> Hi, we are Team HW1 and this is Aftercare Loop. Every visit ends with a plan: take this, come back then, watch for that. Our product is about what happens in the days after that plan is handed over, when most of it is already slipping away. Aftercare Loop closes the loop: it helps a patient understand her after-visit summary, ask about it, verify she understood, act on it with her real-world constraints in mind, and hand unresolved items back to her care team. Everything you will see today uses fictional patients.

## 2. of medical information is forgotten right after a visit. Almost half of what is remembered is wrong.  (`problem`)

- The problem
- 40–80%
- 49%
- of recommendations recalled accurately one week after a specialty visit
- 38% vs 65%
- recall for patients without a high-school diploma vs college graduates. Teach-back by providers was “rare.”
- Sources: Kessels, J R Soc Med 2003 (review; underlying data Anderson et al. 1979) · Laws et al., PLoS ONE 2018

**Speaker notes**

> Here is the problem in one number. A landmark review in the Journal of the Royal Society of Medicine found that 40 to 80 percent of what clinicians tell patients is forgotten immediately, and almost half of what is remembered is remembered wrong. This is not an old-fashioned problem: in a 2018 PLoS ONE study of specialty visits, patients recalled only 49 percent of recommendations one week later, and the gap by education was 38 versus 65 percent. The authors noted that teach-back, the simplest fix, was rare. The after-visit summary is supposed to close that gap. It mostly does not.

## 3. Underserved women carry the cost of a forgotten plan  (`who`)

- Who we serve
- Rural, caregiving, cost-constrained, often managing more than one condition. The after-visit summary was never designed for her.
- 5.8M
- US residents delayed medical care in one year because they lacked transportation
- 9.1%
- of women did not take medication as prescribed to save money, vs 7.0% of men
- 61%
- of 53 million US family caregivers are women, averaging 23.7 hours of care a week
- 12%
- of US adults have proficient health literacy; 30% of Medicaid recipients are at the lowest level
- Sources: Wolfe et al., Am J Public Health 2020 (NHIS 2017) · Mykyta & Cohen, NCHS Data Brief 470, 2023 · NAC/AARP, Caregiving in the U.S. 2020 · Kutner et al., NCES 2006 (NAAL)

**Speaker notes**

> We built this for a specific patient. She may live an hour from the clinic: 5.8 million Americans delayed care in a single year because they had no ride. She is more likely than a man to skip a prescription because of cost. She is more likely to be the caregiver in her family: 61 percent of the country's 53 million family caregivers are women. And like most Americans, she is not a proficient reader of health information; only 12 percent of adults are. None of that is a knowledge problem on her side. It is a design problem on ours.

## 4. Years to a diagnosis, then a thin follow-up  (`women`)

- Why women’s health first
- PCOS
- 47%
- saw three or more clinicians before diagnosis; only 16% were satisfied with the information they received
- Endometriosis
- 4.4 yrs
- mean time from first symptoms to diagnosis for US women
- POTS
- 76%
- of women were misdiagnosed first, seeing a median of five doctors before diagnosis
- Postpartum follow-up gap
- >80%
- of US pregnancy-related deaths are preventable
- 53%
- occur between 7 days and 1 year after delivery
- <60%
- of Medicaid-enrolled women attend a postpartum visit
- Sources: Gibson-Helm et al., JCEM 2017 · Soliman et al., J Womens Health 2017 · Bourne et al., CJC Open 2021 · CDC MMRC 2017–2019 (2022) · Rodin et al., J Womens Health 2019

**Speaker notes**

> Why start with women's health? Because the information gap is widest here. Nearly half of women with PCOS saw three or more clinicians before anyone named it, and only 16 percent were satisfied with the information they got. Endometriosis takes 4.4 years on average to diagnose in the US. Three quarters of women with POTS were misdiagnosed first. And after birth, the follow-up is thinnest exactly when it matters most: more than 80 percent of pregnancy-related deaths are preventable, 53 percent happen between a week and a year postpartum, yet fewer than 60 percent of Medicaid-enrolled women attend a postpartum visit. These are the conditions in our demo patients, but the product is not condition-specific.

## 5. Chatbots answer. Portals store. Nobody closes the loop.  (`gap`)

- The gap in existing tools

| Capability | Aftercare Loop | Abridge | Ada | K Health | Epic MyChart |
|---|---|---|---|---|---|
| Primary user | Patient | Clinician | Consumer, pre-visit | Patient via health system | Patient of Epic system |
| Explains the patient’s own after-visit summary in plain language | Yes (Understand) | Clinician-reviewed summary | No | No | Partial, on roadmap |
| Checks comprehension with adaptive teach-back | Yes (Verify) | No | No | No | No |
| Traces every action to the clinician’s exact words, for the patient | Yes (Act) | Clinician-side only | No | No | No |
| Plans around transportation, cost, caregiving, language | Yes | No | No | No | No |
| Hands unresolved items back to the care team | Yes (Follow Up; simulated) | Clinician-side | No | Own clinicians | Messaging, unstructured |

- Source: each company’s public website, read 2026-11-07; Epic AI roadmap from trade press (secondary). Babylon Health omitted (ceased operations 2023).

**Speaker notes**

> The market is not empty, but it is split in two. Abridge and Epic's drafting tools help the clinician document the visit. Ada and K Health help a consumer decide whether to seek care. None of them works on the patient's side after the visit: none checks whether she understood, none traces every instruction back to the clinician's own words so she can see them, none plans around a missing ride or a tight budget, and none hands unresolved items back to the care team in a structured way. That after-visit space is where the 40 to 80 percent is lost, and it is where we sit.

## 6. One loop, five stages  (`loop`)

- Our solution
- Condition-agnostic: the interface never changes, the content does. Shown here with our fictional demo patient Maya, 20s, new PCOS diagnosis, an hour from the clinic.
- 1. Understand
- Her after-visit summary, explained in plain language at her reading level.
- Maya learns what “insulin resistance” means for her.
- 2. Ask
- Ask Kat answers from her documented plan and curated sources, and saves questions for the clinic.
- “Can I drink water before my blood test?” answered with the source passage.
- 3. Verify
- Adaptive teach-back catches a misunderstanding and re-explains it another way.
- She says “skip breakfast”; Kat clarifies: water only, 8 hours.
- 4. Act
- Each instruction becomes an action linked to its exact source, with barrier-aware suggestions kept separate.
- Lab in 2 weeks; ask the clinic about telehealth for the follow-up.
- 5. Follow Up
- An editable summary of questions, barriers and unresolved items goes back to the care team.
- Her next visit starts with what she still needs.
- Maya Thompson is a fictional demonstration patient. Care-team hand-off is simulated in the MVP.

**Speaker notes**

> Here is the product in one picture. Maya is a fictional patient in her twenties with a brand-new PCOS diagnosis and an hour's drive to the clinic. Understand: she pastes her after-visit summary and gets it explained at her level. Ask: she asks Kat whether she can drink water before her blood test, and Kat answers from her own documented plan, with the source passage shown. Verify: teach-back asks her a short question; when she says she will skip breakfast before the lab, Kat catches it and re-explains that fasting means water only for eight hours. Act: every instruction becomes an action tied to the clinician's exact words, and because she told us rides are hard, Kat suggests asking the clinic about telehealth, clearly labelled as a suggestion, not an instruction. Follow Up: what is still unresolved goes back to the care team, so the next visit starts where this one left off. Then the loop runs again.

## 7. A companion that already knows her plan  (`kat`)

- Meet Ask Kat
- Kat is not a general chatbot. Every answer is grounded in what this patient’s clinician actually wrote, and in curated public health sources.
- Visit summary
- Extracted instructions
- Action plan
- Reported barriers
- Saved questions
- Curated evidence
- Quick prompts perform real actions: explain my diagnosis, help me understand my results, plan my next steps, check my understanding, add a question to my list. If something is not in her record, Kat says so instead of guessing.
- Ask Kat
- Scripted Demo Mode
- Hi! I’m Kat. I’m here to help you understand your health information and prepare questions for your care team. What’s on your mind today?
- Can I drink water before my blood test?
- Your summary says: “Fasting means nothing to eat or drink except water for 8 hours before the test.” So plain water is fine; food and other drinks are not.
- View source › After-Visit Summary, Follow-up
- Check my understanding
- Add to my questions

**Speaker notes**

> Meet Kat. She lives in a floating heart bubble in the corner of every patient page and opens as a side panel or a mobile sheet. What makes her different from a general chatbot is context: she receives the patient's documented conditions, the current visit summary, the instructions we extracted from it, the action plan, the barriers the patient reported, saved questions and the matching curated evidence. So when Maya asks whether she can drink water before her blood test, Kat answers from the clinician's own words and shows the passage. The quick prompts are not decoration: each one performs a real action in the app. And when the key is not configured, the UI says plainly that it is in Scripted Demo Mode.

## 8. Rules first, model second, sources always  (`trust`)

- What makes it trustworthy
- Source-to-action traceability
- An action is verified only if its quote matches the clinician’s document exactly. Anything else is marked “Needs clarification” and never enters the care plan.
- Safety rules before any AI
- Deterministic rules run on every message and document first: chest pain, breathing, stroke signs, bleeding, self-harm, CDC’s postpartum warning signs. Emergency guidance, no lecture.
- Honest demo mode
- Every AI-shaped response carries its mode. Without a key, the UI says “Scripted Demo Mode” and declines unsupported questions instead of guessing.
- No fabrication
- Citations come only from a curated index (MedlinePlus, NIH, CDC, ACOG). Teach-back answer keys come from the question record, never from the model.
- 7–90%
- of medical citations are fabricated by general chatbots, depending on model and task, and they do worse on patient-phrased questions (ChatGPT: 2% → 20%). Retrieval-grounded systems reached 0%.
- Sources: Chelli et al., J Med Internet Res 2024 · McLaughlin et al., Neurosurgery Practice 2026 · Hooshiar, J Prosthet Dent 2025

**Speaker notes**

> Trust is the whole product, so we engineered it rather than promised it. First, traceability: an instruction appears in the care plan only if the quote we extracted matches the clinician's document character for character; anything else is flagged for clarification. Second, safety: deterministic rules run before any model call, on every message and every pasted document, covering six urgent scenarios including the CDC's postpartum warning signs. Third, honesty: when no key is configured, the UI says it is in Scripted Demo Mode and refuses to improvise. Fourth, no fabrication: citations only come from a curated index, and teach-back answer keys are fixed before the model ever sees a response. The number at the bottom is why this matters: general chatbots fabricate between 7 and 90 percent of medical citations, and get worse when a patient asks the question. Grounding is what drives that toward zero.

## 9. Teach-back works when clinicians do it. We make it routine.  (`teachback`)

- Verify, backed by evidence
- 45%
- lower odds of 30-day readmission
- Teach-back discharge education, OR 0.55 (95% CI 0.34–0.91); 3 pooled studies, authors call for RCTs
- 1.04
- standardized gain in adherence (SMD)
- Meta-analysis of 18 RCTs, n = 1,985; large effect, low certainty; no clear effect on knowledge alone
- 19/20
- studies found teach-back effective
- Across settings, from knowledge retention to readmissions and quality of life
- Aftercare Loop adapts a clinician technique with meta-analytic support. Our AI-delivered teach-back is not clinically validated; no study has yet tested one.
- Sources: Oh et al., J Patient Saf 2021 · Vick et al., J Gen Intern Med 2026 · Talevski et al., PLoS ONE 2020

**Speaker notes**

> Our Verify stage is built on teach-back, the technique where a clinician asks the patient to explain the plan back in her own words. The evidence for it, when clinicians do it, is strong for a communication technique: pooled discharge studies associate it with 45 percent lower odds of 30-day readmission; a 2026 meta-analysis of 18 randomized trials found a large gain in adherence; and 19 of 20 studies in a systematic review found it effective. But remember the earlier slide: in practice it is rare. We make it routine and adaptive: a short question about a documented fact, and when the answer misses, a re-explanation in different words, grounded in the document. We want to be clear about the limit, too: every study here is clinician-delivered. Our digital version adapts the technique; it has not been clinically validated.

## 10. Condition-agnostic by construction: rules, then model, then verification  (`architecture`)

- Architecture
- 1. Client
- Next.js 16 PWA. Demo state in the browser; no condition branches.
- 2. API routes
- zod-validated bodies. Model keys stay on the server.
- 3. Safety rules
- Deterministic, run before any model call on every input.
- 4. Scripted or LLM
- Server-side provider (Claude or Gemini), structured JSON output.
- 5. Verify
- zod schema + exact source-quote check. Mode stamped on every response.
- Curated evidence index
- 54 hand-curated references (MedlinePlus, NIH, CDC, ACOG); tag and keyword retrieval; citation validity measured.
- Synthetic patients + ground truth
- 12 fictional fixtures with expected instructions, teach-back keys and safety outcomes.
- Evaluation harness
- npm run eval scores extraction, citation validity, safety and teach-back; results feed the dashboard.
- Evidence and fixtures feed the model call; every verified output is scored
- Documents and retrieved text are wrapped as untrusted data in every prompt. No page, component or service branches on a condition name.

**Speaker notes**

> Under the hood it is a Next.js 16 app with a strict pipeline. The client holds demo state in the browser and calls API route handlers that validate every body with zod; model keys never reach the browser. Every request then hits deterministic safety rules before anything else. Only then do we either look up a scripted response or call the model provider server-side, Claude or Gemini, asking for structured JSON. The output is validated against a schema and every extracted quote is checked against the original document; unverified quotes are flagged, and the response is stamped with its mode. Underneath sit a curated evidence index of 54 hand-curated references, twelve synthetic patients with ground truth, and an evaluation harness that scores the whole pipeline. Nothing in the code branches on a condition name; conditions live in data and prompts, which is what makes it condition-agnostic.

## 11. What we measure  (`evaluation`)

- Evaluation
- Synthetic tests, not clinical validation
- Instruction extraction
- P 100% · R 100% · F1 1.00
- Extracted instructions vs ground truth per patient (true positives, false positives, false negatives)
- Citation validity
- 100%
- 58 of 58 source quotes matched the original document exactly; 0 invalid citations (counted, never hidden)
- Safety pass rate
- 83 of 83 passed
- 40 of 40 emergencies caught; 43 of 43 non-emergencies not escalated; failures listed individually
- Comprehension (simulated)
- 36 of 36 clarified
- Teach-back questions correct initially, then after clarification; misunderstandings identified and unresolved items saved
- Three of four suites measure the pipeline, not model accuracy; see docs/VALIDATION-REPORT.md
- Run eval-2026-11-08T14-59-30-916Z · suite 1.0.0 · deterministic synthetic suite, Scripted Demo Mode · 189 cases, 0 errors · fictional patients, not clinical validation

**Speaker notes**

> We would rather show you a dashboard than an adjective. The evaluation harness runs the whole pipeline against our synthetic patients and ground truth, and reports four things: how precisely we extract instructions, whether every citation resolves to a real curated source, whether every urgent scenario, including wording variants and benign controls, is handled by the deterministic rules, and whether teach-back scoring catches a wrong answer and accepts the corrected one. These numbers come from run eval-2026-11-08T14-59-30-916Z, suite version 1.0.0, a deterministic synthetic run in Scripted Demo Mode across 189 cases with no errors. The safety suite passed 83 of 83: all 40 emergencies caught, and none of the 43 non-emergency inputs escalated. Be precise about what that means: three of the four suites measure the pipeline, not model accuracy. Scripted patients use predefined instructions, the citation suite checks the verification step, and comprehension answers are simulated from the question record. These are automated tests on synthetic cases written by the same team. It is not clinical validation, and the dashboard says so.

## 12. Start where the need is concentrated: community health centers  (`market`)

- Market and model
- 32.4M
- patients served by HRSA-funded health centers in 2024
- ~1,400
- health centers funded each year, our first buyers
- 67%
- of their patients live at or below the poverty line; 18% are uninsured
- 293
- rural hospitals stopped offering obstetrics, 2011–2023
- Phase 0 · now
- Prototype and validation with synthetic data
- Phase 1
- Pilot with one partner, after privacy, security and clinical review
- Phase 2
- Facility-based subscription tiers, by site or panel size
- Phase 3
- Rural, women’s and maternal health organizations
- Pricing and the budget owner are hypotheses to validate with buyers. Medicare or Medicaid reimbursement is not assumed.
- Sources: HRSA Uniform Data System, 2024 national report · HRSA health center data landing page · Chartis, 2025 Rural Health State of the State

**Speaker notes**

> Our first customers are Federally Qualified Health Centers and community clinics. HRSA-funded health centers served 32.4 million patients in 2024 across roughly 1,400 funded organizations; two thirds of their patients live at or below the poverty line and 18 percent are uninsured. That is exactly the patient we designed for, concentrated in one buyer. The rural side is urgent: 293 rural hospitals stopped offering obstetrics between 2011 and 2023, so follow-up after birth increasingly happens far from where the baby was delivered. The model is deliberately staged: we are in Phase 0 with synthetic data; Phase 1 is a pilot with one partner only after privacy, security and clinical review; Phase 2 is facility-based subscriptions. We are not assuming reimbursement; pricing is a hypothesis we need to test with buyers.

## 13. What it is today, and what comes next  (`roadmap`)

- Roadmap and limitations
- Not HIPAA-compliant today
- Today: a hackathon MVP
- Synthetic data only: 12 fictional patients, one visit document each
- Scripted Demo Mode covers 7 of 12 patients (2 in Spanish); live mode needs a model key
- Rule-based safety for six scenarios; US-centric emergency guidance
- Clinician communication summary ships at /follow-up
- State lives in the browser; care-team queue is a simulation
- Evaluation on synthetic cases; no real users yet
- Next: P1, P2 and the production gate
- P1: PDF extraction, broader Spanish, human-reviewed output sample
- P2: facility-based tiers, onboarding and support
- HIPAA applicability and gap assessment; BAAs with every vendor touching PHI
- Clinician safety review and a pilot evaluation plan before any real patient
- Real user testing: comprehension, task completion, follow-through
- Regulatory review of patient-facing functions; designed as an educational tool
- Not a medical device. Not medical advice. Details in docs/LIMITATIONS.md and docs/SECURITY-ROADMAP.md.

**Speaker notes**

> We want to be as honest about limits as we are about the idea. Today this is a hackathon MVP: every patient is fictional, Scripted Demo Mode covers seven of the twelve, two of them in Spanish, the safety rules cover six scenarios with US guidance, state lives in the browser, and the care-team queue is a simulation. The clinician communication summary already ships, on the follow-up page. It is not HIPAA-compliant and not a medical device. The path forward is staged: P1 adds PDF extraction, broader Spanish and a human-reviewed sample of model output; P2 adds facility tiers. Before any real patient we need a HIPAA gap assessment, Business Associate Agreements with every vendor, a clinician safety review, a pilot evaluation plan and real user testing. The loop is designed; the validation is the work ahead.

## 14. Pilot design (hypothesis)  (`pilot`)

- Pilot design
- Hypothesis, not yet run
- 1
- FQHC site
- 8–12
- weeks
- ~50
- consenting patients
- Primary KPI
- Share of documented next steps completed by the next visit
- Secondary measures
- Teach-back: initial vs final correct
- Unresolved items
- Staff follow-up minutes
- System Usability Scale (SUS)
- Baseline: <60% of Medicaid-enrolled women attend the postpartum visit (Rodin et al., J Womens Health 2019)

**Speaker notes**

> This is how we would test the idea, and we want to be clear it is a hypothesis, not a result. One FQHC site, eight to twelve weeks, about fifty consenting patients, and only after the privacy, security and clinical review on the roadmap. The primary measure is the one that matters to a clinic: of the next steps the clinician documented, what share did the patient complete by her next visit. Secondary measures tell us why: teach-back answers correct at first versus after clarification, how many items stayed unresolved, how many staff minutes follow-up took, and a standard usability score. The baseline we are trying to move is stark: fewer than 60 percent of Medicaid-enrolled women even attend the postpartum visit.

## 15. Distribution & pricing (hypothesis)  (`distribution`)

- Go to market
- Today
- Paste text, upload a .txt, or install the PWA
- Pilot
- Clinic QR code or SMS link after the visit
- Phase 3
- SMART on FHIR launch from the clinic’s EHR
- Pricing unit
- Per service site per year, tiered by active panel size
- Budget owners
- FQHC quality and patient-experience leads
- Reimbursement not assumed. Price, unit and buyer are hypotheses to validate with the pilot site.
- Working hypotheses from docs/BUSINESS.md; not validated with buyers.

**Speaker notes**

> How does it reach a patient? Today, with no integration at all: she pastes her summary, uploads a text file, or installs the app as a PWA on her phone. In a pilot, the clinic hands her a QR code or texts her a link at the end of the visit, which costs the clinic almost nothing to try. Later, in Phase 3, a SMART on FHIR launch from the clinic's EHR removes the copy-paste step entirely. On pricing, our working hypothesis is a facility subscription per service site per year, tiered by active panel size, owned by the FQHC's quality or patient-experience lead. We are not assuming any reimbursement code, and every one of these is a hypothesis we will test with the pilot site.

## 16. Aftercare Loop  (`closing`)

- Understand → Ask → Verify → Act → Follow Up
- Team HW1
- Stephanie Kim · Ava Amidei · Kemigisha Sherifah Muzungu M · Payton Mendygral
- Mentors
- Rhea John · Pavel Stepanov
- Fictional data. Not medical advice. Thank you.

**Speaker notes**

> Aftercare Loop does not just answer health questions. It helps a patient understand, verify and follow through on the care instructions her clinician actually wrote, and hands what is still unresolved back to the care team. We are Stephanie, Ava, Sherifah and Payton, Team HW1, and we are grateful to our mentors Rhea John and Pavel Stepanov. Everything you saw used fictional data and is not medical advice. Thank you; we would love your questions.

