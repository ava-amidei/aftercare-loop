import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionItem } from "@/lib/types";
import { ToastProvider } from "@/components/ui";
import { createCareTeamRequest } from "@/lib/services/care-team";
import { useDemoStore } from "@/lib/store";
import { CareTeamView } from "./CareTeamView";

vi.mock("next/navigation", () => ({ usePathname: () => "/care-team", useRouter: () => ({ push: vi.fn() }) }));

const NOW = "2026-11-07T12:00:00.000Z";

function setup() {
  const store = useDemoStore.getState();
  const id = store.activePatientId;
  const base = { patientId: id, rationale: "test", createdAt: NOW, updatedAt: NOW } as const;
  const actions: ActionItem[] = [
    {
      ...base,
      id: "act-pending",
      description: "Pending care-plan step",
      type: "appointment",
      category: "care_plan",
      origin: "clinician_documented",
      sourceVerification: "verified",
      status: "pending",
    },
    {
      ...base,
      id: "act-done",
      description: "Completed care-plan step",
      type: "appointment",
      category: "care_plan",
      origin: "clinician_documented",
      sourceVerification: "verified",
      status: "completed",
    },
  ];
  store.upsertActions(id, actions);
  store.addCareTeamRequest(
    id,
    createCareTeamRequest({ patientId: id, type: "clarification", summary: "My own question for the team", now: NOW }),
  );
  return { id };
}

function renderView() {
  return render(
    <ToastProvider>
      <CareTeamView />
    </ToastProvider>,
  );
}

describe("CareTeamView", () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it("always shows the fictional-simulation banner and no-authorization notes", async () => {
    setup();
    renderView();
    expect(screen.getByTestId("care-team-banner")).toHaveTextContent(
      "Fictional simulation — no real patients or clinicians",
    );
    await screen.findByText("My own question for the team");
    expect(screen.getByText(/never authorize refills or change prescriptions/)).toBeInTheDocument();
    expect(screen.getByText(/Staff review is simulated/)).toBeInTheDocument();
  });

  it("groups own + seeded requests by status, filters by type and advances status", async () => {
    const { id } = setup();
    renderView();
    await screen.findByText("My own question for the team");
    const cards = screen.getAllByTestId("care-team-request");
    expect(cards.length).toBe(5); // 1 own + 4 fictional seeds
    expect(screen.getAllByText("Fictional example").length).toBe(4);

    const submitted = screen.getByRole("heading", { name: /^Submitted/ }).parentElement!;
    const ownCard = within(submitted).getByText("My own question for the team").closest("[data-testid='care-team-request']")!;
    fireEvent.click(within(ownCard as HTMLElement).getByRole("button", { name: "Mark as In review" }));
    expect(useDemoStore.getState().patients[id]!.careTeamRequests[0]!.status).toBe("in_review");

    // Seeded requests advance in page state only.
    const responded = screen.getByRole("heading", { name: /^Responded/ }).parentElement!;
    fireEvent.click(within(responded).getByRole("button", { name: "Mark as Closed" }));
    const closed = screen.getByRole("heading", { name: /^Closed/ }).parentElement!;
    expect(within(closed).getByRole("button", { name: "Closed — no further steps" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Refill request" }));
    expect(screen.getByRole("button", { name: "Refill request" })).toHaveAttribute("aria-pressed", "true");
    const filtered = screen.getAllByTestId("care-team-request");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toHaveTextContent("Refill request");

    fireEvent.click(screen.getByRole("button", { name: "Incomplete follow-up item" }));
    expect(screen.getByText("No requests match this filter.")).toBeInTheDocument();
  });

  it("lists incomplete follow-ups and reported barriers read-only", async () => {
    setup();
    renderView();
    const followUps = await screen.findByTestId("care-team-followups");
    expect(followUps).toHaveTextContent("Pending care-plan step");
    expect(followUps).not.toHaveTextContent("Completed care-plan step");
    expect(within(followUps).getByText("From your clinician")).toBeInTheDocument();
    const barriers = useDemoStore.getState().active().profile.barriers;
    if (barriers.length > 0) {
      expect(screen.getByTestId("care-team-barriers").querySelectorAll("li")).toHaveLength(barriers.length);
    } else {
      expect(screen.getByText("No barriers reported.")).toBeInTheDocument();
    }
    expect(within(followUps).queryByRole("button")).toBeNull();
  });
});
