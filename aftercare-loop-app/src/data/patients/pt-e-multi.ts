// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-e-multi",
  displayName: "Gloria Bennett",
  ageRange: "60–69",
  language: "en",
  explanationLevel: "standard",
  accessibility: ["larger_text", "high_contrast"],
  conditions: ["Heart failure", "Chronic kidney disease, stage 3", "Type 2 diabetes"],
  medications: [
    {
      name: "Furosemide",
      dose: "40 mg",
      frequency: "once each morning",
      documentedPurpose: "water pill to help prevent fluid buildup",
    },
    {
      name: "Lisinopril",
      dose: "10 mg",
      frequency: "once a day",
      documentedPurpose: "for heart and kidney protection",
    },
    {
      name: "Insulin glargine",
      dose: "20 units",
      frequency: "at bedtime",
      documentedPurpose: "for blood sugar",
    },
  ],
  careInstructions: [
    "Limit total fluids to 1.5 liters (about 6 cups) per day, including soups and drinks.",
    "Weigh every morning after using the bathroom and before breakfast; write it down.",
    "Call the clinic for weight gain of more than 2 pounds in a day or 5 pounds in a week.",
    "Take furosemide 40 mg once each morning.",
    "Kidney function and potassium blood work by October 30, 2026.",
  ],
  healthGoals: ["Keep my conditions stable", "Know which advice applies to me", "Lower my medicine costs"],
  barriers: ["cost_or_insurance"],
  scenarioSummary: "Managing several chronic conditions and sorting out advice that may conflict.",
};

const document = buildVisitDocument({
  id: "doc-pt-e-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-23",
  createdAt: "2026-10-23",
  header: fictionalHeader([
    "Patient: Gloria Bennett (fictional)",
    "Visit date: October 23, 2026",
    "Clinic: Mesa Valley Internal Medicine (fictional)",
    "Clinician: Dr. Paul Whitaker, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for a follow-up visit 1 week after a hospital stay for fluid buildup related to heart failure.",
        "You told us your ankles are less swollen and you can walk to your mailbox without stopping.",
        "You brought a handout from your diabetes education class that says to drink plenty of water, especially when your blood sugar is high.",
        "You also told us that one of your medicines has become expensive and you have sometimes skipped doses to make it last.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your heart failure is improving since your hospital stay, and your lungs sounded clear today.",
        "Your weight today was 168 pounds, which is 9 pounds less than when you were in the hospital.",
        "Your kidney function is reduced and stable, consistent with chronic kidney disease stage 3.",
        "Your most recent A1C was 7.6%.",
        "Because you have heart failure and kidney disease together, the amount of fluid you drink matters more for you than for most people.",
        "General advice to drink more water may not apply to you; please ask your care team before changing how much you drink.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take furosemide 40 mg once each morning.",
        "Continue lisinopril 10 mg once a day and insulin glargine 20 units at bedtime as before.",
        "Please tell us before skipping or stretching any medicine because of cost.",
        "Our clinic pharmacist can review lower-cost options and patient assistance programs with you.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Limit your total fluids to 1.5 liters (about 6 cups) per day, including soups and drinks.",
        "- Weigh yourself every morning after using the bathroom and before breakfast, and write down your weight.",
        "- Call the clinic if your weight goes up by more than 2 pounds in one day or 5 pounds in one week.",
        "- Get blood work for kidney function and potassium at the lab by October 30, 2026.",
        "Bring your weight log and your diabetes class handout to your next visit so we can review them together.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if your blood sugar stays above 300, if you feel dizzy when standing, or if your legs or belly are more swollen.",
        "Call 911 if you have chest pain, severe shortness of breath, trouble breathing when lying flat that does not improve when sitting up, or you cough up pink, frothy mucus.",
      ],
    },
  ],
});

export const ptEMulti: PatientFixture = { profile, document };
