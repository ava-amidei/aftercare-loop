// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-l-t2d-htn",
  displayName: "Patricia Hall",
  ageRange: "50–59",
  language: "en",
  explanationLevel: "simple",
  accessibility: ["larger_text", "high_contrast"],
  conditions: ["Type 2 diabetes", "High blood pressure (hypertension)"],
  medications: [
    {
      name: "Metformin",
      dose: "1000 mg",
      frequency: "twice a day with breakfast and dinner",
      documentedPurpose: "for blood sugar",
    },
    {
      name: "Lisinopril",
      dose: "20 mg",
      frequency: "once a day",
      documentedPurpose: "for blood pressure",
    },
  ],
  careInstructions: [
    "Metformin 1000 mg twice a day with breakfast and dinner.",
    "Lisinopril 20 mg once a day.",
    "Check blood pressure at home 3 times a week and bring the log to the next visit.",
    "A1C and kidney blood tests before the next visit.",
    "Diabetic eye exam this year.",
  ],
  healthGoals: ["Lower my A1C", "Walk 20 minutes most days", "Keep my medicine costs down"],
  barriers: ["cost_or_insurance", "transportation"],
  scenarioSummary: "Managing type 2 diabetes and high blood pressure with cost and travel barriers.",
};

const document = buildVisitDocument({
  id: "doc-pt-l-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-20",
  createdAt: "2026-10-20",
  header: fictionalHeader([
    "Patient: Patricia Hall (fictional)",
    "Visit date: October 20, 2026",
    "Clinic: Prairie Bend Rural Health Clinic (fictional)",
    "Clinician: Dr. Grace Holloway, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for your regular diabetes and blood pressure check.",
        "You told us you have been walking more, and you feel well most days.",
        "You said it is hard to pay for test strips, and the pharmacy is 30 miles away.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your A1C was 8.1% three months ago.",
        "A1C shows your average blood sugar over about 3 months.",
        "Your blood pressure today was 142/88, which is higher than the goal we set together.",
        "High blood sugar and high blood pressure can both affect your heart, kidneys, eyes, and nerves over time.",
        "Your foot exam today was normal.",
        "Your last kidney test, 6 months ago, was normal.",
        "Walking is helping, and we encourage you to keep it up.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take metformin 1000 mg twice a day with breakfast and dinner.",
        "- Take lisinopril 20 mg once a day.",
        "Your lisinopril dose went up from 10 mg to 20 mg today.",
        "You may feel a little dizzy for the first few days; stand up slowly.",
        "Both medicines are available as low-cost generics, and our clinic can help you set up mail-order delivery.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Check your blood pressure at home 3 times a week and bring your log to your next visit.",
        "- Get your A1C and kidney blood tests at the lab before your next visit.",
        "- Schedule a diabetic eye exam with an eye doctor this year.",
        "Your next visit is in 3 months; a phone or video visit is fine if travel is hard.",
        "Ask our front desk about the clinic's blood pressure cuff loan program.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if your top blood pressure number is above 180 or your blood sugar is below 70 more than once.",
        "Call 911 if you have swelling of your lips, tongue, face, or throat, chest pain, trouble breathing, trouble speaking, or weakness or numbness on one side of your body.",
      ],
    },
  ],
});

export const ptLT2dHtn: PatientFixture = { profile, document };
