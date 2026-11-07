// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-c-endometriosis",
  displayName: "Priya Shah",
  ageRange: "20–29",
  language: "en",
  explanationLevel: "detailed",
  accessibility: ["reduced_motion"],
  conditions: ["Chronic pelvic pain", "Painful periods (dysmenorrhea)", "Under evaluation for endometriosis"],
  medications: [
    {
      name: "Naproxen",
      dose: "500 mg",
      frequency: "up to twice a day as needed with food",
      documentedPurpose: "for period pain",
    },
  ],
  careInstructions: [
    "Daily symptom diary (pain 0–10, bleeding, bowel or bladder symptoms) until next visit.",
    "Pelvic ultrasound within 4 weeks.",
    "Call the gynecology office to book a consultation.",
    "Naproxen 500 mg with food up to twice a day as needed for period pain.",
    "Return in 8 weeks.",
  ],
  healthGoals: ["Describe my symptoms clearly at appointments", "Understand the evaluation process", "Miss fewer work shifts"],
  barriers: ["scheduling"],
  scenarioSummary: "Under evaluation for endometriosis and preparing to communicate symptoms at upcoming appointments.",
};

const document = buildVisitDocument({
  id: "doc-pt-c-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-09",
  createdAt: "2026-10-09",
  header: fictionalHeader([
    "Patient: Priya Shah (fictional)",
    "Visit date: October 9, 2026",
    "Clinic: Harbor View Women's Health Practice (fictional)",
    "Clinician: Dr. Samuel Okoye, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for pelvic pain that has been getting worse over the past 2 years.",
        "The pain is worst during the first 2 days of your period and sometimes starts a few days before.",
        "You described pain with bowel movements during your period and occasional pain during sex.",
        "You told us the pain has caused you to miss work several times, and your work schedule changes every week, which makes appointments hard to plan.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your pelvic exam today showed tenderness but no mass.",
        "Your pregnancy test and urine test were negative.",
        "Your symptoms could have several causes.",
        "Endometriosis is one possible cause that we are evaluating, but it has not been confirmed.",
        "Endometriosis can only be confirmed with further evaluation, which may include imaging and, in some cases, a procedure discussed with a gynecologist.",
        "A normal ultrasound does not rule endometriosis in or out.",
        "Other possible causes, such as ovarian cysts or bowel conditions, will also be considered.",
        "We discussed that the evaluation can take time and that your symptom records will help the care team understand the pattern of your pain.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take naproxen 500 mg with food up to twice a day as needed for period pain, starting at the first sign of cramps.",
        "Hormonal treatment options were discussed briefly and will be reviewed in more detail with gynecology.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Keep a daily symptom diary that records your pain level from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.",
        "- Schedule a pelvic ultrasound at the imaging center within the next 4 weeks.",
        "- Call the gynecology office at the number on your referral letter to book a consultation.",
        "- Return in 8 weeks to review the ultrasound and your symptom diary.",
        "The imaging center offers early morning and Saturday appointments, and our office can help you look for times that fit your work schedule.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if your pain is not controlled by the medicine above or if you have pain between periods that is new or getting worse.",
        "Call 911 or go to the emergency room if you have sudden, severe pelvic pain, fainting, a fever with severe pain, or very heavy bleeding that soaks a pad every hour for 2 hours.",
      ],
    },
  ],
});

export const ptCEndometriosis: PatientFixture = { profile, document };
