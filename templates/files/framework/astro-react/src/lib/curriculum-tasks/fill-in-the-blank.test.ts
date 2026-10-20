import { describe, it, expect } from "vitest";
import { FillInBlankTaskSchema, parseFillInBlankContent } from "./fill-in-the-blank";
import { paragraph } from "../../test-utils/mdast-builders";

describe("FillInBlankTaskSchema", () => {
  it("accepts a task with at least one blank segment", () => {
    const data = {
      type: "fill-in-the-blank",
      segments: [
        { kind: "text", value: "Hello " },
        { kind: "blank", answers: ["world"] },
      ],
    };

    expect(FillInBlankTaskSchema.parse(data)).toMatchObject({ type: "fill-in-the-blank" });
  });

  it("rejects a task with zero blank segments", () => {
    const data = {
      type: "fill-in-the-blank",
      segments: [{ kind: "text", value: "Hello world" }],
    };

    expect(() => FillInBlankTaskSchema.parse(data)).toThrow();
  });
});

describe("parseFillInBlankContent", () => {
  type FillInBlankResult = {
    segments: Array<
      { kind: "text"; value: string } | { kind: "blank"; answers: string[] }
    >;
  };

  it("extracts blanks from {{answer}} syntax", () => {
    const nodes = [paragraph("The sky is {{blue}}")];

    const result = parseFillInBlankContent(nodes) as FillInBlankResult;

    expect(result.segments).toEqual([
      { kind: "text", value: "The sky is " },
      { kind: "blank", answers: ["blue"] },
    ]);
  });

  it("handles multiple blanks", () => {
    const nodes = [paragraph("{{one}} and {{two}}")];

    const result = parseFillInBlankContent(nodes) as FillInBlankResult;

    expect(result.segments).toEqual([
      { kind: "blank", answers: ["one"] },
      { kind: "text", value: " and " },
      { kind: "blank", answers: ["two"] },
    ]);
  });

  it("trims whitespace inside blanks", () => {
    const nodes = [paragraph("{{ hello }}")];

    const result = parseFillInBlankContent(nodes) as FillInBlankResult;

    expect(result.segments).toEqual([
      { kind: "blank", answers: ["hello"] },
    ]);
  });

  it("returns only text when there are no blanks", () => {
    const nodes = [paragraph("No blanks here")];

    const result = parseFillInBlankContent(nodes) as FillInBlankResult;

    expect(result.segments).toEqual([
      { kind: "text", value: "No blanks here" },
    ]);
  });
});
