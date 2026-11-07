// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-h-migraine",
  displayName: "Tasha Reed",
  ageRange: "30–39",
  language: "en",
  explanationLevel: "simple",
  accessibility: ["reduced_motion", "high_contrast"],
  conditions: ["Migraine without aura"],
  medications: [
    {
      name: "Sumatriptan",
      dose: "50 mg",
      frequency: "at the start of a migraine; may repeat once after 2 hours",
      documentedPurpose: "to stop a migraine attack",
    },
  ],
  careInstructions: [
    "Sumatriptan 50 mg at the start of a migraine; one more dose after 2 hours if needed.",
    "No more than 2 sumatriptan tablets in 24 hours.",
    "Headache diary: date, how long, possible triggers.",
    "Limit ibuprofen or acetaminophen to no more than 2 or 3 days per week.",
    "Return in 2 months.",
  ],
  healthGoals: ["Have fewer migraine days", "Find out my triggers"],
  barriers: ["cost_or_insurance"],
  scenarioSummary: "Managing migraines and keeping track of triggers on a tight budget.",
};

const document = buildVisitDocument({
  id: "doc-pt-h-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-07",
  createdAt: "2026-10-07",
  header: fictionalHeader([
    "Patient: Tasha Reed (fictional)",
    "Visit date: October 7, 2026",
    "Clinic: Cedar Street Health Center (fictional)",
    "Clinician: Nina Alvarez, PA-C (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for headaches that happen about 6 times a month.",
        "The headaches are on one side, throbbing, and come with nausea and sensitivity to light.",
        "Each one lasts most of the day.",
        "You have been taking ibuprofen on most days of the week, and it helps only a little.",
        "You told us the cost of medicine is a worry for you.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your symptoms and normal neurological exam fit migraine without aura.",
        "A migraine is a common type of headache that can come with nausea and sensitivity to light and sound.",
        "Your exam today, including strength, vision, and balance, was normal.",
        "Taking pain relievers on many days each month can sometimes cause more frequent headaches, called medication-overuse headache.",
        "We talked about common triggers such as missed meals, poor sleep, stress, and changes in hormones.",
        "If your migraines stay frequent, a daily preventive medicine can be discussed at your next visit.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take sumatriptan 50 mg at the start of a migraine, and you may take one more dose after 2 hours if the headache comes back.",
        "- Do not take more than 2 sumatriptan tablets in 24 hours.",
        "- Limit pain relievers like ibuprofen or acetaminophen to no more than 2 or 3 days per week.",
        "We sent a generic sumatriptan prescription, which is usually lower in cost; ask the pharmacist about discount programs.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Keep a headache diary that notes the date, how long each headache lasts, and possible triggers such as sleep, food, or stress.",
        "- Return in 2 months to review your headache diary.",
        "A paper diary works just as well as an app.",
        "Bring your diary to the visit so we can look for patterns together.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if your headaches change pattern, happen more often, or wake you from sleep.",
        "Call 911 if you have the worst headache of your life that comes on suddenly, or a headache with weakness, numbness, face drooping, trouble speaking, confusion, a stiff neck, or fever.",
      ],
    },
  ],
});

export const ptHMigraine: PatientFixture = { profile, document };
