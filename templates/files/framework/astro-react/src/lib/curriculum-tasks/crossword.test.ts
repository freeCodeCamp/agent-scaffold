import { describe, it, expect } from "vitest";
import { CrosswordTaskSchema, parseCrosswordContent } from "./crossword";
import { paragraph, list, listItem, code } from "../../test-utils/mdast-builders";

describe("CrosswordTaskSchema", () => {
  const validData = {
    type: "crossword",
    question: "Fill in the crossword using the clues below.",
    solution: [
      [null, "S", null, null],
      ["G", "L", "A", "D"],
      [null, "O", null, null],
      [null, "W", null, null],
    ],
    clues: [
      { direction: "across", clue: "A word meaning happy", row: 1, col: 0, length: 4 },
      { direction: "down", clue: "Opposite of fast", row: 0, col: 1, length: 4 },
    ],
  };

  it("accepts a valid intersecting grid", () => {
    expect(CrosswordTaskSchema.parse(validData)).toMatchObject({ question: validData.question });
  });

  it("rejects a grid with uneven row lengths", () => {
    const data = { ...validData, solution: [["A", "B"], ["C"]] };

    expect(() => CrosswordTaskSchema.parse(data)).toThrow();
  });

  it("rejects a grid with no clues", () => {
    const data = { ...validData, clues: [] };

    expect(() => CrosswordTaskSchema.parse(data)).toThrow();
  });

  it("rejects when the across clue count doesn't match the grid", () => {
    const data = {
      ...validData,
      solution: [["A"], ["B"], ["C"]],
      clues: [
        { direction: "down", clue: "x", row: 0, col: 0, length: 3 },
        { direction: "across", clue: "y", row: 0, col: 0, length: 1 },
      ],
    };

    expect(() => CrosswordTaskSchema.parse(data)).toThrow();
  });

  it("rejects when the down clue count doesn't match the grid", () => {
    const data = {
      ...validData,
      solution: [["A", "B", "C"]],
      clues: [
        { direction: "across", clue: "x", row: 0, col: 0, length: 3 },
        { direction: "down", clue: "y", row: 0, col: 0, length: 1 },
      ],
    };

    expect(() => CrosswordTaskSchema.parse(data)).toThrow();
  });

  it("rejects a grid that splits into more than one disconnected group", () => {
    const data = {
      ...validData,
      solution: [
        ["A", "B", null, null, null],
        [null, null, null, "C", "D"],
      ],
      clues: [
        { direction: "across", clue: "x", row: 0, col: 0, length: 2 },
        { direction: "across", clue: "y", row: 1, col: 3, length: 2 },
      ],
    };

    expect(() => CrosswordTaskSchema.parse(data)).toThrow();
  });
});

describe("parseCrosswordContent", () => {
  it("extracts question, solution grid, and numbered clues from nodes", () => {
    const nodes = [
      paragraph("Fill in the crossword using the clues below."),
      code(".S..\nGLAD\n.O..\n.W.."),
      paragraph("Across:"),
      list([listItem("A word meaning happy")]),
      paragraph("Down:"),
      list([listItem("Opposite of fast")]),
    ];

    const result = parseCrosswordContent(nodes);

    expect(result.question).toBe("Fill in the crossword using the clues below.");
    expect(result.solution).toEqual([
      [null, "S", null, null],
      ["G", "L", "A", "D"],
      [null, "O", null, null],
      [null, "W", null, null],
    ]);
    expect(result.clues).toEqual([
      { direction: "across", clue: "A word meaning happy", row: 1, col: 0, length: 4 },
      { direction: "down", clue: "Opposite of fast", row: 0, col: 1, length: 4 },
    ]);
  });

  it("returns empty question when no paragraph is present", () => {
    const nodes = [code("AB")];

    const result = parseCrosswordContent(nodes);

    expect(result.question).toBe("");
  });
});
