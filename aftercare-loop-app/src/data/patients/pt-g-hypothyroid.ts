// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-g-hypothyroid",
  displayName: "Claire Donovan",
  ageRange: "40–49",
  language: "en",
  explanationLevel: "detailed",
  accessibility: ["screen_reader"],
  conditions: ["Hypothyroidism"],
  medications: [
    {
      name: "Levothyroxine",
      dose: "50 mcg",
      frequency: "once every morning on an empty stomach",
      documentedPurpose: "to replace thyroid hormone",
    },
  ],
  careInstructions: [
    "Levothyroxine 50 mcg every morning on an empty stomach, 30 to 60 minutes before breakfast.",
    "Take calcium or iron supplements at least 4 hours apart from levothyroxine.",
    "Repeat TSH blood test in 6 weeks.",
    "Follow-up video visit after lab results are back.",
  ],
  healthGoals: ["Have more energy", "Understand how my thyroid medicine works"],
  barriers: ["scheduling"],
  scenarioSummary: "Newly started on thyroid medicine and learning how to take it correctly.",
};

const document = buildVisitDocument({
  id: "doc-pt-g-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-16",
  createdAt: "2026-10-16",
  header: fictionalHeader([
    "Patient: Claire Donovan (fictional)",
    "Visit date: October 16, 2026",
    "Clinic: Northgate Primary Care (fictional)",
    "Clinician: Dr. Aaron Feld, DO (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in to discuss your blood test results after several months of tiredness, feeling cold, dry skin, and constipation.",
        "You also noticed your periods have been heavier over the past few months.",
        "You told us you take a calcium supplement and a multivitamin with iron each morning.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your thyroid-stimulating hormone (TSH) level was high at 9.8, and your free T4 level was low.",
        "This pattern means your thyroid gland is not making enough thyroid hormone, which is called hypothyroidism.",
        "Your thyroid peroxidase antibodies were positive, which suggests the most common cause, Hashimoto's thyroiditis, an autoimmune condition.",
        "Hypothyroidism is usually treated with a daily thyroid hormone pill.",
        "The dose is adjusted based on blood tests, so it can take a few months to find the right dose.",
        "Many symptoms improve over several weeks once levels are back in range.",
        "Your blood count was normal, and the heavier periods may improve as your thyroid levels improve; we will review this again at follow-up.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Take levothyroxine 50 mcg once every morning on an empty stomach, 30 to 60 minutes before breakfast.",
        "- Take your calcium or iron supplements at least 4 hours apart from levothyroxine.",
        "Calcium, iron, and some antacids can block your body from absorbing levothyroxine.",
        "Take it with a full glass of water, and try to take it at the same time each day.",
        "Do not change your dose on your own; the dose will be adjusted based on your blood tests.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Get your TSH blood test repeated at the lab in 6 weeks.",
        "- Schedule a follow-up video visit after your lab results are back.",
        "You can book the video visit through the patient portal at any time, including evenings.",
        "The patient portal works with screen readers; call the front desk if you would like help setting it up.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic if you have a racing heartbeat, shakiness, trouble sleeping, or weight loss you cannot explain after starting the medicine, since these can mean the dose is too high.",
        "Call 911 if you have chest pain, fainting, or severe trouble breathing.",
      ],
    },
  ],
});

export const ptGHypothyroid: PatientFixture = { profile, document };
