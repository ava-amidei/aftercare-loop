import type { Namespaced } from "../types";

export const askKat = {
  "askKat.name": "Ask Kat",
  "askKat.fabLabel": "Ask Kat",
  "askKat.open": "Open Ask Kat",
  "askKat.close": "Close Ask Kat",
  "askKat.minimize": "Minimize Ask Kat",
  "askKat.panelTitle": "Ask Kat",
  "askKat.subtitle": "Your health information companion",
  "askKat.notAClinician": "Kat is not a clinician. Kat can't diagnose or change your treatment.",
  "askKat.contextFor": "Using {name}'s fictional record",

  // Exact text from SPEC §12.1 (first open). `askKat.welcome` = the three lines joined.
  "askKat.welcome": "Hi! I'm Kat. 💗\nI'm here to help you understand your health information, explore reliable resources, and prepare questions for your care team.\nWhat's on your mind today?",
  "askKat.welcome.greeting": "Hi! I'm Kat. 💗",
  "askKat.welcome.body":
    "I'm here to help you understand your health information, explore reliable resources, and prepare questions for your care team.",
  "askKat.welcome.question": "What's on your mind today?",

  // The five suggestion chips, keyed by QuickPromptId.
  "askKat.chip.what_should_i_ask": "What should I ask my doctor?",
  "askKat.chip.explain_my_diagnosis": "Explain my diagnosis",
  "askKat.chip.understand_my_results": "Help me understand my results",
  "askKat.chip.plan_next_steps": "Help me plan my next steps",
  "askKat.chip.free_text": "Ask Kat anything about your health…",
  "askKat.chips.label": "Suggested questions",

  // Additional guided prompts (SPEC §3.D).
  "askKat.prompt.simpler": "Can you explain this in simpler terms?",
  "askKat.prompt.medicalTerm": "What does this medical term mean?",
  "askKat.prompt.followUpPlan": "What does my follow-up plan say?",
  "askKat.prompt.clarify": "What information should I clarify?",

  "askKat.input.label": "Message Kat",
  "askKat.input.placeholder": "Ask Kat anything about your health…",
  "askKat.send": "Send",
  "askKat.thinking": "Kat is thinking…",
  "askKat.error": "Kat couldn't respond just now.",
  "askKat.retry": "Try again",
  "askKat.sources": "Sources",
  "askKat.clearChat": "Clear conversation",
  "askKat.you": "You",
  "askKat.kat": "Kat",
  "askKat.questionAdded": "Added to your questions.",

  "askKat.action.view_source": "View original source",
  "askKat.action.check_understanding": "Check my understanding",
  "askKat.action.add_question": "Add question to my list",
  "askKat.action.view_action_plan": "View my action plan",
  "askKat.action.prepare_appointment": "Prepare for my appointment",
  // ---- BEGIN ask-kat-ui additions ----
  "askKat.conversationActive": "Conversation in progress",
  "askKat.messagesLabel": "Conversation with Kat",
  "askKat.fromYourDocument": "From your visit document",
  "askKat.viewSource": "View source",
  "askKat.sourceUnavailable": "The original document for this passage isn't available.",
  "askKat.deterministicNote": "Assembled from your fictional record without an AI model.",
  "askKat.suggestedQuestion": "Suggested question",
  "askKat.questionAlreadySaved": "In your questions",
  "askKat.planCreated": "Your action plan was created from your visit document.",
  "askKat.planError": "Kat couldn't build your action plan just now. You can try again from My Action Plan.",
  "askKat.empty.title": "No messages yet",
  "askKat.empty.body": "Ask Kat a question or choose a suggestion below.",
  "askKat.hydrating": "Loading your conversation…",
  "askKat.moreSuggestions": "More suggestions",
  "askKat.concerningNote": "Kat can't assess symptoms. Please contact your care team promptly.",
  // ---- END ask-kat-ui additions ----
} satisfies Namespaced<"askKat">;
