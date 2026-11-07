import { describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useFocusTrap } from "./use-focus-trap";

function Surface({
  label,
  onEscape,
  trap = true,
  children,
}: {
  label: string;
  onEscape: () => void;
  trap?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { active: true, onEscape, trap, lockScroll: false });
  return (
    <div ref={ref} role="dialog" aria-label={label} tabIndex={-1}>
      {children}
    </div>
  );
}

function Removable() {
  const [shown, setShown] = useState(true);
  return shown ? <button onClick={() => setShown(false)}>Chip</button> : <span>Gone</span>;
}

describe("useFocusTrap", () => {
  it("still handles Escape and Tab after the focused element unmounts (focus on body)", () => {
    const onEscape = vi.fn();
    render(
      <Surface label="Kat" onEscape={onEscape}>
        <Removable />
        <button>Send</button>
      </Surface>,
    );
    const chip = screen.getByRole("button", { name: "Chip" });
    expect(chip).toHaveFocus();
    fireEvent.click(chip);
    chip.blur();
    expect(document.activeElement).toBe(document.body);

    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Send" })).toHaveFocus();
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("only the topmost surface reacts to Escape", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Surface label="Outer" onEscape={outer} trap={false}>
          <button>Outer button</button>
        </Surface>
        <Surface label="Inner" onEscape={inner}>
          <button>Inner button</button>
        </Surface>
      </>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Inner button" }), { key: "Escape" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("a non-modal surface ignores Escape while focus is elsewhere on the page", () => {
    const onEscape = vi.fn();
    render(
      <>
        <button>Page button</button>
        <Surface label="Panel" onEscape={onEscape} trap={false}>
          <button>Panel button</button>
        </Surface>
      </>,
    );
    const page = screen.getByRole("button", { name: "Page button" });
    page.focus();
    fireEvent.keyDown(page, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
    const inside = screen.getByRole("button", { name: "Panel button" });
    inside.focus();
    fireEvent.keyDown(inside, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});
