/*
 * Spanish dictionary (partial — missing keys fall back to English).
 * Translations are demo-validated only for the scripted scenarios.
 * Merge is mechanical: one spread per feature module.
 */
import type { PartialDictionary } from "../types";
import { actionPlan } from "./actionPlan";
import { askKat } from "./askKat";
import { careTeam } from "./careTeam";
import { check } from "./check";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { evaluation } from "./evaluation";
import { followUp } from "./followUp";
import { nav } from "./nav";
import { profile } from "./profile";
import { safety } from "./safety";
import { understand } from "./understand";

export const es: PartialDictionary = {
  ...common,
  ...nav,
  ...dashboard,
  ...profile,
  ...understand,
  ...actionPlan,
  ...check,
  ...followUp,
  ...careTeam,
  ...evaluation,
  ...askKat,
  ...safety,
};
