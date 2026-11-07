// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-a-pcos",
  displayName: "Maya Thompson",
  ageRange: "20–29",
  language: "en",
  explanationLevel: "standard",
  accessibility: [],
  conditions: ["Polycystic ovary syndrome (PCOS)", "Insulin resistance"],
  medications: [
    {
      name: "Metformin",
      dose: "500 mg",
      frequency: "twice daily with breakfast and dinner",
      documentedPurpose: "to help with insulin resistance",
    },
  ],
  careInstructions: [
    "Take metformin 500 mg twice daily with breakfast and dinner.",
    "Fasting blood test for glucose and cholesterol within 2 weeks.",
    "Track period start and end dates.",
    "Follow-up appointment in 3 months.",
  ],
  healthGoals: ["Understand what PCOS means for me", "Have more regular periods", "Prepare questions for my next visit"],
  barriers: ["transportation"],
  scenarioSummary: "Lives in a rural area and is learning about a new PCOS diagnosis.",
};

const document = buildVisitDocument({
  id: "doc-pt-a-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-14",
  createdAt: "2026-10-14",
  header: fictionalHeader([
    "Patient: Maya Thompson (fictional)",
    "Visit date: October 14, 2026",
    "Clinic: Pine Hollow Community Health Center (fictional)",
    "Clinician: Dr. Ellen Ruiz, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in to review your blood test and ultrasound results after several months of irregular periods.",
        "You told us your periods come every 45 to 70 days, and you have noticed more acne and some hair growth on your chin.",
        "You also mentioned that the clinic is about an hour away and that getting a ride can be hard.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your symptoms, lab results, and ultrasound together fit polycystic ovary syndrome (PCOS).",
        "PCOS is a common hormone condition that can affect periods, skin, hair growth, and how the body uses insulin.",
        "Your testosterone level was mildly elevated.",
        "Your fasting insulin was elevated, which suggests insulin resistance.",
        "Your ultrasound showed many small follicles on both ovaries; these are not dangerous cysts.",
        "Your thyroid and prolactin tests were normal.",
        "We talked about how PCOS can be managed over time and how the plan can change based on your goals.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take metformin 500 mg twice daily with breakfast and dinner.",
        "Metformin can cause stomach upset or loose stools at first; taking it with food helps.",
        "Please do not change how much you take without talking with us first.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Get a fasting blood test for glucose and cholesterol at the lab within the next 2 weeks.",
        "- Track the start and end dates of your periods in a calendar or app.",
        "- Schedule a follow-up appointment in 3 months to review your labs and symptoms.",
        "Fasting means nothing to eat or drink except water for 8 hours before the test.",
        "Our front desk can tell you about telehealth options for the follow-up visit if travel is difficult.",
        "Bring your period calendar and any questions you have about PCOS, skin changes, or future pregnancy plans to your next visit.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if stomach upset from metformin lasts longer than 2 weeks or keeps you from eating.",
        "Call the clinic if you go more than 90 days without a period.",
        "Call 911 or go to the nearest emergency room if you have severe belly pain, fainting, chest pain, or trouble breathing.",
      ],
    },
  ],
});

export const ptAPcos: PatientFixture = { profile, document };
