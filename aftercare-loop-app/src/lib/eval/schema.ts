/** zod schema mirroring `EvalRun` from @/lib/types; used by tests and the /api/eval/latest route. */
import { z } from "zod";
import type { EvalRun } from "@/lib/types";

export const EvalSuiteSchema = z.enum(["instruction_extraction", "citation_validity", "safety", "comprehension"]);

export const EvalMetricSchema = z.object({
  name: z.string().min(1),
  numerator: z.number().nullable(),
  denominator: z.number().nullable(),
  value: z.number().nullable(),
  unit: z.enum(["ratio", "count"]),
});

export const ConfusionMatrixSchema = z.object({
  truePositives: z.number().int().nonnegative(),
  falsePositives: z.number().int().nonnegative(),
  falseNegatives: z.number().int().nonnegative(),
  trueNegatives: z.number().int().nonnegative().optional(),
});

export const EvalCaseResultSchema = z.object({
  caseId: z.string().min(1),
  suite: EvalSuiteSchema,
  passed: z.boolean(),
  details: z.string(),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
});

export const EvalRunSchema = z.object({
  runId: z.string().min(1),
  suiteVersion: z.string().min(1),
  timestamp: z.string().datetime(),
  mode: z.enum(["live_claude", "live_gemini", "scripted_demo"]),
  modelId: z.string().optional(),
  kind: z.enum(["deterministic_synthetic", "model_based", "human_reviewed"]),
  caseCount: z.number().int().nonnegative(),
  metrics: z.object({
    instruction_extraction: z.array(EvalMetricSchema),
    citation_validity: z.array(EvalMetricSchema),
    safety: z.array(EvalMetricSchema),
    comprehension: z.array(EvalMetricSchema),
  }),
  confusion: z
    .object({
      instruction_extraction: ConfusionMatrixSchema.optional(),
      citation_validity: ConfusionMatrixSchema.optional(),
      safety: ConfusionMatrixSchema.optional(),
      comprehension: ConfusionMatrixSchema.optional(),
    })
    .optional(),
  cases: z.array(EvalCaseResultSchema),
  errors: z.array(z.string()),
  /**
   * true when a model-based run stopped early (time budget) and some cases were
   * not executed. Absent on complete runs. Not part of the shared EvalRun type.
   */
  partial: z.boolean().optional(),
});

/** An EvalRun as stored on disk (adds the optional `partial` marker). */
export type StoredEvalRun = z.infer<typeof EvalRunSchema>;

// Compile-time check that the schema output stays assignable to the shared type.
type _SchemaMatchesType = z.infer<typeof EvalRunSchema> extends EvalRun ? true : never;
export const _schemaMatchesType: _SchemaMatchesType = true;
