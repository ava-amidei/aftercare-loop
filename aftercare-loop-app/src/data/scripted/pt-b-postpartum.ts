// Scripted Demo Mode content for fictional patient pt-b-postpartum (Lena Brooks).
// Explanation level: simple. Every quote is an exact substring of the fixture document (asserted in tests).
import { ptBPostpartum } from "@/data/patients/pt-b-postpartum";
import type { ScriptedPatientContent } from "./types";

const Q = {
  highDelivery: "Your blood pressure was a little high during your delivery.",
  bpToday: "Your blood pressure today was 134/86.",
  better: "This is better than it was in the hospital, but we want to keep watching it.",
  canStayHigh:
    "Blood pressure can stay high or go up again in the weeks after birth, so checking it at home is important.",
  healing: "Your bleeding and healing look as expected for 2 weeks after birth.",
  tired: "Feeling tired is common with a new baby.",
  mood: "Feeling sad, worried, or not like yourself can also happen after birth, and it can be treated.",
  vitamin: "Keep taking your prenatal vitamin once a day while you are breastfeeding.",
  noBpMed: "You do not need any blood pressure medicine right now.",
  askBefore: "Ask us before starting any new medicine or supplement while breastfeeding.",
  visit: "Return to the clinic for your full postpartum visit on November 18, 2026.",
  checkBp: "Check your blood pressure once a day with the home blood pressure cuff and write down each reading.",
  questionnaire: "Fill out the mood questionnaire we gave you and bring it to your next visit.",
  children: "You are welcome to bring your children to your visit.",
  rides: "Ask our front desk about ride programs or a telehealth visit if getting here is hard.",
  call150:
    "Call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.",
  call911a: "Call 911 right away if you have a seizure, chest pain, or trouble breathing.",
  call911b:
    "Call 911 right away if you are soaking through a pad every hour, have a very bad headache that does not go away, or see spots or have blurry vision.",
  call988: "Call 911 or the 988 Suicide & Crisis Lifeline if you have thoughts of hurting yourself or your baby.",
  fever: "Call the clinic if you have a fever of 100.4°F or higher, or one leg is red, swollen, or painful.",
} as const;

const doc = ptBPostpartum.document;

export const scriptedPtB: ScriptedPatientContent = {
  patientId: ptBPostpartum.profile.id,
  documentId: doc.id,
  language: "en",
  interpretation: {
    whatThisMeans:
      "You had a check-up 2 weeks after your baby was born. Your blood pressure was a little high when you gave birth. Today it was 134/86. That is better than in the hospital, but your care team wants to keep watching it. Blood pressure can stay high or go up again in the weeks after birth. That is why your summary asks you to check it at home every day. Your summary says you do not need blood pressure medicine right now. It says your bleeding and healing look as expected for 2 weeks after birth. It also says feeling sad, worried, or not like yourself can happen after birth, and it can be treated.",
    terms: [
      {
        term: "Blood pressure",
        find: "blood pressure",
        definition:
          "How hard your blood pushes on the walls of your blood vessels. It is written as two numbers, like 134/86.",
        referenceIds: ["ref-medlineplus-high-blood-pressure", "ref-medlineplus-bp-measurement"],
      },
      {
        term: "134/86",
        find: "134/86",
        definition:
          "Your blood pressure today. The top number (134) is the pressure when your heart beats. The bottom number (86) is the pressure when your heart rests between beats.",
        referenceIds: ["ref-medlineplus-bp-measurement"],
      },
      {
        term: "Home blood pressure cuff",
        find: "home blood pressure cuff",
        definition: "A machine you use at home to check your blood pressure. It usually has a band that wraps around your arm.",
        referenceIds: ["ref-cdc-measuring-blood-pressure"],
      },
      {
        term: "Postpartum",
        find: "postpartum",
        definition:
          "The time after giving birth. A postpartum visit is a check-up for you after your baby is born.",
        referenceIds: ["ref-medlineplus-postpartum-care", "ref-acog-optimizing-postpartum-care"],
      },
      {
        term: "Mood questionnaire",
        find: "mood questionnaire",
        definition:
          "A short form with questions about how you have been feeling. It helps your care team check on your emotional health after birth.",
        referenceIds: ["ref-medlineplus-postpartum-depression", "ref-acog-postpartum-depression-faq"],
      },
      {
        term: "Prenatal vitamin",
        find: "prenatal vitamin",
        definition:
          "A daily vitamin often taken during pregnancy. Your summary says to keep taking it once a day while you are breastfeeding.",
        referenceIds: ["ref-medlineplus-postpartum-care"],
      },
      {
        term: "988 Suicide & Crisis Lifeline",
        find: "988 Suicide & Crisis Lifeline",
        definition:
          "A free U.S. line you can call, text, or chat with for support in a crisis. Your summary lists it for thoughts of hurting yourself or your baby.",
        referenceIds: ["ref-samhsa-988-lifeline"],
      },
      {
        term: "Telehealth visit",
        find: "telehealth visit",
        definition: "A visit by phone or video instead of going to the clinic.",
        referenceIds: [],
      },
    ],
    whatToKnow: [
      "In general, blood pressure can stay high or rise again in the weeks after birth, which is why home checks are often part of postpartum care.",
      "In general, home blood pressure readings are more accurate when taken sitting down after a few minutes of rest.",
      "Generally, mood changes can happen to anyone after birth, and postpartum depression is a health condition that can be treated.",
      "In general, health agencies list warning signs after birth — such as a severe headache, vision changes, trouble breathing, chest pain, or heavy bleeding — that need medical care right away.",
      "In general, postpartum care works best as an ongoing process with more than one check-in.",
    ],
    discussWithProvider: [
      "How long should I keep checking my blood pressure at home?",
      "How should I share my blood pressure log with you?",
      "Which medicines or supplements are okay to take while breastfeeding?",
      "Is a ride program or a telehealth visit available for my November 18 visit?",
      "Who can I talk to if I feel sad, worried, or not like myself before my next visit?",
    ],
    unansweredQuestions: [
      "How long to keep checking blood pressure at home.",
      "Whether a ride program or telehealth visit is available — your summary says to ask the front desk.",
      "What will happen at the full postpartum visit on November 18.",
    ],
    limitations: [
      "Your summary does not say how long you need to keep checking your blood pressure at home.",
      "Your summary does not say whether ride programs or telehealth visits are available to you — only that you can ask the front desk.",
      "Your summary does not say which medicines or supplements are okay while breastfeeding; it says to ask before starting any.",
      "Your summary does not say what time your November 18 visit is.",
    ],
    safetyFlags: [
      {
        level: "clarify_with_clinician",
        message:
          "Your summary's “When to seek care” section says to call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.",
      },
      {
        level: "info",
        message:
          "Your summary's “When to seek care” section lists postpartum warning signs. Call 911 right away for a seizure, chest pain, trouble breathing, soaking through a pad every hour, a very bad headache that does not go away, or seeing spots or blurry vision.",
      },
      {
        level: "info",
        message:
          "If you have thoughts of hurting yourself or your baby, your summary says to call 911 or the 988 Suicide & Crisis Lifeline.",
      },
      {
        level: "info",
        message: "Your summary says to call the clinic for a fever of 100.4°F or higher, or if one leg is red, swollen, or painful.",
      },
    ],
    referenceIds: [
      "ref-medlineplus-postpartum-care",
      "ref-acog-optimizing-postpartum-care",
      "ref-medlineplus-postpartum-depression",
      "ref-cdc-hear-her-warning-signs",
      "ref-acog-preeclampsia-faq",
      "ref-cdc-measuring-blood-pressure",
      "ref-samhsa-988-lifeline",
    ],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Here are some questions you could ask at your visit on November 18:\n\n1. How long should I keep checking my blood pressure at home?\n2. Can you look at my blood pressure log with me?\n3. Which medicines or supplements are okay while I'm breastfeeding?\n4. Is a ride program or telehealth visit available for me?\n5. Who can I talk to if I'm feeling sad or worried?\n\nYour summary also asks you to bring the mood questionnaire.",
      sourceQuotes: [Q.visit, Q.questionnaire, Q.rides],
      referenceIds: ["ref-ahrq-questions-are-the-answer", "ref-medlineplus-postpartum-care"],
      actions: [
        { kind: "add_question", label: "Add a question to my list", payload: { question: "How long should I keep checking my blood pressure at home?" } },
        { kind: "add_question", label: "Ask about rides or telehealth", payload: { question: "Is a ride program or telehealth visit available for me?" } },
        { kind: "prepare_appointment", label: "Prepare for my appointment" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Your summary does not name a diagnosis. It is a check-up after birth. Here is what it says:\n\n• Your blood pressure was a little high during your delivery.\n• Today it was 134/86 — better than in the hospital, but your care team wants to keep watching it.\n• Your bleeding and healing look as expected for 2 weeks after birth.\n\nIf you were told about a diagnosis that is not in this summary, please tell me where you saw it, or ask your care team at your visit.",
      sourceQuotes: [Q.highDelivery, Q.bpToday, Q.better, Q.healing],
      referenceIds: ["ref-medlineplus-postpartum-care", "ref-acog-preeclampsia-faq"],
      actions: [
        { kind: "view_source", label: "View original source", payload: { quote: Q.bpToday } },
        { kind: "add_question", label: "Add a question to my list", payload: { question: "Do I have a diagnosis from my blood pressure during delivery?" } },
      ],
    },
    understand_my_results: {
      content:
        "Your summary has these results:\n\n• Blood pressure today: 134/86. The top number is when your heart beats. The bottom number is when it rests. Your summary says this is better than in the hospital, but your care team wants to keep watching it.\n• Bleeding and healing: look as expected for 2 weeks after birth.\n\nYour summary says you do not need blood pressure medicine right now.",
      sourceQuotes: [Q.bpToday, Q.better, Q.healing, Q.noBpMed],
      referenceIds: ["ref-medlineplus-bp-measurement", "ref-medlineplus-high-blood-pressure"],
      actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.bpToday } }],
    },
    plan_next_steps: {
      content:
        "Your summary lists four next steps from your care team:\n\n1. Keep taking your prenatal vitamin once a day while breastfeeding.\n2. Go to your full postpartum visit on November 18, 2026.\n3. Check your blood pressure once a day at home and write down each reading.\n4. Fill out the mood questionnaire and bring it to your next visit.\n\nYou told your care team you don't have a car and care for your children on your own. Your summary says you can bring your children, and you can ask the front desk about ride programs or a telehealth visit. I can't promise those are available, but it's worth asking.",
      sourceQuotes: [Q.vitamin, Q.visit, Q.checkBp, Q.questionnaire, Q.children, Q.rides],
      referenceIds: ["ref-medlineplus-postpartum-care", "ref-cdc-measuring-blood-pressure"],
      actions: [
        { kind: "view_action_plan", label: "View my action plan" },
        { kind: "add_question", label: "Ask about rides or telehealth", payload: { question: "Is a ride program or telehealth visit available for my November 18 visit?" } },
      ],
    },
    free_text: {
      content:
        "Ask me anything about your visit summary. For example: “When is my next visit?”, “What if my blood pressure is high?”, or “Can I bring my kids?” I'll answer from your summary, and I'll tell you when it doesn't say.",
      referenceIds: [],
    },
  },

  freeText: [
    {
      id: "medicines",
      questions: [
        "can i stop my medication",
        "can i stop taking my vitamin",
        "do i need blood pressure medicine",
        "can i take a new medicine while breastfeeding",
      ],
      keywords: [
        ["stop", "medic"],
        ["stop", "vitamin"],
        ["stop", "taking"],
        ["quit"],
        ["skip", "vitamin"],
        ["pressure", "medic"],
        ["pressure", "pill"],
        ["new", "medic"],
        ["supplement"],
        ["take", "medic"],
      ],
      reply: {
        content:
          "I can't tell you to stop, start, or change a medicine. Only your care team can decide that. Here is what your summary says:\n\n• “Keep taking your prenatal vitamin once a day while you are breastfeeding.”\n• “You do not need any blood pressure medicine right now.”\n• “Ask us before starting any new medicine or supplement while breastfeeding.”\n\nIf you have a question about a medicine, you can call the clinic.",
        sourceQuotes: [Q.vitamin, Q.noBpMed, Q.askBefore],
        referenceIds: ["ref-medlineplus-postpartum-care"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "Which medicines or supplements are okay while I'm breastfeeding?" } },
          { kind: "view_source", label: "View original source", payload: { quote: Q.askBefore } },
        ],
      },
    },
    {
      id: "high-reading",
      questions: ["what if my blood pressure is high", "what numbers should i call about"],
      keywords: [["150"], ["pressure", "high"], ["high", "reading"], ["number"], ["reading"]],
      reply: {
        content:
          "Your summary says: “Call the clinic the same day if your top blood pressure number is 150 or higher or your bottom number is 100 or higher.”\n\nIt also says to call 911 right away if you have a seizure, chest pain, or trouble breathing, or a very bad headache that does not go away, or see spots or have blurry vision.",
        sourceQuotes: [Q.call150, Q.call911a, Q.call911b],
        referenceIds: ["ref-acog-preeclampsia-faq", "ref-cdc-hear-her-warning-signs"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.call150 } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-b-3" } },
        ],
      },
    },
    {
      id: "check-bp",
      questions: ["how do i check my blood pressure", "how often should i check my blood pressure"],
      keywords: [["check", "pressure"], ["cuff"], ["how", "often"], ["log"], ["write", "down"]],
      reply: {
        content:
          "Your summary says: “Check your blood pressure once a day with the home blood pressure cuff and write down each reading.”\n\nIn general, readings are more accurate if you sit and rest for a few minutes first. Write down both numbers and the date each time.",
        sourceQuotes: [Q.checkBp],
        referenceIds: ["ref-cdc-measuring-blood-pressure", "ref-medlineplus-bp-measurement"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.checkBp } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-b-2" } },
        ],
      },
    },
    {
      id: "follow-up",
      questions: ["when is my follow up", "when is my next visit", "what does my follow up plan say"],
      keywords: [["follow"], ["next", "visit"], ["next", "appointment"], ["november"], ["when", "visit"], ["when", "appointment"]],
      reply: {
        content:
          "Your summary says: “Return to the clinic for your full postpartum visit on November 18, 2026.”\n\nIt does not say what time. Until then, check your blood pressure once a day and fill out the mood questionnaire to bring with you.",
        sourceQuotes: [Q.visit, Q.checkBp, Q.questionnaire],
        referenceIds: ["ref-medlineplus-postpartum-care"],
        actions: [
          { kind: "view_action_plan", label: "View my action plan" },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-b-1" } },
        ],
      },
    },
    {
      id: "what-to-bring",
      questions: ["what should i bring to my appointment", "can i bring my kids"],
      keywords: [["bring"], ["kids"], ["children"], ["childcare"], ["babysit"]],
      reply: {
        content:
          "Your summary says: “Fill out the mood questionnaire we gave you and bring it to your next visit.” It also says: “You are welcome to bring your children to your visit.”\n\nYou could also bring your blood pressure log and your list of questions.",
        sourceQuotes: [Q.questionnaire, Q.children],
        referenceIds: ["ref-ahrq-questions-are-the-answer"],
        actions: [{ kind: "prepare_appointment", label: "Prepare for my appointment" }],
      },
    },
    {
      id: "rides",
      questions: ["how do i get to my appointment", "i dont have a car"],
      keywords: [["ride"], ["car"], ["transport"], ["bus"], ["telehealth"], ["get", "there"], ["get", "clinic"]],
      reply: {
        content:
          "Your summary says: “Ask our front desk about ride programs or a telehealth visit if getting here is hard.”\n\nI can't promise these are available, but asking is a good first step. You can also dial 211 to ask about local help, such as transportation.",
        sourceQuotes: [Q.rides],
        referenceIds: ["ref-211-community-services"],
        actions: [
          { kind: "add_question", label: "Ask about rides or telehealth", payload: { question: "Is a ride program or telehealth visit available for me?" } },
        ],
      },
    },
    {
      id: "mood",
      questions: ["i feel sad", "what is the mood questionnaire", "why do i feel sad"],
      keywords: [["sad"], ["mood"], ["depress"], ["anxi"], ["cry"], ["feel", "worried"], ["questionnaire"], ["not", "myself"]],
      reply: {
        content:
          "Thank you for telling me. Your summary says: “Feeling sad, worried, or not like yourself can also happen after birth, and it can be treated.”\n\nThe mood questionnaire helps your care team understand how you're feeling. You don't have to wait for your visit to talk about it — you can call the clinic.\n\nIf you have thoughts of hurting yourself or your baby, your summary says: call 911 or the 988 Suicide & Crisis Lifeline.",
        sourceQuotes: [Q.mood, Q.questionnaire, Q.call988],
        referenceIds: ["ref-medlineplus-postpartum-depression", "ref-nimh-perinatal-depression", "ref-samhsa-988-lifeline"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "I'd like to talk about how I've been feeling since the birth." } },
        ],
      },
    },
    {
      id: "tired",
      questions: ["why am i so tired", "is being tired normal"],
      keywords: [["tired"], ["exhaust"], ["sleep"], ["rest"], ["fatigue"]],
      reply: {
        content:
          "Your summary says: “Feeling tired is common with a new baby.”\n\nIt also says feeling sad, worried, or not like yourself can happen after birth, and it can be treated. If your tiredness comes with those feelings, please tell your care team — you can call the clinic or bring it up on November 18.",
        sourceQuotes: [Q.tired, Q.mood],
        referenceIds: ["ref-medlineplus-postpartum-care", "ref-medlineplus-postpartum-depression"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "I'm very tired. What can help, and what should I watch for?" } },
        ],
      },
    },
    {
      id: "bleeding",
      questions: ["how much bleeding is ok", "when will my bleeding stop"],
      keywords: [["bleed"], ["pad"]],
      reply: {
        content:
          "I can't tell you how much bleeding is okay for you. Your summary says: “Your bleeding and healing look as expected for 2 weeks after birth.”\n\nIt also says: “Call 911 right away if you are soaking through a pad every hour, have a very bad headache that does not go away, or see spots or have blurry vision.” Your care team can tell you what to expect next.",
        sourceQuotes: [Q.healing, Q.call911b],
        referenceIds: ["ref-cdc-hear-her-warning-signs", "ref-medlineplus-postpartum-care"],
        actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.call911b } }],
      },
    },
    {
      id: "is-this-serious",
      questions: ["is this serious", "should i be worried", "is my blood pressure dangerous"],
      keywords: [["serious"], ["dangerous"], ["worry"], ["should", "worried"], ["scared"]],
      reply: {
        content:
          "I can't tell you how serious this is or make a diagnosis. Your care team can. Your summary says your blood pressure today is better than in the hospital, “but we want to keep watching it.”\n\nIt lists when to get help: call the clinic the same day if your top number is 150 or higher or your bottom number is 100 or higher. Call 911 right away for a seizure, chest pain, or trouble breathing.",
        sourceQuotes: [Q.better, Q.call150, Q.call911a],
        referenceIds: ["ref-cdc-hear-her-warning-signs", "ref-acog-preeclampsia-faq"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What should I watch for with my blood pressure after birth?" } },
        ],
      },
    },
    {
      id: "simpler",
      questions: ["can you explain this in simpler terms", "what does this medical term mean"],
      keywords: [["simpl"], ["term"], ["dont", "understand"], ["confus"], ["word"]],
      reply: {
        content:
          "Here it is in a few short lines:\n\n• Your blood pressure was a little high when you gave birth.\n• Now it is better, but your care team wants you to check it every day.\n• Your next visit is November 18, 2026.\n\nWords from your summary: “postpartum” means the time after birth. “Blood pressure” is written as two numbers, like 134/86. Ask me about any other word.",
        sourceQuotes: [Q.highDelivery, Q.checkBp, Q.visit],
        referenceIds: ["ref-medlineplus-postpartum-care"],
        actions: [{ kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-b-1" } }],
      },
    },
    {
      id: "clarify",
      questions: ["what information should i clarify", "what should i clarify"],
      keywords: [["clarify"], ["unclear"], ["missing"]],
      reply: {
        content:
          "Here are things your summary doesn't say, which you could ask about:\n\n• How long to keep checking your blood pressure at home.\n• What time your November 18 visit is.\n• Whether a ride program or telehealth visit is available.\n• Which medicines or supplements are okay while breastfeeding.",
        sourceQuotes: [Q.visit, Q.rides, Q.askBefore],
        referenceIds: ["ref-ahrq-questions-are-the-answer"],
        actions: [{ kind: "prepare_appointment", label: "Prepare for my appointment" }],
      },
    },
  ],

  clarifications: {
    "tb-pt-b-1": [
      `Let me say that another way. Your summary says: "${Q.visit}" Your next visit is on November 18, 2026. It is a full check-up for you after your baby's birth.`,
      `Here is another way. Your next clinic date is written right in your summary: "${Q.visit}" You could write November 18 on a calendar or set a reminder in this app. Your summary also says you are welcome to bring your children.`,
    ],
    "tb-pt-b-2": [
      `Let me say that another way. Your summary says: "${Q.checkBp}" That means two things: check one time every day, and write the numbers down each time.`,
      `Here is another way to think of it. Pick one time each day — like after you wake up — to use your home cuff. Then write both numbers on paper or in your phone. Your summary says: "${Q.checkBp}" Your care team may want to see your list, so you could bring it to your visit.`,
    ],
    "tb-pt-b-3": [
      `Let me say that another way. Your summary says: "${Q.call150}" If the top number is 150 or more, call the clinic that same day. Don't wait for your next visit.`,
      `Here is another way. Your reading has two numbers, like 134/86. The top number is the first one. Your summary says: "${Q.call150}" So if you see a top number of 150 or higher, or a bottom number of 100 or higher, call the clinic the same day. It can help to keep the clinic's phone number next to your cuff.`,
    ],
  },
};
