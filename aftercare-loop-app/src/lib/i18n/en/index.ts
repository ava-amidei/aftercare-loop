/**
 * English dictionary = source of truth for TranslationKey.
 * Merge is mechanical: one spread per feature module. Feature agents edit ONLY
 * their own feature file; keys are namespaced so spreads can't collide.
 */
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

export const enModules = {
  common,
  nav,
  dashboard,
  profile,
  understand,
  actionPlan,
  check,
  followUp,
  careTeam,
  evaluation,
  askKat,
  safety,
};

export const en = {
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
