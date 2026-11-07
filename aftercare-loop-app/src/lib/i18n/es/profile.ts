/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { profile as en } from "../en/profile";

export const profile = {
  "profile.title": "Mi perfil de salud",
  "profile.subtitle": "Todos los campos son opcionales. Puede cambiar cualquier dato en cualquier momento.",
  "profile.privacyNote": "Esta demostración guarda los datos ficticios solo en este navegador.",
  "profile.saved": "Perfil guardado.",

  "profile.section.about": "Sobre mí",
  "profile.section.preferences": "Cómo prefiero recibir la información",
  "profile.section.health": "Mi salud",
  "profile.section.access": "Acceso a la atención médica",

  "profile.field.displayName": "Nombre (ficticio)",
  "profile.field.ageRange": "Rango de edad",
  "profile.field.language": "Idioma preferido",
  "profile.field.explanationLevel": "¿Cuánto detalle prefiere?",
  "profile.field.accessibility": "Preferencias de accesibilidad",
  "profile.field.conditions": "Condiciones o inquietudes",
  "profile.field.conditionsHint": "Elija de la lista o escriba la suya.",
  "profile.field.conditionsPlaceholder": "Escriba una condición o inquietud",
  "profile.field.medications": "Medicamentos",
  "profile.field.careInstructions": "Indicaciones de cuidado de mi profesional de salud",
  "profile.field.healthGoals": "Mis metas de salud",
  "profile.field.healthGoalsPlaceholder": "Escriba una meta",
  "profile.field.barriers": "¿Hay algo que le dificulte recibir atención médica?",
  "profile.field.barriersHint":
    "Esto ayuda a Kat a sugerirle preguntas para su clínica. Nunca se usa para suponer nada sobre su salud.",
  "profile.field.pregnancy": "Contexto de embarazo o posparto",
  "profile.field.pregnancyHint": "Agréguelo solo si aplica a su caso. Aftercare Loop nunca lo supone.",

  "profile.level.simple": "Sencillo",
  "profile.level.simpleHint": "Frases cortas y palabras de uso diario",
  "profile.level.standard": "Estándar",
  "profile.level.standardHint": "Lenguaje claro con un poco más de detalle",
  "profile.level.detailed": "Detallado",
  "profile.level.detailedHint": "Más contexto y explicación de términos médicos",

  "profile.accessibility.larger_text": "Texto más grande",
  "profile.accessibility.high_contrast": "Alto contraste",
  "profile.accessibility.reduced_motion": "Menos movimiento",
  "profile.accessibility.screen_reader": "Compatible con lector de pantalla",

  "profile.barrier.transportation": "Transporte",
  "profile.barrier.cost_or_insurance": "Costo o seguro médico",
  "profile.barrier.language": "Idioma",
  "profile.barrier.scheduling": "Poca disponibilidad de citas",
  "profile.barrier.caregiving": "Responsabilidades de cuidado de otras personas",

  "profile.medication.name": "Nombre del medicamento",
  "profile.medication.dose": "Dosis",
  "profile.medication.frequency": "Con qué frecuencia",
  "profile.medication.purpose": "Motivo documentado",
  "profile.medication.add": "Agregar un medicamento",
  "profile.medication.empty": "No hay medicamentos en la lista.",
  "profile.medication.note":
    "Kat nunca sugiere cambiar un medicamento. Consulte cualquier cambio con su equipo de atención médica.",

  "profile.list.add": "Agregar",
  "profile.list.remove": "Quitar {item}",
  "profile.list.empty": "Todavía no ha agregado nada.",
  // --- profile-editor additions ---
  "profile.loading": "Cargando su perfil…",
  "profile.error.title": "No pudimos cargar este perfil.",
  "profile.error.detail": "Intente elegir de nuevo a una paciente ficticia o reinicie la demostración.",
  "profile.form.label": "Editar perfil de salud",
  "profile.save": "Guardar cambios",
  "profile.saving": "Guardando…",
  "profile.discard": "Descartar cambios",
  "profile.discarded": "Se descartaron los cambios.",
  "profile.unsaved": "Tiene cambios sin guardar.",
  "profile.upToDate": "Todos los cambios están guardados.",
  "profile.savedDetail": "A partir de ahora, Kat usará sus preferencias actualizadas.",
  "profile.scenario": "Escenario de demostración: {summary}",

  "profile.field.ageRangePlaceholder": "Prefiero no decirlo",
  "profile.field.languageHint": "La aplicación y las respuestas de Kat usarán este idioma después de guardar.",
  "profile.field.accessibilityHint":
    "El tamaño del texto, el contraste y el movimiento cambian de inmediato para que pueda verlos. Guarde para conservarlos.",

  "profile.conditions.options": "Condiciones o inquietudes para elegir",
  "profile.conditions.addLabel": "Agregar su propia condición o inquietud",
  "profile.conditions.add": "Agregar condición",
  "profile.conditions.empty": "No ha elegido ninguna condición o inquietud.",
  "profile.conditions.selectedCount": "{count} seleccionadas",

  "profile.medication.doseNote":
    "Cambiar una dosis o un horario aquí no cambia sus indicaciones médicas. Solo su equipo de atención médica puede cambiar un medicamento.",
  "profile.medication.item": "Medicamento {number}",
  "profile.medication.removeNamed": "Quitar el medicamento {name}",
  "profile.medication.unnamed": "Medicamento nuevo",

  "profile.careInstructions.hint":
    "Tomado de su registro de visita ficticio. Editar esta lista no cambia lo que le indicó su equipo de atención médica.",
  "profile.careInstructions.placeholder": "Escriba una indicación de cuidado",
  "profile.careInstructions.addLabel": "Agregar una indicación de cuidado",
  "profile.careInstructions.empty": "No hay indicaciones de cuidado en la lista.",
  "profile.healthGoals.addLabel": "Agregar una meta de salud",
  "profile.healthGoals.empty": "Todavía no ha agregado metas.",
  "profile.list.item": "{label}, elemento {number}",

  "profile.origin.fromRecord": "De su registro de visita ficticio.",
  "profile.origin.enteredByYou": "Ingresado por usted",
  "profile.origin.enteredByYouHint": "Agregado o cambiado en este perfil. Su equipo de atención médica no lo ha confirmado.",

  "profile.pregnancy.add": "Agregar contexto de embarazo o posparto",
  "profile.pregnancy.remove": "Quitar el contexto de embarazo o posparto",
  "profile.pregnancy.placeholder": "Por ejemplo, lo que su equipo de atención médica ha documentado",
  // --- end profile-editor additions ---
} satisfies FeatureTranslation<typeof en>;
