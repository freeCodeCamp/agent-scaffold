import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

type MarkdownProps = {
  children: string;
};

type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> & { node?: unknown };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TableHeaderCell({ node, ...props }: TableHeaderCellProps) {
  return <th scope="col" {...props} />;
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ th: TableHeaderCell }}>
      {children}
    </ReactMarkdown>
  );
}
