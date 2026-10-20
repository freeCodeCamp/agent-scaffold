import { describe, it, expect } from "vitest";
import { SelectAllThatApplyTaskSchema } from "./select-all";

describe("SelectAllThatApplyTaskSchema", () => {
  it("accepts a task with one or more correct options", () => {
    const data = {
      type: "select-all-that-apply",
      question: "Select all",
      options: [
        { text: "A", correct: true },
        { text: "B", correct: true },
        { text: "C", correct: false },
      ],
    };

    expect(SelectAllThatApplyTaskSchema.parse(data)).toMatchObject({ question: "Select all" });
  });

  it("rejects a task with zero correct options", () => {
    const data = {
      type: "select-all-that-apply",
      question: "Select all",
      options: [
        { text: "A", correct: false },
        { text: "B", correct: false },
      ],
    };

    expect(() => SelectAllThatApplyTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with fewer than 2 options", () => {
    const data = {
      type: "select-all-that-apply",
      question: "Select all",
      options: [{ text: "A", correct: true }],
    };

    expect(() => SelectAllThatApplyTaskSchema.parse(data)).toThrow();
  });
});
