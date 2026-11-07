import type { Namespaced } from "../types";

export const check = {
  "check.title": "Check My Understanding",
  "check.subtitle": "A few short questions to make sure your visit summary was explained clearly.",
  "check.intro": "Let's make sure I explained that clearly.",
  "check.nextStepPrompt":
    "Let's make sure I explained that clearly. What would you say is the next step in your care plan?",
  "check.reexplain": "Let me explain that another way.",
  "check.start": "Start",
  "check.progress": "Question {current} of {total}",
  "check.attempt": "Try {number}",

  "check.answerLabel": "Your answer",
  "check.answerPlaceholder": "Answer in your own words",
  "check.chooseOne": "Choose an answer",
  "check.orTypeAnswer": "Or type your answer",
  "check.submit": "Check my answer",
  "check.checking": "Checking…",

  "check.result.correct": "That's right.",
  "check.result.correctDetail": "You explained it clearly.",
  "check.result.notYet": "Thanks for sharing that. Let's look at this part together.",
  "check.result.correctAfterRetry": "That's it. Thanks for working through it with me.",

  "check.tryAgain": "Try again",
  "check.nextQuestion": "Next question",
  "check.skip": "Skip for now",
  "check.saveForClinician": "Save this for my clinician",
  "check.savedForClinician": "Saved to your questions for your next appointment.",
  "check.sourcePassage": "From your document",
  "check.complete.title": "All done",
  "check.complete.body": "Thank you for checking in. Anything you saved will be ready for your next appointment.",
  "check.empty": "No questions are ready yet. Review your visit summary first.",
  "check.error": "We couldn't check your answer right now.",
} satisfies Namespaced<"check">;
