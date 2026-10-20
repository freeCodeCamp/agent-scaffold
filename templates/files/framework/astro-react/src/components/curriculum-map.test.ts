// @vitest-environment node

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import type { CurriculumOutline } from '../lib/curriculum-outline.js';
import CurriculumMap from './curriculum-map.astro';

const curriculum: CurriculumOutline = {
  title: 'Test curriculum',
  sections: [
    {
      title: 'Section one',
      modules: [
        { title: 'Module one', lessons: [{ title: 'Lesson one' }] },
        { title: 'Module two', lessons: [{ title: 'Lesson two' }] },
      ],
    },
  ],
};

describe('curriculum map', () => {
  it('marks and expands the current lesson path', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CurriculumMap, {
      props: { curriculum, currentLessonSlug: 'section-one-module-two-lesson-two' },
    });

    expect(html).toContain('href="/learn/section-one-module-two-lesson-two" aria-current="page"');
    expect(html).toContain('<details class="section" open>');
    expect(html).toContain('<details class="module-block" open><summary><h3>Module two</h3>');
  });
});
