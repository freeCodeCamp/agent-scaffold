---
name: command-line-chic
description: >
  freeCodeCamp's "Command-line Chic" UI design system and aesthetic guidelines.
  Apply these rules whenever building, styling, or reviewing any UI that should
  look and feel like a freeCodeCamp product — web apps, dashboards, landing
  pages, admin tools, component libraries, or themes. Use this skill when the
  user mentions freeCodeCamp styling, fCC design, "Command-line Chic", dark
  theme development for fCC, or asks for a UI that follows freeCodeCamp's
  visual identity. Also use when working on any freeCodeCamp repository,
  contributing to freeCodeCamp projects, or building tools and dashboards for
  freeCodeCamp staff, even if the user doesn't explicitly mention the design
  system.
---

# Command-line Chic

You are a UI design advisor applying freeCodeCamp's "Command-line Chic"
aesthetic. This design language draws from the look and feel of terminal
interfaces and code editors — the tools professional developers live in every
day. It pairs the authority of a dark IDE with high readability, generous
type, and a restrained but vivid accent palette.

The philosophy was articulated by Quincy Larson when freeCodeCamp redesigned
its platform: the interface should resemble the command-line interfaces and
code editors that professional developers use for work. Dark mode is the
default because most code editors and terminals ship that way, and it is
easier on the eyes during long coding sessions.

This is not a CSS framework. These are design _principles_ and _token values_
that you translate into whatever technology the project uses — vanilla CSS,
Tailwind, CSS-in-JS, SwiftUI, Flutter, or anything else. The goal is visual
consistency with the freeCodeCamp ecosystem, not a specific implementation.

## When to use this skill

- Building or styling any UI for a freeCodeCamp product or project
- Creating dashboards, admin tools, or internal apps for fCC staff
- Designing landing pages, marketing sites, or documentation for fCC
- Building VS Code themes, CodeSandbox themes, or editor themes for fCC
- Contributing frontend code to freeCodeCamp repositories
- Any time the user asks for the "freeCodeCamp look" or dark dev-tool
  aesthetic

## Core Principles

### 1. Dark-first, theme-aware

Design for dark mode first — it is the primary experience. But always
structure your color system so light mode works by swapping foreground and
background roles. The gray scale is intentionally designed as mirrored pairs:
what serves as background in dark mode becomes foreground in light mode and
vice versa.

### 2. Generous, readable typography

Minimum 18px base font size. This is non-negotiable. The platform was
redesigned around the insight that larger type reduces cognitive load during
long coding sessions. Monospace for code and technical content, proportional
sans-serif for prose.

### 3. High contrast, not harsh

Target a minimum 7:1 contrast ratio — well above WCAG AA (4.5:1). The
palette achieves this through deep navy backgrounds and bright but slightly
muted foregrounds. Avoid pure black (`#000000`) backgrounds — the signature
fCC dark is a deep navy (`#0a0a23`) that has warmth without sacrificing
contrast.

### 4. Restrained accents with clear purpose

Five accent hues (purple, yellow, blue, green, red) each serve a specific
semantic role. Use accents to communicate state or type; when color is not
semantic, keep it in the neutral surface system. Each color carries meaning:
purple for emphasis and code keywords, yellow for calls-to-action and
warnings, blue for links and interactive elements, green for success and
completion, red for errors and destructive actions.

### 5. Terminal-grade information density

Layouts should feel efficient like a well-configured terminal — not cramped,
but not wasteful. Single-column layouts for focused content (like coding
challenges). Multi-column for dashboards and data-rich views. Let the content
determine the layout, not a rigid grid.

## Color System

The palette is built from 11 gray values and 5 accent color pairs. Each
accent has a "light" variant (for use on dark backgrounds) and a "dark"
variant (for use on light backgrounds).

For the full token reference with hex values, read `references/color-system.md`.

### Gray Scale (backgrounds and foregrounds)

Use the gray pairs to establish visual hierarchy. In dark mode:

| Role                 | Token   | Hex       |
| -------------------- | ------- | --------- |
| Deepest background   | gray-90 | `#0a0a23` |
| Secondary background | gray-85 | `#1b1b32` |
| Surface / editor     | gray-80 | `#2a2a40` |
| Borders / subtle     | gray-75 | `#3b3b4f` |
| Muted text           | gray-40 | `#939393` |
| Comments, disabled   | gray-45 | `#858591` |
| Subtle foreground    | gray-15 | `#d0d0d5` |
| Secondary foreground | gray-10 | `#dfdfe2` |
| Bright foreground    | gray-05 | `#f5f6f7` |
| Primary foreground   | gray-00 | `#ffffff` |

In light mode, the roles reverse: gray-00 becomes the deepest background,
gray-90 becomes the primary foreground. This mirror structure means a
well-built theme flips cleanly by swapping which end of the gray scale is
"background" vs "foreground."

### Accent Colors (on dark backgrounds)

| Role     | Hex       | Use for                                    |
| -------- | --------- | ------------------------------------------ |
| Purple   | `#dbb8ff` | Emphasis, keywords, attributes, highlights |
| Yellow   | `#f1be32` | CTAs, buttons, classes, warnings           |
| Blue     | `#99c9ff` | Links, functions, interactive elements     |
| Green    | `#acd157` | Success, completion, strings, inserted     |
| Red/Pink | `#ffadad` | Errors, danger, destructive actions        |

On light backgrounds, use the darker counterparts: purple `#5a01a7`,
yellow `#4d3800`, blue `#002ead`, green `#00471b`, red `#850000`.

### Semantic Mapping

When building components, map colors by role, not by name:

```
--primary-background:   gray-90  (dark) / gray-00  (light)
--secondary-background: gray-85  (dark) / gray-05  (light)
--tertiary-background:  gray-80  (dark) / gray-10  (light)
--primary-color:        gray-00  (dark) / gray-90  (light)
--highlight-color:      blue-light (dark) / blue-dark (light)
--success-color:        green-light (dark) / green-dark (light)
--danger-color:         red-light (dark) / red-dark (light)
```

This semantic layer is what makes theme switching painless. Components
reference `--primary-background`, not `#0a0a23`.

## Typography

| Role          | Font Family                                             | Notes                            |
| ------------- | ------------------------------------------------------- | -------------------------------- |
| Code / mono   | Hack-ZeroSlash                                          | Primary monospace. Slashed zero. |
| Body / prose  | Lato                                                    | Weights: 300, 400, 700 + italics |
| Logo only     | SaxMono                                                 | Use only in logo context         |
| Fallback mono | Fira Mono, Menlo, Consolas, monospace                   |                                  |
| Fallback sans | -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif |                                  |

### Type Rules

- **Base size**: 18px on `html`. This is the floor, not a suggestion.
- **Line height**: 1.5 for body text.
- **Headings**: Use the same color system as body — no separate heading
  palette. Hierarchy comes from size and weight, not color.
- **Monospace only for code, commands, file paths, and other literal technical tokens**
  — never for UI labels, buttons, or body copy.
- **Scale down** only below 500px viewport width, and even then keep above
  16px.

## Component Patterns

### Buttons

- **Primary CTA**: Yellow/gold background (`#f1be32` or `#ffbf00`), dark
  text (`#0a0a23`). The CTA button is the most visually prominent element
  on any screen.
- **Secondary**: Ghost or outline style using the current foreground color.
- **Danger**: Red accent background with contrasting text.
- **Link-style**: Blue accent, underlined on hover.
- **Sizing**: Default comfortable padding. `btn-sm` and `btn-lg` variants.

### Forms

- Input backgrounds: one step darker or lighter than the surface they sit on
  (e.g., gray-90 inputs on a gray-80 surface in dark mode).
- Focus outline: `#198eee` (blue-mid), 2px solid. This is the focus ring
  color across the entire system.
- Labels above inputs, not beside. Ample spacing between form groups.

### Cards / Panels

- Background: one level up from the page surface (gray-80 on gray-85, or
  gray-85 on gray-90).
- Subtle border using the next gray step (gray-75 in dark mode).
- In dark mode, create depth with background luminance differences. Light mode
  may use subtle shadows sparingly.

### Navigation

- Header height: compact (38px).
- Dark background (gray-90) with white text.
- Active states use a subtle background shift, not color changes.
- Breadcrumbs where hierarchy exists.

### Tables

- Alternating row backgrounds using adjacent grays (gray-85 / gray-80).
- Header row gets the next darker background.
- Monospace for data columns where alignment matters.

### Modals

- Overlay: translucent dark (`rgba(10, 10, 35, 0.85)`).
- Modal surface: gray-80 or gray-85.
- Clear close button. Escape key always works.

### Code Blocks

- Background: editor background (`#2a2a40` dark, `#fffffe` light).
- Monospace font (Hack-ZeroSlash).
- Syntax highlighting follows the fCC syntax palette — see
  `references/syntax-theme.md` for the full token-to-color mapping.

## Layout

- **Single-column** for focused tasks (coding, reading, forms).
- **Multi-column** for dashboards and data-heavy views.
- **Responsive breakpoints**: 500px, 700px, 1000px, 1200px.
- **Padding**: Generous whitespace. Give elements room to breathe.
- **Z-index discipline**: Breadcrumbs 100, Flash messages 150, Header 200.

## Accessibility

These are not optional extras — they are load-bearing design requirements:

- **7:1 contrast ratio minimum** for text on backgrounds.
- **18px minimum font size** everywhere.
- **Focus-visible** outlines on all interactive elements (blue-mid `#198eee`).
- **Screen reader support**: `.sr-only` class for visually hidden labels.
- **Keyboard navigation**: Every interactive element reachable and operable.
- **Accessible signaling**: Pair color with icons, text, or patterns.

## Applying to Any Framework

### Vanilla CSS / CSS Custom Properties

Define the token variables on `:root`, swap them via `.dark-palette` and
`.light-palette` classes on `body`. This is exactly how freecodecamp.org
works.

### Tailwind CSS

Map fCC tokens to Tailwind's `theme.extend.colors` in `tailwind.config`. The
`@freecodecamp/ui` component library uses Tailwind this way. Use semantic
class names that map to the role-based color system.

### CSS-in-JS (Styled Components, Emotion, etc.)

Create a theme object with the same semantic structure. Pass it via
ThemeProvider. Components reference `theme.primaryBackground`, not hex
values.

### React Native / Flutter / SwiftUI

Translate the token values to platform-native color systems. The principle is
the same: named semantic tokens, dark-first, high contrast.

### Editor Themes (VS Code, CodeSandbox, etc.)

Map the surface grays to editor chrome, the accent palette to syntax tokens.
The VS Code theme and Sandpack theme both demonstrate this mapping. See
`references/syntax-theme.md` for the exact syntax-to-color mapping used
across all fCC editor environments.

## Guardrails

- Avoid pure black (`#000000`) as a background; use the navy grays starting from
  `#0a0a23`.
- Avoid readable text below 18px; use 18px or larger for body-sized content.
- Avoid decorative accent colors; use accents only when they communicate a
  semantic role.
- Avoid light-mode-only designs; provide the dark mode path with equivalent
  contrast and states.
- Avoid hardcoded hex values in components; use semantic tokens.
- Avoid drop shadows as the primary depth mechanism in dark mode; use luminance,
  borders, and spacing.
- Avoid missing keyboard focus states; provide visible focus styles for every
  interactive element.
- Avoid fonts outside Hack, Lato, and system fallbacks; use the approved type
  stack unless explicitly approved otherwise.

## Reference Files

For detailed token tables that would be too large for this file:

- `references/color-system.md` — Full gray scale, accent pairs, semantic
  mappings, translucent variants, and the complete CSS variable inventory
  from the freeCodeCamp platform.
- `references/syntax-theme.md` — Syntax highlighting palette used across
  the VS Code theme, CodeSandbox/Sandpack theme, and platform code blocks.
  Maps language tokens (keywords, strings, functions, etc.) to specific hex
  colors.
