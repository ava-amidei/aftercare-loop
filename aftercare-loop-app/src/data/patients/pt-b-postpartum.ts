// Fictional demonstration patient. Any resemblance to a real person is coincidental.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, EN_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-b-postpartum",
  displayName: "Lena Brooks",
  ageRange: "30–39",
  language: "en",
  explanationLevel: "simple",
  accessibility: ["larger_text"],
  conditions: ["Postpartum follow-up", "Elevated blood pressure during delivery"],
  medications: [
    {
      name: "Prenatal vitamin",
      frequency: "once a day",
      documentedPurpose: "while breastfeeding",
    },
  ],
  careInstructions: [
    "Full postpartum visit on November 18, 2026.",
    "Check blood pressure once a day with the home cuff and write down each reading.",
    "Keep taking the prenatal vitamin once a day while breastfeeding.",
    "Fill out the mood questionnaire and bring it to the next visit.",
  ],
  healthGoals: ["Keep track of my follow-up visits", "Understand which symptoms need a call", "Get more rest"],
  barriers: ["transportation", "caregiving"],
  pregnancyOrPostpartumContext: "Documented in the fictional record: 2 weeks after a vaginal delivery; breastfeeding.",
  scenarioSummary: "Single mother navigating postpartum follow-up with transportation and caregiving barriers.",
};

const document = buildVisitDocument({
  id: "doc-pt-b-visit-001",
  patientId: profile.id,
  title: "After-Visit Summary — 2026-10-21",
  createdAt: "2026-10-21",
  header: fictionalHeader([
    "Patient: Lena Brooks (fictional)",
    "Visit date: October 21, 2026",
    "Clinic: Riverside Family Health Clinic (fictional)",
    "Clinician: Jordan Lee, CNM (fictional)",
  ]),
  sections: [
    {
      heading: H.reason,
      lines: [
        "You came in for a blood pressure check 2 weeks after the birth of your baby.",
        "Your blood pressure was a little high during your delivery.",
        "You said you are breastfeeding, your bleeding is lighter, and you are very tired.",
        "You told us you take care of your baby and your older child on your own and do not have a car.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Your blood pressure today was 134/86.",
        "This is better than it was in the hospital, but we want to keep watching it.",
        "Blood pressure can stay high or go up again in the weeks after birth, so checking it at home is important.",
        "Your bleeding and healing look as expected for 2 weeks after birth.",
        "Feeling tired is common with a new baby.",
        "Feeling sad, worried, or not like yourself can also happen after birth, and it can be treated.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Keep taking your prenatal vitamin once a day while you are breastfeeding.",
        "You do not need any blood pressure medicine right now.",
        "Ask us before starting any new medicine or supplement while breastfeeding.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Return to the clinic for your full postpartum visit on November 18, 2026.",
        "- Check your blood pressure once a day with the home blood pressure cuff and write down each reading.",
        "- Fill out the mood questionnaire we gave you and bring it to your next visit.",
        "You are welcome to bring your children to your visit.",
        "Ask our front desk about ride programs or a telehealth visit if getting here is hard.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.",
        "Call 911 right away if you have a seizure, chest pain, or trouble breathing.",
        "Call 911 right away if you are soaking through a pad every hour, have a very bad headache that does not go away, or see spots or have blurry vision.",
        "Call 911 or the 988 Suicide & Crisis Lifeline if you have thoughts of hurting yourself or your baby.",
        "Call the clinic if you have a fever of 100.4°F or higher, or one leg is red, swollen, or painful.",
      ],
    },
  ],
});

export const ptBPostpartum: PatientFixture = { profile, document };
