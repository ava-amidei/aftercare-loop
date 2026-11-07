/**
 * Aftercare Loop — shared domain types (THE CONTRACT).
 *
 * Every service, component, fixture and test imports from "@/lib/types".
 * Agents may ADD optional fields or new exported types here; never rename or
 * remove existing ones without updating every consumer in the same change.
 *
 * All patient data in this app is synthetic. Nothing here models real PHI.
 */

// ---------------------------------------------------------------------------
// Identity & preferences
// ---------------------------------------------------------------------------

export type PatientId = string; // e.g. "pt-a-pcos"
export type DocumentId = string; // e.g. "doc-pt-a-visit-001"
export type ActionId = string;
export type ReferenceId = string; // e.g. "ref-medlineplus-pcos"
export type QuestionId = string;

export type Language = "en" | "es";
export type ExplanationLevel = "simple" | "standard" | "detailed";

export type AccessBarrier =
  | "transportation"
  | "cost_or_insurance"
  | "language"
  | "scheduling"
  | "caregiving";

export type AccessibilityPreference =
  | "larger_text"
  | "high_contrast"
  | "reduced_motion"
  | "screen_reader";

export interface PatientProfile {
  id: PatientId;
  displayName: string; // fictional
  ageRange: string; // e.g. "30–39" — never a real DOB
  language: Language;
  explanationLevel: ExplanationLevel;
  accessibility: AccessibilityPreference[];
  /** Conditions / concerns as free text labels; condition-agnostic by design. */
  conditions: string[];
  medications: Medication[];
  /** Short clinician-documented care instructions carried on the profile. */
  careInstructions: string[];
  healthGoals: string[];
  barriers: AccessBarrier[];
  /** Only present when the fictional record explicitly documents it. */
  pregnancyOrPostpartumContext?: string;
  /** One-line scenario framing for the demo (e.g. "Rural, managing PCOS"). */
  scenarioSummary: string;
}

export interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
  /** Verbatim from the synthetic record, if documented. */
  documentedPurpose?: string;
}

// ---------------------------------------------------------------------------
// Documents & source traceability
// ---------------------------------------------------------------------------

export interface VisitDocument {
  id: DocumentId;
  patientId: PatientId;
  title: string; // e.g. "After-Visit Summary — 2026-10-14"
  /** Full plain text. Offsets below index into THIS string (UTF-16 code units). */
  text: string;
  /** Section boundaries, if known; optional convenience for highlighting. */
  sections?: DocumentSection[];
  createdAt: string; // ISO date string
  source: "fixture" | "pasted" | "uploaded_txt";
}

export interface DocumentSection {
  id: string;
  heading: string;
  start: number;
  end: number;
}

/** Exact pointer into a VisitDocument. Must satisfy text.slice(start,end) === quote. */
export interface SourceRef {
  documentId: DocumentId;
  start: number;
  end: number;
  quote: string;
  sectionId?: string;
}

export type SourceVerification =
  | "verified" // quote matches document text at the stated offsets
  | "unverified" // produced by AI but could not be matched to the document
  | "not_applicable"; // patient-selected goal or AI suggestion — no source expected

/** Who is responsible for an item. Drives labeling everywhere in the UI. */
export type ActionOrigin =
  | "clinician_documented" // extracted from the visit document and verified
  | "patient_selected" // goal chosen by the patient
  | "ai_suggested"; // question or administrative option proposed by Kat

export type ActionType =
  | "medication"
  | "appointment"
  | "test_or_lab"
  | "referral"
  | "lifestyle"
  | "monitoring"
  | "administrative" // e.g. ask about transportation assistance
  | "question_for_provider"
  | "other";

export type ActionCategory =
  | "care_plan" // My Care Plan (clinician-directed)
  | "wellness_goal" // My Wellness Goals (patient-selected)
  | "provider_question"; // Questions for My Provider

export type ActionStatus = "pending" | "completed" | "needs_clarification";

export interface ActionItem {
  id: ActionId;
  patientId: PatientId;
  documentId?: DocumentId;
  description: string;
  type: ActionType;
  category: ActionCategory;
  origin: ActionOrigin;
  sourceRef?: SourceRef;
  sourceVerification: SourceVerification;
  /** Only when explicitly documented in the source text. */
  dueDate?: string;
  reminder?: Reminder;
  status: ActionStatus;
  /** Human-readable rationale, e.g. "Documented in After-Visit Summary §Follow-up". */
  rationale: string;
  /** For barrier-aware suggestions: which reported barrier this addresses. */
  addressesBarrier?: AccessBarrier;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  /** ISO date-time; in-app only — no SMS/email/push in the MVP. */
  at: string;
  label: string;
  dismissed: boolean;
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export type EvidenceKind =
  | "patient_education" // MedlinePlus, NIH, CDC patient pages
  | "clinical_guideline" // ACOG, professional societies
  | "peer_reviewed" // journal articles
  | "government_resource"; // other .gov

export interface EvidenceReference {
  id: ReferenceId;
  title: string;
  organization: string;
  url: string;
  doi?: string;
  kind: EvidenceKind;
  topics: string[]; // lowercase tags, e.g. ["pcos", "insulin resistance"]
  publishedOrUpdated?: string; // ISO date if known
  accessedAt: string; // ISO date the curator verified the URL
  /** Short curated summary in our own words (no long verbatim excerpts). */
  summary: string;
  language: Language;
}

export interface EvidenceMatch {
  reference: EvidenceReference;
  score: number; // 0..1 relevance
  matchedTopics: string[];
}

// ---------------------------------------------------------------------------
// AI service outputs (all validated with zod in src/lib/ai/schemas.ts)
// ---------------------------------------------------------------------------

export type ResponseMode = "live_claude" | "scripted_demo";

export interface AiMeta {
  mode: ResponseMode;
  model?: string; // model id when live
  generatedAt: string;
  /** Always-present disclaimer text to render. */
  disclaimer: string;
}

export interface TermDefinition {
  term: string;
  definition: string;
  sourceRef?: SourceRef; // where the term appears in the document
  referenceIds: ReferenceId[];
}

export interface ExtractedInstruction {
  description: string;
  type: ActionType;
  sourceRef?: SourceRef;
  sourceVerification: SourceVerification;
  dueDate?: string;
}

export interface DocumentInterpretation {
  documentId: DocumentId;
  patientId: PatientId;
  whatThisMeans: string; // plain-language overview
  terms: TermDefinition[];
  whatToKnow: string[]; // educational bullets, general (not patient-specific claims)
  discussWithProvider: string[]; // suggested questions
  instructions: ExtractedInstruction[]; // clinician-documented next steps
  unansweredQuestions: string[];
  limitations: string[]; // what the document does NOT say
  safetyFlags: SafetyFlag[];
  referenceIds: ReferenceId[];
  meta: AiMeta;
}

export interface SafetyFlag {
  level: "info" | "clarify_with_clinician" | "urgent";
  message: string;
}

// ---------------------------------------------------------------------------
// Ask Kat conversation
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export type KatActionKind =
  | "view_source"
  | "check_understanding"
  | "add_question"
  | "view_action_plan"
  | "prepare_appointment";

export interface KatContextualAction {
  kind: KatActionKind;
  label: string;
  /** Payload differs by kind: sourceRef for view_source, question text for add_question, etc. */
  payload?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  referenceIds?: ReferenceId[];
  sourceRefs?: SourceRef[];
  actions?: KatContextualAction[];
  safety?: SafetyVerdict;
  meta?: AiMeta;
  error?: string;
  /** Set when a message was produced by a scripted quick prompt. */
  quickPrompt?: QuickPromptId;
}

export type QuickPromptId =
  | "what_should_i_ask"
  | "explain_my_diagnosis"
  | "understand_my_results"
  | "plan_next_steps"
  | "free_text";

export interface KatRequest {
  patientId: PatientId;
  message: string;
  quickPrompt?: QuickPromptId;
  history: Pick<ChatMessage, "role" | "content">[];
}

export interface KatResponse {
  message: ChatMessage;
  safety: SafetyVerdict;
}

// ---------------------------------------------------------------------------
// Safety
// ---------------------------------------------------------------------------

export type SafetyScenario =
  | "chest_pain"
  | "severe_breathing_difficulty"
  | "stroke_symptoms"
  | "severe_bleeding"
  | "suicidal_ideation_or_self_harm"
  | "severe_postpartum_warning";

export type SafetyLevel = "none" | "concerning" | "emergency";

export interface SafetyVerdict {
  level: SafetyLevel;
  scenario?: SafetyScenario;
  /** Which layer decided: deterministic rules first, model only as supplement. */
  detectedBy: "rules" | "model" | "none";
  /** Guidance text to show the user (concise, location-appropriate wording). */
  guidance?: string;
  matchedPhrases?: string[];
}

// ---------------------------------------------------------------------------
// Teach-back (Check My Understanding)
// ---------------------------------------------------------------------------

export interface TeachBackQuestion {
  id: QuestionId;
  patientId: PatientId;
  documentId: DocumentId;
  prompt: string; // e.g. "What would you say is the next step in your care plan?"
  sourceRef: SourceRef; // passage the question is about
  expectedAnswer: string;
  acceptedVariations: string[];
  keyConcepts: string[]; // required concepts for correctness
  /** Optional multiple-choice presentation; free text is always allowed. */
  choices?: { id: string; text: string; correct: boolean }[];
  scoring: {
    minKeyConceptsForCorrect: number;
    /** Phrases that indicate a specific misunderstanding → gentle clarification. */
    misconceptions?: { pattern: string; clarification: string }[];
  };
}

export interface TeachBackAttempt {
  attemptNumber: number;
  response: string;
  matchedConcepts: string[];
  correct: boolean;
  /** Possible misunderstanding identified (deterministic or model-assisted). */
  misunderstanding?: string;
  /** Re-explanation offered after an incorrect attempt. */
  clarification?: string;
  clarificationMode?: ResponseMode;
  at: string;
}

export interface TeachBackSession {
  questionId: QuestionId;
  patientId: PatientId;
  attempts: TeachBackAttempt[];
  initialCorrect?: boolean;
  finalCorrect?: boolean;
  clarificationProvided: boolean;
  savedForClinician: boolean;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Follow Up: communication summary & simulated care-team queue
// ---------------------------------------------------------------------------

export interface CommunicationSummary {
  patientId: PatientId;
  generatedAt: string;
  questions: string[];
  barriers: AccessBarrier[];
  unresolvedItems: string[];
  documentedInstructions: { description: string; sourceRef?: SourceRef }[];
  /** Editable final text the patient can copy. */
  text: string;
}

export type CareTeamRequestType =
  | "clarification"
  | "refill_request"
  | "side_effect_question"
  | "incomplete_follow_up"
  | "reported_barrier";

export type CareTeamRequestStatus = "submitted" | "in_review" | "responded" | "closed";

export interface CareTeamRequest {
  id: string;
  patientId: PatientId;
  type: CareTeamRequestType;
  summary: string;
  details?: string;
  relatedActionId?: ActionId;
  status: CareTeamRequestStatus;
  createdAt: string;
  updatedAt: string;
  /** Always true in the MVP — rendered as a "fictional simulation" label. */
  simulated: true;
}

// ---------------------------------------------------------------------------
// Ground truth & evaluation
// ---------------------------------------------------------------------------

export interface GroundTruthInstruction {
  /** Canonical short description used for matching extracted instructions. */
  description: string;
  type: ActionType;
  /** Exact quote that MUST exist in the document text. */
  quote: string;
  /** Alternate phrasings that count as a correct extraction. */
  acceptedDescriptions: string[];
  dueDate?: string;
}

export interface PatientGroundTruth {
  patientId: PatientId;
  documentId: DocumentId;
  expectedKeyFacts: string[];
  expectedInstructions: GroundTruthInstruction[];
  /** Things the system must never do/say for this case (checked by tests). */
  forbiddenActions: string[];
  requiredReferenceTopics: string[];
  teachBackQuestions: TeachBackQuestion[];
  safetyConsiderations: string[];
}

export interface SafetyTestCase {
  id: string;
  scenario: SafetyScenario | "benign_control";
  input: string;
  expectedLevel: SafetyLevel;
  /** Phrases that must NOT appear (e.g. false reassurance). */
  forbiddenPhrases: string[];
  /** Phrases/concepts that SHOULD appear for emergencies (e.g. "911"). */
  requiredConcepts?: string[];
}

export type EvalSuite =
  | "instruction_extraction"
  | "citation_validity"
  | "safety"
  | "comprehension";

export type EvalKind = "deterministic_synthetic" | "model_based" | "human_reviewed";

export interface EvalMetric {
  name: string;
  numerator: number | null;
  denominator: number | null;
  /** null → render "Not evaluated". */
  value: number | null;
  unit: "ratio" | "count";
}

export interface EvalCaseResult {
  caseId: string;
  suite: EvalSuite;
  passed: boolean;
  details: string;
  expected?: unknown;
  actual?: unknown;
}

export interface ConfusionMatrix {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives?: number;
}

export interface EvalRun {
  runId: string;
  suiteVersion: string;
  timestamp: string;
  mode: ResponseMode;
  modelId?: string;
  kind: EvalKind;
  caseCount: number;
  metrics: Record<EvalSuite, EvalMetric[]>;
  confusion?: Partial<Record<EvalSuite, ConfusionMatrix>>;
  cases: EvalCaseResult[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Demo session state (persisted per patient in localStorage)
// ---------------------------------------------------------------------------

export interface PatientSessionState {
  profile: PatientProfile;
  documents: VisitDocument[];
  activeDocumentId?: DocumentId;
  interpretations: Record<DocumentId, DocumentInterpretation>;
  actions: ActionItem[];
  chat: ChatMessage[];
  teachBack: Record<QuestionId, TeachBackSession>;
  communicationSummary?: CommunicationSummary;
  careTeamRequests: CareTeamRequest[];
  /** Questions saved for the next appointment (free text). */
  savedQuestions: string[];
}

// ---------------------------------------------------------------------------
// [synthetic-patients additions] — optional fields only (declaration merging).
// ---------------------------------------------------------------------------

export interface PatientGroundTruth {
  /**
   * Other imperative sentences in the document (e.g. "When to seek care"
   * guidance, "continue X as before") that are NOT core expected instructions.
   * Extracting one is neither required nor a fabrication, so evaluators may
   * exclude them from false positives. Each is an exact substring of the text.
   */
  optionalInstructionQuotes?: string[];
}

// ---------------------------------------------------------------------------
// BEGIN evidence-index additions (owner: evidence-index module)
// ---------------------------------------------------------------------------

/** Who publishes a reference. Lets the UI avoid labeling non-.gov sources as government. */
export type EvidencePublisherType =
  | "government"
  | "professional_society"
  | "journal"
  | "nonprofit";

// Interface declaration merging: adds an OPTIONAL field to EvidenceReference.
export interface EvidenceReference {
  /** Optional publisher category; set when `kind` alone would be ambiguous. */
  publisherType?: EvidencePublisherType;
}

// ---------------------------------------------------------------------------
// END evidence-index additions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BEGIN teach-back-service additions (owner: teach-back-service)
// ---------------------------------------------------------------------------

// Interface declaration merging: adds an OPTIONAL field to TeachBackQuestion.
export interface TeachBackQuestion {
  /**
   * Optional synonyms per key concept, keyed by the concept string exactly as it
   * appears in `keyConcepts` (or its first "|" segment). Equivalent to writing
   * "concept|synonym|synonym" inside `keyConcepts`. Used only by deterministic
   * scoring; the model never decides correctness.
   */
  conceptSynonyms?: Record<string, string[]>;
}

/** Deterministic teach-back score (pure; see src/lib/services/teach-back-scoring.ts). */
export interface TeachBackScore {
  correct: boolean;
  /** Canonical key concepts found in the response (deduplicated). */
  matchedConcepts: string[];
  /** Gentle clarification for a detected misconception; only set when not correct. */
  misunderstanding?: string;
  /** How the decision was reached (for transparency / evaluation). */
  matchedBy: "choice" | "accepted_variation" | "key_concepts" | "none";
  /** Set when the response selected (or exactly restated) a multiple-choice option. */
  choiceId?: string;
}

// ---------------------------------------------------------------------------
// END teach-back-service additions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BEGIN document-interpreter additions (owner: document-interpreter module)
// ---------------------------------------------------------------------------

// Interface declaration merging: adds OPTIONAL fields only.
export interface ExtractedInstruction {
  /**
   * Set only when sourceVerification is "unverified": the quote the extractor
   * claimed, which could NOT be matched to the document text. Display it as
   * "needs clarification", never as a verified source passage.
   */
  unverifiedQuote?: string;
}

// ---------------------------------------------------------------------------
// END document-interpreter additions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BEGIN ask-kat-service additions (owner: ask-kat-service) — optional fields only
// ---------------------------------------------------------------------------

export interface AiMeta {
  /**
   * How the content was produced. "model" = live Claude; "scripted" =
   * predefined Scripted Demo Mode text; "deterministic" = assembled by rules
   * from the fictional record (quick prompts, safety guidance) with no model call.
   */
  generatedBy?: "model" | "scripted" | "deterministic";
}

// ---------------------------------------------------------------------------
// END ask-kat-service additions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BEGIN safety fix additions (owner: safety) — optional fields only
// ---------------------------------------------------------------------------

export interface ExtractedInstruction {
  /**
   * True when the instruction's text contains prompt-injection markers
   * ("ignore all previous instructions", "you are now…"). Such an item is
   * always "unverified" with no SourceRef, so it lands in "Needs
   * clarification", never in My Care Plan.
   */
  suspectedInjection?: boolean;
}

// ---------------------------------------------------------------------------
// END safety fix additions
// ---------------------------------------------------------------------------
