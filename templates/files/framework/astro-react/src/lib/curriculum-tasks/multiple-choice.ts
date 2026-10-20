import { z } from 'astro/zod';
import { TaskOptionSchema } from './option-list';

export const MultipleChoiceTaskSchema = z
  .object({
    type: z.literal('multiple-choice'),
    question: z.string(),
    options: z.array(TaskOptionSchema).min(2),
  })
  .refine((task) => task.options.filter((option) => option.correct).length === 1, {
    message: 'Multiple choice must have exactly one correct option',
  });
