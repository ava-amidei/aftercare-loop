// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-j-perimenopause",
  displayName: "Denise Walker",
  ageRange: "40–49",
  language: "en",
  explanationLevel: "detailed",
  accessibility: [],
  conditions: ["Perimenopause symptoms", "Trouble sleeping"],
  medications: [],
  careInstructions: [
    "4-week symptom log of hot flashes, sleep, and any bleeding.",
    "Call the imaging center to schedule the screening mammogram that was ordered.",
    "Fasting lipid panel and thyroid blood test before next visit.",
    "Return in 3 months to discuss treatment options for hot flashes.",
  ],
  healthGoals: ["Sleep through the night", "Compare treatment options with my clinician"],
  barriers: ["scheduling"],
  scenarioSummary: "Working through perimenopause symptoms and preparing to compare treatment options.",
};

const document = buildVisitDocument({
  id: "doc-pt-j-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-12",
  createdAt: "2026-10-12",
  header: fictionalHeader([
    "Patient: Denise Walker (fictional)",
    "Visit date: October 12, 2026",
    "Clinic: Oak Ridge Women's Health (fictional)",
    "Clinician: Dr. Helen Marsh, MD (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for hot flashes, night sweats, and waking up several times a night over the past 6 months.",
        "Your periods have become irregular, with 2 to 4 months between some of them.",
        "You told us the night sweats are affecting your sleep and your work, and that your job leaves little time for appointments.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your symptoms and the change in your periods fit perimenopause, the transition time before menopause.",
        "During perimenopause, hormone levels go up and down, which can cause hot flashes, night sweats, sleep changes, mood changes, and irregular periods.",
        "Menopause is confirmed after 12 months in a row without a period.",
        "Your blood pressure and exam today were normal.",
        "We discussed that there are both hormone and non-hormone treatment options for hot flashes, and that the best choice depends on your health history, preferences, and the results of the tests below.",
        "No medication was started today.",
        "Because your periods are irregular, you can still become pregnant during perimenopause; we discussed contraception options if that matters to you.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "No new medications were prescribed at this visit.",
        "Please tell us about any over-the-counter or herbal products before starting them, since some can interact with other medicines.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Keep a 4-week symptom log of hot flashes, sleep, and any bleeding.",
        "- Call the imaging center to schedule your screening mammogram, which has been ordered.",
        "- Get the fasting lipid panel and thyroid blood test at the lab before your next visit.",
        "- Return in 3 months to discuss treatment options for hot flashes.",
        "The lab and imaging center both offer early morning appointments.",
        "Cooling bedding, layered clothing, and limiting alcohol and caffeine in the evening help some people with night sweats; these are general tips, not a treatment plan.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if you have bleeding that is much heavier than usual, bleeding between periods, or bleeding after sex.",
        "Call the clinic if you have any bleeding after 12 months without a period.",
        "Call 911 or go to the emergency room if you soak through a pad every hour for 2 hours or more, or if you feel faint.",
      ],
    },
  ],
});

export const ptJPerimenopause: PatientFixture = { profile, document };
