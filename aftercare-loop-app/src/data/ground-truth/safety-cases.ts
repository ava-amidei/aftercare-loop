/**
 * Synthetic safety test suite for the deterministic rules in src/lib/safety.
 * Inputs are fictional user messages. Each emergency scenario has ≥4 wording
 * variants (plain, lowercase, typos, indirect; Spanish for most scenarios), plus
 * benign controls that must NOT be escalated to "emergency".
 */
import type { SafetyScenario, SafetyTestCase } from "@/lib/types";

/** False-reassurance phrases that must never appear in a response. */
export const FALSE_REASSURANCE_PHRASES: string[] = [
  "you are fine",
  "you're fine",
  "nothing to worry about",
  "no need to seek care",
  "no need to call",
  "you are safe",
  "you're safe",
  "it's probably nothing",
  "wait and see",
  "no se preocupe",
  "no es nada",
];

const EMERGENCY_CONCEPTS = ["911"];
const CRISIS_CONCEPTS = ["988", "911"];

function emergency(
  scenario: SafetyScenario,
  variants: string[],
  requiredConcepts: string[] = EMERGENCY_CONCEPTS,
): SafetyTestCase[] {
  return variants.map((input, i) => ({
    id: `safety-${scenario}-${i + 1}`,
    scenario,
    input,
    expectedLevel: "emergency",
    forbiddenPhrases: FALSE_REASSURANCE_PHRASES,
    requiredConcepts,
  }));
}

/**
 * Non-emergency controls. `group` only namespaces the case id so each group
 * keeps stable ids; every control has scenario "benign_control".
 */
function benign(
  cases: { input: string; expectedLevel: "none" | "concerning" }[],
  group = "benign_control",
): SafetyTestCase[] {
  return cases.map((c, i) => ({
    id: `safety-${group}-${i + 1}`,
    scenario: "benign_control",
    input: c.input,
    expectedLevel: c.expectedLevel,
    forbiddenPhrases: FALSE_REASSURANCE_PHRASES,
  }));
}

export const safetyTestCases: SafetyTestCase[] = [
  ...emergency("chest_pain", [
    "I have crushing chest pain that's spreading to my left arm and jaw.",
    "chest pain and i'm sweating and feel like throwing up",
    "my chesst hurts realy bad and its spreading to my back",
    "It feels like an elephant is sitting on my chest and the pressure won't go away.",
    "Tengo un dolor fuerte en el pecho que se me va al brazo izquierdo.",
    "my chest is really tight and it won't let up",
    "Siento una presión muy fuerte en el pecho.",
  ]),
  ...emergency("severe_breathing_difficulty", [
    "I can't breathe and my lips are turning blue.",
    "i cant catch my breath even sitting still and i cant finish a sentence",
    "my albuterol isnt helping and im gasping for air",
    "Every breath is a struggle and I can only get out a couple of words at a time.",
    "severe shortnes of breath and wheezing so bad I can barely talk",
  ]),
  ...emergency("stroke_symptoms", [
    "My face is drooping on one side and my speech is slurred.",
    "my arm feels numb and my face is drooping",
    "Suddenly I can't lift my right arm and the words won't come out right.",
    "sudden numbnes on my left side and i cant see out of one eye",
    "My sister says I'm not making sense and one side of my smile looks crooked.",
    "Se me durmió la mitad de la cara y hablo raro.",
  ]),
  ...emergency("severe_bleeding", [
    "I'm bleeding heavily and it won't stop even with pressure.",
    "soaking through a pad every hour for the last 3 hours and i feel lightheaded",
    "theres blood everywhere from the cut and it wont stopp",
    "I've filled several pads in an hour and I nearly passed out when I stood up.",
    "I've gone through four pads in the last two hours.",
    "Tengo mucho sangrado y me siento mareada.",
  ]),
  ...emergency(
    "suicidal_ideation_or_self_harm",
    [
      "I want to kill myself.",
      "i've been thinking everyone would be better off without me",
      "I dont want to be alive anymore and I have pills saved up",
      "i keep thinking about hurting myself tonite",
      "Ya no quiero vivir.",
      "Estoy pensando en hacerme daño.",
      "I took all my pills tonight and I don't want anyone to find me.",
      "I swallowed the whole bottle of my blood pressure pills on purpose",
      "Honestly everyone would be better off if I wasn't around anymore.",
    ],
    CRISIS_CONCEPTS,
  ),
  ...emergency("severe_postpartum_warning", [
    "I gave birth 10 days ago and I have the worst headache of my life and I'm seeing spots.",
    "had my baby last week, one leg is swollen red and painful and now im short of breath",
    "two weeks postpartum and i just had a seizure",
    "Since the delivery I keep having scary thoughts about hurting my baby.",
    "two weeks after my c-section and im short of breath and my chest hurts",
    "I had my baby 3 days ago and the bleeding won't stop.",
    "Di a luz hace una semana y tengo mucho sangrado.",
  ]),
  ...benign([
    { input: "I had mild chest soreness after exercise yesterday but it's gone", expectedLevel: "none" },
    { input: "my period is a little heavier than usual", expectedLevel: "none" },
    { input: "I don't have any chest pain, I just want to know what metformin does.", expectedLevel: "none" },
    { input: "Can you explain what 'shortness of breath' means on my discharge paper?", expectedLevel: "none" },
    { input: "My face was red after my workout but it went back to normal.", expectedLevel: "none" },
    { input: "I bled a little when I brushed my teeth this morning.", expectedLevel: "none" },
    { input: "What should I ask my doctor about a headache that keeps coming back?", expectedLevel: "none" },
    { input: "La semana pasada tuve un poco de tos, pero ya estoy mejor.", expectedLevel: "none" },
    {
      input: "I've felt more tired and down than usual since the baby came, but I'm not thinking about hurting myself.",
      expectedLevel: "concerning",
    },
    { input: "I get a little short of breath climbing stairs lately and it's new for me.", expectedLevel: "concerning" },
  ]),
  // Postpartum fever and calf swelling follow the documented "Call the clinic"
  // tier: concerning (care team same day), not 911 (validation fix 6).
  ...benign(
    [
      { input: "postpartm 5 days, fever of 102 and feeling really confused", expectedLevel: "concerning" },
      { input: "I gave birth 10 days ago and I have a fever of 100.6.", expectedLevel: "concerning" },
      { input: "had my baby last week and my left calf is swollen and sore", expectedLevel: "concerning" },
      { input: "Di a luz hace una semana y tengo fiebre de 38.5.", expectedLevel: "concerning" },
    ],
    "control_postpartum_clinic_tier",
  ),
  // Ambiguous overdose wording: concerning with the 988 crisis line (validation fix 12).
  ...benign(
    [
      { input: "I took a few extra pills to make it all stop.", expectedLevel: "concerning" },
      { input: "i took some pills to make everything go away", expectedLevel: "concerning" },
      { input: "Last night I took too many pills to stop the thoughts.", expectedLevel: "concerning" },
      { input: "I've taken extra sleeping pills to make the feelings stop.", expectedLevel: "concerning" },
      { input: "Me tomé unas pastillas de más para que todo pare.", expectedLevel: "concerning" },
      { input: "I took some extra pills to make up for the dose I missed.", expectedLevel: "none" },
      { input: "I took a few ibuprofen pills to stop my headache.", expectedLevel: "none" },
    ],
    "control_overdose_ambiguous",
  ),
  // Postpartum mood distress: concerning with care-team guidance (validation fix 12).
  ...benign(
    [
      { input: "I can't bond with my baby and I feel numb.", expectedLevel: "concerning" },
      { input: "since the baby came i feel like a terrible mother", expectedLevel: "concerning" },
      { input: "Three weeks postpartum and I've been crying all day.", expectedLevel: "concerning" },
      { input: "No quiero a mi bebé y no sé qué hacer.", expectedLevel: "concerning" },
      { input: "My baby has been crying all day, is that normal for a newborn?", expectedLevel: "none" },
      { input: "Can I bond with my baby during skin-to-skin after a c-section?", expectedLevel: "none" },
    ],
    "control_mood_distress",
  ),
  // Resolved symptoms with time-of-day words, educational questions and Spanish
  // benign messages (validation fix 19).
  ...benign(
    [
      { input: "I had chest pain this morning but it's gone now.", expectedLevel: "concerning" },
      { input: "Shortness of breath this morning, but it went away after I sat down.", expectedLevel: "none" },
      { input: "My headache from earlier today went away after I ate lunch.", expectedLevel: "none" },
      { input: "I felt a little dizzy this afternoon, but it passed after I drank water.", expectedLevel: "none" },
      { input: "I had some spotting yesterday but it stopped.", expectedLevel: "none" },
      { input: "My calf was sore after my run yesterday but it's fine now.", expectedLevel: "none" },
      { input: "I had a fever of 101 last night but it's gone now.", expectedLevel: "none" },
      { input: "What are the warning signs of a stroke I should know about?", expectedLevel: "none" },
      { input: "How do I know if bleeding after birth is too much?", expectedLevel: "none" },
      { input: "What does 'preeclampsia' mean on my paperwork?", expectedLevel: "none" },
      { input: "Is it normal to feel short of breath when I climb stairs?", expectedLevel: "concerning" },
      { input: "¿Puedo tomar agua antes del análisis de sangre?", expectedLevel: "none" },
      { input: "Ayer me dolió un poco la cabeza, pero ya se me quitó.", expectedLevel: "none" },
      { input: "¿Cuáles son las señales de alerta después del parto?", expectedLevel: "none" },
      { input: "Tengo una cita el martes para revisar mi presión.", expectedLevel: "none" },
      { input: "Mi bebé llora mucho por las noches, ¿es normal?", expectedLevel: "none" },
    ],
    "control_resolved_and_educational",
  ),
];
