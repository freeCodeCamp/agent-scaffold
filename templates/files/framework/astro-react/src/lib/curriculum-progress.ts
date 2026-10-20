const PROGRESS_STORAGE_KEY = 'progress';
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function readCompletedLessons(): string[] {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((slug): slug is string => typeof slug === 'string' && SLUG_PATTERN.test(slug));
  } catch {
    return [];
  }
}

function writeCompletedLessons(slugs: string[]): void {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(slugs));
}

export function markLessonComplete(slug: string): void {
  const current = readCompletedLessons();

  if (current.includes(slug)) {
    return;
  }

  writeCompletedLessons([...current, slug]);
}

export function getCompletedLessons(): string[] {
  return readCompletedLessons();
}

export function resetProgress(): void {
  writeCompletedLessons([]);
}

export function exportProgress(): string {
  return JSON.stringify(readCompletedLessons(), null, 2);
}

/**
 * Merges a previously exported progress file into the current browser's
 * stored progress. Never removes existing completions.
 *
 * @returns the number of newly completed lessons added by the import.
 */
export function importProgress(raw: string): number {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('That file does not contain a valid progress export.');
  }

  const importedSlugs = parsed.filter(
    (slug): slug is string => typeof slug === 'string' && SLUG_PATTERN.test(slug),
  );

  const current = readCompletedLessons();
  const merged = [...new Set([...current, ...importedSlugs])];

  writeCompletedLessons(merged);

  return merged.length - current.length;
}
