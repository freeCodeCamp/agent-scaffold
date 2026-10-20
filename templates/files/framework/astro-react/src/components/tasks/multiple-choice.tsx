import './shared/task.css';
import './shared/option-task.css';
import { useId, useState } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Select an option first.',
};

type MultipleChoiceProps = {
  task: Extract<Task, { type: 'multiple-choice' }>;
  onCorrect: () => void;
};

export function MultipleChoice({ task, onCorrect }: MultipleChoiceProps) {
  const groupId = useId();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function handleSelect(index: number) {
    setSelectedIndex(index);
    setResult(null);
  }

  function handleCheck() {
    if (selectedIndex === null) {
      setResult('unanswered');
      return;
    }

    const isCorrect = task.options[selectedIndex].correct;
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
              type="radio"
              name={groupId}
              checked={selectedIndex === index}
              onChange={() => handleSelect(index)}
              disabled={result === 'correct'}
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
