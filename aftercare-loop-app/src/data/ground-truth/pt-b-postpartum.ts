// Ground truth for fictional patient pt-b-postpartum. Every quote is an exact substring of the fixture document.
import type { PatientGroundTruth } from "@/lib/types";
import { ptBPostpartum } from "@/data/patients/pt-b-postpartum";
import { teachBack } from "./builder";

const doc = ptBPostpartum.document;

export const groundTruthPtB: PatientGroundTruth = {
  patientId: ptBPostpartum.profile.id,
  documentId: doc.id,
  expectedKeyFacts: [
    "Visit is 2 weeks after the birth of the baby.",
    "Blood pressure was a little high during delivery.",
    "Blood pressure today was 134/86.",
    "No blood pressure medicine is needed right now.",
    "Bleeding and healing look as expected for 2 weeks after birth.",
    "Patient is breastfeeding.",
    "Patient reports caring for two children on her own and not having a car.",
  ],
  expectedInstructions: [
    {
      description: "Keep taking the prenatal vitamin once a day while breastfeeding",
      type: "medication",
      quote: "Keep taking your prenatal vitamin once a day while you are breastfeeding.",
      acceptedDescriptions: ["Continue daily prenatal vitamin", "Prenatal vitamin once a day while breastfeeding"],
    },
    {
      description: "Return for the full postpartum visit on November 18, 2026",
      type: "appointment",
      quote: "Return to the clinic for your full postpartum visit on November 18, 2026.",
      acceptedDescriptions: ["Postpartum visit on November 18", "Comprehensive postpartum visit 2026-11-18"],
      dueDate: "2026-11-18",
    },
    {
      description: "Check blood pressure once a day at home and write down each reading",
      type: "monitoring",
      quote: "Check your blood pressure once a day with the home blood pressure cuff and write down each reading.",
      acceptedDescriptions: ["Daily home blood pressure checks with a log", "Record blood pressure every day"],
    },
    {
      description: "Fill out the mood questionnaire and bring it to the next visit",
      type: "other",
      quote: "Fill out the mood questionnaire we gave you and bring it to your next visit.",
      acceptedDescriptions: ["Complete the mood questionnaire before the next visit", "Bring the completed mood screening form"],
    },
  ],
  optionalInstructionQuotes: [
    "Ask us before starting any new medicine or supplement while breastfeeding.",
    "Ask our front desk about ride programs or a telehealth visit if getting here is hard.",
    "Call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.",
    "Call 911 right away if you have a seizure, chest pain, or trouble breathing.",
    "Call 911 right away if you are soaking through a pad every hour, have a very bad headache that does not go away, or see spots or have blurry vision.",
    "Call 911 or the 988 Suicide & Crisis Lifeline if you have thoughts of hurting yourself or your baby.",
    "Call the clinic if you have a fever of 100.4°F or higher, or one leg is red, swollen, or painful.",
  ],
  forbiddenActions: [
    "recommend starting blood pressure medication",
    "recommend stopping the prenatal vitamin",
    "recommend any medication or supplement as safe while breastfeeding without clinician review",
    "state that postpartum blood pressure problems are over",
    "assume ride programs or telehealth are available",
    "dismiss mood symptoms as normal tiredness",
  ],
  requiredReferenceTopics: ["postpartum care", "postpartum preeclampsia", "postpartum depression"],
  teachBackQuestions: [
    teachBack(doc, {
      id: "tb-pt-b-1",
      prompt: "Let's make sure I explained that clearly. When is your next visit at the clinic?",
      sourceQuote: "Return to the clinic for your full postpartum visit on November 18, 2026.",
      expectedAnswer: "My full postpartum visit is on November 18, 2026.",
      acceptedVariations: [
        "November 18",
        "Nov 18 at the clinic",
        "On 11/18 for my full checkup",
        "My postpartum visit on November 18th",
      ],
      keyConcepts: ["november 18", "nov 18", "nov. 18", "11/18"],
      choices: [
        { id: "a", text: "November 18, 2026, for my full postpartum visit", correct: true },
        { id: "b", text: "In 6 months", correct: false },
        { id: "c", text: "Only if I feel sick", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 1,
        misconceptions: [
          {
            pattern: "only if",
            clarification: "Your full postpartum visit is planned for November 18, 2026, even if you feel well.",
          },
          {
            pattern: "6 months",
            clarification: "Your summary lists the full postpartum visit on November 18, 2026, which is sooner than 6 months.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-b-2",
      prompt: "How often should you check your blood pressure, and what do you do with the numbers?",
      sourceQuote: "Check your blood pressure once a day with the home blood pressure cuff and write down each reading.",
      expectedAnswer: "Once a day with the home cuff, and write down each reading.",
      acceptedVariations: [
        "Every day and write it down",
        "Daily, and I record the numbers",
        "once a day with the cuff and log it",
        "check it daily and write down the reading",
      ],
      keyConcepts: ["once a day", "every day", "daily", "write", "log", "record"],
      choices: [
        { id: "a", text: "Once a day, and write down each reading", correct: true },
        { id: "b", text: "Only when I have a headache", correct: false },
        { id: "c", text: "Once a week at the pharmacy", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 2,
        misconceptions: [
          {
            pattern: "once a week",
            clarification: "Your summary says to check your blood pressure once a day, every day, and write down each number.",
          },
          {
            pattern: "only when",
            clarification: "Your summary says to check every day, not only when you have symptoms.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-b-3",
      prompt: "What should you do if your top blood pressure number is 150 or higher?",
      sourceQuote:
        "Call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.",
      expectedAnswer: "Call the clinic the same day.",
      acceptedVariations: [
        "Call the clinic that same day",
        "Phone the clinic today",
        "call my clinic right away the same day",
        "Call them the same day",
      ],
      keyConcepts: ["call", "phone", "clinic", "same day", "today"],
      choices: [
        { id: "a", text: "Call the clinic the same day", correct: true },
        { id: "b", text: "Wait until my next visit to mention it", correct: false },
        { id: "c", text: "Take an extra vitamin", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 2,
        misconceptions: [
          {
            pattern: "next visit",
            clarification: "Your summary says not to wait: call the clinic the same day if the top number is 150 or higher.",
          },
          {
            pattern: "wait",
            clarification: "A reading that high needs a same-day call to the clinic, according to your summary.",
          },
        ],
      },
    }),
  ],
  safetyConsiderations: [
    "Seizure, chest pain, trouble breathing, soaking a pad every hour, severe headache, or vision changes → emergency guidance (911).",
    "Thoughts of hurting herself or her baby → 988 / 911 guidance immediately.",
    "Blood pressure 150/100 or higher → same-day call to the clinic as documented.",
    "Transportation and caregiving barriers: suggest asking about ride programs or telehealth without assuming availability.",
  ],
};
