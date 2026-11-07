import type { Namespaced } from "../types";

// UI chrome for safety banners. Scenario-specific guidance text comes from
// src/lib/safety (deterministic rules), not from these dictionaries.
export const safety = {
  "safety.emergency.title": "This may be an emergency",
  "safety.emergency.call911": "Call 911 now (in the US) or your local emergency number.",
  "safety.emergency.dontWait": "Don't wait for a reply in this app.",
  "safety.crisis.title": "You don't have to face this alone",
  "safety.crisis.call988":
    "In the US, call or text 988 to reach the 988 Suicide & Crisis Lifeline. If you are in immediate danger, call 911.",
  "safety.concerning.title": "Please check with a clinician soon",
  "safety.concerning.body":
    "Kat can't assess symptoms. Please contact your care team or an urgent care provider promptly.",
  "safety.clarify.title": "Check this with your clinician",
  "safety.info.title": "Good to know",
  "safety.documentFlag": "Your document mentions something that may need prompt attention.",
  "safety.limits":
    "Kat can't diagnose, tell you whether you are safe, or change your medications or care plan.",
  "safety.followInstructions": "Always follow the instructions from your care team.",
} satisfies Namespaced<"safety">;
