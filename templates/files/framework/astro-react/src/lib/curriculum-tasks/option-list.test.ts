import { describe, it, expect } from "vitest";
import { parseOptionListContent } from "./option-list";
import { paragraph, taskList } from "../../test-utils/mdast-builders";

describe("parseOptionListContent", () => {
  it("extracts question and options from nodes", () => {
    const nodes = [
      paragraph("Which is correct?"),
      taskList([
        { text: "Option A", checked: true },
        { text: "Option B", checked: false },
      ]),
    ];

    const result = parseOptionListContent(nodes);

    expect(result.question).toBe("Which is correct?");
    expect(result.options).toEqual([
      { text: "Option A", correct: true },
      { text: "Option B", correct: false },
    ]);
  });

  it("returns empty question when no paragraph is present", () => {
    const nodes = [
      taskList([
        { text: "A", checked: true },
        { text: "B", checked: false },
      ]),
    ];

    const result = parseOptionListContent(nodes);

    expect(result.question).toBe("");
  });

  it("returns empty options when no list is present", () => {
    const nodes = [paragraph("Just a question")];

    const result = parseOptionListContent(nodes);

    expect(result.options).toEqual([]);
  });
});
