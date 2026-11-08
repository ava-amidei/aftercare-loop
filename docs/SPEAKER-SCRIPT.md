# Aftercare Loop — Speaker script for four presenters

Team HW1: **Stephanie Kim · Ava Amidei · Kemigisha Sherifah Muzungu M · Payton Mendygral**
Mentors: Rhea John · Pavel Stepanov

Deck: `aftercare-loop-media/pitch/aftercare-loop-pitch.pptx` (16 slides; same content as the claude.ai
deck and `SLIDES.md`). Live demo: https://aftercare-loop.vercel.app (or `http://localhost:3000` in
Scripted Demo Mode). Click-by-click detail for every demo beat is in `DEMO-SCRIPT.md`; this file is
what each person **says**.

Speaking pace: about 140 words a minute. The full run is **7 minutes**: 3 minutes of slides,
3½ minutes of live demo, 30 seconds to close. Cuts for a 5-minute or 3-minute slot are at the end.
Roles below are a default; swap freely, but keep the hand-off lines so the transitions stay clean.

## Roles at a glance

| Speaker | Owns | Slides | Time |
|---|---|---|---|
| **Stephanie** — the opener | Problem, who we serve, why women's health | 1–4 | 0:00–1:30 |
| **Ava** — the product | The gap, the loop, live demo part 1 (Understand, Ask Kat) | 5–7 + demo | 1:30–3:30 |
| **Sherifah** — trust and safety | Live demo part 2 (Verify, Act, the refusal), trust slide | demo + 8 | 3:30–5:15 |
| **Payton** — evidence and business | Follow Up, evaluation, market, roadmap, pilot, close | 9–16 | 5:15–7:00 |

One person drives the laptop for the whole demo (suggest Ava), so nobody has to hand over a mouse.
Everyone else stands to the side of the screen, not in front of it.

## Before you walk on (not timed)

1. Laptop on the live URL or `npm run dev`; the yellow **Scripted Demo Mode** badge is visible on
   Ask Kat and on an Understand result. If it is not, stop and fix `.env.local`
   (`AFTERCARE_FORCE_SCRIPTED=true`).
2. Click **Reset Demo**, then choose **Maya Thompson** in the patient switcher.
3. Evaluation page already opened once in another tab so it is warm.
4. Phone with the app installed (PWA from the live URL) in Payton's pocket for the "it is already
   on a phone" moment.
5. Say "fictional patient" every time a patient is named. Never say "the AI decides".

---

## Stephanie — 0:00–1:30 (slides 1–4)

**Slide 1, cover.**
> Hi, we are Team HW1 and this is Aftercare Loop. Every visit ends with a plan: take this, come back
> then, watch for that. Our product is about what happens in the days after that plan is handed
> over, when most of it is already slipping away. Aftercare Loop closes that loop: understand,
> ask, verify, act, follow up. Everything you will see today uses fictional patients.

**Slide 2, the problem.**
> Here is the problem in one number. Forty to eighty percent of what clinicians tell patients is
> forgotten right away, and almost half of what is remembered is remembered wrong. A 2018 study of
> specialty visits found patients recalled only forty-nine percent of recommendations a week later,
> and the gap by education was thirty-eight versus sixty-five percent. The authors noted that
> teach-back, the simplest fix, was rare. The after-visit summary is supposed to close that gap.
> It mostly does not.

**Slide 3, who we serve.**
> We built this for a specific patient. She may live an hour from the clinic: five point eight
> million Americans delayed care in one year because they had no ride. She is more likely than a
> man to skip a prescription over cost. She is more likely to be the caregiver in her family. And
> like most Americans, she is not a proficient reader of health information; only twelve percent of
> adults are. None of that is a knowledge problem on her side. It is a design problem on ours.

**Slide 4, why women's health first.**
> Why start with women's health? Because the information gap is widest here. Nearly half of women
> with PCOS saw three or more clinicians before anyone named it. Endometriosis takes four years to
> diagnose. Three quarters of women with POTS were misdiagnosed first. And after birth, fewer than
> sixty percent of Medicaid-enrolled women even attend the postpartum visit, while more than eighty
> percent of pregnancy-related deaths are preventable. These are the conditions in our demo
> patients, but the product is not condition-specific.

**Hand-off:**
> So what exists for her today? Ava.

## Ava — 1:30–3:30 (slides 5–7, then live demo part 1)

**Slide 5, the gap.**
> The market is split in two. Abridge and Epic's tools help the clinician document the visit. Ada and
> K Health help a consumer decide whether to seek care. None of them works on the patient's side
> after the visit: none checks whether she understood, none traces each instruction back to the
> clinician's own words, none plans around a missing ride, and none hands unresolved items back to
> the care team. That after-visit space is where the forty to eighty percent is lost.

**Slide 6, one loop, five stages.**
> Our answer is one loop with five stages: Understand, Ask, Verify, Act, Follow Up. The interface
> never changes; only the content does. Let me show you with Maya, a fictional patient in her
> twenties with a new PCOS diagnosis and an hour's drive to the clinic.

**Slide 7, Ask Kat.** (Say this while switching to the browser.)
> Kat is her companion. She is not a general chatbot: she knows Maya's summary, her plan, her
> reported barriers and her saved questions, and she says so when something is not in the record.

**Live demo, Scene 1, Understand (about 50 s).** Click **Understand**, **Load my sample summary**,
**Explain this to me**.
> This is Maya's after-visit summary, pasted in. Aftercare Loop explains it in plain language,
> defines the words she will hear again, and keeps three things visibly separate: what her clinician
> documented, general education, and the sources. Notice the badge: we are in Scripted Demo Mode and
> the app says so on every AI-shaped response.

**Live demo, Scene 2, Ask Kat (about 40 s).** Open **Ask Kat**, type exactly
**Can I drink water before my blood test?**, **Send**, then **Add a question to my list**.
> She asks the question every fasting patient asks. Kat answers from the summary itself, quotes the
> sentence, and points out what the summary does not say: whether to take her morning metformin.
> It does not guess. It suggests she ask the clinic, and saves the question for her.

**Hand-off:**
> Understanding is the easy part. Checking it is where most tools stop. Sherifah.

## Sherifah — 3:30–5:15 (live demo part 2, then slide 8)

**Live demo, Scene 3, Verify (about 45 s).** Click **Check**, pick the wrong answer
**Once a day at bedtime on an empty stomach**, **Check my answer**, then **Try again** and pick
**Twice a day with breakfast and dinner**.
> This is teach-back, the technique clinicians use when they ask you to repeat the plan in your own
> words. Maya picks the wrong answer. Kat does not say "wrong". She names the misunderstanding and
> re-explains it another way, from the documented passage. Maya tries again and gets it. If she
> still did not, the question is saved for her clinician instead of being argued about.

**Live demo, Scene 4, Act (about 45 s).** Click **Plan**, then **View source** on the metformin item.
> Every documented instruction becomes an action, and every action links to the exact sentence it
> came from. View source highlights it in the original document.

Switch the patient to **Priya Shah**, Understand, **Load my sample summary**, **Explain this to me**,
scroll to **Needs clarification**.
> Now the part we are proudest of. Priya is another fictional patient. One of her steps did not match
> her summary word for word, so it is held under Needs clarification and never enters her care plan.
> This is how a fabricated instruction is refused: if the exact words are not in the document, it is
> not an instruction. (Switch back to Maya.)

Scroll to **Help with getting care**.
> And because Maya told us rides are hard, the plan suggests asking the clinic about telehealth. It
> is labelled as a suggestion and phrased as a question for the clinic, never as an instruction.

**Slide 8, trust.**
> Trust is engineered here, not promised. Deterministic safety rules run before any AI on every
> message and every pasted document: chest pain, breathing, stroke signs, bleeding, self-harm, the
> CDC's postpartum warning signs. Citations only come from a curated index of MedlinePlus, NIH, CDC
> and ACOG. Teach-back answer keys are fixed before the model ever sees a response. The number at the
> bottom is why: general chatbots fabricate between seven and ninety percent of medical citations.
> Grounding drives that toward zero.

**Hand-off:**
> Payton will close the loop and show you how we measure it.

## Payton — 5:15–7:00 (live demo Scene 5, then slides 9–16)

**Live demo, Scene 5, Follow Up (about 30 s).** Click **Follow Up**, edit one line, **Copy summary**.
> The loop closes here. Maya leaves with a summary for her care team: her saved question, her
> reported barriers, anything unresolved, and every documented instruction with its source. She can
> edit it and copy it. Nothing is transmitted in this MVP; the care-team queue is a simulation.
> (Hold up the phone.) It is already on a phone as an installable web app.

**Slide 9, teach-back evidence.**
> Why bet on teach-back? When clinicians do it, pooled discharge studies associate it with forty-five
> percent lower odds of thirty-day readmission, and a 2026 meta-analysis of eighteen trials found a
> large gain in adherence. We make it routine. We are also clear about the limit: those studies are
> clinician-delivered. Our digital version adapts the technique and is not yet clinically validated.

**Slide 11, evaluation.** (Skip slide 10 unless a judge asks about architecture.)
> We would rather show a dashboard than an adjective. Our evaluation harness runs the whole pipeline
> on 154 synthetic cases: instruction extraction, citation validity, safety, and comprehension. The
> numbers on this slide come from that run and are never hard-coded. Be precise about what they are:
> three of the four suites measure the pipeline, not model accuracy, and none of this is clinical
> validation. The dashboard says so in its first line.

**Slides 12–13, market and roadmap.**
> Our first customers are community health centers: thirty-two million patients across about
> fourteen hundred HRSA-funded organizations, two thirds at or below the poverty line. Today this is a
> hackathon MVP: fictional data, scripted mode for seven of twelve patients, not HIPAA-compliant, not
> a medical device. Before any real patient we need a HIPAA gap assessment, clinician safety review
> and real user testing.

**Slides 14–15, pilot and distribution.**
> How we would test it: one FQHC site, eight to twelve weeks, about fifty consenting patients, and one
> primary measure, the share of documented next steps completed by the next visit. Distribution starts
> with a QR code at the end of the visit, which costs the clinic almost nothing to try. Pricing is a
> facility subscription per site per year. Every one of these is a hypothesis we will test with the
> pilot site, not a result.

**Slide 16, close.**
> Aftercare Loop does not just answer health questions. It helps a patient understand, verify and
> follow through on the care instructions her clinician actually wrote, and hands what is still
> unresolved back to her care team. We are Stephanie, Ava, Sherifah and Payton, with thanks to our
> mentors Rhea John and Pavel Stepanov. Fictional data, not medical advice. Thank you.

---

## Q&A: who answers what

| Likely question | Owner | Answer in one breath |
|---|---|---|
| Is this HIPAA-compliant? Could I use it with real patients? | Payton | No. It is an educational MVP on fictional data; state lives in the browser. The roadmap lists the HIPAA gap assessment, BAAs and clinician review that come before any real patient. |
| What stops the AI from inventing an instruction? | Sherifah | An instruction enters the plan only if its quote matches the document character for character; otherwise it is held for clarification. You saw that with Priya. The model never emits offsets; we compute them. |
| What if a patient types "I want to hurt myself" or "chest pain"? | Sherifah | Deterministic rules run before any model call, on every message and document. Emergency guidance comes back immediately, with no lecture. Forty-eight of forty-eight safety cases pass, including wording variants and benign controls. |
| Can Kat tell me to change my medication? | Sherifah | No. Medication-change questions are caught before any lookup; Kat quotes the documented instruction and says the decision belongs to the care team. |
| Is the demo live AI or scripted? | Ava | Scripted Demo Mode today, and the badge says so on every response. Live mode uses Gemini or Claude server-side with the same safety rules and the same source verification. |
| Why women's health and not everyone? | Stephanie | The information gap is widest there: years to diagnosis for PCOS, endometriosis and POTS, and a thin postpartum follow-up. The code is condition-agnostic; conditions live in data. |
| How is this different from MyChart or a chatbot? | Ava | Portals store the summary; chatbots answer questions. Neither checks understanding, traces actions to the clinician's words, plans around barriers, or hands unresolved items back. |
| Who pays? | Payton | Hypothesis: the FQHC's quality or patient-experience lead, per service site per year. Reimbursement is not assumed. The pilot tests the price and the buyer. |
| What do the 100% numbers mean? | Payton | They are automated tests on 154 synthetic cases written by us. Three of the four suites measure the pipeline, not model accuracy. It is honest engineering evidence, not clinical validation. |
| What did you build it with? | Ava | Next.js 16, TypeScript, zod-validated API routes, deterministic safety rules, a curated evidence index of about fifty references, twelve synthetic patients with ground truth, and an evaluation harness with over fourteen hundred tests. |
| Spanish? Accessibility? | Stephanie | English and Spanish today, with adjustable text size, a user-chosen accent color, and seventeen-pixel body text on mobile. Broader Spanish is a P1 item. |

If nobody owns a question, the person who spoke last takes it. Never answer with a number that is
not on a slide or on the Evaluation page.

---

## Cuts for shorter slots

**5 minutes.** Stephanie: slides 1, 2, 4 (skip 3). Ava: slide 6 only, then Understand and Ask Kat.
Sherifah: Verify, the Priya refusal (skip the barrier suggestion), slide 8 in two sentences.
Payton: Follow Up in one sentence, slide 11, slide 13, close. Drop slides 5, 9, 10, 12, 14, 15.

**3 minutes.** Stephanie: slide 2 only (30 s). Ava: Understand and Ask Kat (60 s). Sherifah: Verify
wrong-then-right and the Priya refusal (60 s). Payton: slide 11 and close (30 s). One sentence of
hand-off each.

## If something goes wrong on stage

- Kat says the scripted demo can't answer: use the exact question "Can I drink water before my blood
  test?" or a suggestion chip. Do not improvise wording.
- A judge asks Kat to change a medicine: let it play. Kat declines and points to the care team; that
  is the safety design, and Sherifah names it.
- Badge is not Scripted Demo Mode: stop, fix `.env.local`, restart. Do not demo in live mode.
- Evaluation page says "Not evaluated": run `npm run eval` and reload.
- Stale state: **Reset Demo**, then re-select Maya Thompson.
- Internet drops: the local build at `http://localhost:3000` works offline in Scripted Demo Mode.
