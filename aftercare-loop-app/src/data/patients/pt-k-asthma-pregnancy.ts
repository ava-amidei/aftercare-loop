// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-k-asthma-pregnancy",
  displayName: "Mei Lin Park",
  ageRange: "30–39",
  language: "en",
  explanationLevel: "standard",
  accessibility: ["larger_text"],
  conditions: ["Asthma"],
  medications: [
    {
      name: "Budesonide inhaler",
      dose: "2 puffs",
      frequency: "twice a day, every day",
      documentedPurpose: "controller medicine to prevent asthma symptoms",
    },
    {
      name: "Albuterol inhaler",
      dose: "2 puffs",
      frequency: "every 4 to 6 hours as needed",
      documentedPurpose: "rescue medicine for wheezing or shortness of breath",
    },
  ],
  careInstructions: [
    "Budesonide 2 puffs twice a day, every day, even when feeling well.",
    "Albuterol 2 puffs every 4 to 6 hours as needed for wheezing or shortness of breath.",
    "Check peak flow every morning and write it in the asthma action plan.",
    "Keep the prenatal appointment on November 12, 2026.",
    "Asthma check in 4 weeks.",
  ],
  healthGoals: ["Keep my asthma under control", "Know when to use each inhaler"],
  barriers: ["caregiving"],
  pregnancyOrPostpartumContext: "Documented in the fictional record: currently pregnant, about 22 weeks; prenatal care with a separate obstetric provider.",
  scenarioSummary: "Managing asthma during a documented pregnancy, coordinating two care teams.",
};

const document = buildVisitDocument({
  id: "doc-pt-k-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-26",
  createdAt: "2026-10-26",
  header: fictionalHeader([
    "Patient: Mei Lin Park (fictional)",
    "Visit date: October 26, 2026",
    "Clinic: Westbrook Pulmonary and Primary Care (fictional)",
    "Clinician: Dr. Rafael Ortiz, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in because your asthma has been harder to control over the past month.",
        "You are about 22 weeks pregnant, and your prenatal care is with a separate obstetric provider.",
        "You told us you have been waking up at night coughing about twice a week and using your albuterol inhaler 4 or 5 times a week.",
        "You stopped your budesonide inhaler earlier in the pregnancy because you were worried about the baby.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your asthma is not well controlled right now.",
        "Your lungs had mild wheezing today, and your peak flow was 320, below your personal best of 420.",
        "Well-controlled asthma is important during pregnancy for both you and your baby, because asthma flares can lower the oxygen that reaches the baby.",
        "Budesonide is an inhaled controller medicine that is commonly used during pregnancy.",
        "We reviewed your written asthma action plan and how to use your inhalers with a spacer.",
        "We will send a copy of today's note to your obstetric provider.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Use your budesonide inhaler, 2 puffs twice a day, every day, even when you feel well.",
        "- Use your albuterol inhaler, 2 puffs every 4 to 6 hours as needed, for wheezing or shortness of breath.",
        "Rinse your mouth with water after using budesonide.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Check your peak flow every morning and write it down in your asthma action plan.",
        "- Keep your prenatal appointment with your obstetric provider on November 12, 2026.",
        "- Return to this clinic in 4 weeks for an asthma check.",
        "If you need albuterol more than 2 days a week, let us know so we can review your plan.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Follow the yellow zone steps in your asthma action plan if your peak flow is between 210 and 335.",
        "Call 911 if your peak flow is below 210, if your lips or fingernails look blue or gray, if you are too short of breath to speak in full sentences, or if albuterol is not helping.",
        "Call your obstetric provider or labor and delivery right away if you notice your baby moving less than usual.",
      ],
    },
  ],
});

export const ptKAsthmaPregnancy: PatientFixture = { profile, document };
