/**
 * POST /api/action-plan
 * Body: { patientId, documentId, interpretation, existing, profile?, document? }
 * → { actions: ActionItem[] }
 *
 * Deterministic (no model call). Source refs are re-verified server-side against
 * the document text; client-claimed verification is never trusted. `profile`
 * and `document` fall back to the synthetic fixtures when omitted (pasted
 * documents must be sent in the body because the demo has no server storage).
 */
import { z } from "zod/v4";
import type { ActionItem, PatientProfile, VisitDocument } from "@/lib/types";
import { ACCESS_BARRIERS, ACTION_TYPES, ExtractedInstructionSchema, SourceRefSchema } from "@/lib/ai/schemas";
import { getDocument, getPatient } from "@/data/patients";
import { buildActionPlan } from "@/lib/services/action-plan";
import { RouteError, withJsonBody } from "../_lib/handler";

const MAX_ITEMS = 200;
const str = (max: number) => z.string().max(max);

const InterpretationBodySchema = z.object({
  documentId: str(200),
  patientId: str(200),
  instructions: z.array(ExtractedInstructionSchema).max(MAX_ITEMS),
  discussWithProvider: z.array(str(1000)).max(MAX_ITEMS),
});

const ReminderSchema = z.object({ at: str(64), label: str(500), dismissed: z.boolean() });

const ActionItemSchema = z.object({
  id: str(200),
  patientId: str(200),
  documentId: str(200).optional(),
  description: str(2000),
  type: z.enum(ACTION_TYPES),
  category: z.enum(["care_plan", "wellness_goal", "provider_question"]),
  origin: z.enum(["clinician_documented", "patient_selected", "ai_suggested"]),
  sourceRef: SourceRefSchema.optional(),
  sourceVerification: z.enum(["verified", "unverified", "not_applicable"]),
  dueDate: str(64).optional(),
  reminder: ReminderSchema.optional(),
  status: z.enum(["pending", "completed", "needs_clarification"]),
  rationale: str(2000),
  addressesBarrier: z.enum(ACCESS_BARRIERS).optional(),
  createdAt: str(64),
  updatedAt: str(64),
});

const ProfileSchema = z.object({
  id: str(200),
  displayName: str(200),
  ageRange: str(50),
  language: z.enum(["en", "es"]),
  explanationLevel: z.enum(["simple", "standard", "detailed"]),
  accessibility: z.array(z.enum(["larger_text", "high_contrast", "reduced_motion", "screen_reader"])).max(10),
  conditions: z.array(str(200)).max(50),
  medications: z
    .array(
      z.object({
        name: str(200),
        dose: str(200).optional(),
        frequency: str(200).optional(),
        documentedPurpose: str(500).optional(),
      }),
    )
    .max(50),
  careInstructions: z.array(str(1000)).max(50),
  healthGoals: z.array(str(500)).max(50),
  barriers: z.array(z.enum(ACCESS_BARRIERS)).max(10),
  pregnancyOrPostpartumContext: str(500).optional(),
  scenarioSummary: str(500),
});

const DocumentSchema = z.object({
  id: str(200),
  patientId: str(200),
  title: str(300),
  text: str(20_000),
  sections: z
    .array(
      z.object({
        id: str(200),
        heading: str(300),
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
      }),
    )
    .max(100)
    .optional(),
  createdAt: str(64),
  source: z.enum(["fixture", "pasted", "uploaded_txt"]),
});

const ActionPlanBodySchema = z.object({
  patientId: str(200).min(1),
  documentId: str(200).min(1),
  interpretation: InterpretationBodySchema.nullable().optional(),
  existing: z.array(ActionItemSchema).max(MAX_ITEMS).default([]),
  profile: ProfileSchema.optional(),
  document: DocumentSchema.optional(),
});

export const POST = withJsonBody(
  ActionPlanBodySchema,
  (body): { actions: ActionItem[] } => {
    // Fixture documents are authoritative: a client cannot substitute their text.
    const fixtureDoc = getDocument(body.documentId);
    const document: VisitDocument | undefined = fixtureDoc ?? (body.document as VisitDocument | undefined);
    if (!document || document.id !== body.documentId) {
      throw new RouteError(404, "Document not found.");
    }
    if (document.patientId !== body.patientId) {
      throw new RouteError(400, "Document does not belong to this patient.");
    }
    const profile: PatientProfile | undefined =
      (body.profile as PatientProfile | undefined) ?? getPatient(body.patientId);
    if (!profile || profile.id !== body.patientId) {
      throw new RouteError(404, "Patient not found.");
    }
    const interpretation = body.interpretation ?? null;
    if (interpretation && (interpretation.documentId !== document.id || interpretation.patientId !== profile.id)) {
      throw new RouteError(400, "Interpretation does not match this document.");
    }
    const actions = buildActionPlan({
      profile,
      interpretation,
      document,
      existing: body.existing as ActionItem[],
    });
    return { actions };
  },
  { route: "action-plan" },
);
