import './shared/task.css';
import './crossword.css';
import { useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { Button } from '../button';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Fill in every square first.',
};

type Direction = 'across' | 'down';
type CrosswordTaskType = Extract<Task, { type: 'crossword' }>;
type Clue = CrosswordTaskType['clues'][number];
type NumberedClue = Clue & { number: number };
type CellWords = { across?: NumberedClue; down?: NumberedClue };

type CrosswordProps = {
  task: CrosswordTaskType;
  onCorrect: () => void;
};

function key(row: number, col: number): string {
  return `${row},${col}`;
}

function wordCells(clue: Clue): Array<{ row: number; col: number }> {
  return Array.from({ length: clue.length }, (_, i) => ({
    row: clue.direction === 'across' ? clue.row : clue.row + i,
    col: clue.direction === 'across' ? clue.col + i : clue.col,
  }));
}

export function Crossword({ task, onCorrect }: CrosswordProps) {
  const groupId = useId();
  const questionId = `${groupId}-question`;
  const feedbackId = `${groupId}-feedback`;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('across');
  const [announcement, setAnnouncement] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const numberByPosition = useMemo(() => {
    const positions = Array.from(new Set(task.clues.map((clue) => key(clue.row, clue.col))))
      .map((posKey) => {
        const [row, col] = posKey.split(',').map(Number);
        return { posKey, row, col };
      })
      .sort((a, b) => a.row - b.row || a.col - b.col);

    return new Map(positions.map((position, index) => [position.posKey, index + 1]));
  }, [task.clues]);

  const cluesWithNumbers = useMemo(
    () =>
      task.clues.map((clue) => ({
        ...clue,
        number: numberByPosition.get(key(clue.row, clue.col)) ?? 0,
      })),
    [task.clues, numberByPosition],
  );

  const defaultClue =
    [...cluesWithNumbers].sort(
      (a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1),
    )[0] ?? null;

  const cellWords = useMemo(() => {
    const map = new Map<string, CellWords>();
    for (const clue of cluesWithNumbers) {
      for (const cell of wordCells(clue)) {
        const entry = map.get(key(cell.row, cell.col)) ?? {};
        entry[clue.direction] = clue;
        map.set(key(cell.row, cell.col), entry);
      }
    }
    return map;
  }, [cluesWithNumbers]);

  const currentClue: NumberedClue | null = activeCell
    ? cellWords.get(key(activeCell.row, activeCell.col))?.[activeDirection] ??
      cellWords.get(key(activeCell.row, activeCell.col))?.across ??
      cellWords.get(key(activeCell.row, activeCell.col))?.down ??
      defaultClue
    : defaultClue;

  const activeWordCells = useMemo(() => {
    if (!currentClue) return new Set<string>();
    return new Set(wordCells(currentClue).map((cell) => key(cell.row, cell.col)));
  }, [currentClue]);

  const tabStopCell = activeCell ?? (defaultClue ? { row: defaultClue.row, col: defaultClue.col } : null);

  const invalid = result === 'incorrect' || result === 'unanswered';
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  function focusCell(row: number, col: number) {
    cellRefs.current[key(row, col)]?.focus();
  }

  function adjacentFilledCell(row: number, col: number, direction: Direction, delta: number) {
    const nextRow = direction === 'down' ? row + delta : row;
    const nextCol = direction === 'across' ? col + delta : col;
    return task.solution[nextRow]?.[nextCol] ? { row: nextRow, col: nextCol } : null;
  }

  function handleCellFocus(row: number, col: number, event: FocusEvent<HTMLInputElement>) {
    event.target.select();
    setActiveCell({ row, col });
    setActiveDirection((current) => {
      const words = cellWords.get(key(row, col));
      return words?.[current] ? current : words?.across ? 'across' : 'down';
    });
  }

  function handleCellClick(row: number, col: number) {
    if (activeCell?.row !== row || activeCell?.col !== col) {
      return;
    }

    const words = cellWords.get(key(row, col));
    if (words?.across && words?.down) {
      setActiveDirection((current) => (current === 'across' ? 'down' : 'across'));
    }
  }

  function handleChange(row: number, col: number, rawValue: string) {
    const value = rawValue.slice(-1).toUpperCase();
    if (value && !/^[A-Z]$/.test(value)) {
      return;
    }

    setAnswers((current) => ({ ...current, [key(row, col)]: value }));
    setResult(null);

    if (value) {
      const next = adjacentFilledCell(row, col, activeDirection, 1);
      if (next) {
        focusCell(next.row, next.col);
      }
    }
  }

  function handleKeyDown(row: number, col: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !answers[key(row, col)]) {
      const previous = adjacentFilledCell(row, col, activeDirection, -1);
      if (previous) {
        event.preventDefault();
        setAnswers((current) => ({ ...current, [key(previous.row, previous.col)]: '' }));
        focusCell(previous.row, previous.col);
      }
      return;
    }

    const arrowMoves: Record<string, { direction: Direction; delta: number }> = {
      ArrowLeft: { direction: 'across', delta: -1 },
      ArrowRight: { direction: 'across', delta: 1 },
      ArrowUp: { direction: 'down', delta: -1 },
      ArrowDown: { direction: 'down', delta: 1 },
    };

    const arrow = arrowMoves[event.key];
    if (arrow) {
      const next = adjacentFilledCell(row, col, arrow.direction, arrow.delta);
      if (next) {
        event.preventDefault();
        setActiveDirection(arrow.direction);
        focusCell(next.row, next.col);
      }
      return;
    }

    if (event.key === 'Enter') {
      const words = cellWords.get(key(row, col));
      if (words?.across && words?.down) {
        event.preventDefault();
        setActiveDirection((current) => (current === 'across' ? 'down' : 'across'));
      }
    }
  }

  function handleReset() {
    setAnswers({});
    setResult(null);
    setAnnouncement('Crossword reset.');
  }

  function handleCheck() {
    const allFilled = task.solution.every((row, rowIndex) =>
      row.every((cell, colIndex) => !cell || answers[key(rowIndex, colIndex)]?.trim()),
    );

    if (!allFilled) {
      setResult('unanswered');
      return;
    }

    const isCorrect = task.solution.every((row, rowIndex) =>
      row.every((cell, colIndex) => !cell || answers[key(rowIndex, colIndex)] === cell),
    );

    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      onCorrect();
    }
  }

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <div id={questionId} className="question">
        <Markdown>{task.question}</Markdown>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="crossword-grid-scroll">
        <div
          className="crossword-grid"
          role="group"
          aria-labelledby={questionId}
          style={{ gridTemplateColumns: `repeat(${task.solution[0]?.length ?? 0}, 1fr)` }}
        >
          {task.solution.map((rowCells, row) =>
            rowCells.map((cell, col) => {
              if (!cell) {
                return <div key={key(row, col)} className="crossword-cell blocked" aria-hidden="true" />;
              }

              const words = cellWords.get(key(row, col));
              const wordClue = words?.[activeDirection] ?? words?.across ?? words?.down ?? null;
              const indexInWord = wordClue
                ? (wordClue.direction === 'across' ? col - wordClue.col : row - wordClue.row) + 1
                : 1;
              const number = numberByPosition.get(key(row, col));
              const isActive = activeWordCells.has(key(row, col));
              const isTabStop = tabStopCell?.row === row && tabStopCell?.col === col;

              return (
                <div
                  key={key(row, col)}
                  className={isActive ? 'crossword-cell filled active' : 'crossword-cell filled'}
                >
                  {number ? (
                    <span className="crossword-number" aria-hidden="true">
                      {number}
                    </span>
                  ) : null}
                  <input
                    ref={(node) => {
                      cellRefs.current[key(row, col)] = node;
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={1}
                    tabIndex={isTabStop ? 0 : -1}
                    className="crossword-input"
                    aria-label={
                      wordClue
                        ? `Row ${row + 1}, column ${col + 1}, letter ${indexInWord} of ${wordClue.length}`
                        : `Row ${row + 1}, column ${col + 1}`
                    }
                    aria-invalid={invalid || undefined}
                    aria-describedby={result ? feedbackId : undefined}
                    disabled={result === 'correct'}
                    value={answers[key(row, col)] ?? ''}
                    onFocus={(event) => handleCellFocus(row, col, event)}
                    onClick={() => handleCellClick(row, col)}
                    onChange={(event) => handleChange(row, col, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(row, col, event)}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="crossword-status">
        {currentClue ? (
          <>
            <span className="crossword-status-number">
              {currentClue.number} {currentClue.direction === 'across' ? 'Across' : 'Down'}:
            </span>{' '}
            {currentClue.clue}
          </>
        ) : null}
      </p>

      <TaskActions
        result={result}
        message={result ? FEEDBACK_MESSAGES[result] : ''}
        onCheck={handleCheck}
        feedbackId={feedbackId}
        secondaryAction={
          result !== 'correct' ? (
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
