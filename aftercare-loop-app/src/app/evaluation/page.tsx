import type { Metadata } from "next";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";

export const metadata: Metadata = {
  title: "Evaluation · Aftercare Loop",
  description: "Limited automated evaluation on fictional, synthetic cases. Not clinical validation.",
};

export default function EvaluationPage() {
  return <EvaluationDashboard />;
}
