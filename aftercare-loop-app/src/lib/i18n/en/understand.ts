import type { Namespaced } from "../types";

export const understand = {
  "understand.title": "Understand My Health",
  "understand.subtitle": "Ask about a health topic, or paste your visit summary to have it explained.",

  "understand.input.topicLabel": "Ask about a condition, term, or question",
  "understand.input.topicPlaceholder": "Type a word or question from your visit",
  "understand.input.documentLabel": "Paste your after-visit summary",
  "understand.input.documentPlaceholder": "Paste the text of your visit summary here",
  "understand.input.upload": "Upload a .txt file",
  "understand.input.uploadHint": "Plain text (.txt) files only, up to 200 KB and 20,000 characters.",
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
  // ---- understand-page additions ----
  "understand.tabs.label": "Choose what to understand",
  "understand.tabs.topic": "Ask about a term or condition",
  "understand.tabs.summary": "My visit summary",

  "understand.topic.ask": "Ask",
  "understand.topic.asking": "Looking that up…",
  "understand.topic.hint": "For example, a word from your visit summary or the name of a test.",
  "understand.topic.empty": "Ask about a word, test, or condition to see a plain-language answer here.",
  "understand.topic.emptyQuestion": "Type a word or question first.",
  "understand.topic.youAsked": "You asked",
  "understand.topic.answerFromKat": "Answer from Ask Kat",
  "understand.topic.error": "We couldn't get an answer right now.",
  "understand.topic.addQuestion": "Add to my questions",

  "understand.input.loadSample": "Load my sample summary",
  "understand.input.pasteHint": "You can paste text, load your sample summary, or upload a .txt file.",
  "understand.input.charCount": "{count} of {max} characters",
  "understand.input.tooLong": "This summary is longer than {max} characters. Please shorten it.",
  "understand.input.fileEmpty": "This file is empty.",
  "understand.input.fileReadError": "We couldn't read this file. Please try another one.",
  "understand.input.fileLoaded": "Loaded {name}",
  "understand.explain": "Explain this to me",
  "understand.retry": "Try again",
  "understand.resultFor": "Explanation of: {title}",

  "understand.terms.expandHint": "Tap a word to see what it means.",
  "understand.terms.notInDocument": "This word could not be matched to your document.",
  "understand.terms.learnMore": "Learn more",
  "understand.whatToKnow.generalNote":
    "General health education — not specific advice about your situation.",
  "understand.whatToKnow.empty": "No general education was added for this document.",
  "understand.discuss.hint": "Suggested questions you may want to ask. They are not instructions.",
  "understand.discuss.added": "Added to your questions",
  "understand.discuss.addedToast": "Saved to your questions for your provider.",
  "understand.discuss.empty": "No suggested questions for this document.",
  "understand.nextSteps.hint": "Only instructions that match the exact words in your document are shown here.",
  "understand.nextSteps.needsClarification": "Needs clarification",
  "understand.nextSteps.needsClarificationHint":
    "These may be next steps, but we couldn't match them to the exact words in your document. They are not added to your care plan. Please check them with your care team.",
  "understand.nextSteps.notVerified": "Not verified",
  "understand.nextSteps.claimedQuote": "Text we looked for: “{quote}”",

  "understand.sources.notVerified": "Not verified",
  "understand.sources.notVerifiedNote":
    "No curated reference was found for this explanation, so it is not backed by a verified source. Please check with your care team.",
  "understand.sources.unknownRemoved":
    "Some references could not be found in our curated list and were not shown.",
  "understand.sources.government": "Government source",
  "understand.sources.open": "Open {title}",

  "understand.safety.title": "Please note",
  "understand.safety.urgent": "Urgent",
  "understand.safety.clarify": "Check with your care team",
  "understand.safety.info": "For your information",

  "understand.cta.title": "What would you like to do next?",
  "understand.cta.check": "Check my understanding",
  "understand.cta.plan": "Build my action plan",
  "understand.cta.planBuilding": "Building your action plan…",
  "understand.cta.planError": "We couldn't build your action plan right now.",

  "understand.viewer.title": "Original document",
  "understand.viewer.description": "The highlighted passage is the exact text this item comes from.",
  "understand.viewer.notFound":
    "We couldn't locate this passage in the document, so nothing is highlighted. Please check with your care team.",
  "understand.viewer.noDocument": "The original document is not available.",

  "understand.loading": "Loading your visit summary…",
  "understand.emptyResult": "Select “Explain this to me” to see a plain-language explanation of your summary.",
  // ---- end understand-page additions ----
} satisfies Namespaced<"understand">;
