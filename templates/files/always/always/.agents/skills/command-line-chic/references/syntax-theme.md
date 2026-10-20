# Syntax Highlighting Theme Reference

Code syntax highlighting palette used across all freeCodeCamp editor
environments: the VS Code dark theme, the Sandpack/CodeSandbox theme, and
the platform's embedded code blocks.

These colors are designed to work on the editor surface background
(`#2a2a40` in dark mode). They use the same five accent hues from the
main design system, plus a few additional tones for specific syntax roles.

## Table of Contents

1. [Core Syntax Palette](#core-syntax-palette)
2. [Token-to-Color Mapping](#token-to-color-mapping)
3. [Markdown-Specific Tokens](#markdown-specific-tokens)
4. [JSON Nesting Hierarchy](#json-nesting-hierarchy)
5. [Diff Colors](#diff-colors)
6. [Sandpack Syntax Mapping](#sandpack-syntax-mapping)

---

## Core Syntax Palette

9 colors used across all syntax highlighting:

| Color          | Hex       | Primary Role                          |
| -------------- | --------- | ------------------------------------- |
| Purple (light) | `#dbb8ff` | Keywords, storage types, attributes   |
| Blue (light)   | `#99c9ff` | Functions, properties, CSS values     |
| Green (light)  | `#acd157` | Strings, symbols, inserted content    |
| Yellow         | `#f1be32` | Classes, HTML attributes, CSS classes |
| Orange         | `#F78C6C` | Numbers, constants, parameters        |
| Red/Coral      | `#f07178` | Tags, block variables, bold/italic    |
| Cyan           | `#89DDFF` | Operators, regex, escape characters   |
| Error Red      | `#FF5370` | Invalid tokens, deleted, sub-methods  |
| Gray (mid)     | `#858591` | Comments (always italic)              |
| White/Bright   | `#EEFFFF` | Plain variables, default text         |

---

## Token-to-Color Mapping

### Keywords and Storage — `#dbb8ff` (Purple)

| Scope                         | Style  |
| ----------------------------- | ------ |
| `keyword`                     | normal |
| `storage.type`                | normal |
| `storage.modifier`            | normal |
| `entity.other.attribute-name` | normal |

Keywords, type declarations, and generic attributes all share purple. This
creates a consistent visual signal for "structural" tokens — the parts of
code that define shape rather than content.

### Functions and Properties — `#99c9ff` (Blue)

| Scope                                       | Style  |
| ------------------------------------------- | ------ |
| `entity.name.function`                      | normal |
| `variable.function`                         | normal |
| `support.function`                          | normal |
| `support.type` (entity types)               | normal |
| `source.css support.type.property-name`     | normal |
| `source.sass support.type.property-name`    | normal |
| `source.scss support.type.property-name`    | normal |
| `source.less support.type.property-name`    | normal |
| `source.stylus support.type.property-name`  | normal |
| `source.postcss support.type.property-name` | normal |

Functions and CSS properties share blue because they represent "callable"
or "configurable" units — things you invoke or set.

### Strings and Symbols — `#acd157` (Green)

| Scope                   | Style  |
| ----------------------- | ------ |
| `string`                | normal |
| `constant.other.symbol` | normal |
| `markup.heading`        | normal |
| `markup.inserted`       | normal |

Green signals literal values — data, not structure. Strings, symbols,
and headings are all "content" rather than "code."

### Classes and HTML Attributes — `#f1be32` (Yellow)

| Scope                                         | Style  |
| --------------------------------------------- | ------ |
| `entity.name` (classes, types)                | normal |
| `support.type`                                | normal |
| `support.class`                               | normal |
| `entity.other.attribute-name.class` (CSS)     | normal |
| `text.html.basic entity.other.attribute-name` | italic |
| `constant.other.reference.link.markdown`      | normal |

Yellow marks named abstractions — classes, types, and HTML attributes.
The italic variant for HTML attributes adds visual distinction within
markup-heavy files.

### Numbers and Constants — `#F78C6C` (Orange)

| Scope                | Style  |
| -------------------- | ------ |
| `constant.numeric`   | normal |
| `constant.language`  | normal |
| `variable.parameter` | normal |

Orange is for numeric and constant values — things that evaluate to fixed
values at runtime.

### Tags and Block Variables — `#f07178` (Red/Coral)

| Scope                       | Style  |
| --------------------------- | ------ |
| `entity.name.tag`           | normal |
| `meta.tag.sgml`             | normal |
| `meta.block variable.other` | normal |
| `markup.italic`             | normal |
| `markup.bold`               | normal |

Red/coral marks structural delimiters (tags) and emphasized text. In markup
contexts, it distinguishes formatting from content (green).

### Operators and Regex — `#89DDFF` (Cyan)

| Scope                       | Style  |
| --------------------------- | ------ |
| `keyword.control`           | normal |
| `punctuation`               | normal |
| `meta.tag`                  | normal |
| `string.regexp`             | normal |
| `constant.character.escape` | normal |

Cyan handles the "connective tissue" of code — operators, punctuation, and
pattern-matching constructs.

### Invalid and Deleted — `#FF5370` (Error Red)

| Scope                          | Style  |
| ------------------------------ | ------ |
| `invalid`                      | normal |
| `invalid.illegal`              | normal |
| `markup.deleted`               | normal |
| `entity.name.module.js`        | normal |
| `variable.import.parameter.js` | normal |

Bright red flags problems — invalid tokens and deleted content. Also used
for JS module names and imports where visual distinctness aids navigation.

### Comments — `#858591` (Gray, italic)

| Scope                            | Style  |
| -------------------------------- | ------ |
| `comment`                        | italic |
| `punctuation.definition.comment` | italic |

Comments are always italic and always gray-45. This deliberately
de-emphasizes them relative to active code while keeping them legible.

### Variables and Plain Text — `#EEFFFF`

| Scope                               | Style  |
| ----------------------------------- | ------ |
| `variable`                          | normal |
| `string constant.other.placeholder` | normal |

A slightly warm white for default/variable text. Brighter than the editor
foreground (`#dfdfe2`) to give variables subtle prominence.

### Language Methods — `#FF5370` (italic)

| Scope               | Style  |
| ------------------- | ------ |
| `variable.language` | italic |

Special language keywords like `this`, `self`, `super` get error-red in
italic — visually distinct from both regular variables and keywords.

### Inherited Classes — `#E5C07B`

| Scope                          | Style  |
| ------------------------------ | ------ |
| `entity.other.inherited-class` | normal |

A warm gold for inheritance markers, distinct from yellow classes.

---

## Markdown-Specific Tokens

| Element                  | Color       | Style  |
| ------------------------ | ----------- | ------ |
| Plain text               | `#EEFFFF`   | normal |
| Inline raw (backticks)   | `#dbb8ff`   | normal |
| Headings                 | `#acd157`   | normal |
| Bold                     | `#f07178`   | normal |
| Italic                   | `#f07178`   | normal |
| Underline                | `#F78C6C`   | normal |
| Links                    | `#99c9ff`   | normal |
| Link descriptions        | `#dbb8ff`   | normal |
| Link anchors             | `#f1be32`   | normal |
| Inline code strings      | `#89CA78`   | normal |
| Block quotes / separator | `#65737E`   | normal |
| Fenced code language     | `#65737E`   | normal |
| Raw block / fenced block | `#00000050` | normal |

---

## JSON Nesting Hierarchy

JSON keys cycle through colors by nesting depth, making it easy to visually
track structure in deeply nested objects:

| Depth   | Color                               |
| ------- | ----------------------------------- |
| Level 0 | `#dbb8ff` (Purple)                  |
| Level 1 | `#f1be32` (Yellow)                  |
| Level 2 | `#F78C6C` (Orange)                  |
| Level 3 | `#FF5370` (Error Red)               |
| Level 4 | `#C17E70` (Muted Rose)              |
| Level 5 | `#99c9ff` (Blue)                    |
| Level 6 | `#f07178` (Red/Coral)               |
| Level 7 | `#dbb8ff` (Purple — cycle restarts) |
| Level 8 | `#acd157` (Green)                   |

---

## Diff Colors

| Change Type | Color                 |
| ----------- | --------------------- |
| Inserted    | `#acd157` (Green)     |
| Deleted     | `#FF5370` (Error Red) |
| Changed     | `#dbb8ff` (Purple)    |

---

## Sandpack Syntax Mapping

The Sandpack/CodeSandbox theme uses a simplified token set that maps to the
same palette:

| Sandpack Token | Hex       | Equivalent Full Scope        |
| -------------- | --------- | ---------------------------- |
| `plain`        | `#ffffff` | Default text                 |
| `comment`      | `#858591` | Comments (italic style)      |
| `keyword`      | `#dbb8ff` | Keywords, storage            |
| `tag`          | `#f07178` | HTML/JSX tags                |
| `punctuation`  | `#99c9ff` | Operators, brackets          |
| `definition`   | `#ffffff` | Variable definitions         |
| `property`     | `#99c9ff` | Object properties, CSS props |
| `static`       | `#f78c6c` | Static values, numbers       |
| `string`       | `#acd157` | String literals              |
