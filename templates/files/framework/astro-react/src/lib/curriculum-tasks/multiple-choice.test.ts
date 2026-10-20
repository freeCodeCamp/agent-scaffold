import { describe, it, expect } from "vitest";
import { MultipleChoiceTaskSchema } from "./multiple-choice";

describe("MultipleChoiceTaskSchema", () => {
  it("accepts a valid task with exactly one correct option", () => {
    const data = {
      type: "multiple-choice",
      question: "Pick one",
      options: [
        { text: "A", correct: true },
        { text: "B", correct: false },
      ],
    };

    expect(MultipleChoiceTaskSchema.parse(data)).toMatchObject({ question: "Pick one" });
  });

  it("rejects a task with zero correct options", () => {
    const data = {
      type: "multiple-choice",
      question: "Pick one",
      options: [
        { text: "A", correct: false },
        { text: "B", correct: false },
      ],
    };

    expect(() => MultipleChoiceTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with two correct options", () => {
    const data = {
      type: "multiple-choice",
      question: "Pick one",
      options: [
        { text: "A", correct: true },
        { text: "B", correct: true },
      ],
    };

    expect(() => MultipleChoiceTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with fewer than 2 options", () => {
    const data = {
      type: "multiple-choice",
      question: "Pick one",
      options: [{ text: "A", correct: true }],
    };

    expect(() => MultipleChoiceTaskSchema.parse(data)).toThrow();
  });
});
