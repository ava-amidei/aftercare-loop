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
} satisfies FeatureTranslation<typeof en>;
