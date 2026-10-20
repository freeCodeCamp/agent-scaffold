import type { Code, List, Root, RootContent } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';

export function nodesToMarkdown(nodes: RootContent[]): string {
  const root: Root = { type: 'root', children: nodes };
  return toMarkdown(root, { extensions: [gfmToMarkdown()] }).trim();
}

export function isList(node: RootContent): node is List {
  return node.type === 'list';
}

export function isCode(node: RootContent): node is Code {
  return node.type === 'code';
}
