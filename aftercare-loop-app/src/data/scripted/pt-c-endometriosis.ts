// Scripted Demo Mode content for fictional patient pt-c-endometriosis (Priya Shah).
// Explanation level: detailed. Every quote is an exact substring of the fixture document (asserted in tests).
import { ptCEndometriosis } from "@/data/patients/pt-c-endometriosis";
import type { ScriptedPatientContent } from "./types";

const Q = {
  worse2y: "You came in for pelvic pain that has been getting worse over the past 2 years.",
  timing: "The pain is worst during the first 2 days of your period and sometimes starts a few days before.",
  bowelSex: "You described pain with bowel movements during your period and occasional pain during sex.",
  work: "You told us the pain has caused you to miss work several times, and your work schedule changes every week, which makes appointments hard to plan.",
  exam: "Your pelvic exam today showed tenderness but no mass.",
  tests: "Your pregnancy test and urine test were negative.",
  causes: "Your symptoms could have several causes.",
  notConfirmed: "Endometriosis is one possible cause that we are evaluating, but it has not been confirmed.",
  confirmHow:
    "Endometriosis can only be confirmed with further evaluation, which may include imaging and, in some cases, a procedure discussed with a gynecologist.",
  normalUs: "A normal ultrasound does not rule endometriosis in or out.",
  other: "Other possible causes, such as ovarian cysts or bowel conditions, will also be considered.",
  takesTime:
    "We discussed that the evaluation can take time and that your symptom records will help the care team understand the pattern of your pain.",
  naproxen:
    "Take naproxen 500 mg with food up to twice a day as needed for period pain, starting at the first sign of cramps.",
  hormonal: "Hormonal treatment options were discussed briefly and will be reviewed in more detail with gynecology.",
  diary:
    "Keep a daily symptom diary that records your pain level from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.",
  ultrasound: "Schedule a pelvic ultrasound at the imaging center within the next 4 weeks.",
  gyn: "Call the gynecology office at the number on your referral letter to book a consultation.",
  return8: "Return in 8 weeks to review the ultrasound and your symptom diary.",
  slots:
    "The imaging center offers early morning and Saturday appointments, and our office can help you look for times that fit your work schedule.",
  callClinic:
    "Call the clinic if your pain is not controlled by the medicine above or if you have pain between periods that is new or getting worse.",
  call911:
    "Call 911 or go to the emergency room if you have sudden, severe pelvic pain, fainting, a fever with severe pain, or very heavy bleeding that soaks a pad every hour for 2 hours.",
} as const;

const doc = ptCEndometriosis.document;

export const scriptedPtC: ScriptedPatientContent = {
  patientId: ptCEndometriosis.profile.id,
  documentId: doc.id,
  language: "en",
  interpretation: {
    whatThisMeans:
      "Your after-visit summary describes a visit for pelvic pain that has been getting worse over the past 2 years. The pain is worst during the first 2 days of your period and sometimes starts a few days before, and you also described pain with bowel movements during your period and occasional pain during sex. On exam, your clinician found tenderness but no mass, and your pregnancy test and urine test were negative.\n\nYour summary is careful to say that your symptoms could have several causes. Endometriosis is one possible cause being evaluated, but it has not been confirmed. The summary explains that endometriosis can only be confirmed with further evaluation — which may include imaging and, in some cases, a procedure discussed with a gynecologist — and that a normal ultrasound does not rule endometriosis in or out. Other possible causes, such as ovarian cysts or bowel conditions, will also be considered.\n\nThe documented next steps are a daily symptom diary, a pelvic ultrasound within 4 weeks, a gynecology consultation, naproxen as needed for period pain, and a return visit in 8 weeks. Hormonal treatment options were mentioned briefly and will be reviewed with gynecology; nothing new has been started. This is an explanation of your summary, not a diagnosis.",
    terms: [
      {
        term: "Pelvic pain",
        find: "pelvic pain",
        definition:
          "Pain in the lowest part of the abdomen, between the hip bones. It has many possible causes — gynecologic, bowel, bladder, and others — which is why your care team is doing a step-by-step evaluation.",
        referenceIds: ["ref-medlineplus-endometriosis", "ref-acog-endometriosis-faq"],
      },
      {
        term: "Endometriosis",
        find: "Endometriosis",
        definition:
          "A condition in which tissue similar to the lining of the uterus grows outside the uterus. It can cause pelvic pain and painful periods. In your summary it is one possibility being evaluated; it has not been confirmed.",
        referenceIds: ["ref-medlineplus-endometriosis", "ref-acog-endometriosis-faq"],
      },
      {
        term: "Pelvic exam",
        find: "pelvic exam",
        definition:
          "An exam in which a clinician checks the organs in the pelvis, such as the uterus and ovaries. “Tenderness” means it hurt when pressed; “no mass” means no lump was felt.",
        referenceIds: [],
      },
      {
        term: "Pelvic ultrasound",
        find: "pelvic ultrasound",
        definition:
          "An imaging test that uses sound waves to make pictures of the pelvic organs. It can be done over the abdomen or with a small probe placed in the vagina (transvaginal). Your summary notes that a normal ultrasound does not rule endometriosis in or out.",
        referenceIds: ["ref-medlineplus-transvaginal-ultrasound"],
      },
      {
        term: "Ovarian cysts",
        find: "ovarian cysts",
        definition:
          "Fluid-filled sacs on or in an ovary. Your summary lists them as one of the other possible causes your care team will consider.",
        referenceIds: [],
      },
      {
        term: "Naproxen",
        find: "naproxen",
        definition:
          "A nonsteroidal anti-inflammatory drug (NSAID) used for pain, including period cramps. Your summary says 500 mg with food, up to twice a day as needed, starting at the first sign of cramps.",
        referenceIds: [],
      },
      {
        term: "Symptom diary",
        find: "symptom diary",
        definition:
          "A daily record of your symptoms. Your summary asks you to track your pain from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.",
        referenceIds: [],
      },
      {
        term: "Hormonal treatment",
        find: "Hormonal treatment",
        definition:
          "Medicines that change hormone levels, which are one type of option clinicians may discuss for endometriosis-related pain. Your summary says these will be reviewed in more detail with gynecology; none has been started.",
        referenceIds: ["ref-acog-endometriosis-faq"],
      },
    ],
    whatToKnow: [
      "In general, endometriosis can only be confirmed through further evaluation, and reaching a clear answer about pelvic pain can take time.",
      "In general, an ultrasound can help look for some causes of pelvic pain, but a normal ultrasound does not always explain the pain, and it does not rule endometriosis in or out.",
      "Generally, a symptom record that includes timing, severity, and related symptoms helps clinicians see patterns over weeks.",
      "In general, NSAIDs such as naproxen are commonly used for period cramps and are usually taken with food to lower the chance of stomach upset.",
      "In general, options for endometriosis-related pain can include medicines and, in some cases, procedures; these choices are made together with a gynecologist.",
    ],
    discussWithProvider: [
      "Which other causes of my pain are you considering, and how will each one be checked?",
      "If my ultrasound is normal, what would the next step in the evaluation be?",
      "What options are there if naproxen doesn't control my pain well enough?",
      "Which hormonal treatment options might we discuss with gynecology, and what are their pros and cons?",
      "Can my ultrasound and gynecology consultation be scheduled around my changing work schedule?",
    ],
    unansweredQuestions: [
      "What is causing the pain — the evaluation is still in progress.",
      "Which hormonal treatment options will be discussed with gynecology.",
      "Whether a procedure will be part of the evaluation — your summary only says it may be, in some cases.",
    ],
    limitations: [
      "Your summary does not confirm endometriosis; it says it is one possible cause being evaluated.",
      "Your summary does not say what the ultrasound will show or what happens next if the result is normal.",
      "Your summary does not say when the gynecology consultation will be or how long the wait might be.",
      "Your summary does not say which specific hormonal treatment options were discussed.",
    ],
    safetyFlags: [
      {
        level: "info",
        message:
          "Your summary's “When to seek care” section says to call 911 or go to the emergency room for sudden, severe pelvic pain, fainting, a fever with severe pain, or very heavy bleeding that soaks a pad every hour for 2 hours.",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Your summary says to call the clinic if your pain is not controlled by naproxen or if you have pain between periods that is new or getting worse.",
      },
      {
        level: "info",
        message:
          "Endometriosis is documented as a possibility under evaluation, not a confirmed diagnosis.",
      },
    ],
    referenceIds: [
      "ref-medlineplus-endometriosis",
      "ref-acog-endometriosis-faq",
      "ref-medlineplus-transvaginal-ultrasound",
      "ref-ahrq-questions-are-the-answer",
    ],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Here are questions you could bring to your gynecology consultation or your 8-week return visit, based on what your summary says and leaves open:\n\n1. Which other causes of my pain are you considering, and how will each be checked?\n2. If my ultrasound is normal, what is the next step?\n3. What can I do if naproxen isn't controlling my pain?\n4. Which hormonal treatment options might fit me, and what are the trade-offs?\n5. My work schedule changes every week — can we plan appointments around that?\n\nBringing your symptom diary will help your care team see the pattern of your pain.",
      sourceQuotes: [Q.takesTime, Q.hormonal, Q.work],
      referenceIds: ["ref-ahrq-questions-are-the-answer", "ref-acog-endometriosis-faq"],
      actions: [
        { kind: "add_question", label: "Add a question to my list", payload: { question: "If my ultrasound is normal, what is the next step in the evaluation?" } },
        { kind: "add_question", label: "Add a question to my list", payload: { question: "Which other causes of my pain are you considering?" } },
        { kind: "prepare_appointment", label: "Prepare for my appointment" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Your summary does not give a confirmed diagnosis yet. It says: “Endometriosis is one possible cause that we are evaluating, but it has not been confirmed.”\n\nIt explains that endometriosis can only be confirmed with further evaluation, which may include imaging and, in some cases, a procedure discussed with a gynecologist. It also says other possible causes, such as ovarian cysts or bowel conditions, will be considered.\n\nSo for now, what's documented are your symptoms — chronic pelvic pain and painful periods — and an evaluation in progress. Your care team will tell you if and when there is a diagnosis.",
      sourceQuotes: [Q.notConfirmed, Q.confirmHow, Q.other],
      referenceIds: ["ref-medlineplus-endometriosis", "ref-acog-endometriosis-faq"],
      actions: [
        { kind: "view_source", label: "View original source", payload: { quote: Q.notConfirmed } },
        { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-c-2" } },
      ],
    },
    understand_my_results: {
      content:
        "Here is what your summary says about today's results:\n\n• Pelvic exam: tenderness but no mass. Tenderness means it hurt when pressed; no mass means no lump was felt.\n• Pregnancy test and urine test: negative.\n\nThe pelvic ultrasound hasn't happened yet. Your summary notes that a normal ultrasound does not rule endometriosis in or out, so the result will be one piece of the picture alongside your symptom diary.",
      sourceQuotes: [Q.exam, Q.tests, Q.normalUs],
      referenceIds: ["ref-medlineplus-transvaginal-ultrasound", "ref-medlineplus-endometriosis"],
      actions: [{ kind: "view_source", label: "View original source", payload: { quote: Q.exam } }],
    },
    plan_next_steps: {
      content:
        "Your summary lists five clinician-documented next steps:\n\n1. Take naproxen 500 mg with food, up to twice a day as needed for period pain, starting at the first sign of cramps.\n2. Keep a daily symptom diary: pain from 0 to 10, bleeding, and bowel or bladder symptoms.\n3. Schedule a pelvic ultrasound within the next 4 weeks.\n4. Call the gynecology office (number on your referral letter) to book a consultation.\n5. Return in 8 weeks to review the ultrasound and your diary.\n\nBecause your work schedule changes every week, note that your summary says the imaging center offers early morning and Saturday appointments, and the office can help you look for times that fit. Availability isn't guaranteed, so it's worth asking early.",
      sourceQuotes: [Q.naproxen, Q.diary, Q.ultrasound, Q.gyn, Q.return8, Q.slots],
      referenceIds: ["ref-medlineplus-transvaginal-ultrasound"],
      actions: [
        { kind: "view_action_plan", label: "View my action plan" },
        { kind: "add_question", label: "Ask about appointment times", payload: { question: "Which early morning or Saturday ultrasound times are open?" } },
      ],
    },
    free_text: {
      content:
        "Ask me anything about your visit summary. For example: “Why do I need another ultrasound?”, “Do I have endometriosis?”, or “What should I write in my symptom diary?” I'll answer from your summary and trusted sources, and I'll tell you when your summary doesn't say.",
      referenceIds: [],
    },
  },

  freeText: [
    {
      id: "stop-medication",
      questions: ["can i stop my medication", "can i take more naproxen", "can i take naproxen every day"],
      keywords: [
        ["stop", "medic"],
        ["stop", "naproxen"],
        ["stop", "taking"],
        ["quit"],
        ["more", "naproxen"],
        ["extra"],
        ["double"],
        ["dose"],
        ["naproxen", "every", "day"],
        ["ibuprofen"],
        ["start", "hormon"],
        ["birth", "control"],
      ],
      reply: {
        content:
          "I can't tell you to stop, increase, or change a medicine — that decision belongs to your care team. Your summary says: “Take naproxen 500 mg with food up to twice a day as needed for period pain, starting at the first sign of cramps.”\n\nIf your pain isn't controlled, your summary says: “Call the clinic if your pain is not controlled by the medicine above or if you have pain between periods that is new or getting worse.” Hormonal options will be reviewed with gynecology; nothing new has been started.",
        sourceQuotes: [Q.naproxen, Q.callClinic, Q.hormonal],
        referenceIds: [],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What can I do if naproxen isn't controlling my pain?" } },
          { kind: "view_source", label: "View original source", payload: { quote: Q.naproxen } },
        ],
      },
    },
    {
      id: "ultrasound",
      questions: ["why do i need another ultrasound", "why do i need an ultrasound", "what is a pelvic ultrasound"],
      keywords: [["ultrasound"], ["imaging"], ["scan"], ["another", "ultrasound"]],
      reply: {
        content:
          "Your summary doesn't mention an earlier ultrasound, so I can't say whether this would be another one. It asks you to “Schedule a pelvic ultrasound at the imaging center within the next 4 weeks.”\n\nThe ultrasound is part of the evaluation of your pain. Your summary also says: “A normal ultrasound does not rule endometriosis in or out.” Your clinician plans to “Return in 8 weeks to review the ultrasound and your symptom diary.”",
        sourceQuotes: [Q.ultrasound, Q.normalUs, Q.return8],
        referenceIds: ["ref-medlineplus-transvaginal-ultrasound"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.ultrasound } },
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What are you hoping the ultrasound will show?" } },
        ],
      },
    },
    {
      id: "endometriosis",
      questions: ["do i have endometriosis", "what is endometriosis", "has endometriosis been confirmed"],
      keywords: [["endometriosis"], ["endo"], ["diagnos"]],
      reply: {
        content:
          "Your summary says: “Endometriosis is one possible cause that we are evaluating, but it has not been confirmed.”\n\nIn general, endometriosis is a condition in which tissue similar to the lining of the uterus grows outside the uterus, and it can cause pelvic pain and painful periods. Your summary explains it “can only be confirmed with further evaluation,” and that other causes will also be considered. I can't tell you whether you have it — your care team will share what they find.",
        sourceQuotes: [Q.notConfirmed, Q.confirmHow, Q.other],
        referenceIds: ["ref-medlineplus-endometriosis", "ref-acog-endometriosis-faq"],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.notConfirmed } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-c-2" } },
        ],
      },
    },
    {
      id: "follow-up",
      questions: ["when is my follow up", "when is my next appointment", "what does my follow up plan say"],
      keywords: [["follow"], ["next", "visit"], ["next", "appointment"], ["come", "back"], ["return"], ["8", "weeks"]],
      reply: {
        content:
          "Your summary says: “Return in 8 weeks to review the ultrasound and your symptom diary.” It doesn't give an exact date, so you'll need to book it.\n\nBefore then: schedule the pelvic ultrasound within 4 weeks, call the gynecology office to book a consultation, and keep your daily symptom diary.",
        sourceQuotes: [Q.return8, Q.ultrasound, Q.gyn, Q.diary],
        referenceIds: [],
        actions: [{ kind: "view_action_plan", label: "View my action plan" }],
      },
    },
    {
      id: "what-to-bring",
      questions: ["what should i bring to my appointment", "how do i prepare for my appointment"],
      keywords: [["bring"], ["prepare"]],
      reply: {
        content:
          "Your summary says your symptom records “will help the care team understand the pattern of your pain,” so your symptom diary is the most important thing to bring. Your summary doesn't list anything else.\n\nIt may also help to bring your referral letter, your list of questions, and notes on how often the pain has caused you to miss work.",
        sourceQuotes: [Q.takesTime, Q.gyn],
        referenceIds: ["ref-ahrq-questions-are-the-answer", "ref-medlineplus-talking-with-your-doctor"],
        actions: [{ kind: "prepare_appointment", label: "Prepare for my appointment" }],
      },
    },
    {
      id: "is-this-serious",
      questions: ["is this serious", "should i be worried", "is it cancer"],
      keywords: [["serious"], ["dangerous"], ["worry"], ["worried"], ["scared"], ["cancer"]],
      reply: {
        content:
          "I can't tell you what is or isn't causing your pain, and I can't make a diagnosis. Your summary says your exam showed “tenderness but no mass,” and that “Your symptoms could have several causes.” The evaluation is still in progress.\n\nYour summary lists when to get help: call the clinic if your pain isn't controlled or you have new or worsening pain between periods. Call 911 or go to the emergency room for sudden, severe pelvic pain, fainting, a fever with severe pain, or very heavy bleeding that soaks a pad every hour for 2 hours. It's completely reasonable to ask your clinician this question directly.",
        sourceQuotes: [Q.exam, Q.causes, Q.callClinic, Q.call911],
        referenceIds: ["ref-medlineplus-endometriosis"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "What are the possible causes of my pain, and how worried should I be?" } },
        ],
      },
    },
    {
      id: "diary",
      questions: ["what should i write in my symptom diary", "how do i keep a symptom diary"],
      keywords: [["diary"], ["track"], ["journal"], ["log"], ["record"]],
      reply: {
        content:
          "Your summary says: “Keep a daily symptom diary that records your pain level from 0 to 10, bleeding, and bowel or bladder symptoms until your next visit.”\n\nSo each day, note three things: your pain score (0 = none, 10 = worst imaginable), any bleeding, and any bowel or bladder symptoms. Record mild days too — the pattern over time is what helps your care team.",
        sourceQuotes: [Q.diary, Q.takesTime],
        referenceIds: [],
        actions: [
          { kind: "view_source", label: "View original source", payload: { quote: Q.diary } },
          { kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-c-1" } },
        ],
      },
    },
    {
      id: "schedule",
      questions: ["how do i fit appointments around work", "my schedule changes every week"],
      keywords: [["work", "schedul"], ["miss", "work"], ["around", "work"], ["work", "appointment"], ["schedul", "change"], ["saturday"], ["weekend"], ["shift"], ["time", "off"], ["early", "morning"]],
      reply: {
        content:
          "Your summary says: “The imaging center offers early morning and Saturday appointments, and our office can help you look for times that fit your work schedule.”\n\nI can't see which times are open, so it's worth calling early and asking. You could also ask the gynecology office whether they have flexible times when you call to book your consultation.",
        sourceQuotes: [Q.slots, Q.work],
        referenceIds: [],
        actions: [
          { kind: "add_question", label: "Ask about appointment times", payload: { question: "Do you have appointment times that fit a schedule that changes each week?" } },
        ],
      },
    },
    {
      id: "gynecology",
      questions: ["how do i book the gynecology appointment", "what is the referral"],
      keywords: [["gyn"], ["gynecolog"], ["referral"], ["consult"], ["specialist"]],
      reply: {
        content:
          "Your summary says: “Call the gynecology office at the number on your referral letter to book a consultation.”\n\nA gynecologist is a doctor who specializes in the reproductive organs. Your summary says hormonal treatment options will be reviewed in more detail with gynecology.",
        sourceQuotes: [Q.gyn, Q.hormonal],
        referenceIds: ["ref-acog-endometriosis-faq"],
        actions: [{ kind: "view_action_plan", label: "View my action plan" }],
      },
    },
    {
      id: "related-symptoms",
      questions: ["is pain during sex related", "why does it hurt when i have a bowel movement"],
      keywords: [["sex"], ["intercourse"], ["bowel"], ["poop"], ["bathroom"], ["bladder"], ["pee"]],
      reply: {
        content:
          "Your summary records that “You described pain with bowel movements during your period and occasional pain during sex.” It doesn't say what is causing these symptoms — they are part of what your care team is evaluating.\n\nYour symptom diary asks you to track bowel or bladder symptoms. If it feels comfortable, you could also note pain during sex so you can describe the pattern at your gynecology consultation.",
        sourceQuotes: [Q.bowelSex, Q.diary],
        referenceIds: ["ref-acog-endometriosis-faq"],
        actions: [
          { kind: "add_question", label: "Add a question to my list", payload: { question: "Could my bowel symptoms and pain during sex be related to my pelvic pain?" } },
        ],
      },
    },
    {
      id: "simpler",
      questions: ["can you explain this in simpler terms", "what does this medical term mean"],
      keywords: [["simpl"], ["term"], ["dont", "understand"], ["confus"], ["word"], ["define"]],
      reply: {
        content:
          "Here's a shorter version. Your care team is trying to find the cause of your pelvic pain. Endometriosis is one possibility, but it hasn't been confirmed. Next steps: keep a daily pain diary, get a pelvic ultrasound within 4 weeks, book a gynecology visit, use naproxen with food as needed, and come back in 8 weeks.\n\nTell me any word you'd like explained — for example “ultrasound,” “tenderness,” or “hormonal treatment.”",
        sourceQuotes: [Q.notConfirmed, Q.diary, Q.return8],
        referenceIds: ["ref-medlineplus-endometriosis"],
        actions: [{ kind: "check_understanding", label: "Check my understanding", payload: { questionId: "tb-pt-c-1" } }],
      },
    },
    {
      id: "clarify",
      questions: ["what information should i clarify", "what should i clarify"],
      keywords: [["clarify"], ["unclear"], ["missing"]],
      reply: {
        content:
          "Here are things your summary doesn't say, which you could clarify:\n\n• What happens next if the ultrasound is normal.\n• Which hormonal treatment options were discussed.\n• Whether a procedure might be part of the evaluation.\n• How long the wait for gynecology might be.",
        sourceQuotes: [Q.normalUs, Q.hormonal, Q.confirmHow],
        referenceIds: ["ref-ahrq-questions-are-the-answer"],
        actions: [{ kind: "prepare_appointment", label: "Prepare for my appointment" }],
      },
    },
  ],

  // Demo of the refusal path (DEMO-SCRIPT Scene 4): a paraphrased, more urgent
  // version of a real sentence. It is NOT in the document, so verification
  // fails and the item lands in "Needs clarification", not My Care Plan.
  unverifiableInstructions: [
    {
      description:
        "Call the clinic if your pain is not controlled by the medicine or if you have new pain between periods",
      type: "other",
      claimedQuote: "Call the clinic right away if the pain medicine stops working or if you have any pain between periods.",
      anchor: Q.callClinic,
    },
  ],

  clarifications: {
    "tb-pt-c-1": [
      `Let me explain that another way. Your summary says: "${Q.diary}" Each day, the diary has three parts: your pain level on a 0-to-10 scale, any bleeding, and any bowel or bladder symptoms. It's a daily record, so mild days count too.`,
      `Here's another way to think about it. Imagine three quick questions you answer every evening: How strong was my pain, from 0 to 10? Did I have any bleeding? Did I notice anything with my bowels or bladder? Your summary says: "${Q.diary}" Over the coming weeks, those answers can show your care team the pattern of your pain.`,
    ],
    "tb-pt-c-2": [
      `Let me explain that another way. Your summary says: "${Q.notConfirmed}" That means endometriosis is on the list of possibilities your care team is looking into, but no test or exam has confirmed it yet.`,
      `Here's another way to look at it. Your care team is still gathering information — the ultrasound, your symptom diary, and the gynecology consultation are all part of that. Your summary says: "${Q.notConfirmed}" It also says other possible causes, such as ovarian cysts or bowel conditions, will be considered. Until the evaluation is done, it's an open question rather than a diagnosis.`,
    ],
    "tb-pt-c-3": [
      `Let me explain that another way. Your summary says: "${Q.naproxen}" That means: take it with food, no more than twice a day, and only when you need it for period pain — starting when cramps first begin.`,
      `Here's another way to think about it. There are three parts to remember: with food, up to twice a day, and as needed when cramps start. Your summary says: "${Q.naproxen}" If the medicine isn't controlling your pain, your summary says to call the clinic rather than taking more.`,
    ],
  },
};
