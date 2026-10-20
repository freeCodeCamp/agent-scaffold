# Forms

Read this reference when building forms, inputs, validation, or fieldsets.

## Labels (SC 1.3.1, 3.3.2)

Every `<input>`, `<select>`, and `<textarea>` has a programmatically associated
`<label>` (via `for`/`id`) or `aria-label`/`aria-labelledby`. Placeholder text
is not a substitute for a label.

## Grouping (SC 1.3.1)

Related controls (radio groups, checkbox sets) are wrapped in
`<fieldset>`/`<legend>`.

## Errors (SC 3.3.1, 3.3.3)

- Errors are identified in text, not just color or an icon.
- Error text is tied to its field via `aria-describedby`.
- The invalid field is marked `aria-invalid="true"` while invalid (attribute
  absent when valid — do not set `aria-invalid="false"`).
- Where a fix is knowable, suggest it in the error message.

## Required fields (SC 3.3.2)

Convey "required" in text or via `aria-required`, not solely by color or `*`.

## Autocomplete (SC 1.3.5)

Inputs collecting known personal data use the matching `autocomplete` token
(`name`, `email`, `tel`, `street-address`, etc.) per SC 1.3.5.

## Authentication (SC 3.3.8)

No authentication step requires a cognitive function test (CAPTCHA puzzle,
transcription, memory game) without an accessible alternative. Password fields
allow paste and password managers.

## Validation Feedback

- When a user edits a previously-validated field, immediately hide all feedback
  for that field (border color, feedback text, `aria-invalid`). Feedback must
  not reappear until the next submission.
- Post-submit feedback renders inside an `aria-live="polite"` container.
- If the region updates multiple pieces at once, add `aria-atomic="true"`.

## Code Inside Interactive Elements

Do not nest landmark roles (`role="region"`, `role="main"`, etc.) or
`aria-label` inside interactive elements such as `<label>` or `<button>`. If a
syntax highlighter injects these onto `<pre>` elements, disable that behavior
for any code rendered inside an interactive element.
