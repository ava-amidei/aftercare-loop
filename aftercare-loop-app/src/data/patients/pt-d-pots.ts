// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-d-pots",
  displayName: "Hannah Okafor",
  ageRange: "18–24",
  language: "en",
  explanationLevel: "standard",
  accessibility: ["high_contrast"],
  conditions: ["Postural orthostatic tachycardia syndrome (POTS)"],
  medications: [
    {
      name: "Propranolol",
      dose: "10 mg",
      frequency: "once each morning",
      documentedPurpose: "to help with a fast heart rate when standing",
    },
  ],
  careInstructions: [
    "Drink 2 to 3 liters of fluid each day, spread across the day.",
    "Add about 3 grams of extra salt to food each day, as discussed.",
    "Wear waist-high compression stockings during the day.",
    "Take propranolol 10 mg once each morning.",
    "Cardiology follow-up in 3 months.",
  ],
  healthGoals: ["Understand my care plan", "Feel steadier when standing in class", "Build up activity safely"],
  barriers: [],
  scenarioSummary: "College student with a documented POTS care plan who wants to understand each part of it.",
};

const document = buildVisitDocument({
  id: "doc-pt-d-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-02",
  createdAt: "2026-10-02",
  header: fictionalHeader([
    "Patient: Hannah Okafor (fictional)",
    "Visit date: October 2, 2026",
    "Clinic: Lakeside Cardiology Associates (fictional)",
    "Clinician: Dr. Mariam Haddad, MD, Cardiology (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in to review your tilt table test results and to make a care plan for dizziness and a racing heart when you stand up.",
        "You told us the symptoms are worse in the morning, in hot weather, and after standing in line or in class for a long time.",
        "You have nearly fainted twice this semester but have not fully passed out.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your tilt table test showed your heart rate went up by more than 30 beats per minute within 10 minutes of standing, without a drop in blood pressure.",
        "Together with your symptoms, this fits postural orthostatic tachycardia syndrome (POTS).",
        "Your heart ultrasound (echocardiogram) and heart rhythm monitor were normal.",
        "Your blood counts and thyroid tests were normal.",
        "POTS affects how the body controls heart rate and blood flow when changing position.",
        "The plan below focuses on increasing blood volume, supporting blood flow back to the heart, and slowly rebuilding activity.",
        "A physical therapy referral for a reconditioning program was discussed and will be decided at your next visit.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take propranolol 10 mg once each morning.",
        "This medicine can make you feel tired at first.",
        "Do not stop it suddenly or change the dose on your own; talk with us first.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Drink 2 to 3 liters of fluid each day, spread out across the day.",
        "- Add about 3 grams of extra salt to your food each day, as we discussed.",
        "- Wear waist-high compression stockings during the day, especially when you will be standing for long periods.",
        "- Schedule a follow-up visit with cardiology in 3 months.",
        "The fluid and salt amounts above were chosen for you based on your test results and health history; they are not general advice for everyone.",
        "Try sitting or lying down at the first sign of dizziness, and stand up slowly in the morning.",
        "A note for your school's disability services office can be provided if you need it.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if you faint, if your symptoms get worse even with this plan, or if you have swelling in your legs.",
        "Call 911 if you faint and hit your head, or if you have chest pain, severe shortness of breath, or a heartbeat that is very fast and does not slow down when you lie down.",
      ],
    },
  ],
});

export const ptDPots: PatientFixture = { profile, document };
