import type { Code, Image, List, ListItem, Paragraph, Text } from "mdast";

export function paragraph(text: string): Paragraph {
  return { type: "paragraph", children: [{ type: "text", value: text }] };
}

export function imageParagraph(url: string, alt: string = ""): Paragraph {
  const image: Image = { type: "image", url, alt };
  return { type: "paragraph", children: [image] };
}

export function paragraphWithEmphasis(before: string, emphasized: string, after: string = ""): Paragraph {
  const children: Paragraph["children"] = [
    { type: "text", value: before },
    { type: "emphasis", children: [{ type: "text", value: emphasized }] },
  ];
  if (after) children.push({ type: "text", value: after });
  return { type: "paragraph", children };
}

export function code(value: string): Code {
  return { type: "code", value };
}

export function listItem(
  text: string,
  options?: { checked?: boolean | null },
): ListItem {
  const textNode: Text = { type: "text", value: text };
  const p: Paragraph = { type: "paragraph", children: [textNode] };
  return {
    type: "listItem",
    spread: false,
    checked: options?.checked ?? null,
    children: [p],
  };
}

export function list(
  items: ListItem[],
  options?: { ordered?: boolean },
): List {
  return {
    type: "list",
    ordered: options?.ordered ?? false,
    spread: false,
    children: items,
  };
}

export function taskList(
  items: { text: string; checked: boolean }[],
): List {
  return list(
    items.map((item) => listItem(item.text, { checked: item.checked })),
  );
}

export function nestedList(
  categories: { name: string; items: string[] }[],
): List {
  const categoryItems: ListItem[] = categories.map((cat) => {
    const nameNode: Paragraph = {
      type: "paragraph",
      children: [{ type: "text", value: cat.name }],
    };
    const nested = list(cat.items.map((item) => listItem(item)));
    return {
      type: "listItem" as const,
      spread: false,
      checked: null,
      children: [nameNode, nested],
    };
  });

  return list(categoryItems);
}
