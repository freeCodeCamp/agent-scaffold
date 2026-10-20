import './shared/task.css';
import './order.css';
import { useEffect, useId, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../lib/curriculum-tasks';
import { Markdown } from '../markdown';
import { Button } from '../button';
import { useFocusOnCorrect } from '../../hooks/use-focus-on-correct';
import { TaskActions, type Result } from './shared/task-actions';
import { DragGrip } from './shared/drag-grip';

const FEEDBACK_MESSAGES: Record<Result, string> = {
  correct: 'Correct!',
  incorrect: 'Not quite. Try again.',
  unanswered: 'Order the items first.',
};

type OrderProps = {
  task: Extract<Task, { type: 'order' }>;
  onCorrect: () => void;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type RowProps = {
  id: string;
  disabled: boolean;
};

function Row({ id, disabled }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, index } =
    useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="order-row">
      <span className="order-position">{index + 1}.</span>
      <div
        ref={setActivatorNodeRef}
        className={isDragging ? 'item-card item-dragging' : 'item-card'}
        {...attributes}
        {...listeners}
      >
        <DragGrip />
        <span>{id}</span>
      </div>
    </div>
  );
}

export function Order({ task, onCorrect }: OrderProps) {
  const groupId = useId();
  const questionId = `${groupId}-question`;
  const feedbackId = `${groupId}-feedback`;

  const [items, setItems] = useState<string[]>(() => task.items);
  const [initialOrder, setInitialOrder] = useState<string[]>(() => task.items);
  const [shuffled, setShuffled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const shuffledItems = shuffle(task.items);
    setItems(shuffledItems);
    setInitialOrder(shuffledItems);
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
      return `${active.id} is over position ${items.indexOf(String(over.id)) + 1} of ${items.length}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `${active.id} was dropped.`;
      return `${active.id} was dropped at position ${items.indexOf(String(over.id)) + 1} of ${items.length}.`;
    },
    onDragCancel({ active }) {
      return `Moving ${active.id} was cancelled.`;
    },
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setItems((previous) => arrayMove(previous, previous.indexOf(String(active.id)), previous.indexOf(String(over.id))));
    setResult(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleReset() {
    setItems([...initialOrder]);
    setResult(null);
  }

  function handleCheck() {
    const isCorrect = items.every((item, index) => item === task.items[index]);
    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) onCorrect();
  }

  return (
    <div className="task" ref={taskRef} tabIndex={-1}>
      <div id={questionId} className="question">
        <Markdown>{task.question}</Markdown>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div
            className={shuffled ? 'order-list' : 'order-list unshuffled'}
            role="group"
            aria-labelledby={questionId}
          >
            {items.map((item) => (
              <Row key={item} id={item} disabled={isAnswered} />
            ))}
          </div>
        </SortableContext>

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
