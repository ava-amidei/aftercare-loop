// Scripted Demo Mode content for fictional patient pt-f-gdm-es (Ana Lucía Morales). Spanish (language "es").
// Every quote is an exact substring of the fixture document (asserted in tests). Demo-validated wording only;
// not a professionally validated medical translation.
import { ptFGdmEs } from "@/data/patients/pt-f-gdm-es";
import type { ScriptedPatientContent } from "./types";

const Q = {
  visit: "Usted vino para su control después del parto, 5 semanas después del nacimiento de su bebé.",
  gdm: "Durante el embarazo usted tuvo diabetes gestacional y usó insulina en las últimas semanas.",
  shifts: "También nos dijo que trabaja en turnos que cambian y que le cuesta conseguir citas.",
  gdmDef: "La diabetes gestacional es un nivel alto de azúcar en la sangre que aparece durante el embarazo.",
  stoppedInsulin:
    "En el hospital dejamos la insulina después del parto, y sus niveles de azúcar fueron normales antes de salir.",
  risk: "Aun así, haber tenido diabetes gestacional aumenta la posibilidad de tener diabetes tipo 2 más adelante.",
  why: "Por eso necesitamos una prueba de glucosa ahora y revisiones regulares en el futuro.",
  bp: "Su presión arterial hoy fue normal y su recuperación del parto va bien.",
  vitamin: "Siga tomando su vitamina prenatal una vez al día mientras esté amamantando.",
  noInsulin: "Ya no necesita insulina, a menos que su médico le indique lo contrario.",
  ogtt: "Hágase la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.",
  fasting: "Llegue en ayunas a la prueba: no coma ni beba nada excepto agua durante 8 horas antes.",
  yearly: "Pida una cita con su médico de atención primaria cada año para revisar su azúcar en la sangre.",
  duration: "La prueba dura unas 2 horas; puede traer algo para leer y un refrigerio para después.",
  saturday: "Nuestro laboratorio abre temprano los sábados.",
  interpreter: "Puede pedir un intérprete de español sin costo en cualquier cita.",
  callClinic: "Llame a la clínica si tiene mucha sed, orina con mucha frecuencia o tiene visión borrosa.",
  call911:
    "Llame al 911 si tiene dolor en el pecho, dificultad grave para respirar, una convulsión o un dolor de cabeza muy fuerte con cambios en la visión.",
  crisis:
    "Si tiene pensamientos de hacerse daño o hacerle daño a su bebé, llame al 911 o a la Línea 988 de Prevención del Suicidio y Crisis (marque 988 y oprima 2 para español).",
} as const;

const doc = ptFGdmEs.document;

export const scriptedPtF: ScriptedPatientContent = {
  patientId: ptFGdmEs.profile.id,
  documentId: doc.id,
  language: "es",
  interpretation: {
    whatThisMeans:
      "Su resumen de la visita dice que vino a su control 5 semanas después del parto. Durante el embarazo tuvo diabetes gestacional, que es un nivel alto de azúcar en la sangre que aparece durante el embarazo, y usó insulina en las últimas semanas. En el hospital dejaron la insulina después del parto y sus niveles de azúcar fueron normales antes de salir. Aun así, su resumen explica que haber tenido diabetes gestacional aumenta la posibilidad de tener diabetes tipo 2 más adelante; por eso su plan incluye una prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026 y una revisión del azúcar con atención primaria cada año. Su resumen también dice que su presión arterial fue normal en la visita y que su recuperación del parto va bien.",
    terms: [
      {
        term: "Diabetes gestacional",
        find: "diabetes gestacional",
        definition:
          "Un nivel alto de azúcar en la sangre que aparece durante el embarazo. Su resumen dice que usted la tuvo durante el embarazo.",
        referenceIds: ["ref-niddk-gestational-diabetes"],
      },
      {
        term: "Insulina",
        find: "insulina",
        definition:
          "Una hormona que ayuda a que el azúcar de la sangre entre en las células del cuerpo; también se usa como medicina. Su resumen dice que ya no la necesita, a menos que su médico le indique lo contrario.",
        referenceIds: [],
      },
      {
        term: "Prueba de tolerancia oral a la glucosa de 2 horas",
        find: "prueba de tolerancia oral a la glucosa de 2 horas",
        definition:
          "Un análisis de sangre en el que se mide el azúcar en ayunas, luego se toma una bebida con glucosa (un tipo de azúcar) y se vuelve a medir el azúcar después de 2 horas.",
        referenceIds: ["ref-niddk-gestational-diabetes"],
      },
      {
        term: "En ayunas",
        find: "en ayunas",
        definition:
          "Sin comer ni beber nada excepto agua durante un tiempo antes de una prueba. Para su prueba, su resumen indica 8 horas.",
        referenceIds: [],
      },
      {
        term: "Diabetes tipo 2",
        find: "diabetes tipo 2",
        definition:
          "Una condición de largo plazo en la que el azúcar en la sangre se mantiene alto. Su resumen dice que haber tenido diabetes gestacional aumenta la posibilidad de tenerla más adelante; no dice que usted la tenga.",
        referenceIds: ["ref-medlineplus-es-type2-diabetes"],
      },
      {
        term: "Médico de atención primaria",
        find: "médico de atención primaria",
        definition: "El médico o profesional que le da atención general y continua, como los chequeos regulares.",
        referenceIds: [],
      },
    ],
    whatToKnow: [
      "En general, después de la diabetes gestacional se recomiendan pruebas de azúcar en la sangre después del parto, aun cuando los niveles hayan sido normales al salir del hospital.",
      "En general, haber tenido diabetes gestacional aumenta la posibilidad de tener diabetes tipo 2 más adelante, por lo que se recomiendan revisiones regulares.",
      "Por lo general, la prueba de tolerancia oral a la glucosa se hace en ayunas y toma unas 2 horas.",
    ],
    discussWithProvider: [
      "¿Puedo tomar mi vitamina prenatal la mañana de la prueba de glucosa, o debo esperar hasta después?",
      "¿Puedo hacerme la prueba un sábado temprano, ya que trabajo en turnos que cambian?",
      "¿Cómo y cuándo me darán los resultados de la prueba de glucosa?",
      "¿Cuándo debo programar mi primera revisión anual con atención primaria?",
    ],
    unansweredQuestions: [
      "Qué pasos siguen después de recibir el resultado de la prueba de glucosa.",
      "Cuándo debe ser la primera revisión anual con atención primaria.",
    ],
    limitations: [
      "Su resumen no dice qué pasará después de recibir el resultado de la prueba de glucosa.",
      "Su resumen no dice si debe tomar la vitamina prenatal antes o después de la prueba en ayunas.",
      "Su resumen no dice en qué fecha debe ser su primera revisión anual con atención primaria.",
    ],
    safetyFlags: [
      {
        level: "info",
        message:
          "La sección “Cuándo buscar atención” de su resumen dice que llame al 911 si tiene dolor en el pecho, dificultad grave para respirar, una convulsión o un dolor de cabeza muy fuerte con cambios en la visión.",
      },
      {
        level: "info",
        message:
          "Si tiene pensamientos de hacerse daño o hacerle daño a su bebé, su resumen dice que llame al 911 o a la Línea 988 de Prevención del Suicidio y Crisis (marque 988 y oprima 2 para español).",
      },
      {
        level: "clarify_with_clinician",
        message:
          "Sus niveles de azúcar fueron normales al salir del hospital, pero su resumen dice que aún necesita la prueba de glucosa de 2 horas antes del 15 de diciembre de 2026. Si tiene dudas sobre la prueba, pregúntele a su equipo de atención.",
      },
    ],
    referenceIds: [
      "ref-niddk-gestational-diabetes",
      "ref-medlineplus-es-type2-diabetes",
      "ref-medlineplus-es-postpartum-care",
      "ref-medlineplus-es-postpartum-depression",
    ],
  },

  quickPrompts: {
    what_should_i_ask: {
      content:
        "Estas son algunas preguntas que podría llevar a su próxima cita:\n\n1. ¿Puedo tomar mi vitamina prenatal la mañana de la prueba de glucosa?\n2. ¿Puedo hacerme la prueba un sábado temprano?\n3. ¿Cómo y cuándo me darán los resultados?\n4. ¿Cuándo debo programar mi primera revisión anual con atención primaria?",
      sourceQuotes: [Q.ogtt, Q.saturday, Q.yearly],
      referenceIds: ["ref-medlineplus-es-postpartum-care"],
      actions: [
        {
          kind: "add_question",
          label: "Agregar la pregunta a mi lista",
          payload: { question: "¿Puedo tomar mi vitamina prenatal la mañana de la prueba de glucosa?" },
        },
        { kind: "prepare_appointment", label: "Prepararme para mi cita" },
      ],
    },
    explain_my_diagnosis: {
      content:
        "Su resumen dice: “Durante el embarazo usted tuvo diabetes gestacional y usó insulina en las últimas semanas.” También explica: “La diabetes gestacional es un nivel alto de azúcar en la sangre que aparece durante el embarazo.”\n\nSu resumen no dice que usted tenga diabetes tipo 2. Dice que haber tenido diabetes gestacional aumenta la posibilidad de tenerla más adelante, y por eso necesita la prueba de glucosa. Su médico puede explicarle qué significa esto para usted.",
      sourceQuotes: [Q.gdm, Q.gdmDef, Q.risk, Q.why],
      referenceIds: ["ref-niddk-gestational-diabetes", "ref-medlineplus-es-type2-diabetes"],
      actions: [
        { kind: "view_source", label: "Ver la fuente original", payload: { quote: Q.gdm } },
        { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-f-1" } },
      ],
    },
    understand_my_results: {
      content:
        "Esto es lo que dice su resumen sobre sus resultados:\n\n• Azúcar en la sangre: sus niveles fueron normales antes de salir del hospital, después de dejar la insulina.\n• Presión arterial: fue normal en esta visita.\n• Recuperación del parto: va bien.\n\nSu resumen dice que todavía necesita la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.",
      sourceQuotes: [Q.stoppedInsulin, Q.bp, Q.ogtt],
      referenceIds: ["ref-niddk-gestational-diabetes"],
      actions: [{ kind: "view_source", label: "Ver la fuente original", payload: { quote: Q.stoppedInsulin } }],
    },
    plan_next_steps: {
      content:
        "Su resumen indica cuatro pasos documentados por su clínica:\n\n1. Seguir tomando su vitamina prenatal una vez al día mientras esté amamantando.\n2. Hacerse la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.\n3. Llegar en ayunas a la prueba: nada de comer ni beber excepto agua durante 8 horas antes.\n4. Pedir una cita con su médico de atención primaria cada año para revisar su azúcar en la sangre.",
      sourceQuotes: [Q.vitamin, Q.ogtt, Q.fasting, Q.yearly],
      referenceIds: [],
      actions: [{ kind: "view_action_plan", label: "Ver mi plan de acción" }],
    },
    free_text: {
      content:
        "Pregúnteme lo que quiera sobre su resumen de la visita. Por ejemplo: “¿Cuándo es mi prueba de glucosa?”, “¿Qué significa llegar en ayunas?” o “¿Puedo dejar de tomar mi medicina?”. Le responderé a partir de su resumen y le diré cuando no lo indique.",
      referenceIds: [],
    },
  },

  // Order matters: keyword ties go to the earlier entry, so specific entries come before generic ones.
  // English keyword sets are kept so English-typed questions still get the Spanish (profile-language) reply.
  freeText: [
    {
      id: "stop-medication",
      questions: [
        "¿Puedo dejar de tomar mi medicina?",
        "¿Puedo dejar de tomar la vitamina prenatal?",
        "can i stop my medication",
      ],
      keywords: [
        ["dejar", "medic"],
        ["dejar", "tomar"],
        ["dejar", "vitamina"],
        ["suspend"],
        ["dosis"],
        ["stop", "medic"],
        ["stop", "taking"],
        ["quit"],
        ["skip"],
        ["dose"],
      ],
      reply: {
        content:
          "No puedo decirle que deje de tomar o que cambie un medicamento. Su resumen dice: “Siga tomando su vitamina prenatal una vez al día mientras esté amamantando.” Sobre la insulina, dice: “Ya no necesita insulina, a menos que su médico le indique lo contrario.”\n\nSi tiene dudas sobre sus medicamentos, hable primero con su equipo de atención.",
        sourceQuotes: [Q.vitamin, Q.noInsulin],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "Tengo preguntas sobre mi vitamina prenatal mientras amamanto." },
          },
        ],
      },
    },
    {
      id: "insulin",
      questions: ["¿Tengo que volver a usar insulina?", "¿Por qué dejé la insulina?"],
      keywords: [["insulina"], ["insulin"]],
      reply: {
        content:
          "Su resumen dice: “En el hospital dejamos la insulina después del parto, y sus niveles de azúcar fueron normales antes de salir.” y “Ya no necesita insulina, a menos que su médico le indique lo contrario.”\n\nNo puedo decirle si necesitará insulina en el futuro. Esa es una buena pregunta para su equipo de atención.",
        sourceQuotes: [Q.stoppedInsulin, Q.noInsulin],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Qué señales me indicarían que debo hablar con ustedes sobre la insulina?" },
          },
        ],
      },
    },
    {
      id: "glucose-test",
      questions: [
        "¿Por qué necesito la prueba de glucosa?",
        "Si mi azúcar ya salió normal, ¿necesito la prueba?",
        "why do i need the glucose test",
      ],
      keywords: [
        ["glucosa"],
        ["tolerancia"],
        ["azucar", "normal"],
        ["riesgo"],
        ["diabetes", "tipo"],
        ["glucose"],
        ["why", "test"],
        ["risk"],
      ],
      reply: {
        content:
          "Su resumen explica: “Aun así, haber tenido diabetes gestacional aumenta la posibilidad de tener diabetes tipo 2 más adelante.” y “Por eso necesitamos una prueba de glucosa ahora y revisiones regulares en el futuro.”\n\nAunque sus niveles de azúcar fueron normales antes de salir del hospital, su plan dice que se haga la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.",
        sourceQuotes: [Q.risk, Q.why, Q.stoppedInsulin, Q.ogtt],
        referenceIds: ["ref-niddk-gestational-diabetes", "ref-medlineplus-es-type2-diabetes"],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-f-1" } },
        ],
      },
    },
    {
      id: "fasting",
      questions: [
        "¿Qué significa llegar en ayunas?",
        "¿Puedo tomar agua antes de la prueba?",
        "¿Puedo desayunar antes de la prueba?",
        "can i drink water before the test",
      ],
      keywords: [
        ["ayun"],
        ["agua"],
        ["desayun"],
        ["antes", "prueba"],
        ["cafe"],
        ["fasting"],
        ["fast"],
        ["water"],
        ["coffee"],
        ["breakfast"],
        ["before", "test"],
      ],
      reply: {
        content:
          "Su resumen dice: “Llegue en ayunas a la prueba: no coma ni beba nada excepto agua durante 8 horas antes.”\n\nEso significa que durante las 8 horas antes de la prueba solo puede tomar agua. También dice: “La prueba dura unas 2 horas; puede traer algo para leer y un refrigerio para después.”",
        sourceQuotes: [Q.fasting, Q.duration],
        referenceIds: [],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-f-2" } },
        ],
      },
    },
    {
      id: "what-to-bring",
      questions: ["¿Qué debo traer a mi cita?", "¿Qué debo llevar a la prueba?", "what should i bring to my appointment"],
      keywords: [
        ["traer"],
        ["traigo"],
        ["llevar"],
        ["llevo"],
        ["traer", "cita"],
        ["llevar", "cita"],
        ["traer", "prueba"],
        ["llevar", "prueba"],
        ["bring"],
        ["bring", "appointment"],
        ["prepare", "appointment"],
      ],
      reply: {
        content:
          "Su resumen dice: “La prueba dura unas 2 horas; puede traer algo para leer y un refrigerio para después.”\n\nTambién dice: “Puede pedir un intérprete de español sin costo en cualquier cita.” Puede llevar su lista de preguntas para su equipo de atención.",
        sourceQuotes: [Q.duration, Q.interpreter],
        referenceIds: [],
        actions: [{ kind: "prepare_appointment", label: "Prepararme para mi cita" }],
      },
    },
    {
      id: "follow-up",
      questions: [
        "¿Qué dice mi plan de seguimiento?",
        "¿Cuándo es mi prueba de glucosa?",
        "¿Cuándo es mi próxima cita?",
        "when is my follow up",
        "what does my follow up plan say",
      ],
      keywords: [
        ["seguimiento"],
        ["cuando", "prueba"],
        ["proxima", "cita"],
        ["cuando", "cita"],
        ["diciembre"],
        ["follow"],
        ["next", "appointment"],
        ["next", "visit"],
        ["when", "appointment"],
        ["when", "test"],
      ],
      reply: {
        content:
          "Su resumen dice: “Hágase la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.” y “Pida una cita con su médico de atención primaria cada año para revisar su azúcar en la sangre.”\n\nTambién dice que llegue en ayunas a la prueba: nada de comer ni beber excepto agua durante 8 horas antes.",
        sourceQuotes: [Q.ogtt, Q.yearly, Q.fasting],
        referenceIds: [],
        actions: [{ kind: "view_action_plan", label: "Ver mi plan de acción" }],
      },
    },
    {
      id: "schedule",
      questions: [
        "Trabajo en turnos que cambian, ¿cómo consigo una cita?",
        "¿Puedo pedir un intérprete?",
        "my schedule changes how do i book",
      ],
      keywords: [
        ["turno"],
        ["horario"],
        ["sabado"],
        ["interprete"],
        ["traduc"],
        ["schedule"],
        ["shift"],
        ["saturday"],
        ["interpreter"],
        ["translat"],
      ],
      reply: {
        content:
          "Su resumen menciona que trabaja en turnos que cambian y que le cuesta conseguir citas. También dice: “Nuestro laboratorio abre temprano los sábados.” y “Puede pedir un intérprete de español sin costo en cualquier cita.”\n\nPuede preguntar en la clínica si puede hacerse la prueba de glucosa un sábado temprano.",
        sourceQuotes: [Q.shifts, Q.saturday, Q.interpreter],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Puedo hacerme la prueba de glucosa un sábado temprano?" },
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
          "No puedo decirle qué tan grave es esto para usted. Su resumen indica cuándo pedir ayuda: “Llame a la clínica si tiene mucha sed, orina con mucha frecuencia o tiene visión borrosa.”\n\nTambién dice: “Llame al 911 si tiene dolor en el pecho, dificultad grave para respirar, una convulsión o un dolor de cabeza muy fuerte con cambios en la visión.” Y si tiene pensamientos de hacerse daño o hacerle daño a su bebé, su resumen dice que llame al 911 o a la Línea 988 (marque 988 y oprima 2 para español).",
        sourceQuotes: [Q.callClinic, Q.call911, Q.crisis],
        referenceIds: ["ref-medlineplus-es-postpartum-depression"],
      },
    },
    {
      id: "simpler",
      questions: ["¿Me lo puedes explicar de forma más sencilla?", "can you explain this in simpler terms"],
      keywords: [["sencill"], ["simpl"], ["no entiendo"], ["confund"], ["plain"], ["dont", "understand"], ["confus"]],
      reply: {
        content:
          "Aquí va una versión más sencilla. Durante el embarazo usted tuvo el azúcar alto. Sus niveles de azúcar fueron normales antes de salir del hospital, y su resumen dice que ya no necesita insulina, a menos que su médico le indique lo contrario. Como haber tenido diabetes gestacional aumenta la posibilidad de diabetes tipo 2 más adelante, su plan incluye una prueba de glucosa antes del 15 de diciembre de 2026 (llegue en ayunas, solo agua durante 8 horas) y una revisión del azúcar cada año.",
        sourceQuotes: [Q.gdm, Q.risk, Q.ogtt, Q.fasting],
        referenceIds: ["ref-niddk-gestational-diabetes"],
        actions: [
          { kind: "check_understanding", label: "Repasar lo que entendí", payload: { questionId: "tb-pt-f-1" } },
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
          "Estas son algunas palabras de su resumen:\n\n• Diabetes gestacional: un nivel alto de azúcar en la sangre que aparece durante el embarazo.\n• Prueba de tolerancia oral a la glucosa: un análisis de sangre en el que se mide el azúcar en ayunas y otra vez 2 horas después de tomar una bebida con glucosa.\n• En ayunas: sin comer ni beber nada excepto agua durante un tiempo antes de la prueba.\n• Diabetes tipo 2: una condición de largo plazo en la que el azúcar en la sangre se mantiene alto.",
        sourceQuotes: [Q.gdmDef, Q.ogtt, Q.fasting],
        referenceIds: ["ref-niddk-gestational-diabetes", "ref-medlineplus-es-type2-diabetes"],
      },
    },
    {
      id: "clarify",
      questions: ["¿Qué información debería aclarar?", "what information should i clarify"],
      keywords: [["aclar"], ["clarify"], ["unclear"], ["missing"]],
      reply: {
        content:
          "Su resumen no dice algunas cosas que podría aclarar con su equipo de atención:\n\n• Qué pasará después de recibir el resultado de la prueba de glucosa.\n• Si debe tomar la vitamina prenatal antes o después de la prueba en ayunas.\n• En qué fecha debe ser su primera revisión anual con atención primaria.",
        sourceQuotes: [Q.ogtt, Q.yearly],
        referenceIds: [],
        actions: [
          {
            kind: "add_question",
            label: "Agregar la pregunta a mi lista",
            payload: { question: "¿Qué pasará después de recibir el resultado de la prueba de glucosa?" },
          },
        ],
      },
    },
  ],

  clarifications: {
    "tb-pt-f-1": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.ogtt}” Es una sola prueba de azúcar en la sangre que dura unas 2 horas, y debe hacérsela antes de esa fecha.`,
      `Otra forma de verlo: aunque sus niveles de azúcar fueron normales al salir del hospital, haber tenido diabetes gestacional aumenta la posibilidad de diabetes tipo 2 más adelante. Por eso su plan dice: “${Q.ogtt}” Si le cuesta encontrar un horario, puede preguntar por el laboratorio, que abre temprano los sábados.`,
    ],
    "tb-pt-f-2": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.fasting}” Eso quiere decir que durante las 8 horas antes de la prueba solo puede tomar agua: nada de comida, jugo ni café.`,
      `Otra forma de verlo: si su prueba es temprano en la mañana, las 8 horas sin comer pueden incluir la noche anterior. Su resumen dice: “${Q.fasting}” También dice que puede traer un refrigerio para después de la prueba.`,
    ],
    "tb-pt-f-3": [
      `Se lo explico de otra manera. Su resumen dice: “${Q.yearly}” Es decir, una revisión del azúcar una vez al año con su médico de atención primaria, además de la prueba de glucosa de ahora.`,
      `Otra forma de verlo: haber tenido diabetes gestacional aumenta la posibilidad de diabetes tipo 2 más adelante, aunque ya no esté embarazada. Por eso su resumen dice: “${Q.yearly}” Puede ayudarle anotar la fecha cada año para recordarla.`,
    ],
  },
};
