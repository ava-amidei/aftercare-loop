import { BeakerIcon, CalendarDaysIcon, ClipboardDocumentListIcon, EllipsisHorizontalCircleIcon, EyeDropperIcon, HeartIcon, PaperAirplaneIcon, PresentationChartLineIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import type { HeroIcon } from "@/components/ui/icon";
import type { ActionType } from "@/lib/types";

/** One icon per action type (never per condition). */
export const ACTION_TYPE_ICONS: Record<ActionType, HeroIcon> = {
  medication: EyeDropperIcon,
  appointment: CalendarDaysIcon,
  test_or_lab: BeakerIcon,
  referral: PaperAirplaneIcon,
  lifestyle: HeartIcon,
  monitoring: PresentationChartLineIcon,
  administrative: ClipboardDocumentListIcon,
  question_for_provider: QuestionMarkCircleIcon,
  other: EllipsisHorizontalCircleIcon,
};
