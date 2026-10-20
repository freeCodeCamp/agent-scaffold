import type { Curriculum } from './curriculum-types';

export type CurriculumOutline = {
  title: string;
  sections: {
    title: string;
    modules: {
      title: string;
      lessons: { title: string }[];
    }[];
  }[];
};

export function toCurriculumOutline(curriculum: Curriculum): CurriculumOutline {
  return {
    title: curriculum.title,
    sections: curriculum.sections.map((section) => ({
      title: section.title,
      modules: section.modules.map((module) => ({
        title: module.title,
        lessons: module.lessons.map((lesson) => ({ title: lesson.title })),
      })),
    })),
  };
}
