import type { Namespaced } from "../types";

export const nav = {
  "nav.mainLabel": "Main navigation",
  "nav.menu": "Menu",
  "nav.home": "Home",
  "nav.dashboard": "My Health Dashboard",
  "nav.profile": "My Health Profile",
  "nav.understand": "Understand",
  "nav.understandFull": "Understand My Health",
  "nav.plan": "Plan",
  "nav.actionPlanFull": "My Action Plan",
  "nav.check": "Check",
  "nav.checkFull": "Check My Understanding",
  "nav.followUp": "Follow Up",
  "nav.followUpFull": "Follow Up",
  "nav.careTeam": "Care Team (simulated)",
  "nav.evaluation": "Evaluation",
  "nav.askKat": "Ask Kat",

  "nav.loop.label": "Your care loop",
  "nav.loop.understand": "Understand",
  "nav.loop.ask": "Ask",
  "nav.loop.verify": "Verify",
  "nav.loop.act": "Act",
  "nav.loop.followUp": "Follow Up",

  // [ui-fix-1] AppShell landmark labels
  "nav.primaryLabel": "Main",
  "nav.secondaryLabel": "More",
  "nav.footerLabel": "More (footer)",
  // [/ui-fix-1]
} satisfies Namespaced<"nav">;
