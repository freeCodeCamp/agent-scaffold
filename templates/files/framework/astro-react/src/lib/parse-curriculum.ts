import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import type { Heading, Root, RootContent } from 'mdast';
import type { Curriculum, Lesson, Module, Section } from './curriculum-types';
import { nodesToMarkdown } from './mdast-utils';
import { TASK_DEFINITIONS } from './curriculum-tasks';

const processor = unified().use(remarkParse).use(remarkGfm);

const MARKER = /^--([a-z][a-z-]*)--$/;
const END_PREFIX = 'end-';

function isHeadingDepth(node: RootContent, depth: number): node is Heading {
  return node.type === 'heading' && node.depth === depth;
}

function matchMarker(node: RootContent): string | null {
  if (node.type !== 'paragraph') {
    return null;
  }

  const match = toString(node).trim().match(MARKER);
  return match ? match[1] : null;
}

function finalizeTaskBlock(lesson: Lesson, markerType: string, nodes: RootContent[]): void {
  const definition = TASK_DEFINITIONS[markerType];
  if (!definition) {
    throw new Error(`Unknown task type "--${markerType}--" in lesson "${lesson.title}"`);
  }

  const candidate = { type: markerType, ...definition.parseContent(nodes) };

  try {
    const task = definition.schema.parse(candidate);
    lesson.content.push({ type: 'task', task });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid "--${markerType}--" task in lesson "${lesson.title}": ${message}`, {
      cause: error,
    });
  }
}

function finalizeLessonContent(lesson: Lesson, nodes: RootContent[]): void {
  let textRun: RootContent[] = [];
  let openMarker: string | null = null;
  let openNodes: RootContent[] = [];

  const flushText = () => {
    if (textRun.length === 0) {
      return;
    }

    const markdown = nodesToMarkdown(textRun);
    if (markdown) {
      lesson.content.push({ type: 'text', markdown });
    }
    textRun = [];
  };

  for (const node of nodes) {
    const markerType = matchMarker(node);

    if (markerType?.startsWith(END_PREFIX)) {
      const closedType = markerType.slice(END_PREFIX.length);

      if (!openMarker) {
        throw new Error(`Stray "--${markerType}--" marker in lesson "${lesson.title}"`);
      }

      if (closedType !== openMarker) {
        throw new Error(
          `Expected "--end-${openMarker}--" but found "--${markerType}--" in lesson "${lesson.title}"`,
        );
      }

      finalizeTaskBlock(lesson, openMarker, openNodes);
      openMarker = null;
      openNodes = [];
      continue;
    }

    if (markerType) {
      if (openMarker) {
        throw new Error(
          `Task "--${openMarker}--" in lesson "${lesson.title}" is missing a closing "--end-${openMarker}--" before "--${markerType}--" starts`,
        );
      }

      flushText();
      openMarker = markerType;
      openNodes = [];
      continue;
    }

    if (openMarker) {
      openNodes.push(node);
    } else {
      textRun.push(node);
    }
  }

  if (openMarker) {
    throw new Error(
      `Task "--${openMarker}--" in lesson "${lesson.title}" is missing a closing "--end-${openMarker}--"`,
    );
  }

  flushText();
}

export function parseCurriculum(markdown: string, title: string, description?: string): Curriculum {
  const tree = processor.parse(markdown) as Root;

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentModule: Module | null = null;
  let currentLesson: Lesson | null = null;
  let lessonNodes: RootContent[] = [];

  const flushLesson = () => {
    if (!currentLesson || !currentModule) {
      return;
    }

    finalizeLessonContent(currentLesson, lessonNodes);
    currentModule.lessons.push(currentLesson);
    currentLesson = null;
    lessonNodes = [];
  };

  for (const node of tree.children) {
    if (isHeadingDepth(node, 1)) {
      flushLesson();
      currentSection = { title: toString(node).trim(), modules: [] };
      sections.push(currentSection);
      currentModule = null;
      continue;
    }

    if (isHeadingDepth(node, 2)) {
      flushLesson();
      currentModule = { title: toString(node).trim(), lessons: [] };
      currentSection?.modules.push(currentModule);
      continue;
    }

    if (isHeadingDepth(node, 3)) {
      flushLesson();
      currentLesson = { title: toString(node).trim(), content: [] };
      lessonNodes = [];
      continue;
    }

    if (!currentLesson) {
      continue;
    }

    lessonNodes.push(node);
  }

  flushLesson();

  return {
    title,
    description,
    sections,
  };
}
