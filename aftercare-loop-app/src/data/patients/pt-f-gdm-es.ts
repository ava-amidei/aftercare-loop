// Paciente ficticia de demostración. Cualquier parecido con una persona real es coincidencia.
import type { PatientProfile } from "@/lib/types";
import { buildVisitDocument, ES_HEADINGS as H, fictionalHeader, type PatientFixture } from "./document-builder";

const profile: PatientProfile = {
  id: "pt-f-gdm-es",
  displayName: "Ana Lucía Morales",
  ageRange: "30–39",
  language: "es",
  explanationLevel: "simple",
  accessibility: ["larger_text"],
  conditions: ["Seguimiento de diabetes gestacional"],
  medications: [
    {
      name: "Vitamina prenatal",
      frequency: "una vez al día",
      documentedPurpose: "mientras amamanta",
    },
  ],
  careInstructions: [
    "Prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.",
    "Llegar en ayunas a la prueba: nada de comer ni beber excepto agua durante 8 horas.",
    "Seguir tomando la vitamina prenatal una vez al día mientras amamanta.",
    "Revisión de azúcar en la sangre con atención primaria cada año.",
  ],
  healthGoals: ["Entender por qué necesito la prueba de glucosa", "Cuidar mi salud después del parto"],
  barriers: ["language", "scheduling"],
  pregnancyOrPostpartumContext: "Documentado en el registro ficticio: 5 semanas después del parto; diabetes gestacional durante el embarazo.",
  scenarioSummary: "Prefiere español; seguimiento después de diabetes gestacional.",
};

const document = buildVisitDocument({
  id: "doc-pt-f-visit-001",
  patientId: profile.id,
  title: "Resumen de la visita — 2026-10-28",
  createdAt: "2026-10-28",
  header: fictionalHeader(
    [
      "Paciente: Ana Lucía Morales (ficticia)",
      "Fecha de la visita: 28 de octubre de 2026",
      "Clínica: Centro de Salud Comunitario Valle Verde (ficticio)",
      "Profesional: Dra. Carmen Villanueva, MD (ficticia)",
      "Idioma de la visita: español",
    ],
    "es",
  ),
  sections: [
    {
      heading: H.reason,
      lines: [
        "Usted vino para su control después del parto, 5 semanas después del nacimiento de su bebé.",
        "Durante el embarazo usted tuvo diabetes gestacional y usó insulina en las últimas semanas.",
        "Nos dijo que está amamantando y que su bebé está creciendo bien.",
        "También nos dijo que trabaja en turnos que cambian y que le cuesta conseguir citas.",
      ],
    },
    {
      heading: H.assessment,
      lines: [
        "La diabetes gestacional es un nivel alto de azúcar en la sangre que aparece durante el embarazo.",
        "En el hospital dejamos la insulina después del parto, y sus niveles de azúcar fueron normales antes de salir.",
        "En la mayoría de las personas, el azúcar vuelve a lo normal después del parto.",
        "Aun así, haber tenido diabetes gestacional aumenta la posibilidad de tener diabetes tipo 2 más adelante.",
        "Por eso necesitamos una prueba de glucosa ahora y revisiones regulares en el futuro.",
        "Su presión arterial hoy fue normal y su recuperación del parto va bien.",
      ],
    },
    {
      heading: H.medications,
      lines: [
        "- Siga tomando su vitamina prenatal una vez al día mientras esté amamantando.",
        "Ya no necesita insulina, a menos que su médico le indique lo contrario.",
      ],
    },
    {
      heading: H.followUp,
      lines: [
        "- Hágase la prueba de tolerancia oral a la glucosa de 2 horas antes del 15 de diciembre de 2026.",
        "- Llegue en ayunas a la prueba: no coma ni beba nada excepto agua durante 8 horas antes.",
        "- Pida una cita con su médico de atención primaria cada año para revisar su azúcar en la sangre.",
        "La prueba dura unas 2 horas; puede traer algo para leer y un refrigerio para después.",
        "Nuestro laboratorio abre temprano los sábados.",
        "Puede pedir un intérprete de español sin costo en cualquier cita.",
      ],
    },
    {
      heading: H.seekCare,
      lines: [
        "Llame a la clínica si tiene mucha sed, orina con mucha frecuencia o tiene visión borrosa.",
        "Llame a la clínica si tiene fiebre, dolor fuerte en los senos o sangrado que aumenta.",
        "Llame al 911 si tiene dolor en el pecho, dificultad grave para respirar, una convulsión o un dolor de cabeza muy fuerte con cambios en la visión.",
        "Si tiene pensamientos de hacerse daño o hacerle daño a su bebé, llame al 911 o a la Línea 988 de Prevención del Suicidio y Crisis (marque 988 y oprima 2 para español).",
      ],
    },
  ],
});

export const ptFGdmEs: PatientFixture = { profile, document };
