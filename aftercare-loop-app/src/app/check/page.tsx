import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function CheckPage() {
  return (
    <>
      <PageHeader title="Check My Understanding" />
      <EmptyState
        icon={<ClipboardCheck aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="Short questions to make sure explanations were clear will appear here."
      />
    </>
  );
}
