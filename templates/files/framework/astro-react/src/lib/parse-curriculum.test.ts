import { describe, it, expect } from "vitest";
import { parseCurriculum } from "./parse-curriculum";

describe("parseCurriculum", () => {
  it("parses H1/H2/H3 into section/module/lesson hierarchy", () => {
    const md = `# Section\n\n## Module\n\n### Lesson`;

    const result = parseCurriculum(md, "Test");

    expect(result.sections).toEqual([
      {
        title: "Section",
        modules: [
          {
            title: "Module",
            lessons: [{ title: "Lesson", content: [] }],
          },
        ],
      },
    ]);
  });

  it("preserves curriculum title and description", () => {
    const result = parseCurriculum("", "My Title", "My Description");

    expect(result.title).toBe("My Title");
    expect(result.description).toBe("My Description");
  });

  it("handles multiple sections, modules, and lessons", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "### L2",
      "## M2",
      "### L3",
      "# S2",
      "## M3",
      "### L4",
    ].join("\n\n");

    const result = parseCurriculum(md, "Test");

    expect(result.sections).toMatchObject([
      {
        title: "S1",
        modules: [
          { title: "M1", lessons: [{ title: "L1" }, { title: "L2" }] },
          { title: "M2", lessons: [{ title: "L3" }] },
        ],
      },
      {
        title: "S2",
        modules: [{ title: "M3", lessons: [{ title: "L4" }] }],
      },
    ]);
  });

  it("parses text content between headings into text blocks", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "Some paragraph text.",
      "Another paragraph.",
    ].join("\n\n");

    const result = parseCurriculum(md, "Test");
    const lesson = result.sections[0].modules[0].lessons[0];

    expect(lesson.content).toHaveLength(1);
    expect(lesson.content[0].type).toBe("text");
    const block = lesson.content[0] as { type: "text"; markdown: string };
    expect(block.markdown).toContain("Some paragraph text.");
    expect(block.markdown).toContain("Another paragraph.");
  });

  it("excludes empty text runs", () => {
    const md = ["# S1", "## M1", "### L1"].join("\n\n");

    const result = parseCurriculum(md, "Test");
    const lesson = result.sections[0].modules[0].lessons[0];

    expect(lesson.content).toHaveLength(0);
  });

  it("parses task blocks delimited by markers", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "--multiple-choice--",
      "Pick one:",
      "- [x] Correct",
      "- [ ] Wrong",
      "--end-multiple-choice--",
    ].join("\n\n");

    const result = parseCurriculum(md, "Test");
    const lesson = result.sections[0].modules[0].lessons[0];

    expect(lesson.content).toEqual([
      expect.objectContaining({
        type: "task",
        task: expect.objectContaining({ type: "multiple-choice" }),
      }),
    ]);
  });

  it("interleaves text and task blocks", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "Before text.",
      "--multiple-choice--",
      "Pick one:",
      "- [x] A",
      "- [ ] B",
      "--end-multiple-choice--",
      "After text.",
    ].join("\n\n");

    const result = parseCurriculum(md, "Test");
    const lesson = result.sections[0].modules[0].lessons[0];

    expect(lesson.content.map((b) => b.type)).toEqual(["text", "task", "text"]);
  });

  it("throws on a stray closing marker", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "--end-multiple-choice--",
    ].join("\n\n");

    expect(() => parseCurriculum(md, "Test")).toThrow(/[Ss]tray/);
  });

  it("throws on a missing closing marker", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "--multiple-choice--",
      "Pick one:",
      "- [x] A",
      "- [ ] B",
    ].join("\n\n");

    expect(() => parseCurriculum(md, "Test")).toThrow(/missing.*closing/i);
  });

  it("throws on an unknown task type", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "--unknown-type--",
      "Some content",
      "--end-unknown-type--",
    ].join("\n\n");

    expect(() => parseCurriculum(md, "Test")).toThrow(/[Uu]nknown task type/);
  });

  it("throws a descriptive error on schema validation failure", () => {
    const md = [
      "# S1",
      "## M1",
      "### L1",
      "--multiple-choice--",
      "Pick one:",
      "- [ ] A",
      "- [ ] B",
      "--end-multiple-choice--",
    ].join("\n\n");

    expect(() => parseCurriculum(md, "Test")).toThrow(/[Ii]nvalid.*multiple-choice/);
  });

  it("ignores content before the first lesson heading", () => {
    const md = [
      "# S1",
      "## M1",
      "Orphaned text.",
      "### L1",
      "Lesson text.",
    ].join("\n\n");

    const result = parseCurriculum(md, "Test");
    const lesson = result.sections[0].modules[0].lessons[0];

    expect(lesson.content).toEqual([{ type: "text", markdown: "Lesson text." }]);
  });

  it("returns empty sections for markdown with no headings", () => {
    const result = parseCurriculum("Just a paragraph.", "Test");

    expect(result.sections).toHaveLength(0);
  });
});
