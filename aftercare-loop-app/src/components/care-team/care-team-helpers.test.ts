import { describe, expect, it } from "vitest";
import type { ActionItem, CareTeamRequest } from "@/lib/types";
import { advanceRequest, createCareTeamRequest, seedRequests } from "@/lib/services/care-team";
import {
  filterByType,
  groupByStatus,
  incompleteFollowUps,
  isSeedRequest,
  mergeQueue,
  replaceRequest,
} from "./care-team-helpers";

const NOW = "2026-11-07T12:00:00.000Z";

const own: CareTeamRequest = createCareTeamRequest({
  patientId: "pt-x",
  type: "clarification",
  summary: "Which step first?",
  now: NOW,
});

describe("care-team helpers", () => {
  const seeds = seedRequests("pt-x", NOW);

  it("identifies seeded requests and merges own requests first without duplicates", () => {
    expect(seeds.every(isSeedRequest)).toBe(true);
    expect(isSeedRequest(own)).toBe(false);
    const q = mergeQueue([own], [...seeds, seeds[0]!]);
    expect(q[0]).toBe(own);
    expect(q).toHaveLength(1 + seeds.length);
  });

  it("filters by type", () => {
    const q = mergeQueue([own], seeds);
    expect(filterByType(q, "all")).toHaveLength(q.length);
    expect(filterByType(q, "refill_request").every((r) => r.type === "refill_request")).toBe(true);
    expect(filterByType(q, "incomplete_follow_up")).toEqual([]);
  });

  it("groups by status in workflow order, newest first", () => {
    const older = { ...own, id: "older", createdAt: "2026-11-01T00:00:00.000Z" };
    const groups = groupByStatus([older, own, ...seeds]);
    expect(groups.map((g) => g.status)).toEqual(["submitted", "in_review", "responded", "closed"]);
    const submitted = groups[0]!.requests;
    expect(submitted.indexOf(own)).toBeLessThan(submitted.indexOf(older));
    expect(groups[3]!.requests).toEqual([]);
  });

  it("replaces an advanced request", () => {
    const next = advanceRequest(seeds[0]!, NOW);
    const out = replaceRequest(seeds, next);
    expect(out[0]!.status).toBe("in_review");
    expect(out.slice(1)).toEqual(seeds.slice(1));
  });

  it("lists only pending / needs-clarification care-plan items", () => {
    const mk = (id: string, p: Partial<ActionItem>): ActionItem => ({
      id,
      patientId: "pt-x",
      description: id,
      type: "other",
      category: "care_plan",
      origin: "clinician_documented",
      sourceVerification: "verified",
      status: "pending",
      rationale: "",
      createdAt: NOW,
      updatedAt: NOW,
      ...p,
    });
    const items = [
      mk("pending", {}),
      mk("clarify", { status: "needs_clarification", sourceVerification: "unverified" }),
      mk("done", { status: "completed" }),
      mk("goal", { category: "wellness_goal", origin: "patient_selected" }),
      mk("question", { category: "provider_question", origin: "ai_suggested" }),
    ];
    expect(incompleteFollowUps(items).map((a) => a.id)).toEqual(["pending", "clarify"]);
  });
});
