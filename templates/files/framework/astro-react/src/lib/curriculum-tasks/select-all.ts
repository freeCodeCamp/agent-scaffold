import { z } from 'astro/zod';
import { TaskOptionSchema } from './option-list';

export const SelectAllThatApplyTaskSchema = z
  .object({
    type: z.literal('select-all-that-apply'),
    question: z.string(),
    options: z.array(TaskOptionSchema).min(2),
  })
  .refine((task) => task.options.some((option) => option.correct), {
    message: 'Select-all-that-apply must have at least one correct option',
  });
