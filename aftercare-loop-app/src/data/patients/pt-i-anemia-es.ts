// Paciente ficticia de demostración. Cualquier parecido con una persona real es coincidencia.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, ES_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-i-anemia-es",
  displayName: "Rosa Delgado",
  ageRange: "40–49",
  language: "es",
  explanationLevel: "standard",
  accessibility: [],
  conditions: ["Anemia por falta de hierro", "Menstruaciones abundantes"],
  medications: [
    {
      name: "Sulfato ferroso",
      dose: "325 mg",
      frequency: "una vez al día",
      documentedPurpose: "para la anemia por falta de hierro",
    },
  ],
  careInstructions: [
    "Sulfato ferroso 325 mg una vez al día con jugo de naranja o con agua.",
    "Separar el hierro de la leche, el café, el té y los antiácidos por al menos 2 horas.",
    "Análisis de sangre de control (hemograma y ferritina) en 8 semanas.",
    "Anotar cuántas toallas o tampones usa cada día en la próxima menstruación.",
  ],
  healthGoals: ["Tener más energía", "Entender por qué tengo anemia"],
  barriers: ["caregiving", "transportation"],
  scenarioSummary: "Prefiere español; empieza tratamiento con hierro por anemia y menstruaciones abundantes.",
};

const document = buildVisitDocument({
  id: "doc-pt-i-visit-001",
  patientId: profile.id,
  title: "Resumen de la visita — 2026-10-19",
  createdAt: "2026-10-19",
  header: fictionalHeader(
    [
      "Paciente: Rosa Delgado (ficticia)",
      "Fecha de la visita: 19 de octubre de 2026",
      "Clínica: Clínica Familiar San Isidro (ficticia)",
      "Profesional: Dr. Luis Herrera, MD (ficticio)",
    ],
    "es",
  ),
  sections: [
    {
      heading: H.reason,
      lines: [
        "Usted vino porque se siente muy cansada desde hace varios meses y le falta el aire al subir escaleras.",
        "Nos contó que sus menstruaciones son más abundantes que antes y duran unos 8 días.",
        "También nos dijo que cuida a su madre en casa y que depende del autobús para venir a la clínica.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "Su análisis de sangre mostró hemoglobina baja (9.6) y ferritina baja.",
        "Esto significa que tiene anemia por falta de hierro.",
        "La anemia ocurre cuando la sangre no tiene suficientes glóbulos rojos sanos para llevar oxígeno al cuerpo, y eso puede causar cansancio y falta de aire.",
        "La causa más probable es la pérdida de sangre por menstruaciones abundantes.",
        "Le pedimos un ultrasonido pélvico para buscar la causa del sangrado abundante; la clínica la llamará para darle la cita.",
        "Con el tratamiento con hierro, la mayoría de las personas empiezan a sentirse mejor en unas semanas, pero las reservas de hierro tardan meses en llenarse.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Tome una tableta de sulfato ferroso de 325 mg una vez al día con jugo de naranja o con agua.",
        "- No tome el hierro al mismo tiempo que leche, café, té o antiácidos; sepárelos por al menos 2 horas.",
        "El hierro puede causar heces oscuras o negras, estreñimiento o malestar de estómago.",
        "Si le cae mal, puede tomarlo con un poco de comida; no deje de tomarlo sin hablar con nosotros.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Hágase un análisis de sangre de control (hemograma y ferritina) en 8 semanas.",
        "- Anote cuántas toallas o tampones usa cada día durante su próxima menstruación.",
        "Traiga sus notas a la próxima cita para que podamos revisarlas juntos.",
        "Pregunte en recepción por citas por video si le cuesta venir a la clínica.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Llame a la clínica si las heces negras vienen con dolor de estómago, o si el cansancio o la falta de aire empeoran.",
        "Llame al 911 o vaya a la sala de emergencias si empapa una toalla o tampón cada hora durante más de 2 horas, si se desmaya, o si tiene dolor en el pecho o dificultad grave para respirar.",
      ],
    },
  ],
});

export const ptIAnemiaEs: PatientFixture = { profile, document };
