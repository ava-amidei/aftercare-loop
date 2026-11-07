import {
  Activity,
  CalendarDays,
  Circle,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  MessageCircleQuestion,
  Pill,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { ActionType } from "@/lib/types";

/** One icon per action type (never per condition). */
export const ACTION_TYPE_ICONS: Record<ActionType, LucideIcon> = {
  medication: Pill,
  appointment: CalendarDays,
  test_or_lab: FlaskConical,
  referral: Send,
  lifestyle: HeartPulse,
  monitoring: Activity,
  administrative: ClipboardList,
  question_for_provider: MessageCircleQuestion,
  other: Circle,
};
