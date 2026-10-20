import { describe, it, expect } from "vitest";
import { OrderTaskSchema, parseOrderContent } from "./order";
import { paragraph, list, listItem } from "../../test-utils/mdast-builders";

describe("OrderTaskSchema", () => {
  it("accepts a valid task with unique items", () => {
    const data = {
      type: "order",
      question: "Order these",
      items: ["A", "B", "C"],
    };

    expect(OrderTaskSchema.parse(data)).toMatchObject({ question: "Order these" });
  });

  it("rejects duplicate items", () => {
    const data = {
      type: "order",
      question: "Order these",
      items: ["A", "A"],
    };

    expect(() => OrderTaskSchema.parse(data)).toThrow();
  });

  it("rejects fewer than 2 items", () => {
    const data = {
      type: "order",
      question: "Order these",
      items: ["A"],
    };

    expect(() => OrderTaskSchema.parse(data)).toThrow();
  });
});

describe("parseOrderContent", () => {
  it("extracts question and ordered items", () => {
    const nodes = [
      paragraph("Order these:"),
      list([listItem("First"), listItem("Second"), listItem("Third")]),
    ];

    const result = parseOrderContent(nodes);

    expect(result.question).toBe("Order these:");
    expect(result.items).toEqual(["First", "Second", "Third"]);
  });

  it("returns empty question when no paragraph is present", () => {
    const nodes = [list([listItem("A"), listItem("B")])];

    const result = parseOrderContent(nodes);

    expect(result.question).toBe("");
  });
});
