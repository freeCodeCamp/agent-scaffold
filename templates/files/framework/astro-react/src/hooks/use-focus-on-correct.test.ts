import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFocusOnCorrect } from "./use-focus-on-correct";
import type { Result } from "../components/tasks/shared/task-actions";

describe(useFocusOnCorrect, () => {
  it("focuses the ref element when result becomes correct", () => {
    const { result, rerender } = renderHook(
      ({ r }: { r: Result | null }) => useFocusOnCorrect<HTMLDivElement>(r),
      { initialProps: { r: null as Result | null } },
    );

    const el = document.createElement("div");
    document.body.appendChild(el);
    el.tabIndex = -1;
    result.current.current = el;

    rerender({ r: "correct" });

    expect(el).toHaveFocus();
  });

  it("does not focus when result is incorrect", () => {
    const { result, rerender } = renderHook(
      ({ r }: { r: Result | null }) => useFocusOnCorrect<HTMLDivElement>(r),
      { initialProps: { r: null as Result | null } },
    );

    const el = document.createElement("div");
    document.body.appendChild(el);
    el.tabIndex = -1;
    result.current.current = el;

    rerender({ r: "incorrect" });

    expect(el).not.toHaveFocus();
  });
});
