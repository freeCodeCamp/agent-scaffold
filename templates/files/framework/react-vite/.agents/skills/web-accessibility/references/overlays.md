# Dialogs, Modals, and Drawers

Read this reference when building any overlay such as a modal dialog, confirmation
prompt, drawer, or lightbox.

## Dialogs and Modals (SC 2.1.2, 4.1.2)

Use `<dialog>` with `showModal()`. This gives you focus trapping, top-layer
stacking, a `::backdrop` pseudo-element, and Escape to close. It also implies
`role="dialog"` and `aria-modal="true"`.

### What `showModal()` does NOT give you

You must still add these yourself:

**1. Accessible name.** Add `aria-labelledby` pointing at the dialog's heading.
If there is no visible heading, use `aria-label`.

**2. Scroll lock.** Prevent the background from scrolling while the dialog is
open:

```css
html:has(dialog[open]) {
  overflow: hidden;
}
```

To prevent layout shift from the disappearing scrollbar, use
`scrollbar-gutter: stable` on `<html>`.

To prevent scroll chaining (dialog's own scroll "leaking" to the page at
scroll boundaries), add `overscroll-behavior: contain` to the dialog.

**3. Focus restoration.** Store the triggering element before opening. Restore
focus to it on close:

```javascript
const trigger = document.activeElement;
dialog.showModal();
dialog.addEventListener(
  "close",
  () => {
    trigger?.focus();
  },
  { once: true },
);
```

**4. Backdrop click to close** (if desired):

```javascript
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});
```
