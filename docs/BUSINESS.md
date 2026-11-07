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
| **1 — Pilot** | A small pilot with one partner organization, **only after** privacy, security and clinical review (see `SECURITY-ROADMAP.md`). | HIPAA assessment and BAAs complete. Clinical safety review signed off. Pilot evaluation plan agreed with the partner. |
| **2 — Facility-based subscriptions** | Tiered subscriptions priced per facility (for example by site or patient panel size), with onboarding and support. | Pilot results reviewed with the partner. Pricing validated with buyers. |
| **3 — Expansion** | More organizations, languages and integrations (e.g. EHR via standard interfaces). | Proven operations, security posture and partner outcomes measured in practice. |

## Revenue assumptions to validate

- **Facility subscriptions are the working hypothesis.** Willingness to pay, budget owner (quality,
  care management, patient experience, grants) and pricing unit are all unvalidated.
- **Reimbursement is not assumed.** We don't assume that Medicare, Medicaid or any other payer will
  pay for this tool or for related services. Any reimbursement pathway needs validation with
  billing, compliance and legal experts.
- **Grant and program funding** (for example maternal health or rural health programs) may help
  early pilots. This is unconfirmed.

## What we would measure in a pilot

These are pilot hypotheses, not results: patient comprehension of documented instructions
(teach-back), completion of documented next steps, clarification requests resolved before the next
visit, staff time spent on follow-up questions, and patient-reported usability. Any claim about
outcomes would wait for properly designed, human-reviewed evaluation.

## Risks

- Clinical safety and liability if explanations are wrong or misunderstood. Mitigations: grounding
  in the source document, deterministic safety rules, and clinician review before any pilot.
- Privacy and security obligations once real PHI is involved.
- Adoption: clinic workflows, staff capacity and integration effort.
- Equity: the product must work for low-bandwidth, low-literacy and non-English-speaking users
  without stereotyping.
