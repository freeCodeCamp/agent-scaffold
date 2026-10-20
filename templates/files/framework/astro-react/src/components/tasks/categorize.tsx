import './shared/task.css';
import './categorize.css';
import { useEffect, useId, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';
import { Button } from '../button';
import { DragGrip } from './shared/drag-grip';

const UNPLACED = 'unplaced';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Place all items before checking.',
};

type Containers = Record<string, string[]>;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function zoneLabel(id: string): string {
  return id === UNPLACED ? 'Items' : id;
}

export function findContainer(containers: Containers, id: string): string | undefined {
  if (id in containers) return id;
  return Object.keys(containers).find((key) => containers[key].includes(id));
}

export function moveItem(
  containers: Containers,
  activeId: string,
  activeContainer: string,
  overContainer: string,
): Containers {
  return {
    ...containers,
    [activeContainer]: containers[activeContainer].filter((item) => item !== activeId),
    [overContainer]: [...containers[overContainer], activeId],
  };
}

type ItemProps = {
  id: string;
  disabled: boolean;
};

function Item({ id, disabled }: ItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'item-card item-dragging' : 'item-card'}
      {...attributes}
      {...listeners}
    >
      <DragGrip />
      <span>{id}</span>
    </div>
  );
}

type ZoneProps = {
  id: string;
  items: string[];
  activeId: string | null;
  disabled: boolean;
};

function Zone({ id, items, activeId, disabled }: ZoneProps) {
  const { setNodeRef } = useDroppable({ id, disabled });
  const label = zoneLabel(id);
  const settledCount = items.filter((item) => item !== activeId).length;

  const classNames = ['zone'];
  if (settledCount === 0) classNames.push('zone-empty');

  return (
    <div ref={setNodeRef} className={classNames.join(' ')} role="group" aria-label={label}>
      <h4 className="zone-heading">{label}</h4>
      <div className="zone-items">
        {items.map((item) => (
          <Item key={item} id={item} disabled={disabled} />
        ))}
        {items.length === 0 ? <p className="zone-placeholder">Drop here</p> : null}
      </div>
    </div>
  );
}

type CategorizeProps = {
  task: Extract<Task, { type: 'categorize' }>;
  onCorrect: () => void;
};

export function Categorize({ task, onCorrect }: CategorizeProps) {
  const groupId = useId();
  const feedbackId = `${groupId}-feedback`;

  const allItems = task.categories.flatMap((category) => category.items);
  const correctCategoryByItem = Object.fromEntries(
    task.categories.flatMap((category) => category.items.map((item) => [item, category.name])),
  );

  const [containers, setContainers] = useState<Containers>(() => ({
    [UNPLACED]: allItems,
    ...Object.fromEntries(task.categories.map((category) => [category.name, [] as string[]])),
  }));
  const [initialUnplaced, setInitialUnplaced] = useState<string[]>(allItems);
  const [shuffled, setShuffled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragStartContainer, setDragStartContainer] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const shuffledItems = shuffle(allItems);
    setContainers((previous) => ({ ...previous, [UNPLACED]: shuffledItems }));
    setInitialUnplaced(shuffledItems);
    setShuffled(true);
  }, []);

  const isAnswered = result === 'correct';
  const taskRef = useFocusOnCorrect<HTMLDivElement>(result);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      const container = findContainer(containers, String(over.id));
      return container ? `${active.id} is over ${zoneLabel(container)}.` : undefined;
    },
    onDragEnd({ active, over }) {
      if (!over) return `${active.id} was dropped.`;
      const container = findContainer(containers, String(over.id));
      return container
        ? `${active.id} was placed in ${zoneLabel(container)}.`
        : `${active.id} was dropped.`;
    },
    onDragCancel({ active }) {
      return `Moving ${active.id} was cancelled.`;
    },
  };

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    setActiveId(activeId);
    setDragStartContainer(findContainer(containers, activeId) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overContainer = findContainer(containers, String(over.id));
    const activeContainer = findContainer(containers, activeId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setContainers((previous) => moveItem(previous, activeId, activeContainer, overContainer));
  }

  function handleDragEnd() {
    setActiveId(null);
    setDragStartContainer(null);
    setResult(null);
  }

  function handleDragCancel() {
    if (activeId && dragStartContainer) {
      const currentContainer = findContainer(containers, activeId);
      if (currentContainer && currentContainer !== dragStartContainer) {
        setContainers((previous) => moveItem(previous, activeId, currentContainer, dragStartContainer));
      }
    }
    setActiveId(null);
    setDragStartContainer(null);
  }

  function handleCheck() {
    if (containers[UNPLACED].length > 0) {
      setResult('unanswered');
      return;
    }

    const allCorrect = task.categories.every(
      (category) =>
        containers[category.name].length === category.items.length &&
        containers[category.name].every((item) => correctCategoryByItem[item] === category.name),
    );
    setResult(allCorrect ? 'correct' : 'incorrect');
    if (allCorrect) onCorrect();
  }

  function handleReset() {
    setContainers({
      [UNPLACED]: initialUnplaced,
      ...Object.fromEntries(task.categories.map((category) => [category.name, [] as string[]])),
    });
    setResult(null);
  }

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <div className="question">
        <Markdown>{task.question}</Markdown>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={shuffled ? 'categorize' : 'categorize unshuffled'}>
          <Zone
            id={UNPLACED}
            items={containers[UNPLACED]}
            activeId={activeId}
            disabled={isAnswered}
          />

          <div className="categorize-categories">
            {task.categories.map((category) => (
              <Zone
                key={category.name}
                id={category.name}
                items={containers[category.name]}
                activeId={activeId}
                disabled={isAnswered}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="item-card item-overlay">
              <DragGrip />
              <span>{activeId}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
