# Dropdown Menus and Disclosures

Read this reference when building dropdown navigation, disclosure panels, or
action menus.

## Disclosure Navigation Dropdown (SC 2.1.1, 4.1.2)

The trigger is a `<button>`; the panel is a plain `<ul>` with `<li><a>` links.
No `role="menu"`. Tab/Shift+Tab navigate among the links. Arrow keys are
optional enhancements.

Required attributes on the trigger:

- `aria-expanded="false"` initially; toggle to `"true"` when the panel opens.
- `aria-controls="<panel-id>"` (strongly recommended).

```html
<button aria-expanded="false" aria-controls="nav-menu">Products</button>
<ul id="nav-menu" hidden>
  <li><a href="/widgets">Widgets</a></li>
  <li><a href="/gadgets">Gadgets</a></li>
</ul>
```

## Menu Button (Actions With Full Keyboard Nav)

Use `role="menu"` when you're implementing the full keyboard interaction contract.
`role="menuitem"` on `<a>` elements is valid.

Required attributes on the trigger:

- `aria-haspopup="true"` (or `"menu"`).
- `aria-expanded="false"/"true"`.
- `aria-controls="<menu-id>"`.

Required on the container: `role="menu"` + `aria-labelledby` pointing at the trigger.
Required on each item: `role="menuitem"` (or `menuitemcheckbox`/`menuitemradio`).
Required on `<li>` wrappers: `role="none"` to suppress the listitem role.
On `<a>` items: `tabindex="-1"` (focus is managed by arrow keys, not Tab).

Full keyboard contract — all of these are required:

- Down/Up arrows move between items (wraps at ends).
- Home/End jump to first/last item.
- Character keys jump to the next item starting with that letter.
- Enter/Space activate the focused item.
- Escape closes the menu and returns focus to the trigger.

```html
<button aria-haspopup="true" aria-expanded="false" aria-controls="nav-menu">Products</button>
<ul role="menu" id="nav-menu" aria-labelledby="trigger-id" hidden>
  <li role="none"><a role="menuitem" href="/widgets" tabindex="-1">Widgets</a></li>
  <li role="none"><a role="menuitem" href="/gadgets" tabindex="-1">Gadgets</a></li>
</ul>
```

**If you use `role="menu"`, implement all the keyboard behavior above.**
