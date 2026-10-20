import { describe, it, expect } from "vitest";
import { TextSelectTaskSchema, parseTextSelectContent } from "./text-select";
import { paragraph } from "../../test-utils/mdast-builders";

describe("TextSelectTaskSchema", () => {
  it("accepts a valid task with at least one correct token", () => {
    const data = {
      type: "text-select",
      prompt: "Select the noun.",
      tokens: [
        { text: "The", correct: false },
        { text: "chef", correct: true },
        { text: "cooks.", correct: false },
      ],
    };

    expect(TextSelectTaskSchema.parse(data)).toMatchObject({ type: "text-select" });
  });

  it("rejects a task with no correct tokens", () => {
    const data = {
      type: "text-select",
      prompt: "Select the noun.",
      tokens: [
        { text: "The", correct: false },
        { text: "chef", correct: false },
      ],
    };

    expect(() => TextSelectTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with an empty tokens array", () => {
    const data = {
      type: "text-select",
      prompt: "Select the noun.",
      tokens: [],
    };

    expect(() => TextSelectTaskSchema.parse(data)).toThrow();
  });
});

describe("parseTextSelectContent", () => {
  it("extracts the prompt from the first paragraph", () => {
    const nodes = [
      paragraph("Select the noun."),
      paragraph("The {{chef}} cooks."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.prompt).toBe("Select the noun.");
  });

  it("tokenizes plain words as not correct", () => {
    const nodes = [
      paragraph("Select the noun."),
      paragraph("The chef cooks."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.tokens).toEqual([
      { text: "The", correct: false },
      { text: "chef", correct: false },
      { text: "cooks.", correct: false },
    ]);
  });

  it("marks {{word}} tokens as correct", () => {
    const nodes = [
      paragraph("Select the noun."),
      paragraph("The {{chef}} cooks."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.tokens).toEqual([
      { text: "The", correct: false },
      { text: "chef", correct: true },
      { text: "cooks.", correct: false },
    ]);
  });

  it("handles multiple correct tokens", () => {
    const nodes = [
      paragraph("Select the nouns."),
      paragraph("The {{chef}} and {{baker}} are here."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.tokens).toEqual([
      { text: "The", correct: false },
      { text: "chef", correct: true },
      { text: "and", correct: false },
      { text: "baker", correct: true },
      { text: "are", correct: false },
      { text: "here.", correct: false },
    ]);
  });

  it("treats a multi-word {{phrase}} as a single correct token", () => {
    const nodes = [
      paragraph("Select the galaxy."),
      paragraph("I ate a {{milky way}} for breakfast."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.tokens).toEqual([
      { text: "I", correct: false },
      { text: "ate", correct: false },
      { text: "a", correct: false },
      { text: "milky way", correct: true },
      { text: "for", correct: false },
      { text: "breakfast.", correct: false },
    ]);
  });

  it("trims whitespace inside {{}} markers", () => {
    const nodes = [
      paragraph("Select the noun."),
      paragraph("The {{ chef }} cooks."),
    ];

    const result = parseTextSelectContent(nodes);

    expect(result.tokens).toContainEqual({ text: "chef", correct: true });
  });
});
