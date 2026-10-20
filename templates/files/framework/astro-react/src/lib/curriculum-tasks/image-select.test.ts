import { describe, it, expect } from "vitest";
import { ImageSelectTaskSchema, parseImageSelectContent } from "./image-select";
import { paragraph, imageParagraph } from "../../test-utils/mdast-builders";

describe("ImageSelectTaskSchema", () => {
  const validData = {
    type: "image-select",
    prompt: "Click the resistor.",
    imageSrc: "/images/circuit-diagram.svg",
    correct: ["resistor"],
  };

  it("accepts a valid task", () => {
    expect(ImageSelectTaskSchema.parse(validData)).toMatchObject({ prompt: validData.prompt });
  });

  it("rejects a task with no correct regions", () => {
    const data = { ...validData, correct: [] };

    expect(() => ImageSelectTaskSchema.parse(data)).toThrow();
  });

  it("rejects a task with an empty imageSrc", () => {
    const data = { ...validData, imageSrc: "" };

    expect(() => ImageSelectTaskSchema.parse(data)).toThrow();
  });
});

describe("parseImageSelectContent", () => {
  it("extracts the prompt, image source, and correct region ids", () => {
    const nodes = [
      paragraph("Click the resistor."),
      imageParagraph("/images/circuit-diagram.svg", "A circuit diagram"),
      paragraph("Correct: resistor"),
    ];

    const result = parseImageSelectContent(nodes);

    expect(result.prompt).toBe("Click the resistor.");
    expect(result.imageSrc).toBe("/images/circuit-diagram.svg");
    expect(result.correct).toEqual(["resistor"]);
  });

  it("splits multiple correct ids on commas and trims whitespace", () => {
    const nodes = [
      paragraph("Click the components that store energy."),
      imageParagraph("/images/circuit-diagram.svg"),
      paragraph("Correct: battery,  capacitor"),
    ];

    const result = parseImageSelectContent(nodes);

    expect(result.correct).toEqual(["battery", "capacitor"]);
  });

  it("returns an empty prompt when no non-image, non-correct paragraph is present", () => {
    const nodes = [imageParagraph("/images/circuit-diagram.svg"), paragraph("Correct: resistor")];

    const result = parseImageSelectContent(nodes);

    expect(result.prompt).toBe("");
  });
});
