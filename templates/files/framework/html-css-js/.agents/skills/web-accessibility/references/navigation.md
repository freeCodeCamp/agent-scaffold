# Navigation

Read this reference when building site or app navigation (sidebar nav, top nav,
breadcrumbs, table of contents).

## Landmark (SC 1.3.1, 4.1.2)

Use `<nav>` to wrap navigation regions. A single `<nav>` on the page needs no
label. When more than one exists, give each a unique accessible name with
`aria-label` or `aria-labelledby` pointing at a visible heading.

```html
<nav aria-label="Main">…</nav>
<nav aria-label="Module contents">…</nav>
```

## Links, not buttons (SC 1.3.1)

Navigation items that go to a URL are links (`<a href>`), not buttons.

## Current location — `aria-current` (SC 1.3.1, 2.4.8)

Mark the link matching the current page with `aria-current="page"`. For a link
matching a broader step or section (not the exact page), use
`aria-current="step"` or `aria-current="true"`.

Apply it to exactly one link in a navigation set.

## Lists for grouped links

Wrap a set of navigation links in `<ul>` / `<li>`.
