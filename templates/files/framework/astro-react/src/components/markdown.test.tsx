import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown.js';

describe(Markdown, () => {
  it('renders GFM tables with scoped column headers', () => {
    render(<Markdown>{'| Language |\n| --- |\n| TypeScript |'}</Markdown>);

    const columnHeader = screen.getByRole('columnheader', { name: 'Language' });

    expect(columnHeader).toHaveAttribute('scope', 'col');
  });
});
