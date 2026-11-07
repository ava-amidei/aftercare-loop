/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { careTeam as en } from "../en/careTeam";

export const careTeam = {
  "careTeam.title": "Cola del equipo de atención",
  "careTeam.fictional": "Simulación ficticia",
  "careTeam.fictionalNotice":
    "Esta es una simulación ficticia. No se envía nada a profesionales de salud ni equipos de atención reales.",
  "careTeam.staffView": "Vista simulada del personal clínico",
  "careTeam.noAuthorization":
    "Estas solicitudes nunca autorizan resurtidos ni cambian recetas. Esas decisiones las toma un profesional de salud.",
  "careTeam.empty": "No hay solicitudes en la cola.",

  "careTeam.type.clarification": "Solicitud de aclaración",
  "careTeam.type.refill_request": "Solicitud de resurtido",
  "careTeam.type.side_effect_question": "Pregunta sobre efectos secundarios",
  "careTeam.type.incomplete_follow_up": "Seguimiento pendiente",
  "careTeam.type.reported_barrier": "Dificultad para recibir atención",

  "careTeam.status.submitted": "Enviada",
  "careTeam.status.in_review": "En revisión",
  "careTeam.status.responded": "Respondida",
  "careTeam.status.closed": "Cerrada",

  "careTeam.advance": "Pasar a la siguiente etapa",
  "careTeam.advanceTo": "Marcar como «{status}»",
  "careTeam.field.patient": "Paciente (datos ficticios)",
  "careTeam.field.type": "Tipo de solicitud",
  "careTeam.field.summary": "Resumen",
  "careTeam.field.details": "Detalles",
  "careTeam.field.status": "Estado",
  "careTeam.field.submittedAt": "Enviada el {date}",
  "careTeam.field.updatedAt": "Actualizada el {date}",
  "careTeam.newRequest": "Nueva solicitud",
  "careTeam.submit": "Enviar solicitud",
  "careTeam.submitted": "La solicitud se agregó a la cola simulada.",
  // ---- BEGIN follow-up-and-care-team additions ------------------------------
  "careTeam.banner": "Simulación ficticia — sin pacientes ni profesionales de salud reales",
  "careTeam.description":
    "Una vista clínica simulada de las solicitudes de {name}, más solicitudes ficticias de ejemplo.",
  "careTeam.staffNote":
    "La revisión del personal es simulada. Pasar una solicitud a la siguiente etapa no contacta a nadie.",
  "careTeam.noAi": "En esta página no se ejecutan acciones de IA.",
  "careTeam.loading": "Cargando la cola simulada…",
  "careTeam.error": "No pudimos cargar la cola simulada.",
  "careTeam.queue.title": "Cola de solicitudes",
  "careTeam.filter.label": "Filtrar por tipo de solicitud",
  "careTeam.filter.all": "Todos los tipos",
  "careTeam.group.empty": "No hay solicitudes en esta etapa.",
  "careTeam.emptyFiltered": "Ninguna solicitud coincide con este filtro.",
  "careTeam.emptyDescription": "Las solicitudes creadas en la página de Seguimiento aparecen aquí.",
  "careTeam.origin.patient": "De {name} (datos ficticios)",
  "careTeam.origin.seed": "Ejemplo ficticio",
  "careTeam.closedFinal": "Cerrada — no hay más etapas",
  "careTeam.relatedAction": "Punto relacionado del plan: {description}",
  "careTeam.showDetails": "Ver detalles",
  "careTeam.advanced": "El estado cambió a «{status}» (simulado).",
  "careTeam.readOnly": "Solo lectura",
  "careTeam.followUps.title": "Seguimientos incompletos",
  "careTeam.followUps.description": "Del plan de atención. Pendientes o que necesitan aclaración.",
  "careTeam.followUps.empty": "No hay seguimientos incompletos.",
  "careTeam.followUps.unverified": "No coincide con el documento de la consulta — necesita aclaración",
  "careTeam.barriers.title": "Dificultades para recibir atención (indicadas en el perfil)",
  "careTeam.barriers.description": "Indicadas en el perfil ficticio.",
  "careTeam.barriers.empty": "No se indicaron dificultades.",
  "careTeam.barriers.reported": "Indicado en el perfil",
  // ---- END follow-up-and-care-team additions --------------------------------
} satisfies FeatureTranslation<typeof en>;
