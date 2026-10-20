import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { isList, nodesToMarkdown } from '../mdast-utils';

// Shared by multiple-choice and select-all-that-apply, which are both just a
// question plus a list of options - only their correctness rules differ.
export const TaskOptionSchema = z.object({
  text: z.string(),
  correct: z.boolean(),
});

export function parseOptionListContent(nodes: RootContent[]) {
  const questionNode = nodes.find((node) => node.type === 'paragraph');
  const listNode = nodes.find(isList);

  const question = questionNode ? nodesToMarkdown([questionNode]) : '';
  const options = (listNode?.children ?? []).map((item) => ({
    text: toString(item).trim(),
    correct: item.checked,
  }));

  return { question, options };
}
