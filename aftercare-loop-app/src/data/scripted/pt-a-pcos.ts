// Scripted Demo Mode content for fictional patient pt-a-pcos (Maya Thompson).
// Every quote below is an exact substring of the fixture document (asserted in tests).
import { ptAPcos } from "@/data/patients/pt-a-pcos";
import type { ScriptedPatientContent } from "./types";

const Q = {
  fitPcos: "Your symptoms, lab results, and ultrasound together fit polycystic ovary syndrome (PCOS).",
  whatPcos: "PCOS is a common hormone condition that can affect periods, skin, hair growth, and how the body uses insulin.",
  testosterone: "Your testosterone level was mildly elevated.",
  insulin: "Your fasting insulin was elevated, which suggests insulin resistance.",
  ultrasound: "Your ultrasound showed many small follicles on both ovaries; these are not dangerous cysts.",
  thyroid: "Your thyroid and prolactin tests were normal.",
  managed: "We talked about how PCOS can be managed over time and how the plan can change based on your goals.",
  metformin: "Take metformin 500 mg twice daily with breakfast and dinner.",
  sideEffects: "Metformin can cause stomach upset or loose stools at first; taking it with food helps.",
  noChange: "Please do not change how much you take without talking with us first.",
  bloodTest: "Get a fasting blood test for glucose and cholesterol at the lab within the next 2 weeks.",
  trackPeriods: "Track the start and end dates of your periods in a calendar or app.",
  followUp: "Schedule a follow-up appointment in 3 months to review your labs and symptoms.",
  fasting: "Fasting means nothing to eat or drink except water for 8 hours before the test.",
  telehealth: "Our front desk can tell you about telehealth options for the follow-up visit if travel is difficult.",
  bring: "Bring your period calendar and any questions you have about PCOS, skin changes, or future pregnancy plans to your next visit.",
  callUpset: "Call the clinic if stomach upset from metformin lasts longer than 2 weeks or keeps you from eating.",
  call90: "Call the clinic if you go more than 90 days without a period.",
  call911: "Call 911 or go to the nearest emergency room if you have severe belly pain, fainting, chest pain, or trouble breathing.",
} as const;

const doc = ptAPcos.document;

export const scriptedPtA: ScriptedPatientContent = {
  patientId: ptAPcos.profile.id,
  documentId: doc.id,
  language: "en",
  interpretation: {
    whatThisMeans:
      "Your after-visit summary says your symptoms, lab results, and ultrasound together fit polycystic ovary syndrome (PCOS). It describes PCOS as a common hormone condition that can affect periods, skin, hair growth, and how the body uses insulin. Your testosterone level was mildly elevated, and your fasting insulin was elevated, which your clinician wrote suggests insulin resistance. The many small follicles seen on your ultrasound are described as not dangerous cysts, and your thyroid and prolactin tests came back in the normal range. Your clinician started metformin and asked you to get a fasting blood test, track your periods, and come back in 3 months. This explains what your summary says; it is not a new diagnosis or medical advice.",
    terms: [
      {
        term: "Polycystic ovary syndrome (PCOS)",
        find: "polycystic ovary syndrome (PCOS)",
        definition:
          "A common hormone condition. Your summary says it can affect periods, skin, hair growth, and how the body uses insulin.",
        referenceIds: ["ref-medlineplus-pcos", "ref-nichd-pcos"],
      },
      {
        term: "Testosterone",
        find: "testosterone",
        definition:
          "A hormone that everyone's body makes in some amount; the ovaries make small amounts. Higher levels can be linked with acne and extra hair growth. Your summary says your level was mildly elevated.",
        referenceIds: ["ref-medlineplus-pcos"],
      },
      {
        term: "Insulin resistance",
        find: "insulin resistance",
        definition:
          "When the body's cells do not respond to insulin as easily as usual, so the body makes more insulin to keep blood sugar in range. Your summary says your elevated fasting insulin suggests this.",
        referenceIds: ["ref-medlineplus-pcos", "ref-nichd-pcos"],
      },
      {
        term: "Follicles",
        find: "follicles",
        definition:
          "Small fluid-filled sacs in the ovaries where eggs develop. Your summary says the many small follicles on your ultrasound are not dangerous cysts.",
        referenceIds: ["ref-medlineplus-pcos"],
      },
      {
        term: "Prolactin",
        find: "prolactin",
        definition:
          "A hormone made by the pituitary gland, a small gland at the base of the brain. Clinicians sometimes check it when periods are irregular. Your summary lists your prolactin test as normal.",
        referenceIds: [],
      },
      {
        term: "Metformin",
        find: "metformin",
        definition:
          "A prescription medicine that helps the body use insulin. Your summary says to take it with breakfast and dinner and notes it can cause stomach upset or loose stools at first.",
        referenceIds: ["ref-medlineplus-metformin"],
      },
      {
        term: "Fasting blood test",
        find: "fasting blood test",
        definition:
          "A blood test done after a stretch of time without food. Your summary defines fasting as nothing to eat or drink except water for 8 hours before the test.",
        referenceIds: [],
      },
      {
        term: "Telehealth",
        find: "telehealth",
        definition: "A visit by phone or video instead of in person.",
        referenceIds: [],
      },
    ],
    whatToKnow: [
      "In general, PCOS is a long-term condition, and care plans are often adjusted over time based on symptoms and personal goals.",
      "In general, insulin resistance means the body needs more insulin than usual to keep blood sugar in range, and it is common in people with PCOS.",
      "Generally, the word “polycystic” refers to the many small follicles that can be seen on the ovaries in PCOS.",
      "In general, drug information sources list stomach upset as a common side effect of metformin and advise taking it with meals.",
      "In general, writing down period start and end dates gives a care team a clearer picture of cycle length over time.",
    ],
    discussWithProvider: [
      "What do my fasting glucose and cholesterol results mean for my care plan?",
      "How will we know whether metformin is helping?",
      "What options are there for the acne and chin hair growth I noticed?",
      "How might PCOS relate to my future pregnancy plans, if I want to talk about that?",
      "Could my 3-month follow-up be a telehealth visit, since getting a ride is hard?",
    ],
    unansweredQuestions: [
      "What the fasting glucose and cholesterol results will show — that test has not been done yet.",
      "Which options for acne or hair growth might fit your goals.",
      "Whether the plan will change after the 3-month follow-up.",
    ],
    limitations: [
      "Your summary does not say what your exact testosterone or insulin numbers were.",
      "Your summary does not say anything about fertility or future pregnancy outcomes; it invites you to bring those questions to your next visit.",
      "Your summary does not say whether telehealth is available for you — only that the front desk can tell you about the options.",
      "Your summary does not say you have diabetes, and this explanation does not suggest that.",
    ],
    safetyFlags: [
      {
        level: "info",
        message:
          "Your summary's “When to seek care” section says to call 911 or go to the nearest emergency room for severe belly pain, fainting, chest pain, or trouble breathing.",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Your summary says not to change how much metformin you take without talking with the clinic first. Ask your care team before making any change.",
      },
      {
        level: "info",
        message:
          "Your summary says to call the clinic if stomach upset from metformin lasts longer than 2 weeks or keeps you from eating, or if you go more than 90 days without a period.",
      },
    ],
    referenceIds: [
      "ref-medlineplus-pcos",
      "ref-nichd-pcos",
      "ref-acog-pcos-faq",
      "ref-medlineplus-metformin",
      "ref-ahrq-questions-are-the-answer",
    ],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Here are some questions you could bring to your 3-month follow-up, based on what your summary says and what it leaves open:\n\n1. What do my fasting glucose and cholesterol results mean for my plan?\n2. How will we know whether metformin is helping?\n3. What options are there for the acne and chin hair growth I mentioned?\n4. Can we talk about how PCOS might relate to future pregnancy plans?\n5. Could my follow-up be a telehealth visit, since the clinic is about an hour away?\n\nYour summary also asks you to bring your period calendar to the next visit.",
      sourceQuotes: [Q.bring, Q.telehealth],
      referenceIds: ["ref-ahrq-questions-are-the-answer", "ref-ahrq-question-builder"],
      actions: [
        { kind: "add_question", label: "Add a question to my list", payload: { question: "What do my fasting glucose and cholesterol results mean for my plan?" } },
        { kind: "add_question", label: "Add the telehealth question", payload: { question: "Could my 3-month follow-up be a telehealth visit?" } },
        { kind: "prepare_appointment", label: "Prepare for my appointment" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Your summary documents one diagnosis: polycystic ovary syndrome (PCOS). It says your symptoms, lab results, and ultrasound together fit PCOS, and describes PCOS as a common hormone condition that can affect periods, skin, hair growth, and how the body uses insulin.\n\nIt also notes your fasting insulin was elevated, which suggests insulin resistance, and that PCOS can be managed over time with a plan that can change based on your goals.\n\nI can only explain what is written in your summary. Your clinician is the best person to explain what PCOS means for you specifically.",
      sourceQuotes: [Q.fitPcos, Q.whatPcos, Q.managed],
      referenceIds: ["ref-medlineplus-pcos", "ref-nichd-pcos", "ref-acog-pcos-faq"],
      actions: [
        { kind: "view_source", label: "View original source", payload: { quote: Q.fitPcos } },
        { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-a-1" } },
      ],
    },
    understand_my_results: {
      content:
        "Here is what your summary says about each result:\n\n• Testosterone: mildly elevated.\n• Fasting insulin: elevated, which your clinician wrote suggests insulin resistance.\n• Ultrasound: many small follicles on both ovaries; your summary says these are not dangerous cysts.\n• Thyroid and prolactin: listed as normal.\n\nYour summary does not list the exact numbers, and the fasting glucose and cholesterol test has not been done yet. You could ask your clinician to walk you through the numbers at your follow-up.",
      sourceQuotes: [Q.testosterone, Q.insulin, Q.ultrasound, Q.thyroid],
      referenceIds: ["ref-medlineplus-pcos", "ref-nichd-pcos"],
      actions: [
        { kind: "view_source", label: "View original source", payload: { quote: Q.insulin } },
        { kind: "add_question", label: "Add a question to my list", payload: { question: "Can you walk me through my testosterone and insulin numbers?" } },
      ],
    },
    plan_next_steps: {
      content:
        "Your summary lists four clinician-documented next steps:\n\n1. Take metformin 500 mg twice daily with breakfast and dinner.\n2. Get a fasting blood test for glucose and cholesterol at the lab within the next 2 weeks (nothing to eat or drink except water for 8 hours before).\n3. Track the start and end dates of your periods.\n4. Schedule a follow-up appointment in 3 months.\n\nBecause you mentioned getting a ride can be hard, you could ask the front desk whether a telehealth option would work for your follow-up — your summary says they can tell you about the options.",
      sourceQuotes: [Q.metformin, Q.bloodTest, Q.trackPeriods, Q.followUp, Q.telehealth],
      referenceIds: ["ref-medlineplus-metformin"],
      actions: [
        { kind: "view_action_plan", label: "View my action plan" },
        { kind: "add_question", label: "Ask about telehealth", payload: { question: "Is a telehealth option available for my follow-up visit?" } },
      ],
    },
    free_text: {
      content:
        "Ask me anything about your visit summary. For example: “What does insulin resistance mean?”, “When is my follow-up?”, or “What should I bring to my appointment?” I'll answer using your summary and trusted sources, and I'll tell you when your summary doesn't say.",
      referenceIds: [],
    },
  },

  freeText: [
    {
      id: "stop-medication",
      questions: ["can i stop my medication", "can i stop taking metformin", "should i stop metformin"],
      keywords: [
        ["stop", "medic"],
        ["stop", "metformin"],
        ["stop", "taking"],
        ["quit"],
        ["skip", "metformin"],
        ["skip", "dose"],
        ["change", "dose"],
        ["lower", "dose"],
        ["more", "metformin"],
        ["less", "metformin"],
      ],
      reply: {
        content:
          "I can't tell you to stop or change a medicine — that decision belongs to your care team. Your summary says: “Please do not change how much you take without talking with us first.”\n\nIf metformin is bothering you, your summary says to call the clinic if stomach upset lasts longer than 2 weeks or keeps you from eating. It may help to write down what you're noticing so you can share it with your clinician.",
        sourceQuotes: [Q.noChange, Q.callUpset],
        referenceIds: ["ref-medlineplus-metformin"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "I'd like to talk about how metformin is working for me and any side effects." } },
          { kind: "view_source", label: "View original source", payload: { quote: Q.noChange } },
        ],
      },
    },
    {
      id: "insulin-resistance",
      questions: ["what does insulin resistance mean", "what is insulin resistance"],
      keywords: [["insulin"]],
      reply: {
        content:
          "Insulin is a hormone that helps move sugar from your blood into your cells for energy. With insulin resistance, the cells don't respond to insulin as easily, so the body makes more insulin to keep blood sugar in range.\n\nYour summary says: “Your fasting insulin was elevated, which suggests insulin resistance.” It also lists metformin as part of your plan. Your summary does not say you have diabetes. Your clinician can explain what your result means for you.",
        sourceQuotes: [Q.insulin],
        referenceIds: ["ref-medlineplus-pcos", "ref-nichd-pcos"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.insulin } },
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What does my insulin result mean for my long-term health?" } },
        ],
      },
    },
    {
      id: "ultrasound",
      questions: ["what did my ultrasound show", "do i have cysts", "are the cysts dangerous", "why do i need another ultrasound"],
      keywords: [["ultrasound"], ["cyst"], ["follicle"], ["cyst", "dangerous"], ["another", "ultrasound"]],
      reply: {
        content:
          "Your summary says: “Your ultrasound showed many small follicles on both ovaries; these are not dangerous cysts.” Follicles are small fluid-filled sacs where eggs develop.\n\nYour summary does not mention another ultrasound. If you're wondering whether you'll need more imaging, that's a good question for your follow-up visit.",
        sourceQuotes: [Q.ultrasound],
        referenceIds: ["ref-medlineplus-pcos"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.ultrasound } },
          { kind: "add_question", label: "Add a question to my list", payload: { question: "Will I need another ultrasound in the future?" } },
        ],
      },
    },
    {
      id: "follow-up",
      questions: ["when is my follow up", "when is my next appointment", "what does my follow up plan say"],
      keywords: [["follow"], ["next", "appointment"], ["next", "visit"], ["when", "appointment"], ["come", "back"]],
      reply: {
        content:
          "Your summary says: “Schedule a follow-up appointment in 3 months to review your labs and symptoms.” It does not give an exact date, so you'll need to book it.\n\nBefore then, your follow-up plan also includes the fasting blood test within the next 2 weeks and tracking your period dates. If travel is hard, your summary says the front desk can tell you about telehealth options for the follow-up visit.",
        sourceQuotes: [Q.followUp, Q.bloodTest, Q.telehealth],
        referenceIds: [],
        actions: [
          { kind: "view_action_plan", label: "View my action plan" },
          { kind: "add_question", label: "Ask about telehealth", payload: { question: "Is a telehealth option available for my follow-up visit?" } },
        ],
      },
    },
    {
      id: "what-to-bring",
      questions: ["what should i bring to my appointment", "what do i bring to my next visit"],
      keywords: [["bring"], ["prepare", "appointment"], ["prepare", "visit"]],
      reply: {
        content:
          "Your summary says: “Bring your period calendar and any questions you have about PCOS, skin changes, or future pregnancy plans to your next visit.”\n\nSo a good list is: your period calendar (start and end dates), your questions, and a note of any side effects from metformin. You can save questions in Aftercare Loop and copy them into a summary for your visit.",
        sourceQuotes: [Q.bring, Q.trackPeriods],
        referenceIds: ["ref-ahrq-questions-are-the-answer"],
        actions: [
          { kind: "prepare_appointment", label: "Prepare for my appointment" },
          { kind: "view_source", label: "View original source", payload: { quote: Q.bring } },
        ],
      },
    },
    {
      id: "is-this-serious",
      questions: ["is this serious", "is pcos dangerous", "should i be worried"],
      keywords: [["serious"], ["dangerous"], ["worry"], ["worried"], ["scared"]],
      reply: {
        content:
          "I can't tell you how serious this is for you or make a diagnosis — only your care team can do that. Here is what your summary says: PCOS is a common hormone condition, and “We talked about how PCOS can be managed over time and how the plan can change based on your goals.”\n\nYour summary also lists when to get help: call the clinic if you go more than 90 days without a period, and call 911 or go to the nearest emergency room for severe belly pain, fainting, chest pain, or trouble breathing. If you feel worried, that's a very reasonable thing to bring up with your clinician.",
        sourceQuotes: [Q.whatPcos, Q.managed, Q.call90, Q.call911],
        referenceIds: ["ref-medlineplus-pcos", "ref-acog-pcos-faq"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What should I watch for with PCOS, and when should I call?" } },
        ],
      },
    },
    {
      id: "fasting",
      questions: ["what does fasting mean", "can i drink water before my blood test", "can i have coffee before the test"],
      keywords: [["fasting"], ["fast"], ["before", "test"], ["blood", "test"], ["coffee"], ["water"], ["lab"]],
      reply: {
        content:
          "Your summary says: “Fasting means nothing to eat or drink except water for 8 hours before the test.” So plain water is fine; food and other drinks are not, during those 8 hours.\n\nYour summary does not say whether to take your morning metformin before the test. That's a good question to ask the clinic or lab before your appointment.",
        sourceQuotes: [Q.fasting, Q.bloodTest],
        referenceIds: [],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.fasting } },
          { kind: "add_question", label: "Add a question to my list", payload: { question: "Should I take my morning metformin before my fasting blood test?" } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-a-2" } },
        ],
      },
    },
    {
      id: "side-effects",
      questions: ["what are the side effects of metformin", "metformin upset my stomach"],
      keywords: [["side", "effect"], ["stomach"], ["diarrhea"], ["nausea"], ["loose"], ["upset"]],
      reply: {
        content:
          "Your summary says: “Metformin can cause stomach upset or loose stools at first; taking it with food helps.”\n\nIt also says: “Call the clinic if stomach upset from metformin lasts longer than 2 weeks or keeps you from eating.” Please don't change how much you take on your own — your summary asks you to talk with the clinic first.",
        sourceQuotes: [Q.sideEffects, Q.callUpset, Q.noChange],
        referenceIds: ["ref-medlineplus-metformin"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.sideEffects } },
        ],
      },
    },
    {
      id: "pregnancy",
      questions: ["can i get pregnant with pcos", "will pcos affect pregnancy"],
      keywords: [["pregnan"], ["fertil"], ["baby"], ["kids"]],
      reply: {
        content:
          "Your summary doesn't say anything about your fertility, so I can't tell you what to expect. It does invite you to bring “any questions you have about PCOS, skin changes, or future pregnancy plans to your next visit.”\n\nTrusted sources explain that PCOS can affect ovulation and that clinicians can discuss options with people who want to become pregnant. Your clinician can talk with you about your own situation.",
        sourceQuotes: [Q.bring],
        referenceIds: ["ref-nichd-pcos", "ref-acog-pcos-faq"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "How might PCOS affect my future pregnancy plans?" } },
        ],
      },
    },
    {
      id: "simpler",
      questions: ["can you explain this in simpler terms", "explain it more simply"],
      keywords: [["simpl"], ["plain"], ["dont", "understand"], ["confus"]],
      reply: {
        content:
          "Here's a simpler version. Your care team thinks your symptoms come from PCOS, a common hormone condition. Your body may need extra insulin to handle sugar, so you'll take a medicine called metformin with breakfast and dinner. Next: a fasting blood test within 2 weeks, write down your period dates, and a check-in visit in 3 months.",
        sourceQuotes: [Q.fitPcos, Q.metformin, Q.followUp],
        referenceIds: ["ref-medlineplus-pcos"],
        actions: [{ kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-a-1" } }],
      },
    },
    {
      id: "medical-term",
      questions: ["what does this medical term mean", "what do these words mean"],
      keywords: [["medical", "term"], ["term"], ["word"], ["define"], ["definition"]],
      reply: {
        content:
          "Your summary uses a few medical words. Here are short meanings:\n\n• PCOS (polycystic ovary syndrome): a common hormone condition.\n• Insulin resistance: the body needs more insulin than usual to keep blood sugar in range.\n• Follicles: small fluid-filled sacs in the ovaries.\n• Testosterone and prolactin: hormones your clinician checked.\n• Fasting: nothing but water for 8 hours before a blood test.\n\nTell me which word you'd like to hear more about.",
        sourceQuotes: [Q.fitPcos, Q.insulin, Q.fasting],
        referenceIds: ["ref-medlineplus-pcos"],
      },
    },
    {
      id: "clarify",
      questions: ["what information should i clarify", "what should i clarify"],
      keywords: [["clarify"], ["unclear"], ["missing"]],
      reply: {
        content:
          "Here are things your summary doesn't say, which you could clarify with your care team:\n\n• Your exact testosterone and insulin numbers.\n• Whether to take your morning metformin before the fasting blood test.\n• Whether telehealth is available for your follow-up.\n• What PCOS might mean for future pregnancy plans, if that matters to you.",
        sourceQuotes: [Q.telehealth, Q.fasting],
        referenceIds: ["ref-ahrq-questions-are-the-answer"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "Should I take my morning metformin before my fasting blood test?" } },
          { kind: "prepare_appointment", label: "Prepare for my appointment" },
        ],
      },
    },
  ],

  clarifications: {
    "tb-pt-a-1": [
      `Let me explain that another way. Your summary says: "${Q.metformin}" That means one dose with your first meal of the day and one dose with your evening meal — two times every day, always with food.`,
      `Here's another way to picture it. Think of metformin as going with your two main meals. Your summary says: "${Q.metformin}" Some people keep it near where they eat breakfast as a reminder. If you have questions about timing, your care team can help.`,
    ],
    "tb-pt-a-2": [
      `Let me explain that another way. Your summary says: "${Q.fasting}" So for 8 hours before your blood draw, plain water is the only thing you have — no food and no other drinks.`,
      `Here's another way to think about it. Many people book a fasting test for the morning, so most of the 8 hours happen while they sleep. Your summary says: "${Q.fasting}" If you're unsure whether to take your morning metformin before the test, ask the clinic or lab — your summary doesn't say.`,
    ],
    "tb-pt-a-3": [
      `Let me explain that another way. Your summary says: "${Q.followUp}" After your blood test, the next visit is about 3 months away. At that visit, your clinician plans to go over your lab results and how your symptoms are doing.`,
      `Here's another way to look at it. Picture your plan as a timeline: the fasting blood test comes first, within 2 weeks, and the check-in visit comes about 3 months later. Your summary says: "${Q.followUp}" You could ask the front desk about telehealth options for that visit if travel is hard.`,
    ],
  },
};
