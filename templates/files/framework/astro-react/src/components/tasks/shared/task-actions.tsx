import './task.css';
import type { ReactNode } from 'react';
import { Button } from '../../button';

export type Result = 'correct' | 'incorrect' | 'unanswered';

type TaskActionsProps = {
  result: Result | null;
  message: string;
  onCheck: () => void;
  feedbackId: string;
  secondaryAction?: ReactNode;
};

export function TaskActions({ result, message, onCheck, feedbackId, secondaryAction }: TaskActionsProps) {
  return (
    <div className="task-actions">
      <p id={feedbackId} className={`feedback ${result ?? ''}`} role="status" aria-live="polite">
        {message}
      </p>

      {secondaryAction}

      {result !== 'correct' ? (
        <Button variant="primary" onClick={onCheck}>
          Check answer
        </Button>
      ) : null}
    </div>
  );
}
