import { describe, it, expect } from "vitest";
import { CategorizeTaskSchema, parseCategorizeContent } from "./categorize";
import { paragraph, nestedList } from "../../test-utils/mdast-builders";

describe("CategorizeTaskSchema", () => {
  it("accepts a valid task with unique items across categories", () => {
    const data = {
      type: "categorize",
      question: "Categorize these",
      categories: [
        { name: "Cat A", items: ["X"] },
        { name: "Cat B", items: ["Y"] },
      ],
    };

    expect(CategorizeTaskSchema.parse(data)).toMatchObject({ question: "Categorize these" });
  });

  it("rejects duplicate items across categories", () => {
    const data = {
      type: "categorize",
      question: "Categorize these",
      categories: [
        { name: "Cat A", items: ["X"] },
        { name: "Cat B", items: ["X"] },
      ],
    };

    expect(() => CategorizeTaskSchema.parse(data)).toThrow();
  });

  it("rejects fewer than 2 categories", () => {
    const data = {
      type: "categorize",
      question: "Categorize these",
      categories: [{ name: "Cat A", items: ["X"] }],
    };

    expect(() => CategorizeTaskSchema.parse(data)).toThrow();
  });

  it("rejects a category with zero items", () => {
    const data = {
      type: "categorize",
      question: "Categorize these",
      categories: [
        { name: "Cat A", items: [] },
        { name: "Cat B", items: ["Y"] },
      ],
    };

    expect(() => CategorizeTaskSchema.parse(data)).toThrow();
  });
});

describe("parseCategorizeContent", () => {
  it("parses nested list into categories with items", () => {
    const nodes = [
      paragraph("Categorize these:"),
      nestedList([
        { name: "Fruits", items: ["Apple", "Banana"] },
        { name: "Vegetables", items: ["Carrot"] },
      ]),
    ];

    const result = parseCategorizeContent(nodes);

    expect(result.question).toBe("Categorize these:");
    expect(result.categories).toEqual([
      { name: "Fruits", items: ["Apple", "Banana"] },
      { name: "Vegetables", items: ["Carrot"] },
    ]);
  });

  it("returns empty question when no paragraph is present", () => {
    const nodes = [
      nestedList([
        { name: "A", items: ["X"] },
        { name: "B", items: ["Y"] },
      ]),
    ];

    const result = parseCategorizeContent(nodes);

    expect(result.question).toBe("");
  });
});
