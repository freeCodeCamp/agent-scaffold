import { z } from 'astro/zod';
import { toString } from 'mdast-util-to-string';
import type { Paragraph, RootContent } from 'mdast';
import { nodesToMarkdown } from '../mdast-utils';

export const FlashCardTaskSchema = z.object({
  type: z.literal('flash-card'),
  prompt: z.string(),
  front: z.string().min(1, 'Flash card front is required'),
  back: z.string().min(1, 'Flash card back is required'),
});

const FRONT_PREFIX = /^front:\s*/i;
const BACK_PREFIX = /^back:\s*/i;

function isLabeled(node: RootContent, prefix: RegExp): node is Paragraph {
  return node.type === 'paragraph' && prefix.test(toString(node));
}

function stripLabel(paragraph: Paragraph, prefix: RegExp): Paragraph {
  const [first, ...rest] = paragraph.children;
  if (first?.type !== 'text') {
    return paragraph;
  }

  const value = first.value.replace(prefix, '');
  const children = value === '' ? rest : [{ ...first, value }, ...rest];
  return { ...paragraph, children };
}

function labeledNodesToMarkdown(nodes: RootContent[], prefix: RegExp): string {
  const [first, ...rest] = nodes;
  if (!first || first.type !== 'paragraph') {
    return nodesToMarkdown(nodes);
  }

  return nodesToMarkdown([stripLabel(first, prefix), ...rest]);
}

export function parseFlashCardContent(nodes: RootContent[]): {
  prompt: string;
  front: string;
  back: string;
} {
  const frontIndex = nodes.findIndex((node) => isLabeled(node, FRONT_PREFIX));
  const backIndex = nodes.findIndex((node) => isLabeled(node, BACK_PREFIX));

  const promptNodes = nodes.slice(0, frontIndex === -1 ? 0 : frontIndex);
  const frontNodes = frontIndex === -1 ? [] : nodes.slice(frontIndex, backIndex === -1 ? undefined : backIndex);
  const backNodes = backIndex === -1 ? [] : nodes.slice(backIndex);

  return {
    prompt: nodesToMarkdown(promptNodes),
    front: labeledNodesToMarkdown(frontNodes, FRONT_PREFIX),
    back: labeledNodesToMarkdown(backNodes, BACK_PREFIX),
  };
}
