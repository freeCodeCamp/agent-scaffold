import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lesson as LessonDefinition } from '../lib/curriculum-types.js';
import { Lesson } from './lesson.js';

const navigate = vi.fn();
vi.mock('astro:transitions/client', () => ({ navigate: (href: string) => navigate(href) }));

const lesson: LessonDefinition = {
  title: 'A test lesson',
  content: [
    {
      type: 'task',
      task: {
        type: 'multiple-choice',
        question: 'Which option is correct?',
        options: [
          { text: 'Correct option', correct: true },
          { text: 'Wrong option', correct: false },
        ],
      },
    },
  ],
};

describe(Lesson, () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
  });

  it('persists completion after the task is passed', async () => {
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={lesson}
        lessonSlug="a-test-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Correct option' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    const nextLesson = screen.getByRole('link', { name: 'Next lesson' });
    nextLesson.addEventListener('click', (event) => event.preventDefault());
    await user.click(nextLesson);

    expect(localStorage.getItem('progress')).toBe('["a-test-lesson"]');
  });

  it('goes to the next lesson on Ctrl+Enter once the task is passed', async () => {
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={lesson}
        lessonSlug="a-test-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Correct option' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(localStorage.getItem('progress')).toBe('["a-test-lesson"]');
    expect(navigate).toHaveBeenCalledWith('/learn/next-lesson');
  });

  it('checks the focused task on Ctrl+Enter instead of navigating', async () => {
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={lesson}
        lessonSlug="a-test-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Correct option' }));
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does nothing on Ctrl+Enter when no task is focused', async () => {
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={lesson}
        lessonSlug="a-test-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.queryByText('Select an option first.')).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('only checks the focused task, not an unrelated one', async () => {
    const twoTaskLesson: LessonDefinition = {
      title: 'A two-task lesson',
      content: [lesson.content[0], lesson.content[0]],
    };
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={twoTaskLesson}
        lessonSlug="a-two-task-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    const radios = screen.getAllByRole('radio', { name: 'Correct option' });
    await user.click(radios[1]);
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.getAllByText('Correct!')).toHaveLength(1);
    expect(screen.queryByText('Select an option first.')).not.toBeInTheDocument();
  });

  it('moves focus to the Next lesson button once the last task is passed', async () => {
    const user = userEvent.setup();
    render(
      <Lesson
        lesson={lesson}
        lessonSlug="a-test-lesson"
        nextHref="/learn/next-lesson"
        isLastLesson={false}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Correct option' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('link', { name: 'Next lesson' })).toHaveFocus();
  });
});
