import './shared/task.css';
import './text-select.css';
import { Fragment, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { Button } from '../button';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Select at least one word first.',
};

type TextSelectProps = {
  task: Extract<Task, { type: 'text-select' }>;
  onCorrect: () => void;
};

export function TextSelect({ task, onCorrect }: TextSelectProps) {
  const groupId = useId();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  const tabStopIndex = focusedIndex ?? 0;
  const isAnswered = result === 'correct';

  function handleToggle(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setResult(null);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;

    const next = index + delta;
    if (next < 0 || next >= task.tokens.length) return;

    event.preventDefault();
    setFocusedIndex(next);
    tokenRefs.current[next]?.focus();
  }

  function handleCheck() {
    if (selected.size === 0) {
      setResult('unanswered');
      return;
    }

    const isCorrect = task.tokens.every(
      (token, index) => token.correct === selected.has(index),
    );
    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) onCorrect();
  }

  function handleReset() {
    setSelected(new Set());
    setResult(null);
  }

  const feedbackId = `${groupId}-feedback`;
  const promptId = `${groupId}-prompt`;

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <div id={promptId} className="question">
        <Markdown>{task.prompt}</Markdown>
      </div>

      <div
        className="text-select-body"
        role="group"
        aria-labelledby={promptId}
        aria-describedby={result ? feedbackId : undefined}
      >
        {task.tokens.map((token, index) => {
          const isSelected = selected.has(index);
          let className = 'token';
          if (isSelected && isAnswered) className += ' answered-correct';
          else if (isSelected) className += ' selected';

          return (
            <Fragment key={index}>
              <button
                ref={(node) => {
                  tokenRefs.current[index] = node;
                }}
                className={className}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={index === tabStopIndex ? 0 : -1}
                disabled={isAnswered}
                onFocus={() => setFocusedIndex(index)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onClick={() => handleToggle(index)}
              >
                {token.text}
              </button>
              {index < task.tokens.length - 1 && ' '}
            </Fragment>
          );
        })}
      </div>

      <TaskActions
        result={result}
        message={result ? FEEDBACK_MESSAGES[result] : ''}
        onCheck={handleCheck}
        feedbackId={feedbackId}
        secondaryAction={
          !isAnswered ? (
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
