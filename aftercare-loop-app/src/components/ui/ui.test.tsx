import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  DEMO_BANNER_TEXT,
  DemoBanner,
  Dialog,
  ModeBadge,
  OriginBadge,
  SCRIPTED_MODE_LABEL,
  SourceQuote,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToastProvider,
  useToast,
} from "./index";

describe("Button", () => {
  it("renders an accessible button and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /save/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading")).toHaveClass("sr-only");
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the variant", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-variant", "danger");
  });
});

describe("Button wrapping", () => {
  it("lets text labels wrap so long labels never widen a mobile column", () => {
    render(<Button>Save this question for my care team</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).not.toMatch(/whitespace-nowrap/);
    expect(cls).toMatch(/max-w-full/);
    expect(cls).toMatch(/text-center/);
  });

  it("keeps icon buttons on one line", () => {
    render(<Button size="icon" aria-label="Close">x</Button>);
    expect(screen.getByRole("button", { name: "Close" }).className).toMatch(/whitespace-nowrap/);
  });
});

describe("OriginBadge", () => {
  it.each([
    ["clinician_documented", "Clinician-documented"],
    ["patient_selected", "Patient-selected"],
    ["ai_suggested", "AI-suggested"],
  ] as const)("labels %s as %s", (origin, label) => {
    render(<OriginBadge origin={origin} />);
    const badge = screen.getByText(label).closest("[data-origin]");
    expect(badge).toHaveAttribute("data-origin", origin);
  });

  it("states that AI suggestions are not clinician instructions", () => {
    render(<OriginBadge origin="ai_suggested" />);
    expect(screen.getByText(/not an instruction from your clinician/i)).toBeInTheDocument();
  });

  it("uses a distinct style for each origin", () => {
    const { container } = render(
      <>
        <OriginBadge origin="clinician_documented" />
        <OriginBadge origin="patient_selected" />
        <OriginBadge origin="ai_suggested" />
      </>,
    );
    const classes = Array.from(container.querySelectorAll("[data-origin]")).map((el) => el.className);
    expect(new Set(classes).size).toBe(3);
  });
});

describe("ModeBadge", () => {
  it("renders the exact scripted demo label", () => {
    const { container } = render(<ModeBadge mode="scripted_demo" />);
    expect(SCRIPTED_MODE_LABEL).toBe(
      "Scripted Demo Mode — Responses are predefined for demonstration purposes.",
    );
    expect(container.textContent).toBe(SCRIPTED_MODE_LABEL);
  });

  it("keeps the full scripted sentence for screen readers in compact mode", () => {
    const { container } = render(<ModeBadge mode="scripted_demo" compact />);
    expect(container.textContent).toBe(SCRIPTED_MODE_LABEL);
  });

  it("labels live responses and never shows the scripted text", () => {
    render(<ModeBadge mode="live_claude" model="claude-opus-5-5" />);
    expect(screen.getByText("Live AI (Claude · claude-opus-5-5)")).toBeInTheDocument();
    expect(screen.queryByText(/Scripted Demo Mode/)).not.toBeInTheDocument();
  });

  it("labels live Gemini responses with provider and model", () => {
    const { container } = render(<ModeBadge mode="live_gemini" model="gemini-3.8-flash" />);
    expect(screen.getByText("Live AI (Gemini · gemini-3.8-flash)")).toBeInTheDocument();
    expect(container.querySelector("[data-mode]")?.getAttribute("title")).toBe("Live AI (Gemini · gemini-3.8-flash)");
  });

  it("shows only the provider when compact", () => {
    render(<ModeBadge mode="live_gemini" model="gemini-3.8-flash" compact />);
    expect(screen.getByText("Live AI (Gemini)")).toBeInTheDocument();
  });
});

describe("DemoBanner", () => {
  it("shows the required banner text", () => {
    render(<DemoBanner />);
    expect(screen.getByText("Demonstration using fictional patient data.")).toBeInTheDocument();
    expect(DEMO_BANNER_TEXT).toBe("Demonstration using fictional patient data.");
  });
});

describe("SourceQuote", () => {
  const doc = { title: "After-Visit Summary", text: "Notes. Schedule a fasting lipid panel within 2 weeks. Thanks." };
  const start = doc.text.indexOf("Schedule");
  const quote = "Schedule a fasting lipid panel within 2 weeks.";
  const ref = { documentId: "d1", start, end: start + quote.length, quote };

  it("highlights a verified passage with context and a View source button", async () => {
    const onView = vi.fn();
    render(<SourceQuote sourceRef={ref} document={doc} verification="verified" onViewSource={onView} />);
    expect(screen.getByTestId("source-highlight")).toHaveTextContent(quote);
    expect(screen.getByText("Matches your document")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "View source" }));
    expect(onView).toHaveBeenCalled();
  });

  it("downgrades to unverified when offsets do not match the document", () => {
    render(<SourceQuote sourceRef={{ ...ref, start: 0 }} document={doc} verification="verified" />);
    expect(screen.queryByText("Matches your document")).not.toBeInTheDocument();
    expect(screen.getByText(/Not verified/)).toBeInTheDocument();
  });
});

describe("Stat", () => {
  it("renders Not evaluated for a null value", () => {
    render(<Stat label="Recall" value={null} numerator={null} denominator={null} />);
    expect(screen.getByTestId("stat-value")).toHaveTextContent("Not evaluated");
  });
});

describe("Dialog", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <Dialog open={open} onOpenChange={setOpen} title="Confirm reset">
          <button>Inside</button>
        </Dialog>
      </>
    );
  }

  it("traps focus, closes on Escape and restores focus", async () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open" });
    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Confirm reset" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.tab();
    await userEvent.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

describe("Tabs", () => {
  it("switches panels with arrow keys", async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList label="Sections">
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel A");
    screen.getByRole("tab", { name: "First" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel B");
  });
});

describe("Toast", () => {
  function Trigger() {
    const { toast } = useToast();
    return <button onClick={() => toast({ title: "Saved to your list", variant: "success" })}>Notify</button>;
  }
  it("shows a toast from useToast", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved to your list");
  });

  it("is a safe no-op outside a provider", async () => {
    render(<Trigger />);
    await userEvent.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.queryByText("Saved to your list")).not.toBeInTheDocument();
  });
});
