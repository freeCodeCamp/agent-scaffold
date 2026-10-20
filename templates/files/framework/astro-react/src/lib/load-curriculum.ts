import { getEntry } from 'astro:content';
import type { Curriculum } from './curriculum-types';
import { parseCurriculum } from './parse-curriculum';

export const DEFAULT_CURRICULUM_ENTRY = 'english';

export async function loadCurriculum(
  entryId: string = DEFAULT_CURRICULUM_ENTRY,
): Promise<Curriculum> {
  const entry = await getEntry('curriculum', entryId);
  const markdown = entry?.body ?? '';
  const title = entry?.data.title ?? 'Curriculum';
  const description = entry?.data.description;
  return parseCurriculum(markdown, title, description);
}
