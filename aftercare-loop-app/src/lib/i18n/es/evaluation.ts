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
  "evaluation.loadErrorDetail": "Compruebe que el servidor de la aplicación esté en marcha e inténtelo de nuevo.",
  "evaluation.loading": "Cargando los resultados de la evaluación…",
  "evaluation.reload": "Volver a cargar",
  "evaluation.fraction": "{numerator} de {denominator}",

  "evaluation.notEvaluated.title": "Sin evaluar — ejecute npm run eval",
  "evaluation.notEvaluated.body":
    "Todavía no se ha registrado ninguna evaluación. Desde la carpeta aftercare-loop-app, ejecute:",
  "evaluation.notEvaluated.after":
    "Después, vuelva a cargar esta página. Los resultados se guardan en eval-results/latest.json.",

  "evaluation.disclaimer.title": "Evaluación sintética limitada",
  "evaluation.disclaimer.text":
    "Pruebas automatizadas con casos sintéticos. No es una validación clínica. Sin usuarios reales. No demuestra resultados de salud en el mundo real.",
  "evaluation.evidence.title": "Qué tipo de evidencia es esta",
  "evaluation.evidence.type": "Tipo de evidencia",
  "evaluation.evidence.status": "Estado",
  "evaluation.evidence.automated": "Pruebas automatizadas con casos sintéticos",
  "evaluation.evidence.humanReviewed": "Resultados revisados por personas",
  "evaluation.evidence.userTesting": "Pruebas con usuarios reales",
  "evaluation.evidence.projections": "Proyecciones o resultados en el mundo real",
  "evaluation.evidence.thisRun": "Esta ejecución",
  "evaluation.evidence.noneYet": "Ninguno todavía",
  "evaluation.evidence.noneClaimed": "No se afirma ninguno",

  "evaluation.suite.instruction_extraction": "Extracción de indicaciones",
  "evaluation.suite.citation_validity": "Validez de las citas",
  "evaluation.suite.safety": "Seguridad",
  "evaluation.suite.comprehension": "Comprensión",

  "evaluation.suiteDescription.instruction_extraction":
    "Indicaciones extraídas de cada resumen de visita ficticio, comparadas con la referencia documentada.",
  "evaluation.suiteDescription.citation_validity":
    "Si cada cita de la fuente verificada coincide con el texto del documento en la posición indicada.",
  "evaluation.suiteDescription.safety":
    "Si las reglas de seguridad deterministas reconocen escenarios urgentes predefinidos sin escalar mensajes que no lo son.",
  "evaluation.suiteDescription.comprehension":
    "Si la puntuación de comprobación acepta las respuestas correctas, detecta una respuesta incorrecta simulada y si la aclaración lleva a un nuevo intento correcto.",

  "evaluation.kind.deterministic_synthetic": "Pruebas automatizadas deterministas (datos sintéticos)",
  "evaluation.kind.model_based": "Pruebas basadas en el modelo",
  "evaluation.kind.human_reviewed": "Revisado por personas",

  "evaluation.run.title": "Detalles de la ejecución",
  "evaluation.run.runId": "ID de ejecución",
  "evaluation.run.kind": "Tipo",
  "evaluation.run.suiteVersion": "Versión de las pruebas",
  "evaluation.run.timestamp": "Fecha de ejecución",
  "evaluation.run.mode": "Modo",
  "evaluation.run.model": "Modelo",
  "evaluation.run.modelNone": "n/d (con guion)",
  "evaluation.run.caseCount": "Casos",
  "evaluation.run.passedSummary": "{passed} aprobados, {failed} no aprobados",
  "evaluation.run.errors": "Errores",
  "evaluation.run.noErrors": "Sin errores",
  "evaluation.run.errorsTitle": "Errores registrados durante esta ejecución",

  "evaluation.metrics.title": "Resultados por conjunto de pruebas",
  "evaluation.table.metric": "Métrica",
  "evaluation.table.result": "Resultado",
  "evaluation.table.counts": "Numerador / denominador",

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

  "evaluation.metricName.patientsEvaluated": "Pacientes evaluadas",
  "evaluation.metricName.optionalExtracted": "Indicaciones opcionales extraídas (no cuentan como falsos positivos)",
  "evaluation.metricName.verifiedChecked": "Citas verificadas revisadas",
  "evaluation.metricName.validCitations": "Citas válidas",
  "evaluation.metricName.citationRate": "Tasa de validez de las citas",
  "evaluation.metricName.unverifiedRouted": "Indicaciones no verificadas (enviadas a «Necesita aclaración»)",
  "evaluation.metricName.safetyEvaluated": "Casos de seguridad evaluados",
  "evaluation.metricName.passRate": "Tasa de aprobación",
  "evaluation.metricName.noEmergencyMissed": "Ninguna emergencia omitida (emergencia esperada → emergencia detectada)",
  "evaluation.metricName.noFalseEscalation": "Mensajes sin emergencia que no se escalaron como emergencia",
  "evaluation.metricName.initialCorrect": "Correctas inicialmente (respuesta esperada y todas las variantes aceptadas)",
  "evaluation.metricName.variationsCorrect": "Variantes aceptadas calificadas como correctas",
  "evaluation.metricName.wrongAnswersCaught": "Respuestas incorrectas calificadas como incorrectas",

  "evaluation.confusionMatrix": "Matriz de confusión",
  "evaluation.confusion.caption.instruction_extraction": "Positivo = una indicación documentada en el resumen de la visita.",
  "evaluation.confusion.caption.safety": "Positivo = un escenario de emergencia predefinido.",
  "evaluation.confusion.caption.default": "Recuentos de esta ejecución.",
  "evaluation.confusion.expected": "Esperado",
  "evaluation.confusion.expectedPositive": "Positivo",
  "evaluation.confusion.expectedNegative": "Negativo",
  "evaluation.confusion.detected": "Detectado",
  "evaluation.confusion.notDetected": "No detectado",
  "evaluation.confusion.na": "n/d",
  "evaluation.confusion.naHint": "n/d = los verdaderos negativos no están definidos para este conjunto.",
  "evaluation.groundTruthNote": "Referencia = indicaciones documentadas en cada resumen de visita ficticio.",

  "evaluation.failureDetails": "Detalle de los fallos",
  "evaluation.failures.count": "Detalle de los fallos ({count})",
  "evaluation.failures.none": "No hubo casos fallidos en esta ejecución.",

  "evaluation.cases": "Resultados individuales",
  "evaluation.cases.filterSuite": "Conjunto",
  "evaluation.cases.filterStatus": "Resultado",
  "evaluation.cases.allSuites": "Todos los conjuntos",
  "evaluation.cases.allResults": "Todos los resultados",
  "evaluation.cases.onlyPassed": "Solo aprobados",
  "evaluation.cases.onlyFailed": "Solo no aprobados",
  "evaluation.cases.showing": "Se muestran {shown} de {total} casos",
  "evaluation.cases.empty": "Ningún caso coincide con estos filtros.",
  "evaluation.cases.none": "Esta ejecución no tiene resultados individuales.",
  "evaluation.case.id": "Caso",
  "evaluation.case.suite": "Conjunto",
  "evaluation.case.result": "Resultado",
  "evaluation.case.details": "Detalles",
  "evaluation.case.showPayload": "Esperado y obtenido",
  "evaluation.case.passed": "Aprobado",
  "evaluation.case.failed": "No aprobado",
  "evaluation.case.expected": "Esperado",
  "evaluation.case.actual": "Obtenido",
  "evaluation.honesty.label": "Qué mide esto",
  "evaluation.honesty.instruction_extraction":
    "Los pacientes con guion usan instrucciones predefinidas, así que sus resultados coinciden por construcción. Solo los pacientes con extracción heurística (sin respuesta con guion) miden la extracción.",
  "evaluation.honesty.citation_validity":
    "Esto comprueba el proceso de verificación de fuentes (cada cita debe ser igual al texto del documento en su posición), no la precisión de las citas de un modelo.",
  "evaluation.honesty.comprehension":
    "Respuestas simuladas tomadas del registro de la pregunta (variantes aceptadas y opciones incorrectas), no respuestas de pacientes reales.",
  "evaluation.card.runLine": "Ejecución {runId} · pruebas {suiteVersion} · {kind}",

  "evaluation.runs.title": "Ejecuciones registradas",
  "evaluation.runs.scripted.title": "Ejecución con guion (determinista, sin llamadas al modelo)",
  "evaluation.runs.scripted.file": "De eval-results/latest.json, generado con npm run eval.",
  "evaluation.runs.scripted.missing": "Todavía no hay una ejecución con guion. Ejecute npm run eval.",
  "evaluation.runs.live.title": "Ejecución basada en el modelo (proveedor en vivo)",
  "evaluation.runs.live.file": "De eval-results/latest-live.json, generado con npm run eval -- --mode live --out latest-live.json.",
  "evaluation.runs.live.missing": "Todavía no se ha registrado una ejecución basada en el modelo.",
  "evaluation.runs.live.notModel":
    "Ninguna extracción de este archivo provino del modelo en vivo, así que se registra como ejecución determinista.",
  "evaluation.runs.liveSources": "Origen de la extracción por paciente: {live} del modelo en vivo, {fallback} con el extractor heurístico de respaldo, {skipped} sin ejecutar.",
  "evaluation.runs.partial":
    "Ejecución parcial: se agotó el tiempo antes de ejecutar todos los casos. Los casos que no se ejecutaron aparecen como sin evaluar.",
  "evaluation.results.label": "Mostrar resultados de",
  "evaluation.results.scripted": "Ejecución con guion",
  "evaluation.results.live": "Ejecución basada en el modelo",
} satisfies FeatureTranslation<typeof en>;
