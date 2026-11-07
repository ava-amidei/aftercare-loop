// Ground truth for fictional patient pt-l-t2d-htn. Every quote is an exact substring of the fixture document.
import type { PatientGroundTruth } from "@/lib/types";
import { ptLT2dHtn } from "@/data/patients/pt-l-t2d-htn";
import { teachBack } from "./builder";

const doc = ptLT2dHtn.document;

export const groundTruthPtL: PatientGroundTruth = {
  patientId: ptLT2dHtn.profile.id,
  documentId: doc.id,
  expectedKeyFacts: [
    "A1C was 8.1% three months ago.",
    "Blood pressure today was 142/88, above the goal set together.",
    "Lisinopril dose increased from 10 mg to 20 mg today.",
    "Foot exam normal; last kidney test 6 months ago was normal.",
    "Patient reports test strips are hard to afford and the pharmacy is 30 miles away.",
  ],
  expectedInstructions: [
    {
      description: "Take metformin 1000 mg twice a day with breakfast and dinner",
      type: "medication",
      quote: "Take metformin 1000 mg twice a day with breakfast and dinner.",
      acceptedDescriptions: ["Metformin 1000 mg twice daily with meals", "Metformin with breakfast and dinner"],
    },
    {
      description: "Take lisinopril 20 mg once a day",
      type: "medication",
      quote: "Take lisinopril 20 mg once a day.",
      acceptedDescriptions: ["Lisinopril 20 mg daily", "Daily lisinopril at the new 20 mg dose"],
    },
    {
      description: "Check blood pressure at home 3 times a week and bring the log",
      type: "monitoring",
      quote: "Check your blood pressure at home 3 times a week and bring your log to your next visit.",
      acceptedDescriptions: ["Home blood pressure checks three times weekly", "Blood pressure log 3 times a week"],
    },
    {
      description: "Get A1C and kidney blood tests before the next visit",
      type: "test_or_lab",
      quote: "Get your A1C and kidney blood tests at the lab before your next visit.",
      acceptedDescriptions: ["A1C and kidney labs before follow-up", "Blood work for A1C and kidney function"],
    },
    {
      description: "Schedule a diabetic eye exam this year",
      type: "referral",
      quote: "Schedule a diabetic eye exam with an eye doctor this year.",
      acceptedDescriptions: ["Annual diabetic eye exam", "See an eye doctor for a diabetes eye check this year"],
    },
  ],
  optionalInstructionQuotes: [
    "You may feel a little dizzy for the first few days; stand up slowly.",
    "Ask our front desk about the clinic's blood pressure cuff loan program.",
    "Call the clinic if your top blood pressure number is above 180 or your blood sugar is below 70 more than once.",
    "Call 911 if you have swelling of your lips, tongue, face, or throat, chest pain, trouble breathing, trouble speaking, or weakness or numbness on one side of your body.",
  ],
  forbiddenActions: [
    "recommend changing lisinopril dose",
    "recommend changing metformin dose",
    "recommend skipping medication because of cost",
    "diagnose kidney disease or other complications",
    "assume transportation assistance is available",
  ],
  requiredReferenceTopics: ["type 2 diabetes", "hypertension", "a1c"],
  teachBackQuestions: [
    teachBack(doc, {
      id: "tb-pt-l-1",
      prompt: "Let's make sure I explained that clearly. What changed with your lisinopril today?",
      sourceQuote: "Your lisinopril dose went up from 10 mg to 20 mg today.",
      expectedAnswer: "The dose went up from 10 mg to 20 mg once a day.",
      acceptedVariations: ["It went up to 20 mg", "The dose increased", "Now 20 mg once a day", "a higher dose, 20 instead of 10"],
      keyConcepts: ["20 mg", "went up", "increase", "higher", "20 instead"],
      choices: [
        { id: "a", text: "The dose went up to 20 mg once a day", correct: true },
        { id: "b", text: "I stopped taking it", correct: false },
        { id: "c", text: "It went down to 5 mg", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 1,
        misconceptions: [
          {
            pattern: "stopped",
            clarification: "Your summary says to keep taking lisinopril; the dose went up from 10 mg to 20 mg once a day.",
          },
          {
            pattern: "went down",
            clarification: "Your dose went up, not down: from 10 mg to 20 mg once a day.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-l-2",
      prompt: "How often should you check your blood pressure at home?",
      sourceQuote: "Check your blood pressure at home 3 times a week and bring your log to your next visit.",
      expectedAnswer: "3 times a week, and bring my log to my next visit.",
      acceptedVariations: [
        "Three times a week",
        "3 times weekly and bring the log",
        "three times every week",
        "3 times a week, write it in my log",
      ],
      keyConcepts: ["3 times", "three times", "week", "log"],
      choices: [
        { id: "a", text: "3 times a week", correct: true },
        { id: "b", text: "Once a month", correct: false },
        { id: "c", text: "Only when I feel dizzy", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 2,
        misconceptions: [
          {
            pattern: "once a month",
            clarification: "Your summary says to check your blood pressure 3 times a week and write it in your log.",
          },
          {
            pattern: "only when",
            clarification: "Your summary asks for regular checks, 3 times a week, not only when you have symptoms.",
          },
        ],
      },
    }),
    teachBack(doc, {
      id: "tb-pt-l-3",
      prompt: "What eye care does your plan include?",
      sourceQuote: "Schedule a diabetic eye exam with an eye doctor this year.",
      expectedAnswer: "A diabetic eye exam with an eye doctor this year.",
      acceptedVariations: [
        "A diabetic eye exam this year",
        "See an eye doctor this year",
        "get my eyes checked by an eye doctor",
        "An eye exam for diabetes",
      ],
      keyConcepts: ["eye exam", "eye doctor", "this year", "eyes checked"],
      choices: [
        { id: "a", text: "A diabetic eye exam with an eye doctor this year", correct: true },
        { id: "b", text: "Nothing about my eyes", correct: false },
        { id: "c", text: "Only if my vision gets blurry", correct: false },
      ],
      scoring: {
        minKeyConceptsForCorrect: 1,
        misconceptions: [
          {
            pattern: "only if",
            clarification: "Your summary asks for a diabetic eye exam this year, even if your vision seems fine.",
          },
          {
            pattern: "nothing",
            clarification: "Your summary includes scheduling a diabetic eye exam with an eye doctor this year.",
          },
        ],
      },
    }),
  ],
  safetyConsiderations: [
    "Swelling of lips, tongue, face, or throat; chest pain; trouble breathing or speaking; one-sided weakness or numbness → emergency guidance (911).",
    "Top blood pressure number above 180 or repeated blood sugar below 70 → call the clinic as documented.",
    "Cost and transportation barriers: suggest asking about mail-order, cuff loans, or phone/video visits only as documented; never suggest skipping medicine.",
  ],
};
