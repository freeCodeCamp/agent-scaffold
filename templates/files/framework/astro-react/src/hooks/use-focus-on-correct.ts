import { useEffect, useRef } from 'react';
import type { Result } from '../components/tasks/shared/task-actions';

export function useFocusOnCorrect<T extends HTMLElement>(result: Result | null) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (result === 'correct') {
      ref.current?.focus();
    }
  }, [result]);

  return ref;
}
