import { describe, it, expect } from "vitest";
import { FlashCardTaskSchema, parseFlashCardContent } from "./flash-card";
import { paragraph, paragraphWithEmphasis } from "../../test-utils/mdast-builders";

describe("FlashCardTaskSchema", () => {
  const validData = {
    type: "flash-card",
    prompt: "Find the mistake.",
    front: "I goed to the store.",
    back: "I went to the store.",
  };

  it("accepts a valid task", () => {
    expect(FlashCardTaskSchema.parse(validData)).toMatchObject({
      front: validData.front,
      back: validData.back,
    });
  });

  it("rejects a task with an empty front", () => {
    const data = { ...validData, front: "" };

    expect(() => FlashCardTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with an empty back", () => {
    const data = { ...validData, back: "" };

    expect(() => FlashCardTaskSchema.parse(data)).toThrow();
  });
});

describe("parseFlashCardContent", () => {
  it("extracts the prompt, front, and back from labeled paragraphs", () => {
    const nodes = [
      paragraph("Find the mistake."),
      paragraph("Front: I goed to the store."),
      paragraph("Back: I went to the store."),
    ];

    const result = parseFlashCardContent(nodes);

    expect(result.prompt).toBe("Find the mistake.");
    expect(result.front).toBe("I goed to the store.");
    expect(result.back).toBe("I went to the store.");
  });

  it("matches the label case-insensitively", () => {
    const nodes = [paragraph("front: I goed to the store."), paragraph("BACK: I went to the store.")];

    const result = parseFlashCardContent(nodes);

    expect(result.front).toBe("I goed to the store.");
    expect(result.back).toBe("I went to the store.");
  });

  it("preserves markdown formatting that follows the label", () => {
    const nodes = [paragraphWithEmphasis("Front: I ", "goed", " to the store.")];

    const result = parseFlashCardContent(nodes);

    expect(result.front).toContain("*goed*");
  });

  it("includes paragraphs after the label as part of the same side", () => {
    const nodes = [
      paragraph("Front: I goed to the store."),
      paragraph("It was raining."),
      paragraph("Back: I went to the store."),
    ];

    const result = parseFlashCardContent(nodes);

    expect(result.front).toContain("It was raining.");
  });

  it("returns an empty prompt when the front label is the first node", () => {
    const nodes = [paragraph("Front: I goed to the store."), paragraph("Back: I went to the store.")];

    const result = parseFlashCardContent(nodes);

    expect(result.prompt).toBe("");
  });

  it("returns an empty front and back when no labels are present", () => {
    const nodes = [paragraph("Just some text with no labels.")];

    const result = parseFlashCardContent(nodes);

    expect(result.front).toBe("");
    expect(result.back).toBe("");
  });
});
