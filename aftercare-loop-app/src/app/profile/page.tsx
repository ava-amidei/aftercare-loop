import { User } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function ProfilePage() {
  return (
    <>
      <PageHeader title="My Health Profile" />
      <EmptyState
        icon={<User aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="Your profile settings will appear here."
      />
    </>
  );
}
