import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { isList, nodesToMarkdown } from '../mdast-utils';

const CategorizeCategorySchema = z.object({
  name: z.string(),
  items: z.array(z.string()).min(1),
});

export const CategorizeTaskSchema = z
  .object({
    type: z.literal('categorize'),
    question: z.string(),
    categories: z.array(CategorizeCategorySchema).min(2),
  })
  .refine(
    (task) => {
      const allItems = task.categories.flatMap((category) => category.items);
      return new Set(allItems).size === allItems.length;
    },
    { message: 'Categorize items must be unique across all categories' },
  );

export function parseCategorizeContent(nodes: RootContent[]) {
  const questionNode = nodes.find((node) => node.type === 'paragraph');
  const listNode = nodes.find(isList);

  const question = questionNode ? nodesToMarkdown([questionNode]) : '';
  const categories = (listNode?.children ?? []).map((categoryItem) => {
    const nestedList = categoryItem.children.find(isList);
    const nameNode = categoryItem.children.find((child) => child.type !== 'list');
    const name = nameNode ? toString(nameNode).trim() : '';
    const items = (nestedList?.children ?? []).map((itemNode) => toString(itemNode).trim());

    return { name, items };
  });

  return { question, categories };
}
