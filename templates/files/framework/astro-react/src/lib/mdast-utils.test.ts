import { describe, it, expect } from "vitest";
import { nodesToMarkdown } from "./mdast-utils";
import type { List, RootContent, Table } from "mdast";

describe("nodesToMarkdown", () => {
  it("converts a node to markdown", () => {
    const nodes: RootContent[] = [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello world" }],
      },
    ];

    expect(nodesToMarkdown(nodes)).toBe("Hello world");
  });

  it("converts a list node to markdown", () => {
    const list: List = {
      type: "list",
      ordered: false,
      spread: false,
      children: [
        {
          type: "listItem",
          spread: false,
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Item one" }],
            },
          ],
        },
        {
          type: "listItem",
          spread: false,
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Item two" }],
            },
          ],
        },
      ],
    };

    expect(nodesToMarkdown([list])).toBe("* Item one\n* Item two");
  });

  it("returns an empty string for an empty node array", () => {
    expect(nodesToMarkdown([])).toBe("");
  });

  it("converts mixed node types", () => {
    const nodes: RootContent[] = [
      {
        type: "heading",
        depth: 1,
        children: [{ type: "text", value: "Heading" }],
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Paragraph" }],
      },
    ];

    expect(nodesToMarkdown(nodes)).toBe("# Heading\n\nParagraph");
  });

  it("trims trailing whitespace from output", () => {
    const nodes: RootContent[] = [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello" }],
      },
    ];

    // toMarkdown adds a trailing newline; our wrapper should trim it
    expect(nodesToMarkdown(nodes)).toBe("Hello");
  });

  it("preserves GFM table syntax", () => {
    const table: Table = {
      type: "table",
      align: [null, null],
      children: [
        {
          type: "tableRow",
          children: [
            {
              type: "tableCell",
              children: [{ type: "text", value: "A" }],
            },
            {
              type: "tableCell",
              children: [{ type: "text", value: "B" }],
            },
          ],
        },
        {
          type: "tableRow",
          children: [
            {
              type: "tableCell",
              children: [{ type: "text", value: "1" }],
            },
            {
              type: "tableCell",
              children: [{ type: "text", value: "2" }],
            },
          ],
        },
      ],
    };

    const result = nodesToMarkdown([table]);

    expect(result).toContain("| A | B |");
    expect(result).toContain("| 1 | 2 |");
  });
});
