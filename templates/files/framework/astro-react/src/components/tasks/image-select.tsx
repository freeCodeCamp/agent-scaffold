import './shared/task.css';
import './image-select.css';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { Button } from '../button';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Select at least one region first.',
};

function getRegionIds(svgText: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Failed to parse SVG');
  }
  return Array.from(doc.documentElement.querySelectorAll('[id][data-region]'))
    .map((el) => el.id)
    .filter(Boolean);
}

type ImageSelectProps = {
  task: Extract<Task, { type: 'image-select' }>;
  onCorrect: () => void;
};

export function ImageSelect({ task, onCorrect }: ImageSelectProps) {
  const groupId = useId();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  const isAnswered = result === 'correct';
  const tabStopId = focusedId ?? regionIds[0] ?? null;

  useEffect(() => {
    setLoadError(false);
    fetch(task.imageSrc)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load image: ${r.status}`);
        return r.text();
      })
      .then((text) => {
        const markup = text.replace(/<\?xml[^?]*\?>\s*/g, '');
        setSvgMarkup(markup);
        setRegionIds(getRegionIds(markup));
      })
      .catch((error: unknown) => {
        console.error('Failed to load image-select image:', task.imageSrc, error);
        setLoadError(true);
      });
  }, [task.imageSrc]);

  useLayoutEffect(() => {
    if (!containerRef.current || !regionIds.length) return;

    for (const id of regionIds) {
      const el = containerRef.current.querySelector(`[id="${id}"]`);
      if (!el) continue;

      el.setAttribute('role', 'checkbox');
      el.setAttribute('aria-label', el.getAttribute('data-label') ?? id);
      el.setAttribute('aria-checked', String(selected.has(id)));

      if (isAnswered) {
        el.setAttribute('aria-disabled', 'true');
      } else {
        el.removeAttribute('aria-disabled');
      }

      el.classList.toggle('region-focused', id === tabStopId && !isAnswered);
      el.classList.toggle('region-selected', selected.has(id) && !isAnswered);
      el.classList.toggle('region-correct', selected.has(id) && isAnswered);
    }
  }, [regionIds, selected, tabStopId, isAnswered]);

  function toggleRegion(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setResult(null);
  }

  function findRegionId(target: Element): string | null {
    let el: Element | null = target;
    while (el && el !== containerRef.current) {
      if (el.id && regionIds.includes(el.id)) return el.id;
      el = el.parentElement;
    }
    return null;
  }

  function handleContainerClick(event: React.MouseEvent) {
    if (isAnswered) return;
    const id = findRegionId(event.target as Element);
    if (id) {
      toggleRegion(id);
      setFocusedId(id);
    }
  }

  function handleContainerMouseOver(event: React.MouseEvent) {
    if (isAnswered) return;
    const id = findRegionId(event.target as Element);
    if (id) setFocusedId(id);
  }

  function handleContainerKeyDown(event: React.KeyboardEvent) {
    const index = tabStopId ? regionIds.indexOf(tabStopId) : -1;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedId(regionIds[Math.min(index + 1, regionIds.length - 1)]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedId(regionIds[Math.max(index - 1, 0)]);
    } else if (event.key === ' ' && tabStopId && !isAnswered) {
      event.preventDefault();
      toggleRegion(tabStopId);
    }
  }

  function handleCheck() {
    if (selected.size === 0) {
      setResult('unanswered');
      return;
    }
    const correctSet = new Set(task.correct);
    const isCorrect =
      task.correct.every((id) => selected.has(id)) &&
      [...selected].every((id) => correctSet.has(id));
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

      {loadError ? (
        <p className="image-select-error" role="alert">
          This image couldn't be loaded.
        </p>
      ) : svgMarkup === null ? (
        <div className="image-select-loading" aria-busy="true" />
      ) : (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          ref={containerRef}
          className="image-select-container"
          role="group"
          aria-labelledby={promptId}
          aria-describedby={result ? feedbackId : undefined}
          aria-activedescendant={!isAnswered && tabStopId ? tabStopId : undefined}
          tabIndex={isAnswered ? -1 : 0}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
          onClick={handleContainerClick}
          // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
          onMouseOver={handleContainerMouseOver}
          onKeyDown={handleContainerKeyDown}
        />
      )}

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
