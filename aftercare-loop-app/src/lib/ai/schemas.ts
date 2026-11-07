/**
 * Zod schemas for AI service outputs.
 *
 * IMPORTANT: these use `zod/v4` (shipped inside zod 3.25) because the SDK's
 * `zodOutputFormat` helper only accepts v4 schemas. Plain `import { z } from "zod"`
 * is v3 and must NOT be passed to `generateStructured`.
 *
 * Two families:
 *  - `Model*Schema`: what Claude is asked to return. The model never produces
 *    character offsets; it returns verbatim quotes that the server locates in the
 *    document (`locateQuote`) and verifies. All fields are required (optional
 *    values are `nullable`) to keep structured outputs strict.
 *  - Domain mirrors (`DocumentInterpretationSchema`, `ExtractedInstructionSchema`, ...):
 *    validate assembled domain objects (scripted fixtures, stored state) against
 *    the types in "@/lib/types".
 */
import { z } from "zod/v4";
import type {
  AccessBarrier,
  ActionType,
  KatActionKind,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Enums (kept in sync with @/lib/types via `satisfies`)
// ---------------------------------------------------------------------------

export const ACTION_TYPES = [
  "medication",
  "appointment",
  "test_or_lab",
  "referral",
  "lifestyle",
  "monitoring",
  "administrative",
  "question_for_provider",
  "other",
] as const satisfies readonly ActionType[];

export const ACCESS_BARRIERS = [
  "transportation",
  "cost_or_insurance",
  "language",
  "scheduling",
  "caregiving",
] as const satisfies readonly AccessBarrier[];

export const KAT_ACTION_KINDS = [
  "view_source",
  "check_understanding",
  "add_question",
  "view_action_plan",
  "prepare_appointment",
] as const satisfies readonly KatActionKind[];

export const SAFETY_FLAG_LEVELS = ["info", "clarify_with_clinician", "urgent"] as const;

export const ActionTypeSchema = z.enum(ACTION_TYPES);
export const AccessBarrierSchema = z.enum(ACCESS_BARRIERS);
export const KatActionKindSchema = z.enum(KAT_ACTION_KINDS);

export const SafetyFlagSchema = z.object({
  level: z.enum(SAFETY_FLAG_LEVELS),
  message: z.string(),
});

// ---------------------------------------------------------------------------
// Domain mirrors
// ---------------------------------------------------------------------------

export const SourceRefSchema = z.object({
  documentId: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  quote: z.string(),
  sectionId: z.string().optional(),
});

export const SourceVerificationSchema = z.enum(["verified", "unverified", "not_applicable"]);

export const ExtractedInstructionSchema = z.object({
  description: z.string(),
  type: ActionTypeSchema,
  sourceRef: SourceRefSchema.optional(),
  sourceVerification: SourceVerificationSchema,
  dueDate: z.string().optional(),
});

export const TermDefinitionSchema = z.object({
  term: z.string(),
  definition: z.string(),
  sourceRef: SourceRefSchema.optional(),
  referenceIds: z.array(z.string()),
});

/** DocumentInterpretation without `meta` (meta is always built server-side). */
export const DocumentInterpretationSchema = z.object({
  documentId: z.string(),
  patientId: z.string(),
  whatThisMeans: z.string(),
  terms: z.array(TermDefinitionSchema),
  whatToKnow: z.array(z.string()),
  discussWithProvider: z.array(z.string()),
  instructions: z.array(ExtractedInstructionSchema),
  unansweredQuestions: z.array(z.string()),
  limitations: z.array(z.string()),
  safetyFlags: z.array(SafetyFlagSchema),
  referenceIds: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Model-facing output schemas
// ---------------------------------------------------------------------------

export const ModelInstructionSchema = z.object({
  description: z
    .string()
    .describe("Plain-language restatement of one clinician-documented instruction."),
  type: ActionTypeSchema,
  sourceQuote: z
    .string()
    .describe("Exact, verbatim, contiguous text copied from the document that states this instruction."),
  dueDate: z
    .string()
    .nullable()
    .describe("Only if the document states an explicit date: YYYY-MM-DD. Otherwise null."),
});

export const ModelTermSchema = z.object({
  term: z.string(),
  definition: z.string().describe("Plain-language definition at the patient's explanation level."),
  sourceQuote: z
    .string()
    .nullable()
    .describe("The term exactly as it appears in the document, or null if it does not appear."),
  referenceIds: z.array(z.string()).describe("Only ids from the provided evidence list."),
});

/** What Claude returns for document interpretation; ids/meta/offsets are added server-side. */
export const ModelDocumentInterpretationSchema = z.object({
  whatThisMeans: z.string(),
  terms: z.array(ModelTermSchema),
  whatToKnow: z.array(z.string()),
  discussWithProvider: z.array(z.string()),
  instructions: z.array(ModelInstructionSchema),
  unansweredQuestions: z.array(z.string()),
  limitations: z.array(z.string()),
  safetyFlags: z.array(SafetyFlagSchema),
  referenceIds: z.array(z.string()),
});

export const KatSuggestedActionSchema = z.object({
  kind: KatActionKindSchema,
  label: z.string().describe("Short button label in the patient's language."),
  questionText: z
    .string()
    .nullable()
    .describe("For add_question: the question to save. Otherwise null."),
  sourceQuote: z
    .string()
    .nullable()
    .describe("For view_source: exact verbatim text from the document. Otherwise null."),
});

export const KatReplySchema = z.object({
  content: z.string().describe("Kat's reply to the patient, in plain language."),
  referenceIds: z.array(z.string()).describe("Only ids from the provided evidence list."),
  sourceQuotes: z
    .array(z.string())
    .describe("Exact verbatim passages from the document that support the reply."),
  suggestedActions: z.array(KatSuggestedActionSchema),
  limitations: z
    .array(z.string())
    .describe("What the documents and references do not say about this question."),
});

export const TeachBackClarificationSchema = z.object({
  misunderstanding: z
    .string()
    .describe("Neutral, non-judgmental description of what seems to be unclear."),
  clarification: z
    .string()
    .describe("A different, plain-language re-explanation grounded only in the document."),
});

export const BarrierSuggestionSchema = z.object({
  description: z
    .string()
    .describe("Phrased as a question the patient could ask their clinic. Never assumes availability."),
  type: z.enum(["administrative", "question_for_provider"]),
  addressesBarrier: AccessBarrierSchema,
  rationale: z.string(),
});

export const ActionPlanSuggestionsSchema = z.object({
  suggestions: z.array(BarrierSuggestionSchema),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ModelInstruction = z.infer<typeof ModelInstructionSchema>;
export type ModelTerm = z.infer<typeof ModelTermSchema>;
export type ModelDocumentInterpretation = z.infer<typeof ModelDocumentInterpretationSchema>;
export type KatSuggestedAction = z.infer<typeof KatSuggestedActionSchema>;
export type KatReply = z.infer<typeof KatReplySchema>;
export type TeachBackClarification = z.infer<typeof TeachBackClarificationSchema>;
export type BarrierSuggestion = z.infer<typeof BarrierSuggestionSchema>;
export type ActionPlanSuggestions = z.infer<typeof ActionPlanSuggestionsSchema>;
export type DocumentInterpretationData = z.infer<typeof DocumentInterpretationSchema>;
