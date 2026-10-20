---
name: task-extender
description: Guides adding a new curriculum task type (like multiple-choice or fill-in-the-blank) to this Astro-React template. Use when a user wants to create, add, or design a new task type for lessons.
---

# Task Extender

Design and implement a new curriculum task type following `references/REPO_CONVENTIONS.md`. Read that document and a couple of existing files in `src/lib/curriculum-tasks/` before doing anything to understand existing conventions.

# Rules

- Follow `references/REPO_CONVENTIONS.md`. If the user's request conflicts with it, explain the conflict instead of silently changing the design.
- Reuse existing task patterns whenever possible.
- Don't guess when requirements are unclear. Ask only the minimum questions needed.
- Prefer proposing reasonable defaults over asking exploratory questions. If a good default exists, propose it and let the user react.
- Prefer the simplest interaction that accomplishes the learning goal. Avoid introducing unnecessary complexity.
- Work one phase at a time. Do not begin the next phase until the current one has been completed or explicitly approved where applicable.

## Step 1: Get a basic description

Ask:

> Describe the task type you'd like to add.

Only ask a follow-up if the interaction model is still unclear. When you do, present the reasonable alternatives, recommend one, and explain why. Prefer the option that best matches existing task and accessibility patterns.

Do not discuss markdown yet.

## Step 2: Propose the markdown

Propose a markdown syntax that follows the existing `--marker--` / `--end-marker--` convention.

Requirements:

- Unambiguous
- Easy to author
- Consistent with existing task types
- Parser-friendly

Do not show schemas or parsed data structures.

Stop here and tell the user to type `approve markdown` if they are happy with the proposed markdown. Otherwise, have the user tell you what changes they'd like to see.

Do not continue until the user explicitly types `approve markdown`.

If the user requests changes, revise the markdown proposal and continue iterating until the user explicitly types `approve markdown`.

## Step 3: Design the UI/UX

Work with the user until the interaction is fully specified.

Cover:

- Layout
- Appearance of each interactive element
- Clickable items and click behavior
- Whether a secondary control (e.g. reset) is needed, and what it does
- Keyboard and screen-reader accessibility

Expect multiple rounds of discussion. Don't rush to a single proposal.

The check/feedback row is already fixed by the shared `TaskActions` component and is the same for every task type. Don't redesign it. It's always one row: the feedback message on the left, then any secondary control, then the check button last. Match this exactly in the mockup instead of guessing at button order or placement - unless the task **requires** a different layout.

When ready, present an ASCII mockup.

Stop here and tell the user to type `approve ui` if they are happy with the proposed UI. Otherwise, have the user tell you what changes they'd like to see.

Do not continue until the user explicitly types `approve ui`.

If the user requests changes, revise the mockup and continue iterating until the user explicitly types `approve ui`.

## Step 4: Implement

Re-read the "Adding a new task type" section of `references/REPO_CONVENTIONS.md` and implement the task exactly as described.

Do not perform final verification yet.

## Step 5: Browser review

Ask the user to run the site and test the new task in the browser.

Expect one or more rounds of UI/UX refinement. Make any requested changes, then ask the user to test again.

When the user is satisfied, tell them to type `approve browser` if they are happy with the proposed UI. Otherwise, have the user tell you what changes they'd like to see.

Do not continue until the user explicitly types `approve browser`.

If the user requests changes, revise the mockup and continue iterating until the user explicitly types `approve browser`.

## Step 6: Write tests

Add test files co-located with each new file that has testable logic, following the patterns in the existing test files. At minimum cover:

- Schema validation: valid input passes, each `.refine()` rejection.
- Parser: key tokenisation/extraction cases.
- Component behaviour: renders all interactive elements, unanswered/incorrect/correct feedback, `onCorrect` is called, all inputs are disabled after a correct answer, secondary controls are hidden after a correct answer, roving tabindex initial state, and arrow-key navigation.

Read the existing test files nearest to what you've added before writing, to match the import style, `describe`/`it` naming, and assertion patterns.

Run `pnpm test your-task-type` and confirm all tests pass before moving on.

## Step 7: Verify

Run:

- lint
- typecheck
- build

Deliberately break the example once (bad marker, missing required field, failing `.refine()`, etc.) and verify the build reports a clear, specific error. Then restore the example.

Self-review:

- Every interactive element becomes inert once the task is answered correctly, including any secondary controls introduced by the task.
- No adjacent or overlapping UI elements accidentally use the same color token (border/background, hover/border, button/surface, etc.).
- Every intended click target responds correctly (no dead zones caused by `pointer-events` or layout issues).
- The interaction is fully usable with the keyboard.

Do not make further functional or visual changes after this point unless the
user requests them.

## Step 8: Report

Summarize:

- The markdown syntax that was added
- The files that were changed
- The test results
- The verification results
