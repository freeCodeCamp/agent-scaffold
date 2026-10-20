import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { nodesToMarkdown } from '../mdast-utils';

const TextSelectTokenSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
});

export const TextSelectTaskSchema = z
  .object({
    type: z.literal('text-select'),
    prompt: z.string(),
    tokens: z.array(TextSelectTokenSchema).min(1),
  })
  .refine((task) => task.tokens.some((token) => token.correct), {
    message: 'Text select must have at least one correct token',
  });

const MARKED = /\{\{([^}]+)\}\}/g;

export function parseTextSelectContent(nodes: RootContent[]) {
  const paragraphs = nodes.filter((node) => node.type === 'paragraph');

  const prompt = paragraphs[0] ? nodesToMarkdown([paragraphs[0]]) : '';
  const text = paragraphs[1] ? toString(paragraphs[1]) : '';

  const tokens: Array<{ text: string; correct: boolean }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MARKED.lastIndex = 0;
  while ((match = MARKED.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index).trim();
      for (const word of plain.split(/\s+/)) {
        if (word) tokens.push({ text: word, correct: false });
      }
    }
    const marked = match[1].trim();
    if (marked) tokens.push({ text: marked, correct: true });
    lastIndex = MARKED.lastIndex;
  }

  if (lastIndex < text.length) {
    const plain = text.slice(lastIndex).trim();
    for (const word of plain.split(/\s+/)) {
      if (word) tokens.push({ text: word, correct: false });
    }
  }

  return { prompt, tokens };
}
