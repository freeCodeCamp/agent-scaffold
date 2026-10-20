# Complex Widget Patterns

Read this reference when building a widget that requires a custom ARIA role and
keyboard contract beyond basic buttons, links, and inputs.

Each pattern below lists the minimum required roles, states/properties, and
keyboard behavior. For full details, follow the linked APG page.

---

## Tabs

[APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

### Roles and attributes

- Tab list container: `role="tablist"`.
- Each tab: `role="tab"`, `aria-selected="true|false"`, `aria-controls="<panel-id>"`.
- Each panel: `role="tabpanel"`, `aria-labelledby="<tab-id>"`.
- Only the active tab has `tabindex="0"`; inactive tabs have `tabindex="-1"`
  (roving tabindex).

### Keyboard

- Left/Right arrows move between tabs (horizontal tablist). Up/Down for vertical.
- Home/End jump to first/last tab.
- Tab key moves focus from the tab into the associated panel.
- Activation on arrow (automatic) or on Enter/Space (manual) — pick one model
  and be consistent.

---

## Tree View

[APG: Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

### Roles and attributes

- Container: `role="tree"`, `aria-label`.
- Each node: `role="treeitem"`.
- Nested groups: `role="group"`.
- Expandable nodes: `aria-expanded="true|false"`.
- Selected nodes: `aria-selected="true|false"`.
- Roving tabindex on treeitems.

### Keyboard

- Up/Down arrows move between visible nodes.
- Right arrow: expands a collapsed node, or moves to its first child.
- Left arrow: collapses an expanded node, or moves to its parent.
- Home/End jump to first/last visible node.
- Character keys jump to the next node starting with that letter.
- Enter activates the focused node.

---

## Data Grid

[APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)

### Roles and attributes

- Container: `role="grid"`, `aria-label` or `aria-labelledby`.
- Rows: `role="row"`.
- Column headers: `role="columnheader"`. Sortable headers add
  `aria-sort="ascending|descending|none"`.
- Cells: `role="gridcell"`.
- Row count/index: `aria-rowcount`, `aria-rowindex` for virtual scrolling.
- Column count/index: `aria-colcount`, `aria-colindex` for hidden columns.

### Keyboard

- Arrow keys move between cells in 2D.
- Home/End jump to first/last cell in the row.
- Ctrl+Home/End jump to first/last cell in the grid.
- Page Up/Down scroll by a visible page of rows.
- Enter activates or begins editing the current cell.
- Escape cancels editing.

---

## Combobox

[APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

### Roles and attributes

- Input: `role="combobox"`, `aria-expanded="true|false"`,
  `aria-controls="<listbox-id>"`, `aria-activedescendant="<option-id>"`.
- Popup: `role="listbox"`.
- Each option: `role="option"`, `aria-selected="true|false"`.
- Autocomplete behavior: `aria-autocomplete="list|both|inline|none"`.

### Keyboard

- Down arrow opens the listbox and moves to the first/next option.
- Up arrow moves to the previous option.
- Enter selects the focused option and closes the listbox.
- Escape closes the listbox without selecting.
- Typing filters or highlights matching options per the autocomplete mode.

---

## Accordion

[APG: Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

### Roles and attributes

- Each header trigger: `<button>` (or `role="button"`), `aria-expanded="true|false"`,
  `aria-controls="<panel-id>"`.
- Each panel: `role="region"`, `aria-labelledby="<header-id>"`.
  (`role="region"` is optional when there are more than 6 panels — too many
  landmarks reduce usefulness.)

### Keyboard

- Enter/Space toggle the focused header's panel.
- (Optional) Up/Down arrows move between headers. Home/End jump to first/last.

---

## Carousel / Slide Show

[APG: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

### Roles and attributes

- Outer container: `role="region"`, `aria-roledescription="carousel"`, `aria-label`.
- Slide container: `aria-live="off"` when auto-rotating, `aria-live="polite"`
  when paused or manual.
- Each slide: `role="group"`, `aria-roledescription="slide"`,
  `aria-label="N of M"`.
- Previous/Next controls: standard `<button>` elements.
- Pause/Play button if auto-rotating.

### Keyboard

- Tab reaches the carousel controls.
- Previous/Next buttons or left/right arrows change slides.
- If auto-rotating, it pauses on focus, hover, or activation of the pause button.

---

## Toolbar

[APG: Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

### Roles and attributes

- Container: `role="toolbar"`, `aria-label` or `aria-labelledby`.
- Uses roving tabindex — one item has `tabindex="0"`, the rest `tabindex="-1"`.

### Keyboard

- Left/Right arrows move between toolbar items (horizontal toolbar).
- Home/End jump to first/last item.
- Tab moves focus out of the toolbar to the next focusable element on the page.

---

## Listbox

[APG: Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)

### Roles and attributes

- Container: `role="listbox"`, `aria-label` or `aria-labelledby`.
- Each option: `role="option"`, `aria-selected="true|false"`.
- Multi-select: `aria-multiselectable="true"` on the listbox.

### Keyboard

- Up/Down arrows move focus between options.
- Home/End jump to first/last option.
- Type-ahead: character keys jump to the next matching option.
- Space toggles selection in multi-select mode.

---

## Drag-and-Drop (SC 2.5.7)

### Core requirement

Drag-and-drop must never be the only way to complete an action. Provide an
equivalent non-drag path on the same screen for every drag outcome.

- The non-drag path must work with both keyboard and single-pointer interaction.
- A keyboard-only alternative alone does not satisfy this — mouse/touch users
  also need a non-drag option.
- Treat dragging as an enhancement, not the primary interaction.

### Non-drag alternatives

- **Fill-in-the-blank with a word bank:** select a word then activate a blank,
  or activate a blank then choose from a list of available words.
- **Reordering:** explicit move up/down buttons, or a menu of destination
  positions.
- **Matching/sorting:** pick-up/place actions, or a destination menu per item.

### ARIA

- Do not rely on deprecated `aria-grabbed` or `aria-dropeffect`.
- Announce state changes (selected, placed, removed, moved, canceled) through
  a polite live region when that information is not already exposed by the
  focused control's accessible name or description.

### Keyboard model

If the drag source area behaves as one logical control:

- Tab enters the source area.
- Arrow keys move among items.
- Enter/Space selects or places the current item.
- Tab leaves the source area.

Use standard APG composite widget behavior when applicable.

### Focus

- Do not auto-jump focus to a drop target unless the jump is predictable and
  the destination provides enough context on its own.
- After a completed action, return focus to the original trigger when that
  helps the user continue efficiently.
