import { z } from 'astro/zod';
import type { Paragraph, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { nodesToMarkdown } from '../mdast-utils';

export const ImageSelectTaskSchema = z.object({
  type: z.literal('image-select'),
  prompt: z.string(),
  imageSrc: z.string().min(1),
  correct: z.array(z.string().min(1)).min(1),
});

const CORRECT_PREFIX = /^correct:\s*/i;

export function parseImageSelectContent(nodes: RootContent[]) {
  const promptNode = nodes.find((node): node is Paragraph => {
    if (node.type !== 'paragraph') return false;
    const p = node as Paragraph;
    return (
      !p.children.some((child) => child.type === 'image') &&
      !CORRECT_PREFIX.test(toString(node))
    );
  });

  const imageNode = nodes
    .filter((node): node is Paragraph => node.type === 'paragraph')
    .flatMap((p) => p.children)
    .find((child) => child.type === 'image');

  const correctNode = nodes.find(
    (node) => node.type === 'paragraph' && CORRECT_PREFIX.test(toString(node)),
  );

  const prompt = promptNode ? nodesToMarkdown([promptNode]) : '';
  const imageSrc = imageNode && imageNode.type === 'image' ? imageNode.url : '';
  const correct = correctNode
    ? toString(correctNode)
        .replace(CORRECT_PREFIX, '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  return { prompt, imageSrc, correct };
}
