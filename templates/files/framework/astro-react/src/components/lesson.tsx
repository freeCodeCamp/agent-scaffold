import { useEffect, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import type { Lesson } from '../lib/curriculum-types';
import { Markdown } from './markdown';
import { Button } from './button';
import { MultipleChoice } from './tasks/multiple-choice';
import { SelectAll } from './tasks/select-all';
import { FillInTheBlank } from './tasks/fill-in-the-blank';
import { Categorize } from './tasks/categorize';
import { Order } from './tasks/order';
import { Crossword } from './tasks/crossword';
import { TextSelect } from './tasks/text-select';
import { ImageSelect } from './tasks/image-select';
import { FlashCard } from './tasks/flash-card';
import { useSidebarOpen } from '../hooks/use-sidebar-open';
import { markLessonComplete } from '../lib/curriculum-progress';

import '../styles/pages.css';
import './lesson.css';

type LessonProps = {
  lesson: Lesson;
  lessonSlug: string;
  nextHref: string;
  isLastLesson: boolean;
};

export function Lesson({ lesson, lessonSlug, nextHref, isLastLesson }: LessonProps) {
  const taskCount = lesson.content.filter((block) => block.type === 'task').length;
  const [passedCount, setPassedCount] = useState(0);
  const canProceed = passedCount >= taskCount;
  const sidebarOpen = useSidebarOpen();

  function handleTaskPassed() {
    setPassedCount((count) => count + 1);
  }

 
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') {
        return;
      }

      const focusedTask = event.target instanceof Element ? event.target.closest('.task') : null;
      const checkButton = focusedTask?.querySelector<HTMLButtonElement>('.task-actions .btn-primary');

      if (checkButton) {
        event.preventDefault();
        checkButton.click();
        return;
      }

      if (canProceed) {
        event.preventDefault();
        markLessonComplete(lessonSlug);
        navigate(nextHref);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canProceed, lessonSlug, nextHref]);

  const couldProceedRef = useRef(canProceed);
  useEffect(() => {
    if (canProceed && !couldProceedRef.current) {
      document.querySelector<HTMLAnchorElement>('.lesson-next a')?.focus();
    }
    couldProceedRef.current = canProceed;
  }, [canProceed]);

  return (
    <main id="main-content" className={sidebarOpen ? 'main sidebar-open' : 'main'} tabIndex={-1}>
      <div className="lesson-content">
        <section>
          <h1>{lesson.title}</h1>

          {lesson.content.map((block, index) => {
            if (block.type === 'text') {
              return <Markdown key={index}>{block.markdown}</Markdown>;
            }

            if (block.task.type === 'multiple-choice') {
              return <MultipleChoice key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'select-all-that-apply') {
              return <SelectAll key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'categorize') {
              return <Categorize key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'order') {
              return <Order key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'crossword') {
              return <Crossword key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'text-select') {
              return <TextSelect key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'image-select') {
              return <ImageSelect key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            if (block.task.type === 'flash-card') {
              return <FlashCard key={index} task={block.task} onCorrect={handleTaskPassed} />;
            }

            return <FillInTheBlank key={index} task={block.task} onCorrect={handleTaskPassed} />;
          })}

          {canProceed ? (
            <div className="lesson-next">
              <Button
                variant="primary"
                href={nextHref}
                onClick={() => markLessonComplete(lessonSlug)}
              >
                {isLastLesson ? 'Finish' : 'Next lesson'}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
