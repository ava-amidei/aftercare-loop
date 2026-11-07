import type { Namespaced } from "../types";

export const understand = {
  "understand.title": "Understand My Health",
  "understand.subtitle": "Ask about a health topic, or paste your after-visit summary to get a plain-language explanation.",

  "understand.input.topicLabel": "Ask about a condition, term, or question",
  "understand.input.topicPlaceholder": "Type a word or question from your visit",
  "understand.input.documentLabel": "Paste your after-visit summary",
  "understand.input.documentPlaceholder": "Paste the text of your visit summary here",
  "understand.input.upload": "Upload a .txt file",
  "understand.input.uploadHint": "Plain text (.txt) files only, up to 20,000 characters.",
  "understand.input.useCurrent": "Use my visit summary",
  "understand.input.fileWrongType": "Please choose a plain text (.txt) file.",
  "understand.input.fileTooLarge": "This file is too long. Please use a shorter summary.",
  "understand.input.emptyDocument": "Paste or upload a visit summary first.",
  "understand.generate": "Explain this",
  "understand.generating": "Reading your visit summary…",

  "understand.section.whatThisMeans": "What does this mean?",
  "understand.section.whatToKnow": "What should I know?",
  "understand.section.discuss": "What can I discuss with my provider?",
  "understand.section.nextSteps": "What are my next steps?",
  "understand.section.sources": "Sources",
  "understand.section.terms": "Words to know",
  "understand.section.limitations": "What your document doesn't say",
  "understand.section.unanswered": "Questions your document doesn't answer",

  "understand.label.documented": "From your document",
  "understand.label.generalEducation": "General education",
  "understand.label.clinicianProvided": "From your clinician",
  "understand.label.optionalSuggestion": "Optional suggestion",

  "understand.addToPlan": "Add to my action plan",
  "understand.addedToPlan": "Added to your action plan",
  "understand.addQuestion": "Add to my questions",
  "understand.unverifiedNotice":
    "We couldn't match this to the exact words in your document, so it isn't shown as an instruction. Please check it with your care team.",
  "understand.noEvidence":
    "We couldn't find a reliable reference for this topic. Please ask your care team.",
  "understand.noInstructions": "No follow-up instructions were found in this document.",

  "understand.source.patient_education": "Patient education",
  "understand.source.clinical_guideline": "Clinical guideline",
  "understand.source.peer_reviewed": "Peer-reviewed research",
  "understand.source.government_resource": "Government resource",
  "understand.source.accessed": "Accessed {date}",
  "understand.source.updated": "Updated {date}",

  "understand.document.original": "Original document",
  "understand.document.highlight": "Highlighted passage",
  "understand.empty": "Paste a visit summary or ask a question to get started.",
  "understand.error": "We couldn't create an explanation right now.",
} satisfies Namespaced<"understand">;
