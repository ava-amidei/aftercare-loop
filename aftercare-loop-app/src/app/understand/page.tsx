import type { Metadata } from "next";
import { UnderstandView } from "@/components/understand/UnderstandView";

export const metadata: Metadata = {
  title: "Understand My Health — Aftercare Loop",
};

export default function UnderstandPage() {
  return <UnderstandView />;
}
