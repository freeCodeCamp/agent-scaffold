import './shared/task.css';
import './flash-card.css';
import { type KeyboardEvent, useId, useState } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { Button } from '../button';
import { Markdown } from '../markdown';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Complete!',
  incorrect: 'Flip the card first.',
  unanswered: 'Flip the card first.',
};

type FlashCardProps = {
  task: Extract<Task, { type: 'flash-card' }>;
  onCorrect: () => void;
};

function FlipIcon() {
  return (
    <svg className="flash-card-flip-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 6 Q8 1.5 13 5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 5.5 L10.3 4.2 L11.3 7.3 Z" fill="currentColor" />
      <path d="M13.5 10 Q8 14.5 3 10.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 10.5 L5.7 11.8 L4.7 8.7 Z" fill="currentColor" />
    </svg>
  );
}

export function FlashCard({ task, onCorrect }: FlashCardProps) {
  const cardId = useId();
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  function handleFlip() {
    setFlipped((current) => !current);

    if (result !== 'correct') {
      setResult(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleFlip();
  }

  function handleReset() {
    setFlipped(false);
    setResult(null);
  }

  function handleCheck() {
    if (!flipped) {
      setResult('unanswered');
      return;
    }

    setResult('correct');
    onCorrect();
  }

  const feedbackId = `${cardId}-feedback`;
  const promptId = `${cardId}-prompt`;
  const frontId = `${cardId}-front`;
  const backId = `${cardId}-back`;
  const activeFaceId = flipped ? backId : frontId;

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <div id={promptId} className="question">
        <Markdown>{task.prompt}</Markdown>
      </div>

      <div className="flash-card-scene">
        <div
          className={flipped ? 'flash-card flipped' : 'flash-card'}
          role="button"
          tabIndex={0}
          aria-labelledby={`${promptId} ${activeFaceId}`}
          aria-describedby={feedbackId}
          aria-pressed={flipped}
          onClick={handleFlip}
          onKeyDown={handleKeyDown}
        >
          <div className="flash-card-inner">
            <div className="flash-card-face flash-card-front" aria-hidden={flipped || undefined}>
              <div id={frontId} className="flash-card-content">
                <Markdown>{task.front}</Markdown>
              </div>
              <p className="flash-card-hint" aria-hidden="true">
                <FlipIcon />
                Reveal answer
              </p>
            </div>

            <div className="flash-card-face flash-card-back" aria-hidden={!flipped || undefined}>
              <div id={backId} className="flash-card-content">
                <Markdown>{task.back}</Markdown>
              </div>
              <p className="flash-card-hint" aria-hidden="true">
                <FlipIcon />
                Show front
              </p>
            </div>
          </div>
        </div>
      </div>

      <TaskActions
        result={result}
        message={result ? FEEDBACK_MESSAGES[result] : ''}
        onCheck={handleCheck}
        feedbackId={feedbackId}
        secondaryAction={
          result !== 'correct' ? (
            <Button variant="secondary" onClick={handleReset} disabled={!flipped}>
              Reset
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
