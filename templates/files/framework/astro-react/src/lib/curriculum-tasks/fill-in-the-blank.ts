import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';

const FillInBlankSegmentSchema = z.union([
  z.object({ kind: z.literal('text'), value: z.string() }),
  z.object({ kind: z.literal('blank'), answers: z.array(z.string().min(1)).min(1) }),
]);

export const FillInBlankTaskSchema = z
  .object({
    type: z.literal('fill-in-the-blank'),
    segments: z.array(FillInBlankSegmentSchema),
  })
  .refine((task) => task.segments.some((segment) => segment.kind === 'blank'), {
    message: 'Fill in the blank must have at least one blank',
  });

const BLANK = /\{\{([^}]+)\}\}/g;

// Alternatives are separated by "|". An answer that contains a pipe of its own
// escapes it as "\|", which authors write as "\\|" in markdown because the
// markdown parser consumes one backslash before this runs.
const UNESCAPED_PIPE = /(?<!\\)\|/;
const ESCAPED_PIPE = /\\\|/g;

function parseBlankAnswers(raw: string) {
  const answers = raw
    .split(UNESCAPED_PIPE)
    .map((answer) => answer.replace(ESCAPED_PIPE, '|').trim())
    .filter((answer) => answer !== '');

  if (answers.length > 0) {
    return answers;
  }

  // Every alternative was empty, so the blank holds unescaped separators such
  // as {{|}} and is read literally. A blank containing only whitespace stays
  // empty and fails validation.
  const literal = raw.trim();
  return literal === '' ? [] : [literal];
}

export function parseFillInBlankContent(nodes: RootContent[]) {
  const text = nodes.map((node) => toString(node)).join(' ');
  const segments: Array<{ kind: 'text'; value: string } | { kind: 'blank'; answers: string[] }> =
    [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  BLANK.lastIndex = 0;
  while ((match = BLANK.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'blank', answers: parseBlankAnswers(match[1]) });
    lastIndex = BLANK.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return { segments };
}
