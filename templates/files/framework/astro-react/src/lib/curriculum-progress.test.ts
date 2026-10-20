import { describe, it, expect, beforeEach } from "vitest";
import { markLessonComplete } from "./curriculum-progress";

describe("markLessonComplete", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marks a lesson complete when no prior progress exists", () => {
    markLessonComplete("lesson-1");

    const stored = JSON.parse(localStorage.getItem("progress")!);
    expect(stored).toEqual(["lesson-1"]);
  });

  it("appends to existing progress", () => {
    localStorage.setItem("progress", JSON.stringify(["lesson-1"]));

    markLessonComplete("lesson-2");

    const stored = JSON.parse(localStorage.getItem("progress")!);
    expect(stored).toEqual(["lesson-1", "lesson-2"]);
  });

  it("does not add a duplicate entry", () => {
    localStorage.setItem("progress", JSON.stringify(["lesson-1"]));

    markLessonComplete("lesson-1");

    const stored = JSON.parse(localStorage.getItem("progress")!);
    expect(stored).toEqual(["lesson-1"]);
  });

  it("handles corrupted non-JSON localStorage value", () => {
    localStorage.setItem("progress", "not-json]");

    markLessonComplete("lesson-1");

    const stored = JSON.parse(localStorage.getItem("progress")!);
    expect(stored).toEqual(["lesson-1"]);
  });

  it("handles non-array stored value", () => {
    localStorage.setItem("progress", JSON.stringify({ key: "value" }));

    markLessonComplete("lesson-1");

    const stored = JSON.parse(localStorage.getItem("progress")!);
    expect(stored).toEqual(["lesson-1"]);
  });
});
