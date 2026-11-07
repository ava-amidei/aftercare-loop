import { describe, expect, it } from "vitest";
import type { QuickPromptId } from "@/lib/types";
import { getDocument, getPatient } from "@/data/patients";
import { getGroundTruth } from "@/data/ground-truth";
import { getReferenceById } from "@/data/evidence";
import { containsFalseReassurance, findFalseReassurance } from "@/lib/safety";
import { KAT_ACTION_KINDS, DocumentInterpretationSchema } from "@/lib/ai/schemas";
import {
  SCRIPTED_MODE_LABEL,
  SCRIPTED_UNSUPPORTED,
  getScriptedClarification,
  getScriptedInterpretation,
  getScriptedKatReply,
  getScriptedSuggestedQuestions,
  slugifyQuestion,
  type ScriptedKatReply,
} from "@/lib/ai/scripted";
import { SCRIPTED_PRIMARY_PATIENT_IDS, getScriptedContent, locateFirst, scriptedContent } from "@/data/scripted";

const QUICK_PROMPTS: QuickPromptId[] = [
  "what_should_i_ask",
  "explain_my_diagnosis",
  "understand_my_results",
  "plan_next_steps",
  "free_text",
];

function docFor(patientId: string) {
  const content = getScriptedContent(patientId)!;
  const doc = getDocument(content.documentId);
  if (!doc) throw new Error(`missing document for ${patientId}`);
  return doc;
}

function allReplies(patientId: string): { label: string; reply: ScriptedKatReply }[] {
  const c = getScriptedContent(patientId)!;
  return [
    ...Object.entries(c.quickPrompts).map(([k, reply]) => ({ label: `quick:${k}`, reply })),
    ...c.freeText.map((e) => ({ label: `free:${e.id}`, reply: e.reply })),
  ];
}

/** Every human-readable string in a patient's scripted content. */
function allStrings(patientId: string): string[] {
  const c = getScriptedContent(patientId)!;
  const i = c.interpretation;
  return [
    i.whatThisMeans,
    ...i.terms.flatMap((t) => [t.term, t.definition]),
    ...i.whatToKnow,
    ...i.discussWithProvider,
    ...i.unansweredQuestions,
    ...i.limitations,
    ...i.safetyFlags.map((f) => f.message),
    ...allReplies(patientId).flatMap(({ reply }) => [
      reply.content,
      ...(reply.actions ?? []).flatMap((a) => [a.label, String(a.payload?.question ?? "")]),
    ]),
    ...Object.values(c.clarifications).flat(),
  ].filter(Boolean);
}

const ALL_IDS = scriptedContent.map((c) => c.patientId);
const ES_IDS = ["pt-f-gdm-es", "pt-i-anemia-es"];

/** Language-specific phrasing the scripted content must follow. */
const LANG = {
  en: {
    limitationPrefix: "Your summary does not",
    generalPrefix: /^(In general|Generally)\b/,
    secondPerson: /\byou(r|rs)?\b/i,
    stopQuestion: "Can I stop my medication?",
    cantStop: /can't tell you to stop/i,
    careTeam: /care team/i,
    advisesStopping: /\byou (can|may|should) stop\b/i,
    seriousQuestion: "Is this serious?",
    cantTell: /I can't tell you/,
  },
  es: {
    limitationPrefix: "Su resumen no",
    generalPrefix: /^(En general|Por lo general)\b/,
    secondPerson: /\b(usted|su|sus)\b/i,
    stopQuestion: "¿Puedo dejar de tomar mi medicina?",
    cantStop: /no puedo decirle que deje/i,
    careTeam: /equipo de atención/i,
    advisesStopping: /\bpuede (dejar|suspender)\b/i,
    seriousQuestion: "¿Esto es grave?",
    cantTell: /No puedo decirle/,
  },
} as const;

function langFor(patientId: string) {
  return LANG[getScriptedContent(patientId)!.language];
}

describe("scripted content wiring", () => {
  it("covers the three primary demo patients, the two lighter ones and the two Spanish ones", () => {
    expect(SCRIPTED_PRIMARY_PATIENT_IDS).toEqual(["pt-a-pcos", "pt-b-postpartum", "pt-c-endometriosis"]);
    expect(ALL_IDS).toEqual([
      "pt-a-pcos",
      "pt-b-postpartum",
      "pt-c-endometriosis",
      "pt-d-pots",
      "pt-e-multi",
      "pt-f-gdm-es",
      "pt-i-anemia-es",
    ]);
  });

  it.each(ES_IDS)("%s has Spanish (es) scripted content", (id) => {
    expect(getScriptedContent(id)!.language).toBe("es");
    expect(getPatient(id)!.language).toBe("es");
  });

  it.each(ALL_IDS)("%s points at its real fixture document and language", (id) => {
    const c = getScriptedContent(id)!;
    const profile = getPatient(id)!;
    expect(profile).toBeDefined();
    expect(docFor(id).patientId).toBe(id);
    expect(c.language).toBe(profile.language);
  });

  it("keeps the required labels verbatim", () => {
    expect(SCRIPTED_MODE_LABEL).toBe("Scripted Demo Mode — Responses are predefined for demonstration purposes.");
    expect(SCRIPTED_UNSUPPORTED).toBe(
      "This scripted demonstration can't answer that question. Add an ANTHROPIC_API_KEY to enable live responses.",
    );
  });
});

describe("getScriptedInterpretation", () => {
  it("returns null for unknown patients or mismatched documents", () => {
    expect(getScriptedInterpretation("pt-unknown", "doc-x")).toBeNull();
    expect(getScriptedInterpretation("pt-a-pcos", "doc-pt-b-visit-001")).toBeNull();
    expect(getScriptedInterpretation("pt-a-pcos", "pasted-doc-123")).toBeNull();
  });

  it.each(ALL_IDS)("%s builds a schema-valid interpretation with exact offsets", (id) => {
    const doc = docFor(id);
    const interp = getScriptedInterpretation(id, doc.id)!;
    expect(interp).not.toBeNull();
    expect(DocumentInterpretationSchema.safeParse(interp).success).toBe(true);
    expect(interp.patientId).toBe(id);
    expect(interp.documentId).toBe(doc.id);
    expect(interp.whatThisMeans.length).toBeGreaterThan(100);

    // Terms: 4–8, each located by exact offsets.
    expect(interp.terms.length).toBeGreaterThanOrEqual(4);
    expect(interp.terms.length).toBeLessThanOrEqual(8);
    for (const t of interp.terms) {
      expect(t.sourceRef, `term ${t.term}`).toBeDefined();
      expect(doc.text.slice(t.sourceRef!.start, t.sourceRef!.end)).toBe(t.sourceRef!.quote);
      expect(t.sourceRef!.documentId).toBe(doc.id);
    }

    // Questions for the provider: 3–5.
    expect(interp.discussWithProvider.length).toBeGreaterThanOrEqual(3);
    expect(interp.discussWithProvider.length).toBeLessThanOrEqual(5);

    // Limitations phrased as what the summary does not say.
    expect(interp.limitations.length).toBeGreaterThan(0);
    for (const l of interp.limitations) expect(l.startsWith(langFor(id).limitationPrefix)).toBe(true);
    expect(interp.unansweredQuestions.length).toBeGreaterThan(0);
    expect(interp.safetyFlags.length).toBeGreaterThan(0);
  });

  it.each(ALL_IDS)("%s instructions equal the ground truth, verified at exact offsets", (id) => {
    const doc = docFor(id);
    const gt = getGroundTruth(id)!;
    const interp = getScriptedInterpretation(id, doc.id)!;
    expect(interp.instructions).toHaveLength(gt.expectedInstructions.length);
    interp.instructions.forEach((ins, i) => {
      const expected = gt.expectedInstructions[i];
      expect(ins.description).toBe(expected.description);
      expect(ins.type).toBe(expected.type);
      expect(ins.sourceVerification).toBe("verified");
      expect(ins.sourceRef!.quote).toBe(expected.quote);
      expect(doc.text.slice(ins.sourceRef!.start, ins.sourceRef!.end)).toBe(expected.quote);
      expect(ins.sourceRef!.sectionId).toBeDefined();
      expect(ins.dueDate).toBe(expected.dueDate);
    });
  });

  it.each(ALL_IDS)("%s whatToKnow is clearly general education, not patient-specific", (id) => {
    const interp = getScriptedInterpretation(id, docFor(id).id)!;
    expect(interp.whatToKnow.length).toBeGreaterThanOrEqual(3);
    const lang = langFor(id);
    for (const bullet of interp.whatToKnow) {
      expect(bullet).toMatch(lang.generalPrefix);
      expect(bullet).not.toMatch(lang.secondPerson);
    }
  });

  it.each(ALL_IDS)("%s every referenceId exists in the evidence index", (id) => {
    const interp = getScriptedInterpretation(id, docFor(id).id)!;
    const ids = [...interp.referenceIds, ...interp.terms.flatMap((t) => t.referenceIds)];
    expect(interp.referenceIds.length).toBeGreaterThan(0);
    for (const ref of ids) expect(getReferenceById(ref), ref).toBeDefined();
  });

  it("flags pt-b postpartum warning signs and pt-e's fluid conflict for clinician clarification", () => {
    const b = getScriptedInterpretation("pt-b-postpartum", "doc-pt-b-visit-001")!;
    expect(b.safetyFlags.some((f) => f.level === "clarify_with_clinician" && f.message.includes("When to seek care"))).toBe(true);
    expect(b.safetyFlags.some((f) => f.message.includes("988"))).toBe(true);
    const e = getScriptedInterpretation("pt-e-multi", "doc-pt-e-visit-001")!;
    expect(e.safetyFlags.some((f) => f.level === "clarify_with_clinician" && /conflict/i.test(f.message))).toBe(true);
  });

  it("never presents pt-c endometriosis as confirmed", () => {
    const strings = allStrings("pt-c-endometriosis").join("\n").toLowerCase();
    expect(strings).not.toMatch(/you have endometriosis/);
    expect(strings).not.toMatch(/rules? out endometriosis/);
  });
});

describe("getScriptedKatReply", () => {
  it.each(SCRIPTED_PRIMARY_PATIENT_IDS)("%s covers all five quick prompts", (id) => {
    for (const qp of QUICK_PROMPTS) {
      const reply = getScriptedKatReply(id, "", qp);
      expect(reply, qp).not.toBeNull();
      expect(reply!.content.length).toBeGreaterThan(40);
    }
  });

  it.each(["pt-d-pots", "pt-e-multi", ...ES_IDS])("%s (lighter coverage) also covers all quick prompts", (id) => {
    for (const qp of QUICK_PROMPTS) expect(getScriptedKatReply(id, "", qp), qp).not.toBeNull();
  });

  it.each([...SCRIPTED_PRIMARY_PATIENT_IDS, ...ES_IDS])("%s has 8–12 free-text entries that resolve to themselves", (id) => {
    const c = getScriptedContent(id)!;
    expect(c.freeText.length).toBeGreaterThanOrEqual(8);
    expect(c.freeText.length).toBeLessThanOrEqual(12);
    for (const entry of c.freeText) {
      for (const q of entry.questions) {
        expect(getScriptedKatReply(id, q), `${entry.id}: ${q}`).toBe(entry.reply);
      }
    }
    expect(getScriptedSuggestedQuestions(id)).toHaveLength(c.freeText.length);
  });

  it.each(ALL_IDS)("%s quick-prompt chip text typed as free text maps to the chip reply", (id) => {
    const c = getScriptedContent(id)!;
    expect(getScriptedKatReply(id, "What should I ask my doctor?")).toBe(c.quickPrompts.what_should_i_ask);
    expect(getScriptedKatReply(id, "Explain my diagnosis")).toBe(c.quickPrompts.explain_my_diagnosis);
    expect(getScriptedKatReply(id, "¿Qué debo preguntarle a mi médico?")).toBe(c.quickPrompts.what_should_i_ask);
    expect(getScriptedKatReply(id, "", "free_text")).toBe(c.quickPrompts.free_text);
  });

  it.each([...SCRIPTED_PRIMARY_PATIENT_IDS, ...ES_IDS])("%s answers the core demo questions (incl. wording variants)", (id) => {
    const c = getScriptedContent(id)!;
    const idFor = (q: string) => c.freeText.find((e) => e.reply === getScriptedKatReply(id, q))?.id;
    expect(idFor("Can I stop my medication?")).toMatch(/stop-medication|medicines/);
    expect(idFor("can i stop taking my meds")).toMatch(/stop-medication|medicines/);
    expect(idFor("When is my follow-up?")).toBe("follow-up");
    expect(idFor("when's my next appointment")).toBe("follow-up");
    expect(idFor("What should I bring to my appointment?")).toBe("what-to-bring");
    expect(idFor("Is this serious?")).toBe("is-this-serious");
    expect(idFor("Can you explain this in simpler terms?")).toBe("simpler");
    expect(idFor("What information should I clarify?")).toBe("clarify");
    expect(idFor("What does my follow-up plan say?")).toBe("follow-up");
  });

  it.each(ES_IDS)("%s answers the core demo questions in Spanish (incl. wording variants)", (id) => {
    const c = getScriptedContent(id)!;
    const idFor = (q: string) => c.freeText.find((e) => e.reply === getScriptedKatReply(id, q))?.id;
    expect(idFor("¿Puedo dejar de tomar mi medicina?")).toBe("stop-medication");
    expect(idFor("puedo dejar la medicina")).toBe("stop-medication");
    expect(idFor("¿Qué dice mi plan de seguimiento?")).toBe("follow-up");
    expect(idFor("cuando es mi proxima cita")).toBe("follow-up");
    expect(idFor("¿Qué debo traer a mi próxima cita?")).toBe("what-to-bring");
    expect(idFor("¿Esto es grave?")).toBe("is-this-serious");
    expect(idFor("¿Debo preocuparme?")).toBe("is-this-serious");
    expect(idFor("¿Me lo puedes explicar de forma más sencilla?")).toBe("simpler");
    expect(idFor("no entiendo nada")).toBe("simpler");
    expect(idFor("¿Qué significa este término médico?")).toBe("medical-term");
    expect(idFor("¿Qué información debería aclarar?")).toBe("clarify");
  });

  it("answers Spanish patient-specific examples in Spanish", () => {
    const f = getScriptedContent("pt-f-gdm-es")!;
    const fId = (q: string) => f.freeText.find((e) => e.reply === getScriptedKatReply("pt-f-gdm-es", q))?.id;
    expect(fId("¿Puedo tomar café antes de la prueba?")).toBe("fasting");
    expect(fId("¿Qué significa en ayunas?")).toBe("fasting");
    expect(fId("¿Cuándo es mi prueba de glucosa?")).toBe("follow-up");
    expect(fId("mi azucar salio normal, por que necesito la prueba de glucosa")).toBe("glucose-test");
    expect(fId("¿Tengo que volver a usar insulina?")).toBe("insulin");
    expect(fId("trabajo en turnos, el laboratorio abre los sabados?")).toBe("schedule");
    const i = getScriptedContent("pt-i-anemia-es")!;
    const iId = (q: string) => i.freeText.find((e) => e.reply === getScriptedKatReply("pt-i-anemia-es", q))?.id;
    expect(iId("¿Puedo tomar el hierro con leche?")).toBe("how-to-take");
    expect(iId("¿Puedo dejar de tomar el hierro?")).toBe("stop-medication");
    expect(iId("tengo las heces negras")).toBe("side-effects");
    expect(iId("¿Cuándo voy a tener más energía?")).toBe("feel-better");
    expect(iId("¿Para qué es el ultrasonido?")).toBe("ultrasound");
    expect(iId("¿Qué tengo que anotar?")).toBe("what-to-bring");
    expect(iId("Dependo del autobús para ir a la clínica")).toBe("transport");
    // English-typed questions still get the profile-language (Spanish) reply.
    expect(getScriptedKatReply("pt-i-anemia-es", "What does my follow-up plan say?")!.content).toMatch(/^Su resumen dice/);
  });

  it("answers patient-specific examples", () => {
    const a = getScriptedContent("pt-a-pcos")!;
    expect(getScriptedKatReply("pt-a-pcos", "what does insulin resistance mean")).toBe(
      a.freeText.find((e) => e.id === "insulin-resistance")!.reply,
    );
    expect(getScriptedKatReply("pt-a-pcos", "Is it ok to have coffee before my blood test?")).toBe(
      a.freeText.find((e) => e.id === "fasting")!.reply,
    );
    const c = getScriptedContent("pt-c-endometriosis")!;
    expect(getScriptedKatReply("pt-c-endometriosis", "Why do I need another ultrasound?")).toBe(
      c.freeText.find((e) => e.id === "ultrasound")!.reply,
    );
    expect(getScriptedKatReply("pt-c-endometriosis", "My schedule changes every week, how do I book?")).toBe(
      c.freeText.find((e) => e.id === "schedule")!.reply,
    );
    const b = getScriptedContent("pt-b-postpartum")!;
    expect(getScriptedKatReply("pt-b-postpartum", "I don't have a car, how do I get there?")).toBe(
      b.freeText.find((e) => e.id === "rides")!.reply,
    );
    const e = getScriptedContent("pt-e-multi")!;
    expect(getScriptedKatReply("pt-e-multi", "Should I drink more water when my sugar is high?")).toBe(
      e.freeText.find((x) => x.id === "water")!.reply,
    );
  });

  it("returns null for unsupported questions and unknown patients", () => {
    expect(getScriptedKatReply("pt-a-pcos", "What is the capital of France?")).toBeNull();
    expect(getScriptedKatReply("pt-a-pcos", "")).toBeNull();
    expect(getScriptedKatReply("pt-unknown", "", "what_should_i_ask")).toBeNull();
    expect(getScriptedKatReply("pt-g-hypothyroid", "When is my follow-up?")).toBeNull();
    expect(getScriptedKatReply("pt-f-gdm-es", "¿Puedo comer plátanos?")).toBeNull();
    expect(getScriptedKatReply("pt-i-anemia-es", "¿Cuál es la capital de Francia?")).toBeNull();
  });

  it.each(ALL_IDS)("%s medication questions redirect to the clinician and never advise stopping", (id) => {
    const lang = langFor(id);
    for (const q of ["Can I stop my medication?", lang.stopQuestion]) {
      const reply = getScriptedKatReply(id, q)!;
      expect(reply, q).not.toBeNull();
      expect(reply.content).toMatch(lang.cantStop);
      expect(reply.content).toMatch(lang.careTeam);
      expect(reply.content).not.toMatch(lang.advisesStopping);
    }
  });

  it.each(ALL_IDS)("%s 'is this serious' states limits and does not diagnose", (id) => {
    const lang = langFor(id);
    for (const q of ["Is this serious?", lang.seriousQuestion]) {
      const reply = getScriptedKatReply(id, q)!;
      expect(reply.content).toMatch(lang.cantTell);
      expect(reply.content).toMatch(/911/);
    }
  });

  it.each(ALL_IDS)("%s replies: exact source quotes, real references, valid actions", (id) => {
    const doc = docFor(id);
    const tbIds = new Set(getGroundTruth(id)!.teachBackQuestions.map((q) => q.id));
    for (const { label, reply } of allReplies(id)) {
      for (const quote of reply.sourceQuotes ?? []) {
        expect(doc.text.includes(quote), `${label}: "${quote}"`).toBe(true);
        expect(locateFirst(doc, quote)).not.toBeNull();
      }
      for (const ref of reply.referenceIds ?? []) expect(getReferenceById(ref), `${label}: ${ref}`).toBeDefined();
      for (const action of reply.actions ?? []) {
        expect(KAT_ACTION_KINDS).toContain(action.kind);
        if (action.kind === "view_source") expect(doc.text.includes(String(action.payload?.quote))).toBe(true);
        if (action.kind === "add_question") expect(String(action.payload?.question ?? "").length).toBeGreaterThan(5);
        if (action.kind === "check_understanding") expect(tbIds.has(String(action.payload?.questionId))).toBe(true);
      }
      // Text quoted inline with curly quotes must also be verbatim from the document.
      for (const m of reply.content.matchAll(/“([^”]+)”/g)) {
        const inner = m[1].replace(/[.,]$/, "");
        // Example questions (ending in "?") are not document quotes.
        if (!inner.endsWith("?") && inner.split(" ").length >= 4) expect(doc.text.includes(inner), `${label}: “${inner}”`).toBe(true);
      }
    }
  });
});

describe("getScriptedClarification", () => {
  const judgmental =
    /\b(wrong|fail|failed|incorrect|mistake|careless|incorrect[oa]s?|equivocad[oa]s?|err[oó]neo|errónea|falló|fallaste)\b/i;

  it.each(ALL_IDS)("%s has two different, grounded re-explanations per teach-back question", (id) => {
    for (const q of getGroundTruth(id)!.teachBackQuestions) {
      const first = getScriptedClarification(q.id, 1);
      const second = getScriptedClarification(q.id, 2);
      expect(first, q.id).not.toBeNull();
      expect(second, q.id).not.toBeNull();
      expect(first).not.toBe(second);
      expect(first).toContain(q.sourceRef.quote);
      expect(second).toContain(q.sourceRef.quote);
      expect(first).not.toMatch(judgmental);
      expect(second).not.toMatch(judgmental);
      // Later attempts keep using the second version.
      expect(getScriptedClarification(q.id, 3)).toBe(second);
    }
  });

  it("returns null for unknown questions", () => {
    expect(getScriptedClarification("tb-unknown", 1)).toBeNull();
  });

  it.each(ES_IDS)("%s re-explanations are in Spanish", (id) => {
    for (const q of getGroundTruth(id)!.teachBackQuestions) {
      expect(getScriptedClarification(q.id, 1)).toMatch(/^Se lo explico de otra manera\./);
      expect(getScriptedClarification(q.id, 2)).toMatch(/^Otra forma de verlo/);
    }
  });
});

describe("safety of scripted text", () => {
  it.each(ALL_IDS)("%s contains no false reassurance", (id) => {
    for (const s of allStrings(id)) {
      expect(containsFalseReassurance(s), `${findFalseReassurance(s).join(", ")} in: ${s}`).toBe(false);
    }
  });

  it.each(ALL_IDS)("%s never tells the patient to change medication or claims safety", (id) => {
    const text = allStrings(id).join("\n");
    expect(text).not.toMatch(/\b(increase|decrease|double|halve) (your|the) dose\b/i);
    expect(text).not.toMatch(/\b(aumente|disminuya|duplique|suba|baje) (su|la) dosis\b/i);
    expect(text).not.toMatch(/\byou are safe\b/i);
    expect(text).not.toMatch(/Ask Aftercare AI/);
  });
});

describe("Spanish scripted content stays in Spanish", () => {
  // Common English function words that should never appear in Spanish patient-facing text.
  const english = /\b(the|your|you|and|with|summary|should|this)\b/i;

  it.each(ES_IDS)("%s has no English sentences in patient-facing strings", (id) => {
    for (const s of allStrings(id)) expect(s, s).not.toMatch(english);
  });

  it.each(ES_IDS)("%s cites at least one Spanish-language reference", (id) => {
    const interp = getScriptedInterpretation(id, docFor(id).id)!;
    expect(interp.referenceIds.some((r) => getReferenceById(r)?.language === "es")).toBe(true);
  });
});

describe("slugifyQuestion", () => {
  it("lowercases, strips punctuation and accents, collapses spaces", () => {
    expect(slugifyQuestion("  What's my   Follow-up?! ")).toBe("whats my followup");
    expect(slugifyQuestion("¿Qué debo preguntarle a mi médico?")).toBe("que debo preguntarle a mi medico");
  });
});
