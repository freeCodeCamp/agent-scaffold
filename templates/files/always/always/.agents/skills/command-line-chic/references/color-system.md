# Color System Reference

Complete token inventory for freeCodeCamp's Command-line Chic design system.
Values sourced from the platform CSS (`variables.css`), the official design
style guide, the VS Code dark theme, and the Sandpack/CodeSandbox theme.

## Table of Contents

1. [Base Gray Scale](#base-gray-scale)
2. [Accent Color Pairs](#accent-color-pairs)
3. [Additional Accent Tokens](#additional-accent-tokens)
4. [Dark Palette Semantic Mapping](#dark-palette-semantic-mapping)
5. [Light Palette Semantic Mapping](#light-palette-semantic-mapping)
6. [Editor Surface Mapping](#editor-surface-mapping)
7. [VS Code Theme Chrome Colors](#vs-code-theme-chrome-colors)
8. [Sandpack / CodeSandbox Theme](#sandpack--codesandbox-theme)
9. [CSS Variable Inventory](#css-variable-inventory)

---

## Base Gray Scale

11 values forming a dark navy-to-white ramp. The scale avoids pure black,
using a deep navy (`#0a0a23`) as the darkest value. Each gray pair (00/90,
05/85, 10/80, 15/75) is designed to swap roles between dark and light themes.

| Token                   | Hex / Value                 | Role in Dark Mode       | Role in Light Mode       |
| ----------------------- | --------------------------- | ----------------------- | ------------------------ |
| `--gray-00`             | `#ffffff`                   | Primary foreground      | Primary background       |
| `--gray-00-translucent` | `rgba(255, 255, 255, 0.85)` | Translucent foreground  | Translucent background   |
| `--gray-05`             | `#f5f6f7`                   | Secondary foreground    | Secondary background     |
| `--gray-10`             | `#dfdfe2`                   | Tertiary foreground     | Tertiary background      |
| `--gray-15`             | `#d0d0d5`                   | Quaternary foreground   | Quaternary background    |
| `--gray-40`             | `#939393`                   | Muted text (dark theme) | n/a                      |
| `--gray-45`             | `#858591`                   | Comments, disabled      | Comments, disabled       |
| `--gray-50`             | `#626262`                   | n/a                     | Muted text (light theme) |
| `--gray-75`             | `#3b3b4f`                   | Quaternary background   | Quaternary foreground    |
| `--gray-80`             | `#2a2a40`                   | Tertiary background     | Tertiary foreground      |
| `--gray-85`             | `#1b1b32`                   | Secondary background    | Secondary foreground     |
| `--gray-90`             | `#0a0a23`                   | Primary background      | Primary foreground       |
| `--gray-90-translucent` | `rgba(10, 10, 35, 0.85)`    | Translucent background  | Translucent foreground   |

Gray-45 (`#858591`) is for disabled elements (exempt from the WCAG contrast
minimum) and code comments in both themes. Do not use it for active, readable text. Muted
text that must stay legible, such as a secondary label, uses gray-40 / gray-50
instead.

---

## Accent Color Pairs

Each accent hue has two variants: "light" for use on dark backgrounds and
"dark" for use on light backgrounds. This ensures accents maintain sufficient
contrast regardless of theme.

| Hue    | Light Variant (on dark bg) | Dark Variant (on light bg) | Semantic Role                        |
| ------ | -------------------------- | -------------------------- | ------------------------------------ |
| Purple | `#dbb8ff`                  | `#5a01a7`                  | Emphasis, keywords, attributes       |
| Yellow | `#f1be32` / `#ffc300`      | `#4d3800`                  | CTAs, buttons, warnings, classes     |
| Blue   | `#99c9ff`                  | `#002ead`                  | Links, functions, interactive states |
| Green  | `#acd157`                  | `#00471b`                  | Success, completion, strings         |
| Red    | `#ffadad`                  | `#850000`                  | Errors, danger, destructive actions  |

**Note on yellow**: The style guide and VS Code theme use `#f1be32`, while
the platform CSS uses `#ffc300` (`--yellow-light`). The golden CTA button
uses `#ffbf00` (`--yellow-gold`). All three are valid — use `#f1be32` for
general accents and `#ffbf00` for primary CTA buttons.

---

## Additional Accent Tokens

| Token                       | Hex / Value                | Purpose                           |
| --------------------------- | -------------------------- | --------------------------------- |
| `--theme-color`             | `#0a0a23`                  | Meta theme color (browser chrome) |
| `--yellow-gold`             | `#ffbf00`                  | Primary CTA button background     |
| `--blue-mid`                | `#198eee`                  | Focus outlines, mid-blue accent   |
| `--purple-mid`              | `#9400d3`                  | Mid-range purple accent           |
| `--love-light`              | `#f8577c`                  | Heart/like accent (dark bg)       |
| `--love-dark`               | `#f82153`                  | Heart/like accent (light bg)      |
| `--blue-light-translucent`  | `rgba(153, 201, 255, 0.3)` | Selection backgrounds (dark)      |
| `--blue-dark-translucent`   | `rgba(0, 46, 173, 0.3)`    | Selection backgrounds (light)     |
| `--focus-outline-color`     | `#198eee` (= `--blue-mid`) | Universal focus ring              |
| `--editor-background-light` | `#fffffe`                  | Code editor surface (light)       |
| `--editor-background-dark`  | `#2a2b40`                  | Code editor surface (dark)        |

---

## Dark Palette Semantic Mapping

Applied via `.dark-palette` class on `body`. This is the default/primary
theme.

| Semantic Token                     | Maps To                         | Resolved Hex                |
| ---------------------------------- | ------------------------------- | --------------------------- |
| `--primary-color`                  | `var(--gray-00)`                | `#ffffff`                   |
| `--primary-color-translucent`      | `var(--gray-00-translucent)`    | `rgba(255, 255, 255, 0.85)` |
| `--secondary-color`                | `var(--gray-05)`                | `#f5f6f7`                   |
| `--tertiary-color`                 | `var(--gray-10)`                | `#dfdfe2`                   |
| `--quaternary-color`               | `var(--gray-15)`                | `#d0d0d5`                   |
| `--primary-background`             | `var(--gray-90)`                | `#0a0a23`                   |
| `--primary-background-translucent` | `var(--gray-90-translucent)`    | `rgba(10, 10, 35, 0.85)`    |
| `--secondary-background`           | `var(--gray-85)`                | `#1b1b32`                   |
| `--tertiary-background`            | `var(--gray-80)`                | `#2a2a40`                   |
| `--quaternary-background`          | `var(--gray-75)`                | `#3b3b4f`                   |
| `--highlight-color`                | `var(--blue-light)`             | `#99c9ff`                   |
| `--highlight-background`           | `var(--blue-dark)`              | `#002ead`                   |
| `--selection-color`                | `var(--blue-light-translucent)` | `rgba(153, 201, 255, 0.3)`  |
| `--success-color`                  | `var(--green-light)`            | `#acd157`                   |
| `--success-background`             | `var(--green-dark)`             | `#00471b`                   |
| `--danger-color`                   | `var(--red-light)`              | `#ffadad`                   |
| `--danger-background`              | `var(--red-dark)`               | `#850000`                   |
| `--yellow-color`                   | `var(--yellow-light)`           | `#ffc300`                   |
| `--yellow-background`              | `var(--yellow-dark)`            | `#4d3800`                   |
| `--purple-color`                   | `var(--purple-light)`           | `#dbb8ff`                   |
| `--purple-background`              | `var(--purple-dark)`            | `#5a01a7`                   |
| `--love-color`                     | `var(--love-light)`             | `#f8577c`                   |
| `--editor-background`              | `var(--editor-background-dark)` | `#2a2b40`                   |

---

## Light Palette Semantic Mapping

Applied via `.light-palette` class. Inverts the foreground/background
assignments.

| Semantic Token                     | Maps To                          | Resolved Hex                |
| ---------------------------------- | -------------------------------- | --------------------------- |
| `--primary-color`                  | `var(--gray-90)`                 | `#0a0a23`                   |
| `--primary-color-translucent`      | `var(--gray-90-translucent)`     | `rgba(10, 10, 35, 0.85)`    |
| `--secondary-color`                | `var(--gray-85)`                 | `#1b1b32`                   |
| `--tertiary-color`                 | `var(--gray-80)`                 | `#2a2a40`                   |
| `--quaternary-color`               | `var(--gray-75)`                 | `#3b3b4f`                   |
| `--primary-background`             | `var(--gray-00)`                 | `#ffffff`                   |
| `--primary-background-translucent` | `var(--gray-00-translucent)`     | `rgba(255, 255, 255, 0.85)` |
| `--secondary-background`           | `var(--gray-05)`                 | `#f5f6f7`                   |
| `--tertiary-background`            | `var(--gray-10)`                 | `#dfdfe2`                   |
| `--quaternary-background`          | `var(--gray-15)`                 | `#d0d0d5`                   |
| `--highlight-color`                | `var(--blue-dark)`               | `#002ead`                   |
| `--highlight-background`           | `var(--blue-light)`              | `#99c9ff`                   |
| `--selection-color`                | `var(--blue-dark-translucent)`   | `rgba(0, 46, 173, 0.3)`     |
| `--success-color`                  | `var(--green-dark)`              | `#00471b`                   |
| `--success-background`             | `var(--green-light)`             | `#acd157`                   |
| `--danger-color`                   | `var(--red-dark)`                | `#850000`                   |
| `--danger-background`              | `var(--red-light)`               | `#ffadad`                   |
| `--yellow-color`                   | `var(--yellow-dark)`             | `#4d3800`                   |
| `--yellow-background`              | `var(--yellow-light)`            | `#ffc300`                   |
| `--purple-color`                   | `var(--purple-dark)`             | `#5a01a7`                   |
| `--purple-background`              | `var(--purple-light)`            | `#dbb8ff`                   |
| `--love-color`                     | `var(--love-dark)`               | `#f82153`                   |
| `--editor-background`              | `var(--editor-background-light)` | `#fffffe`                   |

---

## Editor Surface Mapping

How the gray scale maps to different surfaces in code editors and IDEs. This
is consistent across the VS Code theme, Sandpack theme, and platform code
blocks.

| Surface               | Dark Mode | Light Mode |
| --------------------- | --------- | ---------- |
| Activity bar / chrome | `#0a0a23` | `#ffffff`  |
| Sidebar / panels      | `#1b1b32` | `#f5f6f7`  |
| Editor / main surface | `#2a2a40` | `#fffffe`  |
| Borders / dividers    | `#2a2a40` | `#dfdfe2`  |
| Selection highlight   | `#3b3b4f` | `#d0d0d5`  |

---

## VS Code Theme Chrome Colors

Complete UI color mapping from the official freeCodeCamp Dark VS Code Theme.

| VS Code Token                    | Hex         |
| -------------------------------- | ----------- |
| `activityBar.background`         | `#0a0a23`   |
| `activityBar.foreground`         | `#ffffff`   |
| `sideBar.background`             | `#1b1b32`   |
| `sideBar.foreground`             | `#f5f6f7`   |
| `sideBar.border`                 | `#2a2a40`   |
| `sideBarTitle.foreground`        | `#858591`   |
| `editor.background`              | `#2a2a40`   |
| `editor.foreground`              | `#dfdfe2`   |
| `editorIndentGuide.background`   | `#3b3b4f`   |
| `editorWidget.background`        | `#0a0a23`   |
| `tab.inactiveBackground`         | `#1b1b32`   |
| `tab.inactiveForeground`         | `#d0d0d5`   |
| `tab.activeForeground`           | `#ffffff`   |
| `tab.border`                     | `#2a2a40`   |
| `panel.background`               | `#1b1b32`   |
| `panelTitle.activeBorder`        | `#f5f6f7`   |
| `panelTitle.inactiveForeground`  | `#858591`   |
| `terminal.background`            | `#0a0a23`   |
| `terminal.foreground`            | `#ffffff`   |
| `statusBar.background`           | `#0a0a23`   |
| `statusBar.border`               | `#2a2a40`   |
| `titleBar.activeBackground`      | `#0a0a23`   |
| `titleBar.activeForeground`      | `#ffffff`   |
| `titleBar.inactiveBackground`    | `#2a2a40`   |
| `titleBar.inactiveForeground`    | `#dfdfe2`   |
| `button.background`              | `#f1be32`   |
| `button.foreground`              | `#0a0a23`   |
| `input.background`               | `#0a0a23`   |
| `dropdown.background`            | `#0a0a23`   |
| `dropdown.foreground`            | `#ffffff`   |
| `selection.background`           | `#3b3b4f`   |
| `focusBorder`                    | `#ffffff`   |
| `list.activeSelectionBackground` | `#2a2a40`   |
| `list.hoverBackground`           | `#1b1b32`   |
| `scrollbarSlider.background`     | `#0a0a2399` |

---

## Sandpack / CodeSandbox Theme

Token mapping from the official `freeCodeCampDark` Sandpack theme.

| Sandpack Token | Hex       | Purpose                            |
| -------------- | --------- | ---------------------------------- |
| `surface1`     | `#2a2a40` | Primary editor surface             |
| `surface2`     | `#0a0a23` | Secondary surface (header/sidebar) |
| `surface3`     | `#3b3b4f` | Tertiary surface (borders/errors)  |
| `clickable`    | `#dfdfe2` | Clickable text                     |
| `base`         | `#ffffff` | Base text                          |
| `disabled`     | `#858591` | Disabled text                      |
| `hover`        | `#ffffff` | Hover text                         |
| `accent`       | `#dbb8ff` | Accent / highlight                 |
| `error`        | `#ffffff` | Error text                         |
| `errorSurface` | `#3b3b4f` | Error surface background           |

---

## CSS Variable Inventory

Complete list of CSS custom properties as defined in the freeCodeCamp
platform's `variables.css`. Use these variable names when working directly
on freeCodeCamp repositories.

### Root Tokens

```
--theme-color: #0a0a23
--yellow-gold: #ffbf00
--gray-00: #ffffff
--gray-00-translucent: rgba(255, 255, 255, 0.85)
--gray-05: #f5f6f7
--gray-10: #dfdfe2
--gray-15: #d0d0d5
--gray-40: #939393
--gray-45: #858591
--gray-50: #626262
--gray-75: #3b3b4f
--gray-80: #2a2a40
--gray-85: #1b1b32
--gray-90: #0a0a23
--gray-90-translucent: rgba(10, 10, 35, 0.85)
--purple-light: #dbb8ff
--purple-dark: #5a01a7
--purple-mid: #9400d3
--yellow-light: #ffc300
--yellow-dark: #4d3800
--blue-light: rgb(153, 201, 255)
--blue-light-translucent: rgba(153, 201, 255, 0.3)
--blue-dark: rgb(0, 46, 173)
--blue-dark-translucent: rgba(0, 46, 173, 0.3)
--blue-mid: #198eee
--green-light: #acd157
--green-dark: #00471b
--red-light: #ffadad
--red-dark: #850000
--love-light: #f8577c
--love-dark: #f82153
--editor-background-light: #fffffe
--editor-background-dark: #2a2b40
--focus-outline-color: var(--blue-mid)
```

### Layout Tokens

```
--header-height: 38px
--header-element-size: 28px
--header-sub-element-size: 45px
--breadcrumbs-height: 44px
--action-row-height: 54px
```

### Z-Index Tokens

```
Breadcrumbs: 100
Flash messages: 150
--z-index-site-header: 200
```

### Typography Tokens

```
--font-family-sans-serif: 'Lato', sans-serif
--font-family-monospace: 'Hack-ZeroSlash', monospace
html { font-size: 18px }
```
