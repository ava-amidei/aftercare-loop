import type { Namespaced } from "../types";

export const evaluation = {
  "evaluation.title": "Evaluation",
  "evaluation.subtitle": "Results from automated tests on fictional, synthetic scenarios.",
  "evaluation.notEvaluated": "Not evaluated",
  "evaluation.limitation":
    "These are limited evaluations on synthetic data. They are not clinical validation and do not show real-world outcomes.",
  "evaluation.noRun": "No evaluation results yet. Run “npm run eval” to generate them.",
  "evaluation.loadError": "We couldn't load the evaluation results.",
  "evaluation.loadErrorDetail": "Check that the app server is running, then try again.",
  "evaluation.loading": "Loading evaluation results…",
  "evaluation.reload": "Reload results",
  "evaluation.fraction": "{numerator} of {denominator}",

  // Not-evaluated (404) state
  "evaluation.notEvaluated.title": "Not evaluated — run npm run eval",
  "evaluation.notEvaluated.body": "No evaluation run has been recorded yet. From the aftercare-loop-app folder, run:",
  "evaluation.notEvaluated.after": "Then reload this page. Results are written to eval-results/latest.json.",

  // Disclaimers (SPEC §9, §12.8)
  "evaluation.disclaimer.title": "Limited synthetic evaluation",
  "evaluation.disclaimer.text":
    "Automated synthetic-case tests. Not clinical validation. No real users. Does not establish real-world health outcomes.",
  "evaluation.evidence.title": "What kind of evidence this is",
  "evaluation.evidence.type": "Evidence type",
  "evaluation.evidence.status": "Status",
  "evaluation.evidence.automated": "Automated tests on synthetic cases",
  "evaluation.evidence.humanReviewed": "Human-reviewed results",
  "evaluation.evidence.userTesting": "Genuine user testing",
  "evaluation.evidence.projections": "Projections or real-world outcomes",
  "evaluation.evidence.thisRun": "This run",
  "evaluation.evidence.noneYet": "None yet",
  "evaluation.evidence.noneClaimed": "None claimed",

  "evaluation.suite.instruction_extraction": "Instruction extraction",
  "evaluation.suite.citation_validity": "Citation validity",
  "evaluation.suite.safety": "Safety",
  "evaluation.suite.comprehension": "Comprehension",

  "evaluation.suiteDescription.instruction_extraction":
    "Instructions extracted from each fictional visit summary, compared with the documented ground truth.",
  "evaluation.suiteDescription.citation_validity":
    "Whether each verified source quote matches the document text at its stated location.",
  "evaluation.suiteDescription.safety":
    "Whether the deterministic safety rules recognize predefined urgent scenarios without escalating benign messages.",
  "evaluation.suiteDescription.comprehension":
    "Whether teach-back scoring accepts correct answers, catches a simulated wrong answer, and the clarification leads to a correct retry.",

  "evaluation.kind.deterministic_synthetic": "Automated deterministic tests (synthetic data)",
  "evaluation.kind.model_based": "Model-based tests",
  "evaluation.kind.human_reviewed": "Human-reviewed",

  "evaluation.run.title": "Run details",
  "evaluation.run.runId": "Run ID",
  "evaluation.run.kind": "Kind",
  "evaluation.run.suiteVersion": "Suite version",
  "evaluation.run.timestamp": "Run at",
  "evaluation.run.mode": "Mode",
  "evaluation.run.model": "Model",
  "evaluation.run.modelNone": "n/a (scripted)",
  "evaluation.run.caseCount": "Cases",
  "evaluation.run.passedSummary": "{passed} passed, {failed} not passed",
  "evaluation.run.errors": "Errors",
  "evaluation.run.noErrors": "No errors",
  "evaluation.run.errorsTitle": "Errors recorded during this run",

  "evaluation.metrics.title": "Results by suite",
  "evaluation.table.metric": "Metric",
  "evaluation.table.result": "Result",
  "evaluation.table.counts": "Numerator / denominator",

  "evaluation.metric.truePositives": "True positives",
  "evaluation.metric.falsePositives": "False positives",
  "evaluation.metric.falseNegatives": "False negatives",
  "evaluation.metric.trueNegatives": "True negatives",
  "evaluation.metric.precision": "Precision",
  "evaluation.metric.recall": "Recall",
  "evaluation.metric.f1": "F1 score",
  "evaluation.metric.verifiedCitations": "Verified citations",
  "evaluation.metric.invalidCitations": "Invalid citations",
  "evaluation.metric.rate": "Rate",
  "evaluation.metric.total": "Total",
  "evaluation.metric.passed": "Passed",
  "evaluation.metric.failed": "Failed",
  "evaluation.metric.totalQuestions": "Total questions",
  "evaluation.metric.initialCorrect": "Correct on first try",
  "evaluation.metric.correctAfterClarification": "Correct after clarification",
  "evaluation.metric.misunderstandingsIdentified": "Misunderstandings identified",
  "evaluation.metric.unsuccessfulClarifications": "Unsuccessful clarifications",

  // Labels for the exact metric names written by src/lib/eval (see components/evaluation/format.ts).
  "evaluation.metricName.patientsEvaluated": "Patients evaluated",
  "evaluation.metricName.optionalExtracted": "Optional instructions extracted (not counted as false positives)",
  "evaluation.metricName.verifiedChecked": "Verified citations checked",
  "evaluation.metricName.validCitations": "Valid citations",
  "evaluation.metricName.citationRate": "Citation validity rate",
  "evaluation.metricName.unverifiedRouted": "Unverified instructions (sent to Needs clarification)",
  "evaluation.metricName.safetyEvaluated": "Safety cases evaluated",
  "evaluation.metricName.passRate": "Pass rate",
  "evaluation.metricName.noEmergencyMissed": "No emergency missed (expected emergency → detected emergency)",
  "evaluation.metricName.noFalseEscalation": "Non-emergency inputs not escalated to emergency",
  "evaluation.metricName.initialCorrect": "Initial correct (expected answer and all accepted variations)",
  "evaluation.metricName.variationsCorrect": "Accepted variations scored correct",
  "evaluation.metricName.wrongAnswersCaught": "Wrong answers scored incorrect",

  "evaluation.confusionMatrix": "Confusion matrix",
  "evaluation.confusion.caption.instruction_extraction": "Positive = an instruction documented in the visit summary.",
  "evaluation.confusion.caption.safety": "Positive = a predefined emergency scenario.",
  "evaluation.confusion.caption.default": "Counts from this run.",
  "evaluation.confusion.expected": "Expected",
  "evaluation.confusion.expectedPositive": "Positive",
  "evaluation.confusion.expectedNegative": "Negative",
  "evaluation.confusion.detected": "Detected",
  "evaluation.confusion.notDetected": "Not detected",
  "evaluation.confusion.na": "n/a",
  "evaluation.confusion.naHint": "n/a = true negatives are not defined for this suite.",
  "evaluation.groundTruthNote": "Ground truth = instructions documented in each fictional visit summary.",

  "evaluation.failureDetails": "Failure details",
  "evaluation.failures.count": "Failure details ({count})",
  "evaluation.failures.none": "No failed cases in this run.",

  "evaluation.cases": "Individual results",
  "evaluation.cases.filterSuite": "Suite",
  "evaluation.cases.filterStatus": "Result",
  "evaluation.cases.allSuites": "All suites",
  "evaluation.cases.allResults": "All results",
  "evaluation.cases.onlyPassed": "Passed only",
  "evaluation.cases.onlyFailed": "Failed only",
  "evaluation.cases.showing": "Showing {shown} of {total} cases",
  "evaluation.cases.empty": "No cases match these filters.",
  "evaluation.cases.none": "This run has no individual case results.",
  "evaluation.case.id": "Case",
  "evaluation.case.suite": "Suite",
  "evaluation.case.result": "Result",
  "evaluation.case.details": "Details",
  "evaluation.case.showPayload": "Expected and actual",
  "evaluation.case.passed": "Passed",
  "evaluation.case.failed": "Failed",
  "evaluation.case.expected": "Expected",
  "evaluation.case.actual": "Actual",
  // Honesty captions (VALIDATION-REPORT fix 4): what each suite really measures in this run.
  "evaluation.honesty.label": "What this measures",
  "evaluation.honesty.instruction_extraction":
    "Scripted patients use predefined instructions, so their results match by construction. Only heuristic-extracted patients (no scripted response) measure extraction.",
  "evaluation.honesty.citation_validity":
    "This checks the source-verification pipeline (each quote must equal the document text at its offsets), not a model's citation accuracy.",
  "evaluation.honesty.comprehension":
    "Simulated answers taken from the question record (accepted variations and wrong choices), not answers from real patients.",
  "evaluation.card.runLine": "Run {runId} · suite {suiteVersion} · {kind}",

  // Scripted vs model-based runs (VALIDATION-REPORT fix 10)
  "evaluation.runs.title": "Runs on record",
  "evaluation.runs.scripted.title": "Scripted run (deterministic, no model calls)",
  "evaluation.runs.scripted.file": "From eval-results/latest.json, written by npm run eval.",
  "evaluation.runs.scripted.missing": "No scripted run has been recorded yet. Run npm run eval.",
  "evaluation.runs.live.title": "Model-based run (live provider)",
  "evaluation.runs.live.file": "From eval-results/latest-live.json, written by npm run eval -- --mode live --out latest-live.json.",
  "evaluation.runs.live.missing": "No model-based run has been recorded yet.",
  "evaluation.runs.live.notModel":
    "No extraction in this file came from the live model, so it is recorded as a deterministic run.",
  "evaluation.runs.liveSources": "Extraction source per patient: {live} from the live model, {fallback} fell back to the heuristic extractor, {skipped} not run.",
  "evaluation.runs.partial":
    "Partial run: the time budget ran out before every case was executed. Cases that did not run are shown as not evaluated.",
  "evaluation.results.label": "Show results for",
  "evaluation.results.scripted": "Scripted run",
  "evaluation.results.live": "Model-based run",
} satisfies Namespaced<"evaluation">;
