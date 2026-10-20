import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { isList, nodesToMarkdown } from '../mdast-utils';

export const OrderTaskSchema = z
  .object({
    type: z.literal('order'),
    question: z.string(),
    items: z.array(z.string()).min(2),
  })
  .refine((task) => new Set(task.items).size === task.items.length, {
    message: 'Order items must be unique',
  });

export function parseOrderContent(nodes: RootContent[]) {
  const questionNode = nodes.find((node) => node.type === 'paragraph');
  const listNode = nodes.find(isList);

  const question = questionNode ? nodesToMarkdown([questionNode]) : '';
  const items = (listNode?.children ?? []).map((item) => toString(item).trim());

  return { question, items };
}
