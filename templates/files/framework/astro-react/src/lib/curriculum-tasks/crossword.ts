import { z } from 'astro/zod';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { isCode, isList, nodesToMarkdown } from '../mdast-utils';

type CrosswordCell = string | null;
type CrosswordGrid = CrosswordCell[][];
type CrosswordWordStart = { row: number; col: number; length: number };

function cellAt(grid: CrosswordGrid, row: number, col: number): CrosswordCell {
  return grid[row]?.[col] ?? null;
}

function isRectangularGrid(grid: CrosswordGrid): boolean {
  return grid.length > 0 && grid[0].length > 0 && grid.every((row) => row.length === grid[0].length);
}

function findAcrossStarts(grid: CrosswordGrid): CrosswordWordStart[] {
  const starts: CrosswordWordStart[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (!cellAt(grid, row, col)) continue;

      const isStart = col === 0 || !cellAt(grid, row, col - 1);
      const hasNext = Boolean(cellAt(grid, row, col + 1));
      if (!isStart || !hasNext) continue;

      let length = 0;
      while (cellAt(grid, row, col + length)) length++;
      starts.push({ row, col, length });
    }
  }

  return starts;
}

function findDownStarts(grid: CrosswordGrid): CrosswordWordStart[] {
  const starts: CrosswordWordStart[] = [];
  const rowCount = grid.length;
  const colCount = grid.reduce((max, row) => Math.max(max, row.length), 0);

  for (let col = 0; col < colCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      if (!cellAt(grid, row, col)) continue;

      const isStart = row === 0 || !cellAt(grid, row - 1, col);
      const hasNext = Boolean(cellAt(grid, row + 1, col));
      if (!isStart || !hasNext) continue;

      let length = 0;
      while (cellAt(grid, row + length, col)) length++;
      starts.push({ row, col, length });
    }
  }

  return starts;
}

function coveredCellKeys(starts: CrosswordWordStart[], axis: 'across' | 'down'): Set<string> {
  const keys = new Set<string>();

  for (const start of starts) {
    for (let i = 0; i < start.length; i++) {
      const row = axis === 'across' ? start.row : start.row + i;
      const col = axis === 'across' ? start.col + i : start.col;
      keys.add(`${row},${col}`);
    }
  }

  return keys;
}

function everyLetterIsPartOfAWord(grid: CrosswordGrid): boolean {
  const covered = new Set([
    ...coveredCellKeys(findAcrossStarts(grid), 'across'),
    ...coveredCellKeys(findDownStarts(grid), 'down'),
  ]);

  return grid.every((row, rowIndex) =>
    row.every((cell, colIndex) => !cell || covered.has(`${rowIndex},${colIndex}`)),
  );
}

function isSingleConnectedGroup(grid: CrosswordGrid): boolean {
  const letterCells: Array<[number, number]> = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) letterCells.push([rowIndex, colIndex]);
    });
  });

  if (letterCells.length === 0) {
    return false;
  }

  const visited = new Set<string>([`${letterCells[0][0]},${letterCells[0][1]}`]);
  const stack: Array<[number, number]> = [letterCells[0]];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  while (stack.length > 0) {
    const [row, col] = stack.pop()!;
    for (const [deltaRow, deltaCol] of directions) {
      const nextRow = row + deltaRow;
      const nextCol = col + deltaCol;
      const key = `${nextRow},${nextCol}`;
      if (visited.has(key) || !cellAt(grid, nextRow, nextCol)) continue;
      visited.add(key);
      stack.push([nextRow, nextCol]);
    }
  }

  return visited.size === letterCells.length;
}

function acrossClueCountMatchesGrid(task: { solution: CrosswordGrid; clues: { direction: string }[] }): boolean {
  return (
    findAcrossStarts(task.solution).length === task.clues.filter((clue) => clue.direction === 'across').length
  );
}

function downClueCountMatchesGrid(task: { solution: CrosswordGrid; clues: { direction: string }[] }): boolean {
  return findDownStarts(task.solution).length === task.clues.filter((clue) => clue.direction === 'down').length;
}

const CrosswordClueSchema = z.object({
  direction: z.enum(['across', 'down']),
  clue: z.string(),
  row: z.number(),
  col: z.number(),
  length: z.number(),
});

export const CrosswordTaskSchema = z
  .object({
    type: z.literal('crossword'),
    question: z.string(),
    solution: z.array(
      z.array(z.string().regex(/^[A-Z]$/, 'Crossword grid cells must be a single letter or "."').nullable()),
    ),
    clues: z.array(CrosswordClueSchema),
  })
  .refine((task) => isRectangularGrid(task.solution), {
    message: 'Crossword grid must be non-empty and every row must be the same length',
  })
  .refine((task) => task.clues.length > 0, {
    message: 'Crossword must have at least one clue',
  })
  .refine(acrossClueCountMatchesGrid, {
    message: 'Crossword must list exactly as many Across clues as across words found in the grid',
  })
  .refine(downClueCountMatchesGrid, {
    message: 'Crossword must list exactly as many Down clues as down words found in the grid',
  })
  .refine((task) => everyLetterIsPartOfAWord(task.solution), {
    message: 'Crossword has a letter that is not part of any across or down word of at least two letters',
  })
  .refine((task) => isSingleConnectedGroup(task.solution), {
    message: 'Crossword words must all connect into a single grid',
  });

function buildCrosswordSolution(nodes: RootContent[]): CrosswordGrid {
  const gridText = nodes.find(isCode)?.value ?? '';

  return gridText
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('').map((char) => (char === '.' ? null : char.toUpperCase())));
}

function findCrosswordClueTexts(nodes: RootContent[], label: 'across' | 'down'): string[] {
  const labelIndex = nodes.findIndex(
    (node) => node.type === 'paragraph' && toString(node).trim().toLowerCase().replace(/:$/, '') === label,
  );
  if (labelIndex === -1) {
    return [];
  }

  const listNode = nodes.slice(labelIndex + 1).find(isList);
  return (listNode?.children ?? []).map((item) => toString(item).trim());
}

export function parseCrosswordContent(nodes: RootContent[]) {
  const questionNode = nodes.find((node) => node.type === 'paragraph');
  const question = questionNode ? nodesToMarkdown([questionNode]) : '';
  const solution = buildCrosswordSolution(nodes);
  const acrossStarts = findAcrossStarts(solution);
  const downStarts = findDownStarts(solution);

  const acrossClues = findCrosswordClueTexts(nodes, 'across').map((clue, index) => ({
    direction: 'across' as const,
    clue,
    row: acrossStarts[index]?.row ?? -1,
    col: acrossStarts[index]?.col ?? -1,
    length: acrossStarts[index]?.length ?? 0,
  }));

  const downClues = findCrosswordClueTexts(nodes, 'down').map((clue, index) => ({
    direction: 'down' as const,
    clue,
    row: downStarts[index]?.row ?? -1,
    col: downStarts[index]?.col ?? -1,
    length: downStarts[index]?.length ?? 0,
  }));

  return { question, solution, clues: [...acrossClues, ...downClues] };
}
