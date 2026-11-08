/**
 * Curated evidence index for Aftercare Loop.
 *
 * Curation rules (see docs/ARCHITECTURE.md §2 and docs/SPEC.md §5):
 * - Every URL below was fetched by the curator on ACCESSED (HTTP 200 after
 *   redirects, page title checked against the topic). Pages that could not be
 *   verified were dropped rather than guessed.
 * - Summaries are short descriptions of each page's scope written in our own
 *   words. They are NOT clinical advice and contain no verbatim excerpts.
 * - `publishedOrUpdated` is only set when the date was confirmed from the source
 *   itself (e.g. PubMed metadata); otherwise it is omitted rather than guessed.
 * - `kind` is honest: patient FAQs from professional societies are
 *   patient_education; only formal practice guidance is clinical_guideline.
 *   There are no peer_reviewed research studies in this index.
 * - Topic tags are lowercase canonical tags shared with
 *   src/lib/evidence/retriever.ts (TOPIC_SYNONYMS).
 */
import type { EvidenceReference } from "@/lib/types";

export const EVIDENCE_ACCESSED_AT = "2026-11-07";
const ACCESSED = EVIDENCE_ACCESSED_AT;

const MEDLINEPLUS = "MedlinePlus (U.S. National Library of Medicine)";
const MEDLINEPLUS_ES = "MedlinePlus en español (Biblioteca Nacional de Medicina de EE. UU.)";
const ACOG = "American College of Obstetricians and Gynecologists (ACOG)";

export const references: EvidenceReference[] = [
  // -------------------------------------------------------------------------
  // PCOS
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-pcos",
    title: "Polycystic Ovary Syndrome",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/polycysticovarysyndrome.html",
    kind: "patient_education",
    topics: ["pcos", "insulin resistance", "irregular periods", "hormones"],
    accessedAt: ACCESSED,
    summary:
      "Plain-language overview of polycystic ovary syndrome (PCOS): what it is, common signs, how it is diagnosed, and the kinds of treatment a clinician may discuss.",
    language: "en",
  },
  {
    id: "ref-nichd-pcos",
    title: "Polycystic Ovary Syndrome (PCOS)",
    organization: "Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD, NIH)",
    publisherType: "government",
    url: "https://www.nichd.nih.gov/health/topics/pcos",
    kind: "patient_education",
    topics: ["pcos", "insulin resistance", "fertility", "hormones"],
    accessedAt: ACCESSED,
    summary:
      "NIH topic page on PCOS covering symptoms, causes, diagnosis, related health risks and treatment approaches, plus NIH research on the condition.",
    language: "en",
  },
  {
    id: "ref-acog-pcos-faq",
    title: "Polycystic Ovary Syndrome (PCOS) — Patient FAQ",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos",
    kind: "patient_education",
    topics: ["pcos", "irregular periods", "fertility", "insulin resistance"],
    accessedAt: ACCESSED,
    summary:
      "Patient FAQ from ACOG explaining PCOS in question-and-answer form, including how it is diagnosed, related long-term health concerns, and treatment options to discuss with an OB-GYN.",
    language: "en",
  },
  {
    id: "ref-pcos-international-guideline-2023",
    title:
      "Recommendations From the 2023 International Evidence-based Guideline for the Assessment and Management of Polycystic Ovary Syndrome",
    organization: "The Journal of Clinical Endocrinology & Metabolism (Teede HJ et al.)",
    publisherType: "journal",
    url: "https://doi.org/10.1210/clinem/dgad463",
    doi: "10.1210/clinem/dgad463",
    kind: "clinical_guideline",
    topics: ["pcos", "insulin resistance", "fertility"],
    publishedOrUpdated: "2023-09-18",
    accessedAt: ACCESSED,
    summary:
      "Summary of the 2023 international evidence-based PCOS guideline (PubMed 37580314, open access in PMC). Written for clinicians; it covers assessment, diagnosis and management and notes that much of the underlying evidence is of low to moderate quality.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Endometriosis
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-endometriosis",
    title: "Endometriosis",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/endometriosis.html",
    kind: "patient_education",
    topics: ["endometriosis", "pelvic pain", "painful periods", "fertility"],
    accessedAt: ACCESSED,
    summary:
      "Plain-language overview of endometriosis: what happens in the body, common symptoms, how it is evaluated, and treatment options a clinician may discuss.",
    language: "en",
  },
  {
    id: "ref-acog-endometriosis-faq",
    title: "Endometriosis — Patient FAQ",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/womens-health/faqs/endometriosis",
    kind: "patient_education",
    topics: ["endometriosis", "pelvic pain", "painful periods", "fertility"],
    accessedAt: ACCESSED,
    summary:
      "ACOG patient FAQ on endometriosis describing symptoms, how a diagnosis is reached, and medical and surgical treatment options to talk through with an OB-GYN.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Postpartum care, depression and warning signs
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-postpartum-care",
    title: "Postpartum Care",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/postpartumcare.html",
    kind: "patient_education",
    topics: ["postpartum care", "postpartum recovery", "pregnancy"],
    accessedAt: ACCESSED,
    summary:
      "Overview of the physical and emotional changes after giving birth, recovery, and the postpartum checkup, with links to related resources.",
    language: "en",
  },
  {
    id: "ref-acog-optimizing-postpartum-care",
    title: "Optimizing Postpartum Care (Committee Opinion)",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/clinical/guidance/committee-opinion/2018/05/optimizing-postpartum-care",
    kind: "clinical_guideline",
    topics: ["postpartum care", "postpartum follow-up", "postpartum recovery"],
    accessedAt: ACCESSED,
    summary:
      "ACOG clinical guidance for clinicians recommending that postpartum care be an ongoing process rather than a single visit, with services and support tailored to each person.",
    language: "en",
  },
  {
    id: "ref-medlineplus-postpartum-depression",
    title: "Postpartum Depression",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/postpartumdepression.html",
    kind: "patient_education",
    topics: ["postpartum depression", "mental health", "postpartum care"],
    accessedAt: ACCESSED,
    summary:
      "Explains postpartum depression, how it differs from the short-lived 'baby blues', common symptoms, and why getting help from a health care provider matters.",
    language: "en",
  },
  {
    id: "ref-nimh-perinatal-depression",
    title: "Perinatal Depression",
    organization: "National Institute of Mental Health (NIMH, NIH)",
    publisherType: "government",
    url: "https://www.nimh.nih.gov/health/publications/perinatal-depression",
    kind: "patient_education",
    topics: ["postpartum depression", "perinatal depression", "mental health", "pregnancy"],
    accessedAt: ACCESSED,
    summary:
      "NIMH publication on depression during pregnancy and after birth, covering signs, risk factors, treatment options, and how to find help.",
    language: "en",
  },
  {
    id: "ref-acog-postpartum-depression-faq",
    title: "Postpartum Depression — Patient FAQ",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/womens-health/faqs/postpartum-depression",
    kind: "patient_education",
    topics: ["postpartum depression", "mental health", "postpartum care"],
    accessedAt: ACCESSED,
    summary:
      "ACOG patient FAQ describing postpartum depression, how it is identified, and treatment and support options to raise with an OB-GYN or other clinician.",
    language: "en",
  },
  {
    id: "ref-cdc-hear-her-warning-signs",
    title: "Urgent Maternal Warning Signs and Symptoms (HEAR HER Campaign)",
    organization: "Centers for Disease Control and Prevention (CDC)",
    publisherType: "government",
    url: "https://www.cdc.gov/hearher/maternal-warning-signs/index.html",
    kind: "patient_education",
    topics: [
      "emergency warning signs",
      "postpartum warning signs",
      "postpartum care",
      "pregnancy",
      "headache",
    ],
    accessedAt: ACCESSED,
    summary:
      "CDC list of urgent warning signs during pregnancy and in the year after birth (such as severe headache, trouble breathing, chest pain, heavy bleeding, or thoughts of self-harm) that need prompt medical attention.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // POTS
  // -------------------------------------------------------------------------
  {
    id: "ref-ninds-pots",
    title: "Postural Tachycardia Syndrome (POTS)",
    organization: "National Institute of Neurological Disorders and Stroke (NINDS, NIH)",
    publisherType: "government",
    url: "https://www.ninds.nih.gov/health-information/disorders/postural-tachycardia-syndrome-pots",
    kind: "patient_education",
    topics: ["pots", "dysautonomia", "dizziness"],
    accessedAt: ACCESSED,
    summary:
      "NIH page explaining postural tachycardia syndrome, its symptoms and risk factors, how it is diagnosed and treated, and current research and clinical trials.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Thyroid
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-hypothyroidism",
    title: "Hypothyroidism",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/hypothyroidism.html",
    kind: "patient_education",
    topics: ["hypothyroidism", "thyroid"],
    accessedAt: ACCESSED,
    summary:
      "Overview of an underactive thyroid (hypothyroidism), including Hashimoto's disease, typical symptoms, how blood tests are used to diagnose it, and treatment.",
    language: "en",
  },
  {
    id: "ref-niddk-hypothyroidism",
    title: "Hypothyroidism (Underactive Thyroid)",
    organization: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK, NIH)",
    publisherType: "government",
    url: "https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism",
    kind: "patient_education",
    topics: ["hypothyroidism", "thyroid", "levothyroxine", "tsh"],
    accessedAt: ACCESSED,
    summary:
      "NIDDK guide to hypothyroidism covering causes, symptoms, diagnosis with thyroid blood tests, and treatment with thyroid hormone medicine such as levothyroxine.",
    language: "en",
  },
  {
    id: "ref-medlineplus-tsh-test",
    title: "TSH (Thyroid-stimulating hormone) Test",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/",
    kind: "patient_education",
    topics: ["tsh", "thyroid", "lab tests", "hypothyroidism"],
    accessedAt: ACCESSED,
    summary:
      "Explains what the TSH blood test measures, why it is ordered, what to expect during the test, and that results should be interpreted with a health care provider.",
    language: "en",
  },
  {
    id: "ref-medlineplus-levothyroxine",
    title: "Levothyroxine (Drug Information)",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/druginfo/meds/a682461.html",
    kind: "patient_education",
    topics: ["levothyroxine", "hypothyroidism", "thyroid", "medication"],
    accessedAt: ACCESSED,
    summary:
      "Drug information page for levothyroxine describing what it is used for, how it is usually taken, precautions, and possible side effects; dosing decisions belong to the prescriber.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Diabetes (type 2, gestational), A1c, metformin
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-type2-diabetes",
    title: "Type 2 Diabetes",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/diabetestype2.html",
    kind: "patient_education",
    topics: ["type 2 diabetes", "diabetes", "blood sugar", "insulin resistance"],
    accessedAt: ACCESSED,
    summary:
      "Overview of type 2 diabetes: how it affects blood sugar, risk factors, symptoms, diagnosis, and the role of lifestyle changes and medicines in management.",
    language: "en",
  },
  {
    id: "ref-medlineplus-a1c-test",
    title: "Hemoglobin A1C (HbA1c) Test",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/",
    kind: "patient_education",
    topics: ["a1c", "lab tests", "diabetes", "type 2 diabetes", "blood sugar"],
    accessedAt: ACCESSED,
    summary:
      "Explains the hemoglobin A1C blood test, which reflects average blood sugar over the past few months, why it is ordered, and how results are discussed with a provider.",
    language: "en",
  },
  {
    id: "ref-medlineplus-metformin",
    title: "Metformin (Drug Information)",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/druginfo/meds/a696005.html",
    kind: "patient_education",
    topics: ["metformin", "type 2 diabetes", "diabetes", "medication"],
    accessedAt: ACCESSED,
    summary:
      "Drug information page for metformin describing why it is prescribed, how it is usually taken, important warnings, and possible side effects to discuss with the prescriber.",
    language: "en",
  },
  {
    id: "ref-medlineplus-gestational-diabetes",
    title: "Gestational Diabetes",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/diabetesandpregnancy.html",
    kind: "patient_education",
    topics: ["gestational diabetes", "diabetes", "pregnancy", "blood sugar"],
    accessedAt: ACCESSED,
    summary:
      "Overview of diabetes during pregnancy, including gestational diabetes, how it is tested for, and how it can affect pregnancy and long-term health.",
    language: "en",
  },
  {
    id: "ref-niddk-gestational-diabetes",
    title: "Gestational Diabetes",
    organization: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK, NIH)",
    publisherType: "government",
    url: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/gestational",
    kind: "patient_education",
    topics: ["gestational diabetes", "diabetes", "pregnancy", "postpartum follow-up", "type 2 diabetes"],
    accessedAt: ACCESSED,
    summary:
      "NIDDK guide to gestational diabetes covering causes, testing during pregnancy, management, and why follow-up testing after the baby is born is recommended.",
    language: "en",
  },
  {
    id: "ref-acog-gestational-diabetes-faq",
    title: "Gestational Diabetes — Patient FAQ",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/womens-health/faqs/gestational-diabetes",
    kind: "patient_education",
    topics: ["gestational diabetes", "pregnancy", "blood sugar", "postpartum follow-up"],
    accessedAt: ACCESSED,
    summary:
      "ACOG patient FAQ on gestational diabetes explaining screening in pregnancy, managing blood sugar, and testing after delivery.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Blood pressure / hypertension
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-high-blood-pressure",
    title: "High Blood Pressure",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/highbloodpressure.html",
    kind: "patient_education",
    topics: ["hypertension", "blood pressure"],
    accessedAt: ACCESSED,
    summary:
      "Overview of high blood pressure (hypertension): what the numbers mean, why it often has no symptoms, how it is diagnosed, and common management approaches.",
    language: "en",
  },
  {
    id: "ref-medlineplus-high-bp-pregnancy",
    title: "High Blood Pressure in Pregnancy",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/highbloodpressureinpregnancy.html",
    kind: "patient_education",
    topics: ["hypertension", "preeclampsia", "pregnancy", "blood pressure", "postpartum care"],
    accessedAt: ACCESSED,
    summary:
      "Overview of high blood pressure conditions during pregnancy, including preeclampsia, why they need monitoring, and how they are managed by the care team.",
    language: "en",
  },
  {
    id: "ref-acog-preeclampsia-faq",
    title: "Preeclampsia and High Blood Pressure During Pregnancy — Patient FAQ",
    organization: ACOG,
    publisherType: "professional_society",
    url: "https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy",
    kind: "patient_education",
    topics: ["preeclampsia", "hypertension", "pregnancy", "emergency warning signs", "postpartum warning signs"],
    accessedAt: ACCESSED,
    summary:
      "ACOG patient FAQ on high blood pressure disorders of pregnancy, including preeclampsia, which symptoms to report, and how they are monitored during and after pregnancy.",
    language: "en",
  },
  {
    id: "ref-medlineplus-bp-measurement",
    title: "Blood Pressure Measurement",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/ency/article/007490.htm",
    kind: "patient_education",
    topics: ["blood pressure monitoring", "blood pressure", "hypertension"],
    accessedAt: ACCESSED,
    summary:
      "Medical encyclopedia article on how blood pressure is measured, how to prepare, what the two numbers mean, and why readings can vary.",
    language: "en",
  },
  {
    id: "ref-cdc-measuring-blood-pressure",
    title: "Measuring Your Blood Pressure",
    organization: "Centers for Disease Control and Prevention (CDC)",
    publisherType: "government",
    url: "https://www.cdc.gov/high-blood-pressure/measure/index.html",
    kind: "patient_education",
    topics: ["blood pressure monitoring", "blood pressure", "hypertension"],
    accessedAt: ACCESSED,
    summary:
      "CDC guidance for patients on measuring blood pressure at home, at a doctor's office or at a pharmacy, with tips on factors that can affect readings and steps for accurate measurement.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Anemia & iron
  // -------------------------------------------------------------------------
  {
    id: "ref-nhlbi-iron-deficiency-anemia",
    title: "Iron-Deficiency Anemia",
    organization: "National Heart, Lung, and Blood Institute (NHLBI, NIH)",
    publisherType: "government",
    url: "https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia",
    kind: "patient_education",
    topics: ["anemia", "iron deficiency", "iron supplements", "pregnancy"],
    accessedAt: ACCESSED,
    summary:
      "NHLBI page on anemia caused by low iron, covering causes and risk factors (including pregnancy and heavy periods), symptoms, diagnosis, and treatment.",
    language: "en",
  },
  {
    id: "ref-medlineplus-iron",
    title: "Iron",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/iron.html",
    kind: "patient_education",
    topics: ["iron supplements", "iron deficiency", "anemia", "nutrition"],
    accessedAt: ACCESSED,
    summary:
      "Overview of iron in the body and in food, what happens with too little or too much iron, and the use of iron supplements to treat low iron, which should be guided by a health care provider.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Migraine
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-migraine",
    title: "Migraine",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/migraine.html",
    kind: "patient_education",
    topics: ["migraine", "headache"],
    accessedAt: ACCESSED,
    summary:
      "Overview of migraine headaches, common triggers and symptoms, how they are diagnosed, and treatment and prevention options a clinician may discuss.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Perimenopause / menopause
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-menopause",
    title: "Menopause",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/menopause.html",
    kind: "patient_education",
    topics: ["menopause", "perimenopause", "hormones"],
    accessedAt: ACCESSED,
    summary:
      "Overview of menopause and the menopausal transition (perimenopause), common symptoms, diagnosis, and treatment options to consider with a health care provider.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Asthma (including pregnancy)
  // -------------------------------------------------------------------------
  {
    id: "ref-nhlbi-managing-asthma",
    title: "Managing Asthma",
    organization: "National Heart, Lung, and Blood Institute (NHLBI, NIH)",
    publisherType: "government",
    url: "https://www.nhlbi.nih.gov/health/asthma/living-with",
    kind: "patient_education",
    topics: ["asthma", "asthma in pregnancy", "pregnancy"],
    accessedAt: ACCESSED,
    summary:
      "NHLBI page on living with asthma, including a section on pregnancy explaining that symptoms can change while pregnant and that medicine changes should be discussed with a provider first.",
    language: "en",
  },
  {
    id: "ref-nhlbi-asthma-guidelines-2020",
    title: "2020 Focused Updates to the Asthma Management Guidelines",
    organization: "National Heart, Lung, and Blood Institute (NHLBI, NIH) — NAEPP Expert Panel",
    publisherType: "government",
    url: "https://www.nhlbi.nih.gov/resources/2020-focused-updates-asthma-management-guidelines",
    kind: "clinical_guideline",
    topics: ["asthma"],
    accessedAt: ACCESSED,
    summary:
      "Clinician-facing focused update to the U.S. National Asthma Education and Prevention Program guidelines on selected topics in asthma diagnosis and management.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Pelvic ultrasound
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-transvaginal-ultrasound",
    title: "Transvaginal Ultrasound",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/ency/article/003779.htm",
    kind: "patient_education",
    topics: ["pelvic ultrasound", "ultrasound", "imaging", "pelvic pain"],
    accessedAt: ACCESSED,
    summary:
      "Medical encyclopedia article describing a transvaginal (pelvic) ultrasound: why it is done, how to prepare, what the exam feels like, and how results are shared.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Patient–provider communication & question lists
  // -------------------------------------------------------------------------
  {
    id: "ref-ahrq-questions-are-the-answer",
    title: "Questions Are the Answer",
    organization: "Agency for Healthcare Research and Quality (AHRQ)",
    publisherType: "government",
    url: "https://www.ahrq.gov/questions/index.html",
    kind: "patient_education",
    topics: ["patient-provider communication", "question lists", "appointment preparation"],
    accessedAt: ACCESSED,
    summary:
      "AHRQ resource encouraging patients to prepare and ask questions before, during and after medical appointments, with tips for better conversations with clinicians.",
    language: "en",
  },
  {
    id: "ref-ahrq-question-builder",
    title: "QuestionBuilder App",
    organization: "Agency for Healthcare Research and Quality (AHRQ)",
    publisherType: "government",
    url: "https://www.ahrq.gov/questions/question-builder/index.html",
    kind: "government_resource",
    topics: ["question lists", "appointment preparation", "patient-provider communication"],
    accessedAt: ACCESSED,
    summary:
      "AHRQ tool that helps patients build and save a list of questions to bring to a medical appointment.",
    language: "en",
  },
  {
    id: "ref-medlineplus-talking-with-your-doctor",
    title: "Talking With Your Doctor",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/talkingwithyourdoctor.html",
    kind: "patient_education",
    topics: ["patient-provider communication", "question lists", "appointment preparation"],
    accessedAt: ACCESSED,
    summary:
      "Collection of guidance on communicating with health care providers, including preparing for visits, asking questions, and understanding instructions.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Access: transportation, cost, community resources
  // -------------------------------------------------------------------------
  {
    id: "ref-hrsa-find-a-health-center",
    title: "Find a Health Center",
    organization: "Health Resources and Services Administration (HRSA)",
    publisherType: "government",
    url: "https://findahealthcenter.hrsa.gov/",
    kind: "government_resource",
    topics: ["health centers", "financial assistance", "transportation", "community resources"],
    accessedAt: ACCESSED,
    summary:
      "HRSA search tool for finding HRSA-funded community health centers near a given location.",
    language: "en",
  },
  {
    id: "ref-211-community-services",
    title: "211 — Essential Community Services",
    organization: "United Way Worldwide (211 network)",
    url: "https://211.org/",
    // Non-governmental referral service. No EvidenceKind fits exactly; it is
    // marked patient_education (patient-facing information) and its publisher
    // type is recorded as nonprofit so the UI does not present it as .gov.
    kind: "patient_education",
    publisherType: "nonprofit",
    topics: ["community resources", "financial assistance", "caregiving", "transportation"],
    accessedAt: ACCESSED,
    summary:
      "Confidential referral service reached by dialing 211 that connects people with local help such as housing, utilities, food, bill payment, health care and caregiver resources.",
    language: "en",
  },
  {
    id: "ref-medlineplus-save-money-medicines",
    title: "How to Save Money on Medicines",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/ency/patientinstructions/000863.htm",
    kind: "patient_education",
    topics: ["medication cost", "financial assistance", "medication"],
    accessedAt: ACCESSED,
    summary:
      "Practical ways to lower prescription costs, such as asking about generic options and discount programs, and talking with a pharmacist or provider before changing anything.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Crisis support
  // -------------------------------------------------------------------------
  {
    id: "ref-samhsa-988-lifeline",
    title: "988 Suicide & Crisis Lifeline",
    organization: "Substance Abuse and Mental Health Services Administration (SAMHSA)",
    publisherType: "government",
    url: "https://www.samhsa.gov/mental-health/988",
    kind: "government_resource",
    topics: ["988", "crisis support", "suicide prevention", "mental health", "postpartum depression"],
    accessedAt: ACCESSED,
    summary:
      "SAMHSA page about the 988 Suicide & Crisis Lifeline, which people in the U.S. can call, text or chat for support with mental health, substance use and suicidal crisis.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Heart failure, chronic kidney disease, diuretics, potassium (validation fix #22)
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-heart-failure",
    title: "Heart Failure",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/heartfailure.html",
    kind: "patient_education",
    topics: ["heart failure", "fluid buildup", "daily weights"],
    accessedAt: ACCESSED,
    summary:
      "Plain-language overview of heart failure: what it means when the heart does not pump as well as the body needs, common symptoms such as swelling and shortness of breath, and how it is treated and managed.",
    language: "en",
  },
  {
    id: "ref-niddk-chronic-kidney-disease",
    title: "Chronic Kidney Disease (CKD)",
    organization: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK, NIH)",
    publisherType: "government",
    url: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd",
    kind: "patient_education",
    topics: ["chronic kidney disease", "kidney function"],
    accessedAt: ACCESSED,
    summary:
      "NIH health information on chronic kidney disease covering what it is, common causes such as diabetes and high blood pressure, how kidney function is tested, and ways to manage it with a care team.",
    language: "en",
  },
  {
    id: "ref-medlineplus-furosemide",
    title: "Furosemide (Drug Information)",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/druginfo/meds/a682858.html",
    kind: "patient_education",
    topics: ["furosemide", "diuretic", "heart failure", "medication"],
    accessedAt: ACCESSED,
    summary:
      "Drug information page for furosemide, a diuretic (water pill), describing what it is used for, how it is usually taken, precautions, and possible side effects; dosing decisions belong to the prescriber.",
    language: "en",
  },
  {
    id: "ref-medlineplus-potassium",
    title: "Potassium",
    organization: MEDLINEPLUS,
    publisherType: "government",
    url: "https://medlineplus.gov/potassium.html",
    kind: "patient_education",
    topics: ["potassium", "kidney function"],
    accessedAt: ACCESSED,
    summary:
      "Overview of potassium, a mineral the body needs for nerves, muscles and the heart, including food sources and why some health conditions and medicines can make levels too high or too low.",
    language: "en",
  },

  // -------------------------------------------------------------------------
  // Spanish-language MedlinePlus (language "es")
  // -------------------------------------------------------------------------
  {
    id: "ref-medlineplus-es-pcos",
    title: "Síndrome de ovario poliquístico",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/polycysticovarysyndrome.html",
    kind: "patient_education",
    topics: ["pcos", "insulin resistance", "irregular periods", "hormones"],
    accessedAt: ACCESSED,
    summary:
      "Información sencilla sobre el síndrome de ovario poliquístico (SOP): qué es, señales comunes, cómo se diagnostica y opciones de tratamiento para hablar con su proveedor.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-endometriosis",
    title: "Endometriosis",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/endometriosis.html",
    kind: "patient_education",
    topics: ["endometriosis", "pelvic pain", "painful periods", "fertility"],
    accessedAt: ACCESSED,
    summary:
      "Resumen sobre la endometriosis: qué ocurre en el cuerpo, síntomas frecuentes, cómo se evalúa y tratamientos que el médico puede comentar.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-postpartum-care",
    title: "Cuidados después del parto",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/postpartumcare.html",
    kind: "patient_education",
    topics: ["postpartum care", "postpartum recovery", "pregnancy"],
    accessedAt: ACCESSED,
    summary:
      "Información sobre la recuperación física y emocional después del parto, las citas de seguimiento y los cambios que requieren llamar al proveedor de salud.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-postpartum-depression",
    title: "Depresión posparto",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/postpartumdepression.html",
    kind: "patient_education",
    topics: ["postpartum depression", "mental health", "postpartum care"],
    accessedAt: ACCESSED,
    summary:
      "Explica la depresión posparto, en qué se diferencia de la tristeza pasajera después del parto, sus síntomas y por qué es importante pedir ayuda.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-type2-diabetes",
    title: "Diabetes tipo 2",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/diabetestype2.html",
    kind: "patient_education",
    topics: ["type 2 diabetes", "diabetes", "blood sugar"],
    accessedAt: ACCESSED,
    summary:
      "Resumen sobre la diabetes tipo 2: cómo afecta el azúcar en la sangre, factores de riesgo, diagnóstico y el papel de los cambios de estilo de vida y los medicamentos.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-high-blood-pressure",
    title: "Presión arterial alta",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/highbloodpressure.html",
    kind: "patient_education",
    topics: ["hypertension", "blood pressure"],
    accessedAt: ACCESSED,
    summary:
      "Información sobre la presión arterial alta (hipertensión): qué significan los números, por qué a menudo no causa síntomas y cómo se controla.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-hypothyroidism",
    title: "Hipotiroidismo",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/hypothyroidism.html",
    kind: "patient_education",
    topics: ["hypothyroidism", "thyroid"],
    accessedAt: ACCESSED,
    summary:
      "Resumen sobre la tiroides poco activa (hipotiroidismo): síntomas comunes, análisis de sangre para el diagnóstico y tratamiento.",
    language: "es",
  },
  {
    id: "ref-medlineplus-es-anemia",
    title: "Anemia",
    organization: MEDLINEPLUS_ES,
    publisherType: "government",
    url: "https://medlineplus.gov/spanish/anemia.html",
    kind: "patient_education",
    topics: ["anemia", "iron deficiency"],
    accessedAt: ACCESSED,
    summary:
      "Información sobre la anemia, sus tipos y causas (como la falta de hierro), síntomas y cómo se diagnostica y trata.",
    language: "es",
  },
];
