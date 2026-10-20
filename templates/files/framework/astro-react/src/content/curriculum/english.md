---
title: Sample Curriculum
description: Optional Description. A sample curriculum used to test and demo this boilerplate's task types and layout.
---

# Section 1

## Module 1.1

### Lesson 1: Markdown

Here's the text for the first lesson. No task to complete here.

You can put markdown here and it will render HTML. Like **bold**, _italic_, and ~~strikethrough~~ text.

| Also tables | Column 2 |
| ----------- | -------- |
| data        | data     |
| data        | data     |

> Blockquotes

`inline "code"`

- Unordered lists
- Item 2

1. Ordered lists
2. Item 2

Images:

![A cute cat](/images/cat.png)

You can use markdown in the text areas of any lesson. It is not allowed in some parts the tasks.

The content for this entire curriculum lives in `content/curriculum/english.md`.

## Module 1.2: Learn The Task Types

### Lesson 1: Multiple Choice

This lesson has a multiple choice question. The syntax for the task below looks like this:

```
--multiple-choice--

Is this a mulitple choice _question?_

- [ ] Maybe.
- [x] Yes.
- [ ] No.
- [ ] I don't think _so._

--end-multiple-choice--
```

The correct answer has an `x` by it. The underscores in the task is to see if markdown works in the different areas. They will be used in the rest of the tasks for the same purpose.

--multiple-choice--

Is this a mulitple choice _question?_

- [ ] Maybe.
- [x] Yes.
- [ ] No.
- [ ] I don't think _so._

--end-multiple-choice--

### Lesson 2: Select All That Apply

This lesson has a select all that apply task. The task sytax looks like this:

```
--select-all-that-apply--

Select the valid _options:_

- [ ] No
- [ ] No
- [x] Yes
- [x] _Yes_

--end-select-all-that-apply--
```

--select-all-that-apply--

Select the valid _options:_

- [ ] No
- [ ] No
- [x] Yes
- [x] _Yes_

--end-select-all-that-apply--

### Lesson 3: Fill In The Blank

This lesson has a fill in the blank. The task syntax looks like this:

```
--fill-in-the-blank--

This sentence has a {{blank}}. Case is ignored when filling in {{a|the}} _blank(s)_.

--end-fill-in-the-blank--
```

Allow multiple answers for a single blank by separating them with a pipe.

--fill-in-the-blank--

This sentence has a {{blank}}. Case is ignored when filling in {{a|the}} _blank(s)_.

--end-fill-in-the-blank--

### Lesson 4: Categorize

This lesson has a categorize task. Its syntax looks like this:

```
--categorize--

Put the items into their correct _categories._

- Letters
  - A
  - B
- Numbers
  - 1
  - 2
- Special _Characters_
  - !
  - _@_

--end-categorize--
```

The categories are on the top level of the list, and the correct items for those categories are on the second level. The items will be shuffled on load.

--categorize--

Put the items into their correct _categories._

- Letters
  - A
  - B
- Numbers
  - 1
  - 2
- Special _Characters_
  - !
  - _@_

--end-categorize--

### Lesson 5: Order

This lesson has an order task. Its syntax looks like this:

```
--order--

Put these steps in the correct _order._

1. Step 1
2. Step 2
3. Step 3
4. _Step 4_

--end-order--
```

Put the items in the correct order in the markdown, they will be shuffled on load.

--order--

Put these steps in the correct _order._

1. Step 1
2. Step 2
3. Step 3
4. _Step 4_

--end-order--

### Lesson 6: Crossword

This lesson has a crossword task. Its syntax looks like this:

````
--crossword--

Fill in the crossword using the clues _below._

```
...D..
ACROSS
...W..
...N..
```

Across:
- This word is accross.

Down:
- This word is _down._

--end-crossword--
````

ToDo: Explain the order of the clues and how they work.

--crossword--

Fill in the crossword using the clues _below._

```
...D..
ACROSS
...W..
...N..
```

Across:
- This word is accross.

Down:
- This word is _down._

--end-crossword--

### Lesson 7: Flash Card

This lesson has a flash card task. Its syntax looks like this:

```
--flash-card--

There's a mistake in the sentence below, can you find _it?_

Front: I goed to the store yesterday.

Back: I went to the store _yesterday._

--end-flash-card--
```

--flash-card--

There's a mistake in the sentence below, can you find _it?_

Front: I goed to the store yesterday.

Back: I went to the store _yesterday._

--end-flash-card--

### Lesson 8: Text Select

This lesson has a text select task. Its syntax looks like this:

```
--text-select--

Select the number(s) in the sentence _below._

I have {{two}} or {{three}} _things._

--end-text-select--
```

--text-select--

Select the number(s) in the sentence _below._

I have {{two}} or {{three}} _things._

--end-text-select--

### Lesson 9: Image Select 1

This lesson has an image select task. Its syntax looks like this:

```
--image-select--

Click the components that store _energy._

![A simple circuit diagram](/images/circuit-diagram.svg)

Correct: battery, capacitor

--end-image-select--
```

The image is an SVG in the `public/images/` folder. The `id` attribute of elements in within the SVG match correct answers here. All clickable elements in the SVG need a `data-region="true"` attribute. And optionally, a `data-label="..."` attribute will be read by screen readers - It falls back to the `id` if it's not there.

--image-select--

Click the components that store _energy._

![A simple circuit diagram](/images/circuit-diagram.svg)

Correct: battery, capacitor

--end-image-select--

The correct answers are the items on the left and right.

### Lesson 10: Image Select 2

This is an image select task with a real image used as the backdrop. Its syntax looks like this:

```
--image-select--

Select the speakers.

![A workstation image](/images/workstation.svg)

Correct: left-speaker, right-speaker

--end-image-select--
```

ToDo: Add instructions on how to create an image.

--image-select--

Select the speakers.

![A workstation image](/images/workstation.svg)

Correct: left-speaker, right-speaker

--end-image-select--

## Module 2.1

### Lesson 1

This is placeholder lesson text for section 2, module 2.1, lesson 1.

### Lesson 2

This is placeholder lesson text for section 2, module 2.1, lesson 2.

# Section 2

## Module 1.1

### Lesson 1

A section 2 lesson.
