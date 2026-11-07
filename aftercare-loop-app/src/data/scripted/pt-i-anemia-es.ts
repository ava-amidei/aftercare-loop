// Scripted Demo Mode content for fictional patient pt-i-anemia-es (Rosa Delgado). Spanish (language "es").
// Every quote is an exact substring of the fixture document (asserted in tests). Demo-validated wording only;
// not a professionally validated medical translation.
import { ptIAnemiaEs } from "@/data/patients/pt-i-anemia-es";
import type { ScriptedPatientContent } from "./types";

const Q = {
  tired:
    "Usted vino porque se siente muy cansada desde hace varios meses y le falta el aire al subir escaleras.",
  caregiving: "También nos dijo que cuida a su madre en casa y que depende del autobús para venir a la clínica.",
  labs: "Su análisis de sangre mostró hemoglobina baja (9.6) y ferritina baja.",
  means: "Esto significa que tiene anemia por falta de hierro.",
  anemiaDef:
    "La anemia ocurre cuando la sangre no tiene suficientes glóbulos rojos sanos para llevar oxígeno al cuerpo, y eso puede causar cansancio y falta de aire.",
  cause: "La causa más probable es la pérdida de sangre por menstruaciones abundantes.",
  ultrasound:
    "Le pedimos un ultrasonido pélvico para buscar la causa del sangrado abundante; la clínica la llamará para darle la cita.",
  weeks:
    "Con el tratamiento con hierro, la mayoría de las personas empiezan a sentirse mejor en unas semanas, pero las reservas de hierro tardan meses en llenarse.",
  iron: "Tome una tableta de sulfato ferroso de 325 mg una vez al día con jugo de naranja o con agua.",
  separate: "No tome el hierro al mismo tiempo que leche, café, té o antiácidos; sepárelos por al menos 2 horas.",
  sideEffects: "El hierro puede causar heces oscuras o negras, estreñimiento o malestar de estómago.",
  food: "Si le cae mal, puede tomarlo con un poco de comida; no deje de tomarlo sin hablar con nosotros.",
  labs8: "Hágase un análisis de sangre de control (hemograma y ferritina) en 8 semanas.",
  pads: "Anote cuántas toallas o tampones usa cada día durante su próxima menstruación.",
  notes: "Traiga sus notas a la próxima cita para que podamos revisarlas juntos.",
  video: "Pregunte en recepción por citas por video si le cuesta venir a la clínica.",
  callClinic:
    "Llame a la clínica si las heces negras vienen con dolor de estómago, o si el cansancio o la falta de aire empeoran.",
  call911:
    "Llame al 911 o vaya a la sala de emergencias si empapa una toalla o tampón cada hora durante más de 2 horas, si se desmaya, o si tiene dolor en el pecho o dificultad grave para respirar.",
} as const;

const doc = ptIAnemiaEs.document;

export const scriptedPtI: ScriptedPatientContent = {
  patientId: ptIAnemiaEs.profile.id,
  documentId: doc.id,
  language: "es",
  interpretation: {
    whatThisMeans:
      "Su resumen de la visita dice que vino porque se siente muy cansada desde hace varios meses y le falta el aire al subir escaleras. Su análisis de sangre mostró hemoglobina baja (9.6) y ferritina baja, y su médico escribió que esto significa que tiene anemia por falta de hierro. Su resumen dice que la causa más probable es la pérdida de sangre por menstruaciones abundantes, y que le pidieron un ultrasonido pélvico para buscar la causa del sangrado abundante; la clínica la llamará para darle la cita. Su plan incluye una tableta de sulfato ferroso cada día, separar el hierro de la leche, el café, el té y los antiácidos, un análisis de sangre de control en 8 semanas y anotar cuántas toallas o tampones usa en su próxima menstruación.",
    terms: [
      {
        term: "Hemoglobina",
        find: "hemoglobina",
        definition:
          "La proteína de los glóbulos rojos que lleva el oxígeno por el cuerpo. Su resumen dice que la suya estaba baja (9.6).",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
      {
        term: "Ferritina",
        find: "ferritina",
        definition:
          "Una proteína que guarda hierro en el cuerpo. El análisis de ferritina ayuda a ver cuánto hierro de reserva hay.",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
      {
        term: "Anemia por falta de hierro",
        find: "anemia por falta de hierro",
        definition:
          "Anemia que ocurre porque el cuerpo no tiene suficiente hierro para formar glóbulos rojos sanos. Su resumen dice que la causa más probable en su caso es la pérdida de sangre por menstruaciones abundantes.",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
      {
        term: "Glóbulos rojos",
        find: "glóbulos rojos",
        definition: "Las células de la sangre que llevan el oxígeno a todo el cuerpo.",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
      {
        term: "Ultrasonido pélvico",
        find: "ultrasonido pélvico",
        definition:
          "Un estudio que usa ondas de sonido para mostrar imágenes de los órganos de la pelvis, como el útero y los ovarios. Su resumen dice que se pidió para buscar la causa del sangrado abundante.",
        referenceIds: [],
      },
      {
        term: "Sulfato ferroso",
        find: "sulfato ferroso",
        definition:
          "Un tipo de suplemento de hierro. Su resumen dice que no deje de tomarlo sin hablar con la clínica.",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
      {
        term: "Hemograma",
        find: "hemograma",
        definition:
          "Un análisis de sangre que cuenta los glóbulos rojos, los glóbulos blancos y las plaquetas, y mide la hemoglobina.",
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
    ],
    whatToKnow: [
      "En general, la anemia ocurre cuando la sangre no tiene suficientes glóbulos rojos sanos para llevar oxígeno al cuerpo.",
      "En general, la pérdida de sangre, como la de menstruaciones abundantes, puede causar anemia por falta de hierro.",
      "Por lo general, el hierro puede causar heces oscuras, estreñimiento o malestar de estómago.",
      "En general, las reservas de hierro tardan meses en llenarse, aunque la energía puede mejorar antes.",
    ],
    discussWithProvider: [
      "¿Cuándo me llamarán para la cita del ultrasonido pélvico?",
      "¿Qué hago si el hierro me causa estreñimiento o malestar de estómago?",
      "¿Puedo tener algunas citas por video, ya que cuido a mi madre y dependo del autobús?",
      "¿Cuánto tiempo tendré que tomar el hierro?",
    ],
    unansweredQuestions: [
      "Qué causa el sangrado abundante: el ultrasonido pélvico se pidió para buscarlo.",
      "Cuánto tiempo tendrá que tomar el hierro.",
    ],
    limitations: [
      "Su resumen no dice cuánto tiempo tendrá que tomar el hierro.",
      "Su resumen no dice la fecha del ultrasonido pélvico; dice que la clínica la llamará para darle la cita.",
      "Su resumen no dice a qué hora del día tomar el hierro.",
    ],
    safetyFlags: [
      {
        level: "info",
        message:
          "La sección “Cuándo buscar atención” de su resumen dice que llame al 911 o vaya a la sala de emergencias si empapa una toalla o tampón cada hora durante más de 2 horas, si se desmaya, o si tiene dolor en el pecho o dificultad grave para respirar.",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Su resumen dice que llame a la clínica si las heces negras vienen con dolor de estómago, o si el cansancio o la falta de aire empeoran. Hable con su equipo de atención antes de dejar de tomar el hierro o de cambiar cómo lo toma.",
      },
    ],
    referenceIds: ["ref-medlineplus-es-anemia"],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Estas son algunas preguntas que podría llevar a su próxima cita:\n\n1. ¿Cuándo me llamarán para la cita del ultrasonido pélvico?\n2. ¿Qué hago si el hierro me causa estreñimiento o malestar de estómago?\n3. ¿Puedo tener algunas citas por video?\n4. ¿Cuánto tiempo tendré que tomar el hierro?",
      sourceQuotes: [Q.ultrasound, Q.sideEffects, Q.video],
      referenceIds: [],
      actions: [
        {
          kind: "add_question",
          label: "Agregar la pregunta a mi lista",
          payload: { question: "¿Cuándo me llamarán para la cita del ultrasonido pélvico?" },
        },
        { kind: "prepare_appointment", label: "Prepararme para mi cita" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Su resumen dice: “Su análisis de sangre mostró hemoglobina baja (9.6) y ferritina baja.” y “Esto significa que tiene anemia por falta de hierro.”\n\nTambién explica que la anemia ocurre cuando la sangre no tiene suficientes glóbulos rojos sanos para llevar oxígeno al cuerpo, y que eso puede causar cansancio y falta de aire. Dice que la causa más probable es la pérdida de sangre por menstruaciones abundantes, y que el ultrasonido pélvico es para buscar la causa del sangrado. Su médico puede explicarle qué significa esto para usted.",
      sourceQuotes: [Q.labs, Q.means, Q.anemiaDef, Q.cause, Q.ultrasound],
      referenceIds: ["ref-medlineplus-es-anemia"],
      actions: [
        { kind: "view_source", label: "Ver la fuente original", payload: { quote: Q.means } },
        { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-i-1" } },
      ],
    },
    understand_my_results: {
      content:
        "Esto es lo que dice su resumen sobre sus resultados:\n\n• Hemoglobina: baja (9.6).\n• Ferritina: baja.\n\nSu resumen dice que esto significa que tiene anemia por falta de hierro. Su plan incluye un análisis de sangre de control (hemograma y ferritina) en 8 semanas.",
      sourceQuotes: [Q.labs, Q.means, Q.labs8],
      referenceIds: ["ref-medlineplus-es-anemia"],
      actions: [{ kind: "view_source", label: "Ver la fuente original", payload: { quote: Q.labs } }],
    },
    plan_next_steps: {
      content:
        "Su resumen indica cuatro pasos documentados por su clínica:\n\n1. Tomar una tableta de sulfato ferroso de 325 mg una vez al día con jugo de naranja o con agua.\n2. No tomar el hierro al mismo tiempo que leche, café, té o antiácidos; separarlos por al menos 2 horas.\n3. Hacerse un análisis de sangre de control (hemograma y ferritina) en 8 semanas.\n4. Anotar cuántas toallas o tampones usa cada día durante su próxima menstruación.",
      sourceQuotes: [Q.iron, Q.separate, Q.labs8, Q.pads],
      referenceIds: [],
      actions: [{ kind: "view_action_plan", label: "Ver mi plan de acción" }],
    },
    free_text: {
      content:
        "Pregúnteme lo que quiera sobre su resumen de la visita. Por ejemplo: “¿Cómo debo tomar el hierro?”, “¿Cuándo es mi análisis de sangre?” o “¿Puedo dejar de tomar el hierro?”. Le responderé a partir de su resumen y le diré cuando no lo indique.",
      referenceIds: [],
    },
  },

  // Order matters: keyword ties go to the earlier entry, so specific entries come before generic ones.
  // English keyword sets are kept so English-typed questions still get the Spanish (profile-language) reply.
  freeText: [
    {
      id: "stop-medication",
      questions: ["¿Puedo dejar de tomar mi medicina?", "¿Puedo dejar de tomar el hierro?", "can i stop my medication"],
      keywords: [
        ["dejar", "medic"],
        ["dejar", "tomar"],
        ["dejar", "hierro"],
        ["suspend"],
        ["dosis"],
        ["stop", "medic"],
        ["stop", "taking"],
        ["stop", "iron"],
        ["quit"],
        ["skip"],
        ["dose"],
      ],
      reply: {
        content:
          "No puedo decirle que deje de tomar o que cambie un medicamento. Su resumen dice: “Si le cae mal, puede tomarlo con un poco de comida; no deje de tomarlo sin hablar con nosotros.”\n\nSi el hierro le está causando molestias, hable con su equipo de atención.",
        sourceQuotes: [Q.food],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "El hierro me causa molestias. ¿Qué puedo hacer?" },
          },
        ],
      },
    },
    {
      id: "side-effects",
      questions: [
        "Mis heces están negras, ¿es por el hierro?",
        "¿Qué efectos secundarios tiene el hierro?",
        "the iron upset my stomach",
      ],
      keywords: [
        ["heces"],
        ["negr"],
        ["oscur"],
        ["estren"],
        ["estomago"],
        ["efecto"],
        ["side", "effect"],
        ["stool"],
        ["black"],
        ["constipat"],
        ["stomach"],
      ],
      reply: {
        content:
          "Su resumen dice: “El hierro puede causar heces oscuras o negras, estreñimiento o malestar de estómago.” y “Si le cae mal, puede tomarlo con un poco de comida; no deje de tomarlo sin hablar con nosotros.”\n\nNo puedo saber la causa de sus síntomas. Su resumen también dice: “Llame a la clínica si las heces negras vienen con dolor de estómago, o si el cansancio o la falta de aire empeoran.”",
        sourceQuotes: [Q.sideEffects, Q.food, Q.callClinic],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Qué hago si el hierro me causa estreñimiento o malestar de estómago?" },
          },
        ],
      },
    },
    {
      id: "how-to-take",
      questions: [
        "¿Cómo debo tomar el hierro?",
        "¿Puedo tomar el hierro con café?",
        "how do i take my iron",
        "can i take iron with coffee",
      ],
      keywords: [
        ["como", "tom"],
        ["tom", "hierro"],
        ["cafe"],
        ["leche"],
        ["antiacid"],
        ["naranja"],
        ["jugo"],
        ["coffee"],
        ["milk"],
        ["antacid"],
        ["how", "take"],
        ["iron"],
      ],
      reply: {
        content:
          "Su resumen dice: “Tome una tableta de sulfato ferroso de 325 mg una vez al día con jugo de naranja o con agua.” y “No tome el hierro al mismo tiempo que leche, café, té o antiácidos; sepárelos por al menos 2 horas.”\n\nTambién dice que, si le cae mal, puede tomarlo con un poco de comida.",
        sourceQuotes: [Q.iron, Q.separate, Q.food],
        referenceIds: [],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-i-2" } },
        ],
      },
    },
    {
      id: "feel-better",
      questions: ["¿Cuándo me voy a sentir mejor?", "¿Cuándo tendré más energía?", "when will i feel better"],
      keywords: [["mejor"], ["energia"], ["cansad"], ["better"], ["energy"], ["tired"]],
      reply: {
        content:
          "Su resumen dice: “Con el tratamiento con hierro, la mayoría de las personas empiezan a sentirse mejor en unas semanas, pero las reservas de hierro tardan meses en llenarse.”\n\nNo puedo decirle cuándo se sentirá mejor usted. Su plan incluye un análisis de sangre de control (hemograma y ferritina) en 8 semanas, y su resumen dice que llame a la clínica si el cansancio o la falta de aire empeoran.",
        sourceQuotes: [Q.weeks, Q.labs8, Q.callClinic],
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
    },
    {
      id: "ultrasound",
      questions: ["¿Por qué necesito un ultrasonido?", "¿Cuándo es mi ultrasonido?", "why do i need an ultrasound"],
      keywords: [["ultrasonido"], ["ecograf"], ["causa", "sangrado"], ["ultrasound"]],
      reply: {
        content:
          "Su resumen dice: “Le pedimos un ultrasonido pélvico para buscar la causa del sangrado abundante; la clínica la llamará para darle la cita.”\n\nSu resumen no dice qué causa el sangrado abundante ni la fecha del ultrasonido. Si no la han llamado, puede preguntar en la clínica.",
        sourceQuotes: [Q.ultrasound],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Cuándo será mi cita para el ultrasonido pélvico?" },
          },
        ],
      },
    },
    {
      id: "what-to-bring",
      questions: ["¿Qué debo traer a mi cita?", "¿Qué tengo que anotar?", "what should i bring to my appointment"],
      keywords: [
        ["traer"],
        ["traigo"],
        ["llevar"],
        ["llevo"],
        ["traer", "cita"],
        ["llevar", "cita"],
        ["anot"],
        ["toalla"],
        ["tampon"],
        ["bring"],
        ["bring", "appointment"],
        ["prepare", "appointment"],
        ["pads"],
        ["track"],
      ],
      reply: {
        content:
          "Su resumen dice: “Anote cuántas toallas o tampones usa cada día durante su próxima menstruación.” y “Traiga sus notas a la próxima cita para que podamos revisarlas juntos.”\n\nTambién puede llevar su lista de preguntas para su equipo de atención.",
        sourceQuotes: [Q.pads, Q.notes],
        referenceIds: [],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-i-3" } },
          { kind: "prepare_appointment", label: "Prepararme para mi cita" },
        ],
      },
    },
    {
      id: "follow-up",
      questions: [
        "¿Qué dice mi plan de seguimiento?",
        "¿Cuándo es mi próxima cita?",
        "¿Cuándo es mi análisis de sangre?",
        "when is my follow up",
        "what does my follow up plan say",
      ],
      keywords: [
        ["seguimiento"],
        ["proxima", "cita"],
        ["cuando", "cita"],
        ["cuando", "analisis"],
        ["semanas"],
        ["follow"],
        ["next", "appointment"],
        ["next", "visit"],
        ["blood", "work"],
        ["lab"],
      ],
      reply: {
        content:
          "Su resumen dice: “Hágase un análisis de sangre de control (hemograma y ferritina) en 8 semanas.” y “Anote cuántas toallas o tampones usa cada día durante su próxima menstruación.”\n\nTambién dice que la clínica la llamará para darle la cita del ultrasonido pélvico, y que traiga sus notas a la próxima cita.",
        sourceQuotes: [Q.labs8, Q.pads, Q.ultrasound, Q.notes],
        referenceIds: [],
        actions: [{ kind: "view_action_plan", label: "Ver mi plan de acción" }],
      },
    },
    {
      id: "transport",
      questions: [
        "Dependo del autobús, ¿cómo llego a la clínica?",
        "¿Puedo tener una cita por video?",
        "i dont have a car how do i get there",
      ],
      keywords: [["autobus"], ["video"], ["transporte"], ["llego"], ["madre"], ["ride"], ["transport"], ["drive"]],
      reply: {
        content:
          "Su resumen menciona que cuida a su madre en casa y que depende del autobús para venir a la clínica. También dice: “Pregunte en recepción por citas por video si le cuesta venir a la clínica.”\n\nPuede preguntar si alguna de sus próximas citas puede ser por video.",
        sourceQuotes: [Q.caregiving, Q.video],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Puedo tener algunas de mis citas por video?" },
          },
        ],
      },
    },
    {
      id: "is-this-serious",
      questions: ["¿Esto es grave?", "¿Debo preocuparme?", "is this serious", "should i be worried"],
      keywords: [
        ["grave"],
        ["serio"],
        ["peligro"],
        ["preocup"],
        ["miedo"],
        ["serious"],
        ["dangerous"],
        ["worry"],
        ["worried"],
        ["scared"],
      ],
      reply: {
        content:
          "No puedo decirle qué tan grave es esto para usted. Su resumen indica cuándo pedir ayuda: “Llame a la clínica si las heces negras vienen con dolor de estómago, o si el cansancio o la falta de aire empeoran.”\n\nTambién dice: “Llame al 911 o vaya a la sala de emergencias si empapa una toalla o tampón cada hora durante más de 2 horas, si se desmaya, o si tiene dolor en el pecho o dificultad grave para respirar.”",
        sourceQuotes: [Q.callClinic, Q.call911],
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
    },
    {
      id: "simpler",
      questions: ["¿Me lo puedes explicar de forma más sencilla?", "can you explain this in simpler terms"],
      keywords: [["sencill"], ["simpl"], ["no entiendo"], ["confund"], ["plain"], ["dont", "understand"], ["confus"]],
      reply: {
        content:
          "Aquí va una versión más sencilla. Su sangre no tiene suficiente hierro, y por eso no tiene suficientes glóbulos rojos sanos para llevar oxígeno. Eso puede causar cansancio y falta de aire. Según su resumen, la causa más probable es la pérdida de sangre por menstruaciones abundantes. Su plan: una tableta de hierro al día con jugo de naranja o con agua (separada de la leche, el café, el té y los antiácidos por al menos 2 horas), anotar cuántas toallas o tampones usa, y un análisis de sangre en 8 semanas.",
        sourceQuotes: [Q.means, Q.anemiaDef, Q.iron, Q.separate, Q.labs8],
        referenceIds: ["ref-medlineplus-es-anemia"],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-i-1" } },
        ],
      },
    },
    {
      id: "medical-term",
      questions: ["¿Qué significa este término médico?", "what does this medical term mean"],
      keywords: [
        ["termino"],
        ["palabra"],
        ["significa"],
        ["medical", "term"],
        ["term"],
        ["word"],
        ["define"],
        ["definition"],
      ],
      reply: {
        content:
          "Estas son algunas palabras de su resumen:\n\n• Hemoglobina: la proteína de los glóbulos rojos que lleva el oxígeno por el cuerpo.\n• Ferritina: una proteína que guarda hierro en el cuerpo.\n• Hemograma: un análisis de sangre que cuenta los glóbulos rojos, los glóbulos blancos y las plaquetas.\n• Ultrasonido pélvico: un estudio con ondas de sonido que muestra imágenes de los órganos de la pelvis.",
        sourceQuotes: [Q.labs, Q.labs8, Q.ultrasound],
        referenceIds: ["ref-medlineplus-es-anemia"],
      },
    },
    {
      id: "clarify",
      questions: ["¿Qué información debería aclarar?", "what information should i clarify"],
      keywords: [["aclar"], ["clarify"], ["unclear"], ["missing"]],
      reply: {
        content:
          "Su resumen no dice algunas cosas que podría aclarar con su equipo de atención:\n\n• Cuánto tiempo tendrá que tomar el hierro.\n• La fecha del ultrasonido pélvico (dice que la clínica la llamará).\n• A qué hora del día tomar el hierro.",
        sourceQuotes: [Q.iron, Q.ultrasound],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Cuánto tiempo tendré que tomar el hierro?" },
          },
        ],
      },
    },
  ],

  clarifications: {
    "tb-pt-i-1": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.iron}” Es una sola tableta cada día, todos los días, y la puede tomar con jugo de naranja o con agua.`,
      `Otra forma de verlo: piense en una tableta al día como parte de su rutina, con un vaso de jugo de naranja o de agua. Su resumen dice: “${Q.iron}” Si le cae mal, su resumen dice que puede tomarla con un poco de comida, y que no deje de tomarla sin hablar con la clínica.`,
    ],
    "tb-pt-i-2": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.separate}” Por ejemplo, si toma café en el desayuno, deje pasar al menos 2 horas entre el café y el hierro.`,
      `Otra forma de verlo: hay cuatro cosas que deben ir separadas del hierro: la leche, el café, el té y los antiácidos. Su resumen dice: “${Q.separate}” Si no está segura de cómo organizar sus horarios, puede preguntarle a su equipo de atención.`,
    ],
    "tb-pt-i-3": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.pads}” Cada día de su próxima menstruación, anote el número de toallas o tampones que usó.`,
      `Otra forma de verlo: estas notas ayudan a su equipo de atención a entender cuánto sangrado tiene. Su resumen dice: “${Q.pads}” Y también: “${Q.notes}”`,
    ],
  },
};
