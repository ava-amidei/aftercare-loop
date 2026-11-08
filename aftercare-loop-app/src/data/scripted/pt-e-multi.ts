// Scripted Demo Mode content for fictional patient pt-e-multi (Gloria Bennett). Lighter coverage.
// Every quote is an exact substring of the fixture document (asserted in tests).
import { ptEMulti } from "@/data/patients/pt-e-multi";
import type { ScriptedPatientContent } from "./types";

const Q = {
  hospital: "You came in for a follow-up visit 1 week after a hospital stay for fluid buildup related to heart failure.",
  handout:
    "You brought a handout from your diabetes education class that says to drink plenty of water, especially when your blood sugar is high.",
  skipped: "You also told us that one of your medicines has become expensive and you have sometimes skipped doses to make it last.",
  improving: "Your heart failure is improving since your hospital stay, and your lungs sounded clear today.",
  weight: "Your weight today was 168 pounds, which is 9 pounds less than when you were in the hospital.",
  kidney: "Your kidney function is reduced and stable, consistent with chronic kidney disease stage 3.",
  a1c: "Your most recent A1C was 7.6%.",
  matters:
    "Because you have heart failure and kidney disease together, the amount of fluid you drink matters more for you than for most people.",
  general:
    "General advice to drink more water may not apply to you; please ask your care team before changing how much you drink.",
  furosemide: "Take furosemide 40 mg once each morning.",
  continue: "Continue lisinopril 10 mg once a day and insulin glargine 20 units at bedtime as before.",
  tellCost: "Please tell us before skipping or stretching any medicine because of cost.",
  pharmacist: "Our clinic pharmacist can review lower-cost options and patient assistance programs with you.",
  fluidLimit: "Limit your total fluids to 1.5 liters (about 6 cups) per day, including soups and drinks.",
  weigh: "Weigh yourself every morning after using the bathroom and before breakfast, and write down your weight.",
  callWeight: "Call the clinic if your weight goes up by more than 2 pounds in one day or 5 pounds in one week.",
  labs: "Get blood work for kidney function and potassium at the lab by October 30, 2026.",
  bring: "Bring your weight log and your diabetes class handout to your next visit so we can review them together.",
  callClinic:
    "Call the clinic if your blood sugar stays above 300, if you feel dizzy when standing, or if your legs or belly are more swollen.",
  call911:
    "Call 911 if you have chest pain, severe shortness of breath, trouble breathing when lying flat that does not improve when sitting up, or you cough up pink, frothy mucus.",
} as const;

const doc = ptEMulti.document;

export const scriptedPtE: ScriptedPatientContent = {
  patientId: ptEMulti.profile.id,
  documentId: doc.id,
  language: "en",
  interpretation: {
    whatThisMeans:
      "Your after-visit summary is from a follow-up 1 week after a hospital stay for fluid buildup related to heart failure. It says your heart failure is improving, your lungs sounded clear, and your weight today was 168 pounds — 9 pounds less than in the hospital. Your kidney function is reduced and stable, consistent with chronic kidney disease stage 3, and your most recent A1C was 7.6%. Because you have heart failure and kidney disease together, your summary says the amount of fluid you drink matters more for you than for most people, and it limits total fluids to 1.5 liters (about 6 cups) a day. Your diabetes class handout says to drink plenty of water; your summary says general advice to drink more water may not apply to you and asks you to check with your care team before changing how much you drink. This is a possible conflict to clarify with your care team, not something to resolve on your own.",
    terms: [
      {
        term: "Heart failure",
        find: "heart failure",
        definition:
          "A condition in which the heart does not pump as well as the body needs. It does not mean the heart has stopped. Fluid can build up in the body, which is why weight and fluids are tracked.",
        referenceIds: ["ref-medlineplus-heart-failure"],
      },
      {
        term: "Chronic kidney disease stage 3",
        find: "chronic kidney disease stage 3",
        definition:
          "Long-term reduced kidney function. Stages go from 1 to 5; stage 3 means moderately reduced function. Your summary says yours is reduced and stable.",
        referenceIds: ["ref-niddk-chronic-kidney-disease"],
      },
      {
        term: "A1C",
        find: "A1C",
        definition: "A blood test that reflects your average blood sugar over the past few months.",
        referenceIds: ["ref-medlineplus-a1c-test", "ref-medlineplus-type2-diabetes"],
      },
      {
        term: "Furosemide",
        find: "furosemide",
        definition: "A “water pill” (diuretic) that helps the body get rid of extra fluid through urine.",
        referenceIds: ["ref-medlineplus-furosemide"],
      },
      {
        term: "Potassium",
        find: "potassium",
        definition:
          "A mineral in the blood that helps muscles and the heart work. Some heart and kidney medicines can change potassium levels, which is one reason it is checked.",
        referenceIds: ["ref-medlineplus-potassium"],
      },
      {
        term: "Insulin glargine",
        find: "insulin glargine",
        definition: "A long-acting insulin that helps control blood sugar. Your summary says to continue 20 units at bedtime as before.",
        referenceIds: ["ref-medlineplus-type2-diabetes"],
      },
    ],
    whatToKnow: [
      "In general, people with heart failure are often asked to weigh themselves daily, because quick weight gain can be a sign of fluid buildup.",
      "In general, fluid advice can differ between conditions, and advice written for one condition may not fit someone managing several conditions at once.",
      "In general, the A1C test reflects average blood sugar over the past few months.",
      "Generally, pharmacists can help review lower-cost medicine options, such as generics or assistance programs.",
    ],
    discussWithProvider: [
      "My diabetes handout says to drink plenty of water, but my summary limits fluids to 1.5 liters. Which advice should I follow?",
      "What should I do when my blood sugar is high, given my fluid limit?",
      "Can I meet with the clinic pharmacist about lower-cost options for my medicine?",
      "What will my kidney function and potassium results tell us?",
    ],
    unansweredQuestions: [
      "Which fluid advice to follow when your blood sugar is high — your summary asks you to check with your care team.",
      "Which medicine has become expensive and what lower-cost options exist.",
    ],
    limitations: [
      "Your summary does not say how to handle thirst or high blood sugar within your fluid limit; ask your care team.",
      "Your summary does not say which medicine became expensive or what the lower-cost options are.",
      "Your summary does not link to education materials about heart failure or kidney disease; the general references shown here are not specific to you, so ask your care team which materials fit your situation.",
    ],
    safetyFlags: [
      {
        level: "clarify_with_clinician",
        message:
          "Possible conflict: your diabetes class handout says to drink plenty of water, but your summary limits total fluids to 1.5 liters (about 6 cups) per day. Your summary says to ask your care team before changing how much you drink — bring the handout to your next visit.",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Your summary asks you to tell the clinic before skipping or stretching any medicine because of cost. The clinic pharmacist can review lower-cost options with you.",
      },
      {
        level: "info",
        message:
          "Your summary's “When to seek care” section says to call 911 for chest pain, severe shortness of breath, trouble breathing when lying flat that does not improve when sitting up, or coughing up pink, frothy mucus.",
      },
    ],
    referenceIds: [
      "ref-medlineplus-heart-failure",
      "ref-niddk-chronic-kidney-disease",
      "ref-medlineplus-type2-diabetes",
      "ref-medlineplus-a1c-test",
      "ref-medlineplus-furosemide",
      "ref-medlineplus-save-money-medicines",
    ],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Here are some questions you could bring to your next visit:\n\n1. My diabetes handout says to drink plenty of water, but my summary limits fluids to 1.5 liters. Which advice should I follow?\n2. What should I do when my blood sugar is high, given my fluid limit?\n3. Can I meet with the clinic pharmacist about lower-cost options?\n4. What will my kidney and potassium blood work tell us?\n\nYour summary asks you to bring your weight log and the diabetes class handout.",
      sourceQuotes: [Q.handout, Q.general, Q.pharmacist, Q.bring],
      referenceIds: ["ref-ahrq-questions-are-the-answer"],
      actions: [
        { kind: "add_question", label: "Add the fluid question", payload: { question: "My diabetes handout says to drink plenty of water, but my summary limits fluids to 1.5 liters. Which advice should I follow?" } },
        { kind: "prepare_appointment", label: "Prepare for my appointment" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Your summary documents three conditions:\n\n• Heart failure — “improving since your hospital stay, and your lungs sounded clear today.”\n• Chronic kidney disease stage 3 — kidney function “reduced and stable.”\n• Type 2 diabetes, listed in your health profile; your summary notes a most recent A1C of 7.6%.\n\nBecause you have heart failure and kidney disease together, your summary says the amount of fluid you drink matters more for you than for most people. Your clinician can explain how these conditions affect each other for you.",
      sourceQuotes: [Q.improving, Q.kidney, Q.a1c, Q.matters],
      referenceIds: ["ref-medlineplus-heart-failure", "ref-niddk-chronic-kidney-disease", "ref-medlineplus-type2-diabetes"],
      actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.matters } }],
    },
    understand_my_results: {
      content:
        "Here is what your summary says about your results:\n\n• Weight: 168 pounds, 9 pounds less than in the hospital.\n• Kidney function: reduced and stable, consistent with chronic kidney disease stage 3.\n• A1C: 7.6% (this reflects average blood sugar over the past few months).\n• Lungs: sounded clear today.\n\nYour kidney function and potassium blood work is due by October 30, 2026.",
      sourceQuotes: [Q.weight, Q.kidney, Q.a1c, Q.improving, Q.labs],
      referenceIds: ["ref-medlineplus-a1c-test", "ref-niddk-chronic-kidney-disease", "ref-medlineplus-potassium"],
      actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.a1c } }],
    },
    plan_next_steps: {
      content:
        "Your summary lists five clinician-documented steps:\n\n1. Take furosemide 40 mg once each morning.\n2. Limit total fluids to 1.5 liters (about 6 cups) per day, including soups and drinks.\n3. Weigh yourself every morning and write it down.\n4. Call the clinic if your weight goes up by more than 2 pounds in one day or 5 pounds in one week.\n5. Get kidney function and potassium blood work by October 30, 2026.\n\nYou mentioned a medicine has become expensive. Your summary says the clinic pharmacist can review lower-cost options and patient assistance programs with you — and asks you to tell the clinic before skipping or stretching any medicine.",
      sourceQuotes: [Q.furosemide, Q.fluidLimit, Q.weigh, Q.callWeight, Q.labs, Q.pharmacist, Q.tellCost],
      referenceIds: ["ref-medlineplus-furosemide", "ref-medlineplus-save-money-medicines"],
      actions: [
        { kind: "view_action_plan", label: "View my action plan" },
        { kind: "add_question", label: "Ask about lower-cost options", payload: { question: "Can I meet with the clinic pharmacist about lower-cost options for my medicine?" } },
      ],
    },
    free_text: {
      content:
        "Ask me anything about your visit summary. For example: “Should I drink more water?”, “What if I can't afford my medicine?”, or “When is my blood work due?” I'll answer from your summary and tell you when it doesn't say.",
      referenceIds: [],
    },
  },

  freeText: [
    {
      id: "stop-medication",
      questions: ["can i stop my medication", "can i skip my medicine because of cost", "i cant afford my medicine"],
      keywords: [
        ["stop", "medic"],
        ["stop", "taking"],
        ["quit"],
        ["skip"],
        ["stretch"],
        ["afford"],
        ["cost"],
        ["expensive"],
        ["dose"],
        // Missed / doubled doses (judge-panel fix).
        ["double"],
        ["missed", "medic"],
        ["missed", "pill"],
        ["forgot", "medic"],
        ["forgot", "pill"],
        ["extra", "dose"],
        ["make up"],
      ],
      reply: {
        content:
          "I can't tell you to stop, skip, or change a medicine — that decision belongs to your care team. Your summary says: “Please tell us before skipping or stretching any medicine because of cost.”\n\nIt also says: “Our clinic pharmacist can review lower-cost options and patient assistance programs with you.” That could be a good next call.",
        sourceQuotes: [Q.tellCost, Q.pharmacist],
        referenceIds: ["ref-medlineplus-save-money-medicines"],
        actions: [
          { kind: "add_question", label: "Ask about lower-cost options", payload: { question: "Can I meet with the clinic pharmacist about lower-cost options for my medicine?" } },
        ],
      },
    },
    {
      id: "water",
      questions: ["should i drink more water", "how much water can i drink", "my handout says to drink plenty of water"],
      keywords: [["water"], ["fluid"], ["drink"], ["thirst"], ["handout"]],
      reply: {
        content:
          "Your summary says: “Limit your total fluids to 1.5 liters (about 6 cups) per day, including soups and drinks.” It also says: “General advice to drink more water may not apply to you; please ask your care team before changing how much you drink.”\n\nYour diabetes handout and your visit summary seem to give different advice. I can't decide which applies to you — please ask your care team, and bring the handout to your next visit as your summary suggests.",
        sourceQuotes: [Q.fluidLimit, Q.general, Q.bring],
        referenceIds: [],
        actions: [
          { kind: "add_question", label: "Add the fluid question", payload: { question: "My diabetes handout says to drink plenty of water, but my summary limits fluids to 1.5 liters. Which advice should I follow?" } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-e-2" } },
        ],
      },
    },
    {
      id: "weight",
      questions: ["why do i weigh myself every day", "what if my weight goes up"],
      keywords: [["weigh"], ["weight"], ["scale"], ["pound"]],
      reply: {
        content:
          "Your summary says: “Weigh yourself every morning after using the bathroom and before breakfast, and write down your weight.” and “Call the clinic if your weight goes up by more than 2 pounds in one day or 5 pounds in one week.”\n\nIn general, quick weight gain can be a sign of fluid buildup, which is why daily weights are part of many heart failure plans.",
        sourceQuotes: [Q.weigh, Q.callWeight],
        referenceIds: ["ref-medlineplus-heart-failure"],
        actions: [{ kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-e-3" } }],
      },
    },
    {
      id: "follow-up",
      questions: ["when is my follow up", "when is my blood work due", "what does my follow up plan say"],
      keywords: [["follow"], ["blood", "work"], ["lab"], ["next", "visit"], ["october"]],
      reply: {
        content:
          "Your summary says: “Get blood work for kidney function and potassium at the lab by October 30, 2026.” It doesn't give a date for your next visit, but it asks you to bring your weight log and diabetes class handout to it.",
        sourceQuotes: [Q.labs, Q.bring],
        referenceIds: ["ref-niddk-chronic-kidney-disease", "ref-medlineplus-potassium"],
        actions: [{ kind: "view_action_plan", label: "View my action plan" }],
      },
    },
    {
      id: "is-this-serious",
      questions: ["is this serious", "should i be worried"],
      keywords: [["serious"], ["dangerous"], ["worry"], ["worried"], ["scared"]],
      reply: {
        content:
          "I can't tell you how serious this is for you. Your summary says your heart failure is improving since your hospital stay. It also lists when to get help: call the clinic if your blood sugar stays above 300, you feel dizzy when standing, or your legs or belly are more swollen.\n\nCall 911 for chest pain, severe shortness of breath, trouble breathing when lying flat that does not improve when sitting up, or coughing up pink, frothy mucus.",
        sourceQuotes: [Q.improving, Q.callClinic, Q.call911],
        referenceIds: [],
      },
    },
  ],

  clarifications: {
    "tb-pt-e-1": [
      `Let me explain that another way. Your summary says: "${Q.fluidLimit}" That's a limit — no more than 1.5 liters, or about 6 cups, in a whole day. Soups and all drinks count toward it, not just water.`,
      `Here's another way to picture it. Imagine 6 cups as your daily total. Each drink or bowl of soup uses part of that total. Your summary says: "${Q.fluidLimit}" Some people find it helpful to write down what they drink. If you have questions about what counts, your care team can help.`,
    ],
    "tb-pt-e-2": [
      `Let me explain that another way. Your visit summary says: "${Q.general}" Because you have heart failure and kidney disease together, the handout's advice to drink plenty of water may not fit you. Keep to your documented 1.5-liter limit and ask your care team which advice to follow.`,
      `Here's another way to think about it. The diabetes handout was written for many people, and your visit summary was written for you. When the two seem to disagree, your summary asks you to check with your care team first: "${Q.general}" Bringing the handout to your next visit, as your summary suggests, lets them review it with you.`,
    ],
    "tb-pt-e-3": [
      `Let me explain that another way. Your summary says: "${Q.callWeight}" So if the scale shows more than 2 pounds up from one day to the next, or more than 5 pounds up over a week, call the clinic.`,
      `Here's another way to think about it. Your daily morning weight works like a check on fluid, and writing it down makes a quick change easier to spot. Your summary says: "${Q.callWeight}" For example, going from 168 to 171 pounds overnight would be more than 2 pounds, which is a reason to call.`,
    ],
  },
};
