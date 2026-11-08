# Aftercare Loop — Business & Growth

> Planning document for a hackathon MVP. Nothing here reports market data, revenue, pilot results
> or health outcomes. The product hasn't been tested with real users or organizations.

## Problem

Patients often leave a visit with an after-visit summary they don't fully understand. Then they
have to act on it alone: take medications as documented, schedule tests and follow-ups, and bring
the right questions next time. Barriers such as distance, cost, scheduling, caregiving and
language make that harder. Aftercare Loop's loop of **Understand → Ask → Verify → Act → Follow Up**
explains the documented instructions in plain language, checks understanding with teach-back,
links each next step to its exact source passage, and prepares a summary for the care team.

## Initial customers

Organizations that serve underserved women and want better continuity between visits:

- Federally Qualified Health Centers (FQHCs)
- Community clinics
- Rural health organizations
- Women's health practices
- Maternal health programs
- Health systems serving underserved populations

The intended buyer is the organization, and the patient uses the product at no cost. Patients
are users, not customers.

## Phases

| Phase | Goal | Gate to move on |
|---|---|---|
| **0 — Prototype & validation** (current) | Working MVP on synthetic data. Conversations with clinicians, patients and community organizations to test the problem and the workflow. | Clear evidence of need from target organizations. Clinician review of the content approach. |
| **1 — Pilot** | A pilot with one FQHC partner (see "Pilot design (hypothesis)"), **only after** privacy, security and clinical review (see `SECURITY-ROADMAP.md`). | HIPAA assessment and BAAs complete. Clinical safety review signed off. Pilot evaluation plan agreed with the partner. |
| **2 — Facility-based subscriptions** | Tiered subscriptions per service site per year, by active panel size (hypothesis, see "Pricing and budget owner"), with onboarding and support. | Pilot results reviewed with the partner. Pricing validated with buyers. |
| **3 — Expansion** | More organizations, languages and integrations (e.g. SMART on FHIR launch from the EHR). | Proven operations, security posture and partner outcomes measured in practice. |

## Why continuity matters to the buyer (cited baseline)

Figures in this section come from `docs/research/EVIDENCE-BRIEF.md`. They describe the problem, not
anything Aftercare Loop has achieved.

- **Postpartum follow-up:** "Nationally, less than 60% of Medicaid-enrolled women attend their
  postpartum visit" (Rodin D et al., *J Womens Health* 2019;28(9):1246-1253,
  https://doi.org/10.1089/jwh.2018.7568; EVIDENCE-BRIEF §4d). The barriers it names include
  information gaps, transportation, childcare and depression.
- **Recall after visits:** one week after an outpatient specialty visit, only 49% of
  recommendations were recalled accurately, and teach-back by providers was "rare" (Laws MB et al.,
  *PLoS ONE* 2018; EVIDENCE-BRIEF §1c).

## Pilot design (hypothesis)

Nothing here has been agreed with a partner, and no pilot has run. Every number in this section is a
**planning hypothesis** to validate with the partner site. None of them is a result or a target we
have evidence for. The pilot only starts after the Phase 1 gate (privacy, security and clinical
review; see `SECURITY-ROADMAP.md`).

| Element | Hypothesis |
|---|---|
| Site | One FQHC service site (hypothesis) |
| Duration | 8–12 weeks (hypothesis) |
| Participants | About 50 consenting adult patients, enrolled at a visit (hypothesis) |
| Primary KPI | Share of clinician-documented next steps completed by the next visit (patient-reported in the app and confirmed by staff at that visit) |
| Secondary KPIs | Teach-back correct on the first attempt vs after clarification; number of unresolved items handed to the care team; staff minutes spent on follow-up questions per patient; System Usability Scale (SUS) score |
| Comparison | To agree with the partner (for example, the site's own baseline for the same visit types). No comparison group has been designed yet |
| Review | Human review of a sample of explanations and summaries by the partner's clinicians before and during the pilot |

The primary KPI uses the product's own unit: every next step in My Care Plan is traceable to the
exact words of the visit summary, so "completed by the next visit" can be counted per documented
step. We don't predict an effect size. The Rodin 2019 figure is the reason a postpartum or
chronic-care program might care, not a benchmark we expect to move.

## Pricing and budget owner (hypotheses to validate)

- **Pricing unit (hypothesis):** a subscription **per service site per year**, tiered by **active
  patient panel size**. We have no price points. Willingness to pay is untested.
- **Candidate budget owners (unvalidated):** quality improvement, care management or care
  coordination, patient experience, and grant-funded maternal health or rural health programs.
  Which one owns the decision is a question for the first partner conversations.
- **Patients never pay.** The organization is the buyer. Patients are users, not customers.
- **Reimbursement is not assumed.** We don't assume that Medicare, Medicaid or any other payer will
  pay for this tool or for related services. Any reimbursement pathway needs validation with
  billing, compliance and legal experts.
- **Grant and program funding** (for example maternal health or rural health programs) may help
  early pilots. This is unconfirmed.

## Distribution path

| Stage | How a patient gets the summary into Aftercare Loop |
|---|---|
| **Today (MVP)** | Paste the after-visit summary text or upload a `.txt` file; the app installs as a PWA on a phone. Fictional data only. |
| **Pilot (hypothesis)** | The clinic hands out a QR code or sends an SMS link at check-out. The patient opens the app and adds the summary. Requires the Phase 1 gate. |
| **Phase 3 (roadmap)** | SMART on FHIR launch from the EHR, so the summary arrives without copy and paste. Not built. |

## Risks

- Clinical safety and liability if explanations are wrong or misunderstood. Mitigations: grounding
  in the source document, deterministic safety rules, and clinician review before any pilot.
- Privacy and security obligations once real PHI is involved.
- Adoption: clinic workflows, staff capacity and integration effort.
- Equity: the product must work for low-bandwidth, low-literacy and non-English-speaking users
  without stereotyping.
