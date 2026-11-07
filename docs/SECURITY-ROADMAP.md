# Aftercare Loop — Security, Privacy & Production Roadmap

**The Aftercare Loop MVP is not HIPAA-compliant.** It is a hackathon demonstration built only for
fictional, synthetic patient data. Do not enter real patient information, and do not deploy it
where real protected health information (PHI) could reach it.

## What the MVP does today

These controls exist in the code base (`aftercare-loop-app/`). They reduce risk for a demo. They
are not a compliance program.

| Area | Current behavior | Where |
|---|---|---|
| Data | Fictional patients only. Every page shows "Demonstration using fictional patient data." | `src/data/patients/`, `DemoBanner` |
| Storage | Demo state lives in the browser's `localStorage` only. No server database, no accounts. | `src/lib/store/` |
| Secrets | `ANTHROPIC_API_KEY` is read server-side only (`src/lib/ai/client.ts`). No `NEXT_PUBLIC_` secrets. Clients call `/api/*`. | `src/lib/ai/client.ts` |
| Input validation | API bodies are validated with zod. Invalid input returns 400 and oversized bodies return 413. Error messages don't echo request content. | `src/app/api/_lib/handler.ts` |
| Untrusted content | Document text is sanitized (control characters stripped, capped at 20,000 characters) and wrapped in delimiters. Prompts tell the model to treat it as data only. | `src/lib/safety/sanitize.ts`, `src/lib/ai/prompts.ts` |
| Uploads | `.txt` files only, with a size limit. | `src/components/understand/file-input.ts` |
| Safety | Deterministic emergency and crisis rules run before any model call. Emergencies get short guidance (911 / 988 in the US). | `src/lib/safety/rules.ts` |
| Traceability | A clinician-documented instruction is "verified" only if its quote matches the document text at the stored offsets. Anything else goes to "Needs clarification". | `src/lib/services/source-verification.ts` |
| Logging | Logs carry ids, lengths, mode, model and duration. They never include full document text or prompts. | `src/app/api/_lib/handler.ts`, `src/lib/ai/client.ts` |
| Transmission | Nothing is sent to real clinicians. The care-team queue is a labeled simulation. | `src/lib/services/care-team.ts` |

Known gaps in the MVP: no authentication or authorization, no encryption at rest beyond what the
browser provides, no audit log, no consent flow, no rate limiting, no formal threat model, and no
third-party security review. When live mode is on, text is sent to an external model provider
(Anthropic) under the deployer's own API terms. No Business Associate Agreement (BAA) is in place.

## Production roadmap (before any real PHI)

Each item below must be complete before a pilot with real patients (see `BUSINESS.md`, Phase 1).

1. **HIPAA assessment.** Formal applicability and gap assessment covering the Privacy, Security and
   Breach Notification Rules, with documented policies and a designated privacy/security owner.
2. **Business Associate Agreements.** BAAs with every vendor that touches PHI (hosting, model
   provider, logging/monitoring, email/SMS). Only use services covered by a BAA.
3. **Encryption.** TLS everywhere in transit. Encryption at rest for databases, backups and object
   storage, with managed keys and rotation. Move patient data out of `localStorage` and into
   server-side storage.
4. **Authentication and RBAC.** Patient and staff accounts, MFA for staff, and role-based access
   (patient, care-team member, administrator) with least privilege and session management.
5. **Consent.** Clear, plain-language consent for data use, AI processing, and any sharing with the
   care team. Revocation should be possible.
6. **Audit logging.** Tamper-evident logs of access to and changes in PHI (who, what, when),
   reviewed regularly, without logging clinical content unnecessarily.
7. **Data minimization and retention.** Collect only what each feature needs. Set retention and
   deletion schedules and support patient data export and deletion requests.
8. **Secure integrations.** For any EHR or messaging integration, use standards-based, authenticated
   interfaces (e.g. SMART on FHIR / OAuth 2.0), scoped tokens, and integration testing with the
   partner organization.
9. **Vendor review.** Security and privacy due diligence for each vendor, including the model
   provider's data retention and training-use terms.
10. **Risk assessment.** A documented security risk analysis and threat model (including prompt
    injection and data exfiltration through model output), penetration testing, dependency and
    secret scanning in CI, rate limiting and abuse monitoring.
11. **Clinical safety testing and regulatory review.** Clinician-reviewed evaluation of
    explanations, safety handling and teach-back on realistic cases. A review of whether any
    feature could be regulated (for example as clinical decision support or software as a medical
    device). An incident and escalation process for safety issues.

## Principles that carry forward

- Education, not diagnosis or treatment direction. The product never changes medications or
  overrides documented instructions.
- Deterministic safety handling stays ahead of any model call. Model-based detection only adds to it.
- Documents and retrieved references are always treated as untrusted input.
- AI suggestions are always labeled and kept separate from clinician-documented instructions.
