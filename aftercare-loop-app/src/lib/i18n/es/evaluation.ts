/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { evaluation as en } from "../en/evaluation";

export const evaluation = {
  "evaluation.title": "Evaluación",
  "evaluation.subtitle": "Resultados de pruebas automatizadas con escenarios sintéticos y ficticios.",
  "evaluation.notEvaluated": "Sin evaluar",
  "evaluation.limitation":
    "Son evaluaciones limitadas con datos sintéticos. No constituyen una validación clínica ni muestran resultados en el mundo real.",
  "evaluation.noRun": "Todavía no hay resultados de evaluación. Ejecute «npm run eval» para generarlos.",
  "evaluation.loadError": "No pudimos cargar los resultados de la evaluación.",
  "evaluation.fraction": "{numerator} de {denominator}",

  "evaluation.suite.instruction_extraction": "Extracción de indicaciones",
  "evaluation.suite.citation_validity": "Validez de las citas",
  "evaluation.suite.safety": "Seguridad",
  "evaluation.suite.comprehension": "Comprensión",

  "evaluation.kind.deterministic_synthetic": "Pruebas automatizadas deterministas (datos sintéticos)",
  "evaluation.kind.model_based": "Pruebas basadas en el modelo",
  "evaluation.kind.human_reviewed": "Revisado por personas",

  "evaluation.run.suiteVersion": "Versión de las pruebas",
  "evaluation.run.timestamp": "Fecha de ejecución",
  "evaluation.run.mode": "Modo",
  "evaluation.run.model": "Modelo",
  "evaluation.run.modelNone": "Ninguno (modo con guion)",
  "evaluation.run.caseCount": "Casos",
  "evaluation.run.errors": "Errores",
  "evaluation.run.noErrors": "Sin errores",

  "evaluation.metric.truePositives": "Verdaderos positivos",
  "evaluation.metric.falsePositives": "Falsos positivos",
  "evaluation.metric.falseNegatives": "Falsos negativos",
  "evaluation.metric.trueNegatives": "Verdaderos negativos",
  "evaluation.metric.precision": "Precisión",
  "evaluation.metric.recall": "Exhaustividad (recall)",
  "evaluation.metric.f1": "Puntuación F1",
  "evaluation.metric.verifiedCitations": "Citas verificadas",
  "evaluation.metric.invalidCitations": "Citas no válidas",
  "evaluation.metric.rate": "Tasa",
  "evaluation.metric.total": "Total",
  "evaluation.metric.passed": "Aprobadas",
  "evaluation.metric.failed": "No aprobadas",
  "evaluation.metric.totalQuestions": "Total de preguntas",
  "evaluation.metric.initialCorrect": "Correctas al primer intento",
  "evaluation.metric.correctAfterClarification": "Correctas después de la aclaración",
  "evaluation.metric.misunderstandingsIdentified": "Malentendidos identificados",
  "evaluation.metric.unsuccessfulClarifications": "Aclaraciones sin éxito",

  "evaluation.confusionMatrix": "Matriz de confusión",
  "evaluation.failureDetails": "Detalle de los fallos",
  "evaluation.cases": "Resultados individuales",
  "evaluation.case.passed": "Aprobado",
  "evaluation.case.failed": "No aprobado",
  "evaluation.case.expected": "Esperado",
  "evaluation.case.actual": "Obtenido",
} satisfies FeatureTranslation<typeof en>;
