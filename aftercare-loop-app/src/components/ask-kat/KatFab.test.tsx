import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KatFab } from "./KatFab";

describe("KatFab", () => {
  it("is icon-only below md (label kept for assistive tech) and a labelled pill from md up", () => {
    const onClick = vi.fn();
    render(<KatFab label="Ask Kat" ariaLabel="Open Ask Kat" onClick={onClick} />);
    const fab = screen.getByRole("button", { name: "Open Ask Kat" });
    // Small 56px footprint on mobile so it covers as little content as possible (SPEC §12.1).
    expect(fab.className).toMatch(/(^|\s)size-14(\s|$)/);
    expect(fab.className).toMatch(/md:size-auto/);
    const label = screen.getByTestId("kat-fab-label");
    expect(label).toHaveTextContent("Ask Kat");
    expect(label.className).toMatch(/(^|\s)sr-only(\s|$)/);
    expect(label.className).toMatch(/md:not-sr-only/);
    fireEvent.click(fab);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
