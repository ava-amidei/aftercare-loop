/**
 * Reproducible evaluation runner: `npm run eval` (from aftercare-loop-app/).
 *
 * Runs the instruction-extraction, citation-validity, safety and comprehension
 * suites over the synthetic fixtures and writes eval-results/latest.json plus
 * eval-results/<runId>.json (EvalRun). Mode follows getAiMode(): without
 * ANTHROPIC_API_KEY (or with AFTERCARE_FORCE_SCRIPTED=true) everything is
 * deterministic and no network call is made.
 *
 * Logging: only ids, counts and metric values — never document text or prompts.
 */
import { runDefaultEvaluation } from "../src/lib/eval/defaults";
import { defaultResultsDir, writeEvalRun } from "../src/lib/eval/io";
import type { EvalMetric, EvalRun } from "../src/lib/types";

function fmt(m: EvalMetric): string {
  if (m.value === null) return `${m.name}: Not evaluated`;
  if (m.unit === "ratio") return `${m.name}: ${m.numerator}/${m.denominator} = ${(m.value * 100).toFixed(1)}%`;
  return `${m.name}: ${m.value}${m.denominator !== null ? ` (of ${m.denominator})` : ""}`;
}

function summarize(run: EvalRun): string {
  const lines = [
    `Run ${run.runId} — suite ${run.suiteVersion}, mode ${run.mode}, kind ${run.kind}${run.modelId ? `, model ${run.modelId}` : ""}`,
    `${run.caseCount} cases, ${run.cases.filter((c) => !c.passed).length} not passed, ${run.errors.length} errors`,
  ];
  for (const [suite, metrics] of Object.entries(run.metrics)) {
    lines.push(`\n[${suite}]`, ...metrics.map((m) => `  ${fmt(m)}`));
  }
  if (run.errors.length) lines.push("\n[errors]", ...run.errors.map((e) => `  ${e}`));
  return lines.join("\n");
}

async function main(): Promise<void> {
  const run = await runDefaultEvaluation();
  const { latest, archived } = await writeEvalRun(run, defaultResultsDir());
  console.log(summarize(run));
  console.log(`\nWrote ${latest}\nWrote ${archived}`);
  console.log("Limited synthetic evaluation on fictional data — not clinical validation.");
}

main().catch((err: unknown) => {
  console.error("Evaluation failed:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
