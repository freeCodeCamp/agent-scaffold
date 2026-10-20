import { describe, it, expect } from "vitest";
import { toCurriculumOutline } from "./curriculum-outline";
import type { Curriculum } from "./curriculum-types";

describe("toCurriculumOutline", () => {
  it("preserves section, module, and lesson titles", () => {
    const curriculum: Curriculum = {
      title: "My Curriculum",
      sections: [
        {
          title: "Section 1",
          modules: [
            {
              title: "Module 1",
              lessons: [
                { title: "Lesson 1", content: [] },
                { title: "Lesson 2", content: [] },
              ],
            },
          ],
        },
      ],
    };

    expect(toCurriculumOutline(curriculum)).toEqual({
      title: "My Curriculum",
      sections: [
        {
          title: "Section 1",
          modules: [
            {
              title: "Module 1",
              lessons: [{ title: "Lesson 1" }, { title: "Lesson 2" }],
            },
          ],
        },
      ],
    });
  });

  it("strips content blocks from lessons", () => {
    const curriculum: Curriculum = {
      title: "Test",
      sections: [
        {
          title: "S1",
          modules: [
            {
              title: "M1",
              lessons: [
                {
                  title: "L1",
                  content: [{ type: "text", markdown: "Some text" }],
                },
              ],
            },
          ],
        },
      ],
    };

    const outline = toCurriculumOutline(curriculum);
    const lesson = outline.sections[0].modules[0].lessons[0];

    expect(lesson).toEqual({ title: "L1" });
  });

  it("returns an empty outline for an empty curriculum", () => {
    const curriculum: Curriculum = { title: "Empty", sections: [] };

    const outline = toCurriculumOutline(curriculum);

    expect(outline.title).toBe("Empty");
    expect(outline.sections).toEqual([]);
  });
});
