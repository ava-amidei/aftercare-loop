import { describe, expect, it } from "vitest";
import type { SafetyLevel, SafetyScenario } from "@/lib/types";
import {
  SAFETY_SYSTEM_RULES,
  containsFalseReassurance,
  evaluateSafety,
  findFalseReassurance,
  getSafetyGuidance,
  normalizeForSafety,
} from "./index";

// All inputs are synthetic test phrases written for this suite.
interface Case {
  input: string;
  level: SafetyLevel;
  scenario?: SafetyScenario;
  postpartumContext?: boolean;
}

const emergencies: Case[] = [
  // chest pain
  { input: "I have chest pain and my left arm feels numb", level: "emergency", scenario: "chest_pain" },
  { input: "Crushing pressure in my chest right now", level: "emergency", scenario: "chest_pain" },
  { input: "my cheast hurts and im sweating a lot", level: "emergency", scenario: "chest_pain" },
  { input: "Mild chest ache but the pain is spreading to my jaw", level: "emergency", scenario: "chest_pain" },
  { input: "I think I'm having a heart attack", level: "emergency", scenario: "chest_pain" },
  { input: "Tengo dolor en el pecho y me duele el brazo izquierdo", level: "emergency", scenario: "chest_pain" },
  { input: "chest tightness and shortness of breath", level: "emergency", scenario: "chest_pain" },
  // breathing
  { input: "I can't breathe", level: "emergency", scenario: "severe_breathing_difficulty" },
  { input: "i cant breath at all", level: "emergency", scenario: "severe_breathing_difficulty" },
  { input: "I'm gasping for air and my lips are turning blue", level: "emergency", scenario: "severe_breathing_difficulty" },
  { input: "I can barely breathe and it's getting worse", level: "emergency", scenario: "severe_breathing_difficulty" },
  { input: "No puedo respirar", level: "emergency", scenario: "severe_breathing_difficulty" },
  { input: "No, I can't breathe!", level: "emergency", scenario: "severe_breathing_difficulty" },
  // stroke
  { input: "My face is drooping on one side and my speech is slurred", level: "emergency", scenario: "stroke_symptoms" },
  { input: "Sudden weakness on the left side of my body", level: "emergency", scenario: "stroke_symptoms" },
  { input: "I can't lift my right arm and my words are coming out wrong", level: "emergency", scenario: "stroke_symptoms" },
  { input: "I think I'm having a stroke", level: "emergency", scenario: "stroke_symptoms" },
  { input: "Se me cae un lado de la cara y tengo la habla arrastrada", level: "emergency", scenario: "stroke_symptoms" },
  { input: "worst headache of my life just started", level: "emergency", scenario: "stroke_symptoms" },
  // bleeding
  { input: "I'm bleeding heavily and it won't stop", level: "emergency", scenario: "severe_bleeding" },
  { input: "There is blood everywhere from a cut on my leg", level: "emergency", scenario: "severe_bleeding" },
  { input: "I've been vomiting blood", level: "emergency", scenario: "severe_bleeding" },
  { input: "Tengo un sangrado abundante", level: "emergency", scenario: "severe_bleeding" },
  { input: "passing clots bigger than a golf ball", level: "emergency", scenario: "severe_bleeding" },
  // suicidal / self-harm
  { input: "I want to kill myself", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "I've been having suicidal thoughts", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "Everyone would be better off without me", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "I keep thinking about hurting myself", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "Quiero morir", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "no quiero vivir más", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  { input: "im thinking about sucide", level: "emergency", scenario: "suicidal_ideation_or_self_harm" },
  // postpartum
  { input: "I gave birth 10 days ago and I'm soaking a pad every hour", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "Since my delivery I have a fever of 101.2", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "postpartum: severe headache and blurry vision", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "My calf is swollen and painful after my c-section", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "I have scary thoughts about hurting my baby", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "Di a luz hace una semana y tengo fiebre de 38.5", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "Empapo una toalla cada hora después del parto", level: "emergency", scenario: "severe_postpartum_warning" },
  { input: "I have a temperature of 100.4", level: "emergency", scenario: "severe_postpartum_warning", postpartumContext: true },
];

const concerning: Case[] = [
  { input: "I have a little chest soreness when I cough", level: "concerning", scenario: "chest_pain" },
  { input: "Last year I had chest pain and arm pain", level: "concerning" },
  { input: "I've been a bit short of breath on the stairs", level: "concerning", scenario: "severe_breathing_difficulty" },
  { input: "Me cuesta respirar cuando camino", level: "concerning", scenario: "severe_breathing_difficulty" },
  { input: "My hand feels numb", level: "concerning", scenario: "stroke_symptoms" },
  { input: "I'm bleeding more than usual", level: "concerning", scenario: "severe_bleeding" },
  { input: "I'm not suicidal, just exhausted", level: "concerning", scenario: "suicidal_ideation_or_self_harm" },
  { input: "I used to self-harm when I was a teenager", level: "concerning", scenario: "suicidal_ideation_or_self_harm" },
  { input: "I have a fever of 101", level: "concerning" },
  { input: "What are the warning signs of heavy bleeding after birth?", level: "concerning" },
];

const benign: Case[] = [
  { input: "What does PCOS mean?", level: "none" },
  { input: "Can you explain my follow-up plan in simpler terms?", level: "none" },
  { input: "When is my next appointment for the ultrasound?", level: "none" },
  { input: "My chest x-ray results came back, what do they say?", level: "none" },
  { input: "I'm breathing better now after the inhaler", level: "none" },
  { input: "No chest pain or shortness of breath today", level: "none" },
  { input: "I don't have chest pain, and no trouble breathing", level: "none" },
  { input: "I have no idea what metformin is for", level: "none" },
  { input: "I'm dying to know my lab results", level: "none" },
  { input: "This paperwork is killing me", level: "none" },
  { input: "I have heavy periods and want to ask about it", level: "none" },
  { input: "I need a ride to my appointment because I don't have a car", level: "none" },
  { input: "I have trouble talking to my doctor about my symptoms", level: "none" },
  { input: "¿Qué significa endometriosis?", level: "none" },
  { input: "No tengo dolor en el pecho", level: "none" },
  { input: "I feel lightheaded when I stand up too fast", level: "none" },
  { input: "Years ago I had some chest soreness", level: "none" },
  { input: "My temperature was 98.6 this morning", level: "none" },
];

function check(c: Case) {
  const v = evaluateSafety(c.input, { postpartumContext: c.postpartumContext });
  expect({ input: c.input, level: v.level }).toEqual({ input: c.input, level: c.level });
  if (c.scenario) expect(v.scenario).toBe(c.scenario);
  if (c.level !== "none") {
    expect(v.detectedBy).toBe("rules");
    expect(v.guidance).toBeTruthy();
    expect(v.matchedPhrases?.length).toBeGreaterThan(0);
    expect(containsFalseReassurance(v.guidance ?? "")).toBe(false);
  } else {
    expect(v.guidance).toBeUndefined();
  }
  return v;
}

describe("evaluateSafety — emergencies (zero false negatives)", () => {
  it.each(emergencies)("$input", (c) => {
    const v = check(c);
    expect(v.guidance).toMatch(/911/);
  });

  it("has ≥4 emergency variants per scenario", () => {
    const counts = new Map<string, number>();
    for (const c of emergencies) counts.set(c.scenario!, (counts.get(c.scenario!) ?? 0) + 1);
    for (const s of [
      "chest_pain",
      "severe_breathing_difficulty",
      "stroke_symptoms",
      "severe_bleeding",
      "suicidal_ideation_or_self_harm",
      "severe_postpartum_warning",
    ]) {
      expect(counts.get(s) ?? 0).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("evaluateSafety — concerning", () => {
  it.each(concerning)("$input", (c) => {
    const v = check(c);
    expect(v.level).not.toBe("emergency");
  });
});

describe("evaluateSafety — benign controls never emergency", () => {
  it.each(benign)("$input", (c) => {
    check(c);
  });
});

describe("evaluateSafety — guidance", () => {
  it("emergency guidance is concise and US-labeled 988 for suicide", () => {
    const v = evaluateSafety("I want to end my life");
    expect(v.guidance).toMatch(/911/);
    expect(v.guidance).toMatch(/In the US.*988/);
    expect(v.guidance!.length).toBeLessThan(500);
  });

  it("harm-to-baby thoughts include the crisis line", () => {
    const v = evaluateSafety("I'm afraid I might hurt my baby");
    expect(v.level).toBe("emergency");
    expect(v.guidance).toMatch(/988/);
  });

  it("non-suicidal emergency guidance does not include 988", () => {
    expect(evaluateSafety("I can't breathe").guidance).not.toMatch(/988/);
  });

  it("concerning guidance states limits and recommends prompt care", () => {
    const v = evaluateSafety("I have a little chest soreness");
    expect(v.guidance).toMatch(/can't assess how serious this is/);
    expect(v.guidance).toMatch(/care team/);
  });

  it("Spanish guidance when language is es", () => {
    const v = evaluateSafety("dolor en el pecho y sudor frío", { language: "es" });
    expect(v.level).toBe("emergency");
    expect(v.guidance).toMatch(/Llame al 911/);
    const s = evaluateSafety("quiero morir", { language: "es" });
    expect(s.guidance).toMatch(/988/);
    expect(s.guidance).toMatch(/EE\. UU\./);
  });

  it("getSafetyGuidance returns undefined for none", () => {
    expect(getSafetyGuidance("none", undefined, "en")).toBeUndefined();
  });

  it("no guidance text falsely reassures (en + es, all levels/scenarios)", () => {
    const scenarios = [
      undefined,
      "chest_pain",
      "suicidal_ideation_or_self_harm",
      "severe_postpartum_warning",
    ] as const;
    for (const lang of ["en", "es"] as const)
      for (const level of ["concerning", "emergency"] as const)
        for (const s of scenarios) {
          const g = getSafetyGuidance(level, s, lang, { crisisLine: true })!;
          expect(findFalseReassurance(g)).toEqual([]);
        }
  });
});

describe("evaluateSafety — negation, past tense, hypotheticals, documents", () => {
  it("negated chest pain with active breathing emergency still escalates", () => {
    expect(evaluateSafety("No chest pain but I can't breathe").level).toBe("emergency");
  });

  it("remote past is dampened but present override restores emergency", () => {
    expect(evaluateSafety("I had a stroke years ago").level).toBe("none");
    expect(evaluateSafety("Last year I had chest pain, and now my face is drooping").level).toBe("emergency");
    expect(evaluateSafety("Since last year I still get crushing chest pain").level).toBe("emergency");
  });

  it("'no idea'/'not sure' are not negations", () => {
    expect(evaluateSafety("I'm not sure but I think I'm having a stroke").level).toBe("emergency");
    expect(evaluateSafety("I don't know why but I can't breathe").level).toBe("emergency");
  });

  it("document warning-sign lists do not trigger, reported symptoms cap at concerning", () => {
    const doc =
      "Follow-up in 2 weeks. Call 911 if you have chest pain, trouble breathing, or heavy bleeding. Patient denies chest pain.";
    expect(evaluateSafety(doc, { source: "document" }).level).toBe("none");
    expect(evaluateSafety("Patient reports chest pain and sweating.", { source: "document" }).level).toBe("concerning");
  });

  it("negation carries across disjunctive lists only", () => {
    expect(evaluateSafety("I have no fever, chest pain, or shortness of breath").level).toBe("none");
    expect(evaluateSafety("no tengo fiebre, dolor de pecho ni tos").level).toBe("none");
    expect(evaluateSafety("No fever, crushing chest pain").level).toBe("emergency");
    expect(evaluateSafety("No fever, my chest hurts").level).toBe("emergency");
  });

  it("conditional questions are dampened unless a present-time word is used", () => {
    expect(evaluateSafety("What should I do if I have chest pain?").level).toBe("concerning");
    expect(evaluateSafety("What should I do if I have chest pain right now?").level).toBe("emergency");
  });

  it("accidental injuries are not self-harm; deliberate ones are", () => {
    expect(evaluateSafety("I cut myself cooking").level).toBe("none");
    expect(evaluateSafety("I hurt myself lifting the stroller").level).toBe("none");
    expect(evaluateSafety("I cut myself on purpose last night").scenario).toBe("suicidal_ideation_or_self_harm");
  });

  it("exertional breathlessness is concerning, not emergency", () => {
    expect(evaluateSafety("I can't catch my breath after running").level).toBe("concerning");
  });

  it("empty input is none", () => {
    expect(evaluateSafety("   ")).toEqual({ level: "none", detectedBy: "none" });
  });

  it("normalizes accents, apostrophes and typos", () => {
    expect(normalizeForSafety("I CAN’T   breathe — señal")).toBe("i cant breathe | senal");
    expect(normalizeForSafety("chesst pian")).toBe("chest pain");
  });
});

describe("containsFalseReassurance", () => {
  it.each([
    "Don't worry, you are fine.",
    "This is normal after a procedure.",
    "There's nothing to worry about.",
    "You're okay, no need to seek care.",
    "It's probably nothing.",
    "No se preocupe, es normal.",
  ])("flags: %s", (t) => {
    expect(containsFalseReassurance(t)).toBe(true);
  });

  it.each([
    "I can't assess how serious this is. Please contact your care team.",
    "Your plan says to schedule a follow-up visit in two weeks.",
  ])("does not flag: %s", (t) => {
    expect(containsFalseReassurance(t)).toBe(false);
  });
});

describe("SAFETY_SYSTEM_RULES", () => {
  it("contains the core constraints", () => {
    expect(SAFETY_SYSTEM_RULES).toMatch(/Never diagnose/);
    expect(SAFETY_SYSTEM_RULES).toMatch(/safe/);
    expect(SAFETY_SYSTEM_RULES).toMatch(/medication/);
    expect(SAFETY_SYSTEM_RULES).toMatch(/untrusted_document/);
    expect(SAFETY_SYSTEM_RULES).toMatch(/911/);
  });
});
