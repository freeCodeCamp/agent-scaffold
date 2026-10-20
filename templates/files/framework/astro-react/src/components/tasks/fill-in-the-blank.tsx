import './shared/task.css';
import './fill-in-the-blank.css';
import { useId, useState } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Fill in every blank first.',
};

type FillInTheBlankProps = {
  task: Extract<Task, { type: 'fill-in-the-blank' }>;
  onCorrect: () => void;
};

export function FillInTheBlank({ task, onCorrect }: FillInTheBlankProps) {
  const groupId = useId();
  const feedbackId = `${groupId}-feedback`;
  const blankCount = task.segments.filter((segment) => segment.kind === 'blank').length;
  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(''));
  const [result, setResult] = useState<Result | null>(null);
  const invalid = result === 'incorrect' || result === 'unanswered';
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  function handleChange(blankIndex: number, value: string) {
    setAnswers((previous) =>
      previous.map((answer, index) => (index === blankIndex ? value : answer)),
    );
    setResult(null);
  }

  function handleCheck() {
    if (answers.some((answer) => answer.trim() === '')) {
      setResult('unanswered');
      return;
    }

    let blankIndex = 0;
    const isCorrect = task.segments.every((segment) => {
      if (segment.kind !== 'blank') {
        return true;
      }

      const userAnswer = answers[blankIndex].trim().toLowerCase();
      const accepted = segment.answers.some(
        (expected) => expected.trim().toLowerCase() === userAnswer,
      );
      blankIndex += 1;
      return accepted;
    });

    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      onCorrect();
    }
  }

  let blankIndex = 0;

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <p className="prompt">
        {task.segments.map((segment, index) => {
          if (segment.kind === 'text') {
            return <span key={index}>{segment.value}</span>;
          }

          const currentBlankIndex = blankIndex;
          blankIndex += 1;

          return (
            <input
              key={index}
              type="text"
              className="blank"
              aria-label={`Blank ${currentBlankIndex + 1}`}
              aria-invalid={invalid || undefined}
              aria-describedby={result ? feedbackId : undefined}
              disabled={result === 'correct'}
              value={answers[currentBlankIndex]}
              onChange={(event) => handleChange(currentBlankIndex, event.target.value)}
            />
          );
        })}
      </p>

      <TaskActions
        result={result}
        message={result ? FEEDBACK_MESSAGES[result] : ''}
        onCheck={handleCheck}
        feedbackId={feedbackId}
      />
    </div>
  );
}
