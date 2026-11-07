/**
 * Clinician communication summary (SPEC §12.10). Pure.
 *
 * Collects the patient's questions, reported barriers, unresolved follow-up
 * items (incl. teach-back questions saved for the care team because they are
 * still unclear) and verified documented instructions (with exact source quotes) into
 * an editable plain-text block in the profile language. It is a draft for the
 * patient to copy — nothing is transmitted anywhere.
 */
import type {
  AccessBarrier,
  ActionItem,
  CommunicationSummary,
  Language,
  PatientSessionState,
  SourceRef,
  TeachBackQuestion,
  VisitDocument,
} from "@/lib/types";
import { getGroundTruth } from "@/data/ground-truth";
import { formatDate, nowIso } from "@/lib/utils/dates";
import { normalizeWhitespace } from "@/lib/utils/text";
import { toClinicQuestion } from "./barriers";

const BARRIER_DISPLAY: Record<Language, Record<AccessBarrier, string>> = {
  en: {
    transportation: "Transportation",
    cost_or_insurance: "Cost or insurance",
    language: "Language",
    scheduling: "Limited appointment availability",
    caregiving: "Caregiving responsibilities",
  },
  es: {
    transportation: "Transporte",
    cost_or_insurance: "Costo o seguro médico",
    language: "Idioma",
    scheduling: "Poca disponibilidad de citas",
    caregiving: "Responsabilidades de cuidado de otras personas",
  },
};

export const SUMMARY_STRINGS = {
  en: {
    title: "Notes for my care team",
    preparedBy: (name: string, date: string) => `Prepared by ${name} on ${date}. Draft — please review and edit before sharing.`,
    fictional: "Demonstration using fictional patient data.",
    questions: "QUESTIONS FOR MY PROVIDER",
    barriers: "THINGS THAT MAKE CARE HARDER FOR ME",
    unresolved: "FOLLOW-UP ITEMS I STILL NEED TO RESOLVE",
    documented: "INSTRUCTIONS DOCUMENTED IN MY VISIT SUMMARY",
    none: "- None noted",
    due: (date: string) => `due ${date}`,
    needsClarification: "needs clarification",
    source: "Source",
    teachBackUnclear: (prompt: string) => `Still unclear after a teach-back check: ${prompt}`,
    teachBackUnclearUnknown: "A teach-back question from my visit summary that is still unclear to me",
  },
  es: {
    title: "Notas para mi equipo de atención",
    preparedBy: (name: string, date: string) => `Preparado por ${name} el ${date}. Borrador — revíselo y edítelo antes de compartirlo.`,
    fictional: "Demostración con datos de pacientes ficticios.",
    questions: "PREGUNTAS PARA MI PROVEEDOR",
    barriers: "COSAS QUE ME DIFICULTAN RECIBIR ATENCIÓN",
    unresolved: "PENDIENTES DE SEGUIMIENTO QUE AÚN DEBO RESOLVER",
    documented: "INSTRUCCIONES DOCUMENTADAS EN MI RESUMEN DE LA VISITA",
    none: "- Nada anotado",
    due: (date: string) => `fecha límite ${date}`,
    needsClarification: "necesita aclaración",
    source: "Fuente",
    teachBackUnclear: (prompt: string) => `Aún no me queda claro después de una pregunta de comprobación: ${prompt}`,
    teachBackUnclearUnknown: "Una pregunta de comprobación sobre mi resumen de la visita que aún no me queda clara",
  },
} as const;

export interface CommunicationSummaryOptions {
  /** ISO timestamp for generatedAt (defaults to now). */
  now?: string;
  /** Teach-back questions for this patient (defaults to the fixture ground truth). */
  teachBackQuestions?: TeachBackQuestion[];
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const clean = normalizeWhitespace(v);
    const k = clean.toLowerCase();
    if (!clean || seen.has(k)) continue;
    seen.add(k);
    out.push(clean);
  }
  return out;
}

function refStillMatches(documents: VisitDocument[], ref: SourceRef | undefined): boolean {
  if (!ref) return false;
  const doc = documents.find((d) => d.id === ref.documentId);
  // If the document is not in state we cannot re-check; trust the stored verification.
  if (!doc) return true;
  return doc.text.slice(ref.start, ref.end) === ref.quote;
}

function isDocumentedVerified(a: ActionItem, documents: VisitDocument[]): boolean {
  return (
    a.origin === "clinician_documented" &&
    a.sourceVerification === "verified" &&
    refStillMatches(documents, a.sourceRef)
  );
}

export function buildCommunicationSummary(
  state: PatientSessionState,
  options: CommunicationSummaryOptions = {},
): CommunicationSummary {
  const { profile } = state;
  const language: Language = profile.language === "es" ? "es" : "en";
  const s = SUMMARY_STRINGS[language];
  const generatedAt = options.now ?? nowIso();
  const actions = state.actions.filter((a) => a.patientId === profile.id);

  // Barrier suggestions are phrased as prompts to the patient ("Would you like
  // to ask…?"); the summary is addressed to the clinic, so use the clinic-facing
  // wording (also for older saved questions stored in prompt form).
  const questions = dedupe(
    [
      ...state.savedQuestions,
      ...actions
        .filter((a) => a.category === "provider_question" && a.status === "pending")
        .map((a) => a.description),
    ].map(toClinicQuestion),
  );

  const barriers: AccessBarrier[] = Array.from(new Set(profile.barriers ?? []));

  const documented = actions.filter(
    (a) => a.category === "care_plan" && isDocumentedVerified(a, state.documents),
  );

  const unresolvedActions = actions.filter(
    (a) =>
      a.status === "needs_clarification" ||
      (a.category === "care_plan" && a.status === "pending"),
  );
  const unresolvedLine = (a: ActionItem): string => {
    const notes: string[] = [];
    if (a.status === "needs_clarification") notes.push(s.needsClarification);
    if (a.dueDate) {
      const d = formatDate(a.dueDate, language);
      if (d) notes.push(s.due(d));
    }
    const desc = normalizeWhitespace(a.description);
    return notes.length ? `${desc} (${notes.join("; ")})` : desc;
  };
  // Teach-back questions saved for the care team (attempts ran out, or the
  // patient chose to save) that were never answered correctly, with the
  // passage they are about.
  const tbQuestions = options.teachBackQuestions ?? getGroundTruth(profile.id)?.teachBackQuestions ?? [];
  const teachBackLines = Object.values(state.teachBack ?? {})
    .filter((t) => t && t.patientId === profile.id && t.savedForClinician && t.finalCorrect !== true)
    .map((t) => {
      const q = tbQuestions.find((x) => x.id === t.questionId);
      if (!q) return s.teachBackUnclearUnknown;
      const quote = normalizeWhitespace(q.sourceRef?.quote ?? "");
      const line = s.teachBackUnclear(normalizeWhitespace(q.prompt));
      return quote ? `${line} (${s.source}: "${quote}")` : line;
    });
  const unresolvedItems = dedupe([...unresolvedActions.map(unresolvedLine), ...teachBackLines]);

  const documentedInstructions = documented.map((a) => ({
    description: normalizeWhitespace(a.description),
    ...(a.sourceRef ? { sourceRef: { ...a.sourceRef } } : {}),
  }));

  // ---- formatted, editable text --------------------------------------------
  const lines: string[] = [];
  lines.push(s.title);
  lines.push(s.preparedBy(profile.displayName, formatDate(generatedAt, language) || generatedAt.slice(0, 10)));
  lines.push(s.fictional);

  const section = (heading: string, body: string[]) => {
    lines.push("", heading);
    if (body.length === 0) lines.push(s.none);
    else lines.push(...body);
  };

  section(s.questions, questions.map((q) => `- ${q}`));
  section(s.barriers, barriers.map((b) => `- ${BARRIER_DISPLAY[language][b]}`));
  section(s.unresolved, unresolvedItems.map((u) => `- ${u}`));

  const documentedLines: string[] = [];
  for (const d of documentedInstructions) {
    documentedLines.push(`- ${d.description}`);
    if (d.sourceRef) documentedLines.push(`  ${s.source}: "${normalizeWhitespace(d.sourceRef.quote)}"`);
  }
  section(s.documented, documentedLines);

  return {
    patientId: profile.id,
    generatedAt,
    questions,
    barriers,
    unresolvedItems,
    documentedInstructions,
    text: lines.join("\n") + "\n",
  };
}
