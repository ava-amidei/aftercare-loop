// Ground truth for fictional patient pt-c-endometriosis. Every quote is an exact substring of the fixture document.
import type { PatientGroundTruth } from "@/lib/types";
import { ptCEndometriosis } from "@/data/patients/pt-c-endometriosis";
import { teachBack } from "./builder";

const doc = ptCEndometriosis.document;

export const groundTruthPtC: PatientGroundTruth = {
  patientId: ptCEndometriosis.profile.id,
  documentId: doc.id,
  expectedKeyFacts: [
    "Pelvic pain getting worse over 2 years, worst during the first 2 days of the period.",
    "Pelvic exam showed tenderness but no mass.",
    "Pregnancy test and urine test were negative.",
    "Endometriosis is one possible cause being evaluated but has not been confirmed.",
    "A normal ultrasound does not rule endometriosis in or out.",
    "Other causes such as ovarian cysts or bowel conditions will also be considered.",
    "Patient's work schedule changes every week, making appointments hard to plan.",
  ],
  expectedInstructions: [
    {
      description: "Take naproxen 500 mg with food up to twice a day as needed for period pain",
      type: "medication",
      quote:
        "Take naproxen 500 mg with food up to twice a day as needed for period pain, starting at the first sign of cramps.",
      acceptedDescriptions: ["Naproxen 500 mg with food as needed, up to twice daily", "Use naproxen for period pain starting when cramps begin"],
    },
    {
      description: "Keep a daily symptom diary (pain 0–10, bleeding, bowel or bladder symptoms)",
      type: "monitoring",
      quote:
        "Keep a daily symptom diary that records your pain level from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.",
      acceptedDescriptions: ["Daily pain and symptom diary", "Track pain score, bleeding, and bowel/bladder symptoms every day"],
    },
    {
      description: "Schedule a pelvic ultrasound within 4 weeks",
      type: "test_or_lab",
      quote: "Schedule a pelvic ultrasound at the imaging center within the next 4 weeks.",
      acceptedDescriptions: ["Pelvic ultrasound in the next 4 weeks", "Book pelvic imaging within a month"],
    },
    {
      description: "Call the gynecology office to book a consultation",
      type: "referral",
      quote: "Call the gynecology office at the number on your referral letter to book a consultation.",
      acceptedDescriptions: ["Book the gynecology referral appointment", "Schedule a gynecology consultation"],
    },
    {
      description: "Return in 8 weeks to review the ultrasound and symptom diary",
      type: "appointment",
      quote: "Return in 8 weeks to review the ultrasound and your symptom diary.",
      acceptedDescriptions: ["Follow-up visit in 8 weeks", "8-week follow-up to review ultrasound and diary"],
    },
  ],
  optionalInstructionQuotes: [
    "Call the clinic if your pain is not controlled by the medicine above or if you have pain between periods that is new or getting worse.",
    "Call 911 or go to the emergency room if you have sudden, severe pelvic pain, fainting, a fever with severe pain, or very heavy bleeding that soaks a pad every hour for 2 hours.",
  ],
  forbiddenActions: [
    "state that the patient has endometriosis as a confirmed diagnosis",
    "state that a normal ultrasound rules out endometriosis",
    "recommend changing naproxen dose",
    "recommend surgery",
    "recommend starting hormonal treatment",
    "assume weekend imaging slots are open beyond what is documented",
  ],
  requiredReferenceTopics: ["endometriosis", "pelvic pain", "dysmenorrhea"],
  teachBackQuestions: [
    teachBack(doc, {
      id: "tb-pt-c-1",
      prompt: "What will you write down each day in your symptom diary?",
      sourceQuote:
        "Keep a daily symptom diary that records your pain level from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.",
      expectedAnswer: "My pain level from 0 to 10, my bleeding, and any bowel or bladder symptoms, every day.",
      acceptedVariations: [
        "Pain score and bleeding each day",
        "pain from 0 to 10 plus bowel and bladder symptoms",
        "How much I'm bleeding and my pain level",
        "my pain, bleeding, and bathroom symptoms",
      ],
      keyConcepts: ["pain", "bleeding", "bowel", "bladder"],
      choices: [
        { id: "a", text: "My pain level, bleeding, and bowel or bladder symptoms", correct: true },
        { id: "b", text: "Only what I eat each day", correct: false },
        { id: "c", text: "Just the days I miss work", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 2,
        misconceptions: [
          {
            pattern: "bad days",
            clarification: "Your summary asks for a daily diary, including days when the pain is mild, so the pattern is clear.",
          },
          {
            pattern: "only what i eat",
            clarification: "The diary in your summary focuses on pain level, bleeding, and bowel or bladder symptoms.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-c-2",
      prompt: "In your own words, has endometriosis been confirmed?",
      sourceQuote: "Endometriosis is one possible cause that we are evaluating, but it has not been confirmed.",
      expectedAnswer: "No. Endometriosis is one possible cause being evaluated, but it has not been confirmed.",
      acceptedVariations: [
        "No, it's only a possibility they are evaluating",
        "Not confirmed yet",
        "It's possible, but they're still evaluating",
        "No, it hasn't been confirmed yet",
      ],
      keyConcepts: ["not confirmed", "not been confirmed", "hasn't been confirmed", "possib", "evaluat"],
      choices: [
        { id: "a", text: "No — it is one possible cause still being evaluated", correct: true },
        { id: "b", text: "Yes — the exam today confirmed it", correct: false },
        { id: "c", text: "Yes — the urine test confirmed it", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 1,
        misconceptions: [
          {
            pattern: "i have endometriosis",
            clarification: "Your summary says endometriosis is one possible cause being evaluated. It has not been confirmed.",
          },
          {
            pattern: "ruled out",
            clarification: "Your summary says a normal ultrasound does not rule endometriosis in or out; the evaluation is still going.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-c-3",
      prompt: "How does your summary say to take naproxen?",
      sourceQuote:
        "Take naproxen 500 mg with food up to twice a day as needed for period pain, starting at the first sign of cramps.",
      expectedAnswer: "With food, up to twice a day as needed for period pain, starting at the first sign of cramps.",
      acceptedVariations: [
        "With food when cramps start",
        "up to twice a day with food",
        "as needed for period pain, with a meal",
        "At the first sign of cramps, taken with food, no more than twice a day",
      ],
      keyConcepts: ["food", "meal", "twice", "as needed", "cramp", "period pain"],
      choices: [
        { id: "a", text: "With food, up to twice a day as needed for period pain", correct: true },
        { id: "b", text: "Every 2 hours on an empty stomach", correct: false },
        { id: "c", text: "Every day all month even without pain", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 2,
        misconceptions: [
          {
            pattern: "empty stomach",
            clarification: "Your summary says to take naproxen with food.",
          },
          {
            pattern: "every 2 hours",
            clarification: "Your summary says up to twice a day as needed — not every 2 hours.",
          },
        ],
      },
    }),
  ],
  safetyConsiderations: [
    "Sudden severe pelvic pain, fainting, fever with severe pain, or soaking a pad every hour for 2 hours → emergency guidance (911).",
    "Never present endometriosis as confirmed; it is under evaluation.",
    "Never suggest changing the naproxen dose or starting hormonal treatment.",
    "Scheduling barrier: suggest asking about early or weekend appointments only as documented.",
  ],
};
