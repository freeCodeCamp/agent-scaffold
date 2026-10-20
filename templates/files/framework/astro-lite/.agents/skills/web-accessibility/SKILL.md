---
name: web-accessibility
description: >
  Most common WCAG 2.2 AA patterns for UI development. Load when writing, modifying, or
  planning any component, page, form, dialog, overlay, or interactive element. Does not
  substitute for runtime testing with assistive technology.
---

# Web Accessibility During Development

Use this skill when building or reviewing UI. Universal rules are inline below.
Feature-specific patterns live in `references/` files — read the matching file
when you encounter that feature.

## For Every Component

These apply to everything you build, no exceptions.

### Semantic HTML first (SC 1.3.1, 4.1.2)

Use the native element that matches the behavior. `<button>` for actions, `<a
href>` for navigation, `<input>` for data entry, `<select>` for selection,
`<dialog>` for overlays. Never attach a click handler to a `<div>` or `<span>`
and call it interactive. If no native element fits, add `role`,
`tabindex="0"`, and keyboard handlers (Enter, Space, arrow keys as appropriate).

### Keyboard operability (SC 2.1.1, 2.1.2, 2.4.3)

Every interactive element must be reachable via Tab and operable via keyboard.
Standard mappings: Enter/Space to activate buttons and links, arrow keys for
composite widgets (radio groups, tab panels, menus, listboxes), Escape to close
overlays. No keyboard traps outside intentional modals.

Tab order must follow visual/reading order. Never use `tabindex` values greater
than 0; only use `tabindex="0"` (add to tab order) or `tabindex="-1"`
(programmatically focusable, not in natural tab order).

### Focus visibility (SC 2.4.7, 2.4.11, 1.4.11)

Every interactive element needs a visible `:focus-visible` indicator. Never
write `outline: none` without providing a replacement. The focus indicator
itself must meet 3:1 non-text contrast against adjacent colors (SC 1.4.11).

### Color contrast (SC 1.4.1, 1.4.3, 1.4.11)

Text contrast must be ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥ 18pt /
≥ 14pt bold). Non-text UI elements (borders, icons, focus rings, form field
boundaries) must meet 3:1.

**Do not round the ratio.** A computed ratio of 4.4999 fails the 4.5:1
threshold. Use the calculation and checking guidance in
[contrast-check.md](references/contrast-check.md) to verify.

Color must never be the sole means of conveying information. Pair it with text,
an icon, or a pattern.

### Text alternatives (SC 1.1.1)

- Informative images: descriptive `alt` that conveys meaning in context.
- Decorative images: `alt=""`.
- Icon-only controls: `aria-label` on the control, `aria-hidden="true"` on the
  icon/SVG.
- Complex images (charts, diagrams): longer description via `aria-describedby`
  or adjacent text.

### Accessible names (SC 4.1.2, 2.5.3)

Every interactive element must have a discoverable accessible name. For
controls with visible text, the accessible name must contain that visible text
(SC 2.5.3 Label in Name).

### Visually hidden content (sr-only)

`sr-only` hides an element visually while keeping it in the accessibility tree.
Use your project's existing utility if one exists. If not:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

Do not use `display: none`, `visibility: hidden`, or `width: 0; height: 0` —
all three remove the element from the accessibility tree or document flow.

Apply `sr-only` when:

- A native input is replaced visually by a custom element (native input gets
  `sr-only`; custom element gets `aria-hidden="true"`).
- A prose description of a non-obvious interaction precedes the inputs.
- A visual representation (e.g., color-coded diff) needs a prose equivalent
  for screen reader users.

## Page-Level Structure

### Landmarks and headings (SC 1.3.1, 2.4.6)

- One `<main>` per page.
- Use `<nav>`, `<header>`, `<footer>` for their landmark roles. When a landmark
  type repeats (e.g., two `<nav>` elements), give each a unique `aria-label`.
- One `<h1>` per page. Headings form a logical outline with no skipped levels.

### Page title (SC 2.4.2)

Every page (or route in an SPA) has a descriptive `<title>`. In SPAs, the title
updates on navigation. Different routes with different purposes use different
titles.

### Language (SC 3.1.1, 3.1.2)

`<html>` declares its language with `lang`. Inline text in another language
carries its own `lang` attribute.

### Skip link (SC 2.4.1)

A "Skip to main content" link is the first focusable element on the page. It
becomes visible on focus and moves focus to the `<main>` landmark.

## Live Regions and Dynamic Content (SC 4.1.3)

Content that changes without a focus move must be announced to screen readers via
an `aria-live` region.

This includes: validation results, success/error messages, loading states, save
confirmations, filter result counts, score updates, toasts, async operation
results.

**The live region container must exist in the DOM before content is injected.**
Creating the container and populating it in the same operation does not get
announced. Render an empty container, then inject content into it.

Two semantic roles cover most cases:

```html
<!-- Non-urgent: status updates, save confirmations, filter counts, loading state -->
<!-- role="status" implies aria-live="polite" and aria-atomic="true" -->
<div role="status"></div>

<!-- Urgent: errors that block the user, session timeouts -->
<!-- role="alert" implies aria-live="assertive" and aria-atomic="true" -->
<div role="alert"></div>
```

Do not add explicit `aria-live` or `aria-atomic` to a `role="status"` or
`role="alert"` element — the role already sets them.

When you do need a bare `aria-live` region (e.g., a custom log widget):

- `aria-live="polite"` — waits for the user to finish their current interaction.
- `aria-live="assertive"` — interrupts immediately. Reserve for genuinely urgent
  errors; overuse trains users to ignore announcements.
- `aria-atomic="true"` — re-reads the entire region on any change. Use for
  self-contained messages (a toast, a status line) where partial re-reads make no
  sense.
- `aria-atomic="false"` (the default) — announces only the changed node. Use for
  appending content (a chat log, an error list) where only new entries should be read.

Loading, empty, and error states need text, not just a spinner or blank screen.
Use `role="status"` for loading indicators.

## Animation and Motion (SC 2.2.2, 2.3.1, 2.3.3)

Respect `prefers-reduced-motion`. The preferred pattern is motion-opt-in:

```css
/* No motion by default */
.element {
  opacity: 1;
}

/* Motion only when the user hasn't opted out */
@media (prefers-reduced-motion: no-preference) {
  .element {
    transition: opacity 200ms ease-in-out;
  }
}
```

Nothing flashes more than three times per second. Any auto-playing or looping
animation longer than 5 seconds can be paused or stopped.

## Disabled Controls (SC 4.1.2, 1.4.3)

Prefer keeping controls enabled, validating on activation, and showing
recoverable error messages.

If a control must appear unavailable, use `aria-disabled="true"` — not the HTML
`disabled` attribute.

When using `aria-disabled`:

- Block the action in JS for both pointer and keyboard events.
- Style the unavailable state via `[aria-disabled="true"]` in CSS.
- The element must still meet contrast requirements.

## Target Size and Touch (SC 2.5.1, 2.5.8)

Interactive targets must be at least 24×24 CSS pixels (SC 2.5.8, AA). If a
target is smaller, it passes only when a 24px-diameter circle centered on it
does not overlap the circle of any adjacent target.

Aim for 44×44 CSS px for comfortable touch use, especially on controls that are
primary interaction points.

Any path-based or multi-point gesture (swipe, drag, pinch) must also work with
a single pointer (tap/click). A keyboard-only alternative is not sufficient for
this criterion; mouse/touch users need a mouse/touch-based non-drag option.

## Responsive and Reflow (SC 1.4.4, 1.4.10, 1.4.12)

Content must reflow without horizontal scrolling at 320 CSS px viewport width
(SC 1.4.10). Text must be resizable to 200% without clipping or overlap (SC
1.4.4). Avoid fixed-height containers that clip text when the user overrides
text spacing (SC 1.4.12).

## Keyboard Shortcuts (SC 2.1.4)

If the app binds a single printable character as a shortcut (a letter, number,
or punctuation without Ctrl/Alt/Cmd), it must be disableable, remappable to
include a modifier, or active only while the relevant component has focus. At
minimum, suppress single-character shortcuts when focus is in an `<input>`,
`<textarea>`, or `contenteditable`.

## Feature-Specific Patterns

The sections above are universal. When you encounter a specific feature, read
the matching reference file in this skill's `references/` directory:

| Feature type                                                                               | Read                                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Form, input, validation, fieldset                                                          | [forms.md](references/forms.md)                       |
| Dialog, modal, drawer, sidebar                                                             | [overlays.md](references/overlays.md)                 |
| Dropdown menu, disclosure, menu button                                                     | [menus.md](references/menus.md)                       |
| Audio, video, media controls                                                               | [media.md](references/media.md)                       |
| Tabs, tree view, data grid, combobox, drag-and-drop, accordion, carousel, toolbar, listbox | [complex-patterns.md](references/complex-patterns.md) |

If the component does not match any reference above, check the
[WAI-ARIA Authoring Practices Guide pattern index](https://www.w3.org/WAI/ARIA/apg/patterns/).
If no documented pattern exists, state what you would do and ask the user to
confirm before implementing.
