import type { Namespaced } from "../types";

export const profile = {
  "profile.title": "My Health Profile",
  "profile.subtitle": "Every field is optional. You can change anything at any time.",
  "profile.privacyNote": "This demo keeps fictional data in this browser only.",
  "profile.saved": "Profile saved.",

  "profile.section.about": "About me",
  "profile.section.preferences": "How I like information",
  "profile.section.health": "My health",
  "profile.section.access": "Getting care",

  "profile.field.displayName": "Name (fictional)",
  "profile.field.ageRange": "Age range",
  "profile.field.language": "Preferred language",
  "profile.field.explanationLevel": "How much detail would you like?",
  "profile.field.accessibility": "Accessibility preferences",
  "profile.field.conditions": "Conditions or concerns",
  "profile.field.conditionsHint": "Choose from the list or type your own.",
  "profile.field.conditionsPlaceholder": "Type a condition or concern",
  "profile.field.medications": "Medications",
  "profile.field.careInstructions": "Care instructions from my clinician",
  "profile.field.healthGoals": "My health goals",
  "profile.field.healthGoalsPlaceholder": "Type a goal",
  "profile.field.barriers": "Is anything making it harder to get care?",
  "profile.field.barriersHint": "This helps Kat suggest questions to ask your clinic. It is never used to guess anything about your health.",
  "profile.field.pregnancy": "Pregnancy or postpartum context",
  "profile.field.pregnancyHint": "Only add this if it applies to you. Aftercare Loop never guesses it.",

  "profile.level.simple": "Simple",
  "profile.level.simpleHint": "Short, everyday words",
  "profile.level.standard": "Standard",
  "profile.level.standardHint": "Plain language with a bit more detail",
  "profile.level.detailed": "Detailed",
  "profile.level.detailedHint": "More background and medical terms explained",

  "profile.accessibility.larger_text": "Larger text",
  "profile.accessibility.high_contrast": "High contrast",
  "profile.accessibility.reduced_motion": "Reduced motion",
  "profile.accessibility.screen_reader": "Screen reader friendly",

  "profile.barrier.transportation": "Transportation",
  "profile.barrier.cost_or_insurance": "Cost or insurance",
  "profile.barrier.language": "Language",
  "profile.barrier.scheduling": "Limited appointment availability",
  "profile.barrier.caregiving": "Caregiving responsibilities",

  "profile.medication.name": "Medication name",
  "profile.medication.dose": "Dose",
  "profile.medication.frequency": "How often",
  "profile.medication.purpose": "Documented purpose",
  "profile.medication.add": "Add a medication",
  "profile.medication.empty": "No medications listed.",
  "profile.medication.note": "Kat never suggests changing a medication. Ask your care team about any changes.",

  "profile.list.add": "Add",
  "profile.list.remove": "Remove {item}",
  "profile.list.empty": "Nothing added yet.",
  // --- profile-editor additions ---
  "profile.loading": "Loading your profile…",
  "profile.error.title": "We couldn't load this profile.",
  "profile.error.detail": "Try choosing a fictional patient again, or reset the demo.",
  "profile.form.label": "Edit health profile",
  "profile.save": "Save changes",
  "profile.saving": "Saving…",
  "profile.discard": "Discard changes",
  "profile.discarded": "Changes discarded.",
  "profile.unsaved": "You have unsaved changes.",
  "profile.upToDate": "All changes saved.",
  "profile.savedDetail": "Kat will use your updated preferences from now on.",
  "profile.scenario": "Demo scenario: {summary}",

  "profile.field.ageRangePlaceholder": "Prefer not to say",
  "profile.field.languageHint": "The app and Kat's answers will use this language after you save.",
  "profile.field.accessibilityHint": "Text size, contrast and motion change right away so you can preview them. Save to keep them.",

  "profile.conditions.options": "Conditions or concerns to choose from",
  "profile.conditions.addLabel": "Add your own condition or concern",
  "profile.conditions.add": "Add condition",
  "profile.conditions.empty": "No conditions or concerns selected.",
  "profile.conditions.selectedCount": "{count} selected",

  "profile.medication.doseNote":
    "Changing a dose or schedule here does not change your medical instructions. Only your care team can change a medication.",
  "profile.medication.item": "Medication {number}",
  "profile.medication.removeNamed": "Remove medication {name}",
  "profile.medication.unnamed": "New medication",

  "profile.careInstructions.hint":
    "From your fictional visit record. Editing this list does not change what your care team told you.",
  "profile.careInstructions.placeholder": "Type a care instruction",
  "profile.careInstructions.addLabel": "Add a care instruction",
  "profile.careInstructions.empty": "No care instructions listed.",
  "profile.healthGoals.addLabel": "Add a health goal",
  "profile.healthGoals.empty": "No goals added yet.",
  "profile.list.item": "{label}, item {number}",

  "profile.origin.fromRecord": "From your fictional visit record.",
  "profile.origin.enteredByYou": "Entered by you",
  "profile.origin.enteredByYouHint": "Added or changed in this profile. Not confirmed by your care team.",

  "profile.pregnancy.add": "Add pregnancy or postpartum context",
  "profile.pregnancy.remove": "Remove pregnancy or postpartum context",
  "profile.pregnancy.placeholder": "For example, what your care team has documented",
  // --- end profile-editor additions ---
} satisfies Namespaced<"profile">;
