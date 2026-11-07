// Scripted Demo Mode content for fictional patient pt-d-pots (Hannah Okafor). Lighter coverage.
// Every quote is an exact substring of the fixture document (asserted in tests).
import { ptDPots } from "@/data/patients/pt-d-pots";
import type { ScriptedPatientContent } from "./types";

const Q = {
  tilt: "Your tilt table test showed your heart rate went up by more than 30 beats per minute within 10 minutes of standing, without a drop in blood pressure.",
  fits: "Together with your symptoms, this fits postural orthostatic tachycardia syndrome (POTS).",
  echo: "Your heart ultrasound (echocardiogram) and heart rhythm monitor were normal.",
  blood: "Your blood counts and thyroid tests were normal.",
  what: "POTS affects how the body controls heart rate and blood flow when changing position.",
  planFocus:
    "The plan below focuses on increasing blood volume, supporting blood flow back to the heart, and slowly rebuilding activity.",
  pt: "A physical therapy referral for a reconditioning program was discussed and will be decided at your next visit.",
  propranolol: "Take propranolol 10 mg once each morning.",
  tiredMed: "This medicine can make you feel tired at first.",
  noStop: "Do not stop it suddenly or change the dose on your own; talk with us first.",
  fluid: "Drink 2 to 3 liters of fluid each day, spread out across the day.",
  salt: "Add about 3 grams of extra salt to your food each day, as we discussed.",
  stockings: "Wear waist-high compression stockings during the day, especially when you will be standing for long periods.",
  followUp: "Schedule a follow-up visit with cardiology in 3 months.",
  individual:
    "The fluid and salt amounts above were chosen for you based on your test results and health history; they are not general advice for everyone.",
  dizzy: "Try sitting or lying down at the first sign of dizziness, and stand up slowly in the morning.",
  note: "A note for your school's disability services office can be provided if you need it.",
  callClinic: "Call the clinic if you faint, if your symptoms get worse even with this plan, or if you have swelling in your legs.",
  call911:
    "Call 911 if you faint and hit your head, or if you have chest pain, severe shortness of breath, or a heartbeat that is very fast and does not slow down when you lie down.",
} as const;

const doc = ptDPots.document;

export const scriptedPtD: ScriptedPatientContent = {
  patientId: ptDPots.profile.id,
  documentId: doc.id,
  language: "en",
  interpretation: {
    whatThisMeans:
      "Your after-visit summary says your tilt table test showed your heart rate went up by more than 30 beats per minute within 10 minutes of standing, without a drop in blood pressure. Together with your symptoms, your clinician wrote that this fits postural orthostatic tachycardia syndrome (POTS), which affects how the body controls heart rate and blood flow when changing position. Your echocardiogram, heart rhythm monitor, blood counts, and thyroid tests were listed as normal. Your plan includes specific amounts of fluid and salt, compression stockings, propranolol each morning, and a cardiology visit in 3 months. Your summary is clear that the fluid and salt amounts were chosen for you and are not general advice for everyone.",
    terms: [
      {
        term: "Tilt table test",
        find: "tilt table test",
        definition:
          "A test in which you lie on a table that tilts you upright while your heart rate and blood pressure are monitored.",
        referenceIds: ["ref-ninds-pots"],
      },
      {
        term: "Postural orthostatic tachycardia syndrome (POTS)",
        find: "postural orthostatic tachycardia syndrome (POTS)",
        definition:
          "A condition that affects how the body controls heart rate and blood flow when changing position. “Tachycardia” means a fast heart rate.",
        referenceIds: ["ref-ninds-pots"],
      },
      {
        term: "Echocardiogram",
        find: "echocardiogram",
        definition: "An ultrasound of the heart that shows its structure and how well it pumps.",
        referenceIds: [],
      },
      {
        term: "Propranolol",
        find: "propranolol",
        definition:
          "A beta-blocker, a type of medicine that can slow the heart rate. Your summary says not to stop it suddenly or change the dose on your own.",
        referenceIds: [],
      },
      {
        term: "Compression stockings",
        find: "compression stockings",
        definition: "Snug stockings that gently squeeze the legs to help blood flow back toward the heart.",
        referenceIds: ["ref-ninds-pots"],
      },
      {
        term: "Reconditioning program",
        find: "reconditioning program",
        definition:
          "An exercise plan, often guided by a physical therapist, that slowly builds activity back up. Your summary says the referral will be decided at your next visit.",
        referenceIds: [],
      },
    ],
    whatToKnow: [
      "In general, POTS care plans are individualized, and fluid and salt amounts are set by a clinician for each person.",
      "In general, POTS symptoms can be brought on or made worse by heat and by standing for long periods.",
      "Generally, standing up slowly and sitting or lying down at the first sign of lightheadedness are common strategies for symptoms on standing.",
      "In general, beta-blockers should not be stopped suddenly without guidance from the prescriber.",
    ],
    discussWithProvider: [
      "What counts toward my 2 to 3 liters of fluid each day?",
      "How will we decide about the physical therapy reconditioning program at my next visit?",
      "How will we know whether propranolol is helping?",
      "Can you provide the note for my school's disability services office?",
    ],
    unansweredQuestions: [
      "Whether physical therapy will be part of the plan — this will be decided at the next visit.",
      "How long propranolol will be part of the plan.",
    ],
    limitations: [
      "Your summary does not say which drinks count toward your 2 to 3 liters of fluid.",
      "Your summary does not say whether to start new exercise before the physical therapy decision.",
      "Your summary does not say how long you will take propranolol.",
    ],
    safetyFlags: [
      {
        level: "info",
        message:
          "Your summary's “When to seek care” section says to call 911 if you faint and hit your head, or if you have chest pain, severe shortness of breath, or a heartbeat that is very fast and does not slow down when you lie down.",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Your fluid and salt amounts were chosen for you and are not general advice for everyone. Ask your care team before changing them.",
      },
    ],
    referenceIds: ["ref-ninds-pots", "ref-ahrq-questions-are-the-answer"],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Here are some questions you could bring to your cardiology follow-up:\n\n1. What counts toward my 2 to 3 liters of fluid each day?\n2. How will we decide about physical therapy?\n3. How will we know whether propranolol is helping?\n4. Can you write the note for my school's disability services office?",
      sourceQuotes: [Q.fluid, Q.pt, Q.note],
      referenceIds: ["ref-ahrq-questions-are-the-answer"],
      actions: [
        { kind: "add_question", label: "Add a question to my list", payload: { question: "What counts toward my 2 to 3 liters of fluid each day?" } },
        { kind: "prepare_appointment", label: "Prepare for my appointment" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Your summary says: “Together with your symptoms, this fits postural orthostatic tachycardia syndrome (POTS).” It explains that POTS affects how the body controls heart rate and blood flow when changing position.\n\nYour plan focuses on increasing blood volume, supporting blood flow back to the heart, and slowly rebuilding activity. Your clinician can explain what this means for you specifically.",
      sourceQuotes: [Q.fits, Q.what, Q.planFocus],
      referenceIds: ["ref-ninds-pots"],
      actions: [
        { kind: "view_source", label: "View original source", payload: { quote: Q.fits } },
        { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-d-1" } },
      ],
    },
    understand_my_results: {
      content:
        "Here is what your summary says about your results:\n\n• Tilt table test: your heart rate went up by more than 30 beats per minute within 10 minutes of standing, without a drop in blood pressure.\n• Echocardiogram and heart rhythm monitor: normal.\n• Blood counts and thyroid tests: normal.",
      sourceQuotes: [Q.tilt, Q.echo, Q.blood],
      referenceIds: ["ref-ninds-pots"],
      actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.tilt } }],
    },
    plan_next_steps: {
      content:
        "Your summary lists five clinician-documented steps:\n\n1. Take propranolol 10 mg once each morning.\n2. Drink 2 to 3 liters of fluid each day, spread out across the day.\n3. Add about 3 grams of extra salt to your food each day.\n4. Wear waist-high compression stockings during the day.\n5. Schedule a cardiology follow-up in 3 months.\n\nYour summary says the fluid and salt amounts were chosen for you — they are not general advice for everyone.",
      sourceQuotes: [Q.propranolol, Q.fluid, Q.salt, Q.stockings, Q.followUp, Q.individual],
      referenceIds: ["ref-ninds-pots"],
      actions: [{ kind: "view_action_plan", label: "View my action plan" }],
    },
    free_text: {
      content:
        "Ask me anything about your visit summary. For example: “How much fluid should I drink?”, “When is my follow-up?”, or “Can I stop my medication?” I'll answer from your summary and tell you when it doesn't say.",
      referenceIds: [],
    },
  },

  freeText: [
    {
      id: "stop-medication",
      questions: ["can i stop my medication", "can i stop taking propranolol"],
      keywords: [["stop", "medic"], ["stop", "propranolol"], ["stop", "taking"], ["quit"], ["dose"], ["skip"]],
      reply: {
        content:
          "I can't tell you to stop or change a medicine. Your summary says: “Do not stop it suddenly or change the dose on your own; talk with us first.”\n\nIt also notes: “This medicine can make you feel tired at first.” If that's bothering you, please talk with your care team.",
        sourceQuotes: [Q.noStop, Q.tiredMed],
        referenceIds: [],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "I'd like to talk about how propranolol is working for me." } },
        ],
      },
    },
    {
      id: "fluid-salt",
      questions: ["how much fluid should i drink", "how much salt should i eat"],
      keywords: [["fluid"], ["water"], ["drink"], ["salt"], ["liter"]],
      reply: {
        content:
          "Your summary says: “Drink 2 to 3 liters of fluid each day, spread out across the day.” and “Add about 3 grams of extra salt to your food each day, as we discussed.”\n\nIt also says these amounts “were chosen for you based on your test results and health history; they are not general advice for everyone.” Please check with your care team before changing them.",
        sourceQuotes: [Q.fluid, Q.salt, Q.individual],
        referenceIds: ["ref-ninds-pots"],
        actions: [{ kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-d-1" } }],
      },
    },
    {
      id: "follow-up",
      questions: ["when is my follow up", "what does my follow up plan say"],
      keywords: [["follow"], ["next", "visit"], ["next", "appointment"], ["cardiology"]],
      reply: {
        content:
          "Your summary says: “Schedule a follow-up visit with cardiology in 3 months.” It also says the physical therapy referral will be decided at your next visit.",
        sourceQuotes: [Q.followUp, Q.pt],
        referenceIds: [],
        actions: [{ kind: "view_action_plan", label: "View my action plan" }],
      },
    },
    {
      id: "exercise",
      questions: ["can i exercise", "should i start working out"],
      keywords: [["exercis"], ["workout"], ["working", "out"], ["gym"], ["physical", "therapy"]],
      reply: {
        content:
          "Your summary says: “A physical therapy referral for a reconditioning program was discussed and will be decided at your next visit.” It doesn't say whether to start new exercise before then, so that's a good question for your care team.",
        sourceQuotes: [Q.pt],
        referenceIds: ["ref-ninds-pots"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What activity is okay for me before the physical therapy decision?" } },
        ],
      },
    },
    {
      id: "is-this-serious",
      questions: ["is this serious", "should i be worried"],
      keywords: [["serious"], ["dangerous"], ["worry"], ["worried"], ["scared"], ["faint"]],
      reply: {
        content:
          "I can't tell you how serious this is for you. Your summary lists when to get help: “Call the clinic if you faint, if your symptoms get worse even with this plan, or if you have swelling in your legs.”\n\nIt also says to call 911 if you faint and hit your head, or have chest pain, severe shortness of breath, or a very fast heartbeat that does not slow down when you lie down.",
        sourceQuotes: [Q.callClinic, Q.call911],
        referenceIds: ["ref-ninds-pots"],
      },
    },
  ],

  clarifications: {
    "tb-pt-d-1": [
      `Let me explain that another way. Your plan says: "${Q.fluid}" That's 2 to 3 liters in total each day, sipped across the day instead of all at once. These amounts were chosen for you, so check with your care team before changing them.`,
      `Here's another way to picture it. A liter is a little more than 4 cups, so 2 to 3 liters is a bit more than 8 to 12 cups across the whole day. Your plan says: "${Q.fluid}" Spreading it out, with some at each meal and some in between, matches what your plan describes.`,
    ],
    "tb-pt-d-2": [
      `Let me explain that another way. Your plan says: "${Q.salt}" That means adding about 3 grams of salt on top of what you usually eat, every day. This amount was chosen for you; it is not general advice for everyone.`,
      `Here's another way to think about it. Many people hear advice to cut back on salt, so this part of your plan can feel surprising. Your plan is different because it was chosen for your situation: "${Q.salt}" If you're not sure how to measure about 3 grams, that's a good question for your care team.`,
    ],
    "tb-pt-d-3": [
      `Let me explain that another way. Your plan says: "${Q.stockings}" Put them on for the daytime, when you're up and about, and especially on days when you'll be standing a long time, like waiting in line or in class.`,
      `Here's another way to picture it. The stockings help while you're upright, which is when your symptoms tend to happen. Your plan says: "${Q.stockings}" They are waist-high, so they cover your legs all the way up. Questions about fit or comfort are good to bring to your care team.`,
    ],
  },
};
