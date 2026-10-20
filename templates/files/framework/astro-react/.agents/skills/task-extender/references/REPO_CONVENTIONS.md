- **CSS class names: kebab-case, always**, not camelCase. These are plain .css files imported for side effects, not CSS Modules, so kebab-case is the standard (matches global.css: `.dark-palette`, `.skip-link`).

- **Shared client-side reactive logic goes in `src/hooks/` as a real custom hook** (function prefixed `use`, itself calling `useState`/`useEffect`), not a plain lib utility that each consuming component wraps in its own manual `useEffect`. Only applies once something is used by 2+ components - single-consumer client logic can just live inline in that one component (see `nav.tsx`'s theme handling).

- **Components all live in `src/components/`** - there's no separate `views/` folder. Page-level components (1:1 with a route, e.g. `lesson.tsx`, `progress.tsx`) sit alongside genuinely-reused ones (e.g. `button.tsx`, `nav.tsx`). Task-type components (multiple-choice, select-all, etc.) get their own `src/components/tasks/` subfolder.

- **`src/lib/` is framework-agnostic, non-component, non-hook logic only.** File names should self-identify their domain (e.g. `curriculum-progress.ts`) unless the file is genuinely generic (e.g. `mdast-utils.ts`). A domain with multiple related pieces gets its own subfolder instead of one large file (see `curriculum-tasks/`, one file per task type).

- **Use `type` for object shapes, not `interface`.** Matches every prop-type definition in the codebase.

- **Zod schema variables get a `Schema` suffix** (e.g. `MultipleChoiceTaskSchema`), so the schema is never confused with the inferred TS type.

- **Exported functions get explicit return types.** Don't rely on inference for anything importable from elsewhere.

- **`.astro` page files stay thin.** They fetch data and wire up `Layout` plus whatever components the page needs. Composing more than one component is fine, including passing a static child into a hydrated island - deciding what to render or transforming data in the frontmatter/template is not (that logic belongs in a view component instead).

- **Prefer React (`.tsx`) for UI; `.astro` is fine when it's the better fit.** Default to `.tsx`. Reach for `.astro` only for leaf, purely static content - no interactivity, no children/composition, no foreseeable need for state (see `curriculum-map.astro`, `learn.astro`). A `.tsx` component can't import an `.astro` one directly - to combine them, pass the astro-rendered output in as `children` from the page instead (see `<Sidebar client:load><CurriculumMap .../></Sidebar>` in `[slug].astro`).

- **Avoid FOUC for client-only state** (theme, progress, anything read from `localStorage`) with a synchronous `<script is:inline>` that runs before paint, co-located with the component whose visual state it affects, not in `layout.astro`. Build-time/SSR can't know a visitor's client state, so without this it flashes the wrong version before hydration corrects it. See the theme script and `curriculum-map.astro`'s completed-badge script.

- **For a task's set of interactive options**, Tab should move into and out of the whole group in one step, with arrow keys moving within it. Use native semantics where they give you this for free, otherwise roving `tabindex` (see existing task files for the pattern). This is not a hard rule, prefer it unless it doesn't make sense. If the arrows are needed for something else within the task items for example.

- **Match existing patterns before inventing new ones.** Before writing something new, check how a similar problem is already solved here (data fetching, error handling, hook shape, component composition) and follow that, unless there's a real reason not to. If you do introduce a genuinely new pattern, add a rule here so it's the one everyone follows next time, instead of an undocumented one-off.

- **Update this file when the code moves out from under it.** If a change renames, deletes, or restructures something a rule here points to (a file, a function, a pattern), update or remove that rule in the same change - don't leave a stale reference for the next person to trip over.

- **Any button that isn't the primary call-to-action** (selectable items, a reset control, etc.) should reuse the shared `.btn`/`.btn-secondary`/ `.btn-link` classes rather than inventing new button styles. If the task needs an action alongside the check button (like a reset), pass it through `TaskActions`'s `secondaryAction` prop so it renders in the same row instead of being placed separately.

- **Clean up after every change.** Check whether anything else can be cleaned up or removed after adding, changing, or deleting code. Ask before making changes.

- **Push back when a rule is wrong.** If a rule, convention, or instruction here seems like the wrong call for a specific situation, say so explicitly and explain why before following it. Don't silently comply with something you disagree with, and don't silently deviate from it either - flag it and let the user decide whether to override it or update the rule.

- **More generally:** once a task is answered correctly, every interactive control in it should become inert - not just inputs and the check button. If the task type introduces a new kind of control (a reset button, a hint button, anything else), it needs the same treatment: hidden or disabled once the task is correctly completed, matching whichever existing pattern fits (hidden like the check button, disabled like inputs).

## Adding a new task type

1. Decide the markdown syntax - what `--your-task-type--` looks like and what content follows it.
2. In `src/lib/curriculum-tasks/`:
   - Add `your-task-type.ts` with a Zod schema (`type: z.literal('your-task-type')` + fields, with `.refine()` for any cross-field validation) and a `parseYourTypeContent(nodes)` function extracting structured data from the raw mdast nodes. Reuse `option-list.ts` if the shape is just a question plus a list of options.
   - In `index.ts`: add the schema to the exported `Task` union, and register the schema + parseContent under a new key in `TASK_DEFINITIONS`.
   - Do not touch `parse-curriculum.ts` - the registry entry is the only thing that needs to change.
3. Build the component in `src/components/tasks/your-task-type.tsx` (+ CSS - reuse `option-task.css` if it fits an options-list shape, otherwise a new co-located file). Follow the established pattern: never disable the check/submit button (inputs themselves may be disabled once the task is answered correctly), use `aria-live="polite"` for feedback, use `aria-labelledby` instead of `<legend>`/`<label>` if the prompt or options need rich markdown, and know that `role="radio"` doesn't support `aria-invalid` (jsx-a11y flags it) if the new type uses radio inputs.
4. Wire it into `src/components/lesson.tsx` - add a `block.task.type === 'your-task-type'` branch inside the `lesson.content.map(...)` dispatch.
5. Add at least one real example to `english.md` to verify parsing.
6. Verify: lint/format/typecheck/build, and deliberately break the example once to confirm the build actually fails with a clear message before restoring it.
