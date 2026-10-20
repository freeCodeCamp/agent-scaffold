import { describe, it, expect } from "vitest";
import {
  slugify,
  buildLessonRouteSlug,
  buildLearnPath,
  getOrderedLessons,
} from "./curriculum-route-utils";
import type { Curriculum, Section, Module, Lesson } from "./curriculum-types";

describe("slugify", () => {
  it("lowercases text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("hello! @world#")).toBe("hello-world");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("collapses multiple hyphens into one", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("returns an empty string for an empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("lesson 1")).toBe("lesson-1");
  });

  it("returns an empty string when input is only special characters", () => {
    expect(slugify("!@#$%")).toBe("");
  });

  it("returns the input unchanged when already slugified", () => {
    expect(slugify("already-slugified")).toBe("already-slugified");
  });
});

describe("buildLessonRouteSlug", () => {
  it("composes three segments separated by hyphens", () => {
    const result = buildLessonRouteSlug("Section One", "Module Two", "Lesson Three");

    expect(result).toBe("section-one-module-two-lesson-three");
  });

  it("extracts title from section, module, and lesson objects", () => {
    const section: Section = { title: "Section One", modules: [] };
    const module: Module = { title: "Module Two", lessons: [] };
    const lesson: Lesson = { title: "Lesson Three", content: [] };

    const result = buildLessonRouteSlug(section, module, lesson);

    expect(result).toBe("section-one-module-two-lesson-three");
  });

  it("slugifies each segment", () => {
    const result = buildLessonRouteSlug("My Section!", "My Module", "Lesson #1");

    expect(result).toBe("my-section-my-module-lesson-1");
  });
});

describe("buildLearnPath", () => {
  it("prefixes the slug with /learn/", () => {
    const result = buildLearnPath("Section", "Module", "Lesson");

    expect(result).toBe("/learn/section-module-lesson");
  });
});

describe("getOrderedLessons", () => {
  const lesson = (title: string): Lesson => ({ title, content: [] });
  const module = (title: string, lessons: Lesson[]): Module => ({
    title,
    lessons,
  });
  const section = (title: string, modules: Module[]): Section => ({
    title,
    modules,
  });

  it("flattens a curriculum into ordered lesson entries", () => {
    const curriculum: Curriculum = {
      title: "Test",
      sections: [
        section("S1", [
          module("M1", [lesson("L1"), lesson("L2")]),
          module("M2", [lesson("L3")]),
        ]),
      ],
    };

    const result = getOrderedLessons(curriculum);

    expect(result.map((e) => e.lesson.title)).toEqual(["L1", "L2", "L3"]);
  });

  it("populates slug and href for each entry", () => {
    const curriculum: Curriculum = {
      title: "Test",
      sections: [section("Sec", [module("Mod", [lesson("Les")])])],
    };

    const [entry] = getOrderedLessons(curriculum);

    expect(entry.slug).toBe("sec-mod-les");
    expect(entry.href).toBe("/learn/sec-mod-les");
  });

  it("skips modules with no lessons", () => {
    const curriculum: Curriculum = {
      title: "Test",
      sections: [
        section("S1", [module("Empty", []), module("M1", [lesson("L1")])]),
      ],
    };

    expect(getOrderedLessons(curriculum).map((e) => e.lesson.title)).toEqual([
      "L1",
    ]);
  });

  it("returns an empty array for a curriculum with no sections", () => {
    const curriculum: Curriculum = { title: "Empty", sections: [] };

    expect(getOrderedLessons(curriculum)).toEqual([]);
  });
});
