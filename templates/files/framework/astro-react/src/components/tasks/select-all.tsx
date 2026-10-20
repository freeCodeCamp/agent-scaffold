import './shared/task.css';
import './shared/option-task.css';
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Select at least one option first.',
};

type SelectAllProps = {
  task: Extract<Task, { type: 'select-all-that-apply' }>;
  onCorrect: () => void;
};

export function SelectAll({ task, onCorrect }: SelectAllProps) {
  const groupId = useId();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const optionRefs = useRef<Array<HTMLInputElement | null>>([]);

  const tabStopIndex = focusedIndex ?? 0;

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

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) {
      return;
    }

    const next = index + delta;
    if (next < 0 || next >= task.options.length) {
      return;
    }

    event.preventDefault();
    optionRefs.current[next]?.focus();
  }

  function handleCheck() {
    if (selected.size === 0) {
      setResult('unanswered');
      return;
    }

    const isCorrect = task.options.every((option, index) => option.correct === selected.has(index));
    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      onCorrect();
    }
  }

  const feedbackId = `${groupId}-feedback`;
  const invalid = result === 'incorrect' || result === 'unanswered';
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <fieldset
        className="fieldset"
        aria-labelledby={`${groupId}-question`}
        aria-invalid={invalid || undefined}
        aria-describedby={result ? feedbackId : undefined}
      >
        <div id={`${groupId}-question`} className="question">
          <Markdown>{task.question}</Markdown>
        </div>

        {task.options.map((option, index) => (
          <label key={index} className="option">
            <input
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="checkbox"
              tabIndex={index === tabStopIndex ? 0 : -1}
              checked={selected.has(index)}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onChange={() => handleToggle(index)}
              disabled={result === 'correct'}
              aria-invalid={invalid || undefined}
              aria-describedby={result ? feedbackId : undefined}
            />
            {option.text}
          </label>
        ))}
      </fieldset>

      <TaskActions
        result={result}
        message={result ? FEEDBACK_MESSAGES[result] : ''}
        onCheck={handleCheck}
        feedbackId={feedbackId}
      />
    </div>
  );
}
