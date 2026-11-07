/** Safety engine public surface. Import from "@/lib/safety". */
export {
  evaluateSafety,
  containsFalseReassurance,
  findFalseReassurance,
  normalizeForSafety,
  toSafetyClauses,
  type SafetyOptions,
} from "./rules";
export {
  SAFETY_SYSTEM_RULES,
  SAFETY_GUIDANCE,
  getSafetyGuidance,
  type GuidanceOptions,
} from "./guidance";
export {
  MAX_DOCUMENT_CHARS,
  sanitizeDocument,
  sanitizeDocumentText,
  wrapUntrusted,
  detectInjectionMarkers,
  type SanitizedDocument,
} from "./sanitize";
