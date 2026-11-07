/**
 * Typed key builders for domain enums. Each template literal must resolve to
 * an existing key — adding an enum member without a dictionary entry is a
 * compile error here.
 */
import type {
  AccessBarrier,
  AccessibilityPreference,
  ActionCategory,
  ActionOrigin,
  ActionStatus,
  ActionType,
  CareTeamRequestStatus,
  CareTeamRequestType,
  EvalKind,
  EvalSuite,
  EvidenceKind,
  ExplanationLevel,
  KatActionKind,
  Language,
  QuickPromptId,
  SourceVerification,
} from "@/lib/types";
import type { TranslationKey } from "./types";

const k = <K extends TranslationKey>(key: K): K => key;

export const languageNameKey = (v: Language) => k(`common.language.${v}`);
export const originKey = (v: ActionOrigin) => k(`common.origin.${v}`);
export const verificationKey = (v: SourceVerification) => k(`common.verification.${v}`);
export const explanationLevelKey = (v: ExplanationLevel) => k(`profile.level.${v}`);
export const explanationLevelHintKey = (v: ExplanationLevel) => k(`profile.level.${v}Hint`);
export const accessibilityKey = (v: AccessibilityPreference) => k(`profile.accessibility.${v}`);
export const barrierKey = (v: AccessBarrier) => k(`profile.barrier.${v}`);
export const evidenceKindKey = (v: EvidenceKind) => k(`understand.source.${v}`);
export const actionCategoryKey = (v: ActionCategory) => k(`actionPlan.category.${v}`);
export const actionCategoryHintKey = (v: ActionCategory) => k(`actionPlan.category.${v}Hint`);
export const actionStatusKey = (v: ActionStatus) => k(`actionPlan.status.${v}`);
export const actionTypeKey = (v: ActionType) => k(`actionPlan.type.${v}`);
export const careTeamTypeKey = (v: CareTeamRequestType) => k(`careTeam.type.${v}`);
export const careTeamStatusKey = (v: CareTeamRequestStatus) => k(`careTeam.status.${v}`);
export const evalSuiteKey = (v: EvalSuite) => k(`evaluation.suite.${v}`);
export const evalKindKey = (v: EvalKind) => k(`evaluation.kind.${v}`);
export const quickPromptKey = (v: QuickPromptId) => k(`askKat.chip.${v}`);
export const katActionKey = (v: KatActionKind) => k(`askKat.action.${v}`);

/** The five Ask Kat chips, in SPEC §12.1 order. */
export const QUICK_PROMPT_ORDER: readonly QuickPromptId[] = [
  "what_should_i_ask",
  "explain_my_diagnosis",
  "understand_my_results",
  "plan_next_steps",
  "free_text",
];
