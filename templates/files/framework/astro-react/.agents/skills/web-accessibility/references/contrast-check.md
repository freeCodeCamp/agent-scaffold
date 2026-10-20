# Contrast Checking

Use a contrast checker that reports the unrounded WCAG ratio. A computed ratio
of `4.4999` fails the `4.5:1` threshold.

## WCAG 2.2 AA thresholds

| Content                                           | Minimum ratio |
| ------------------------------------------------- | ------------: |
| Normal text                                       |         4.5:1 |
| Large text (at least 18pt, or 14pt bold)          |           3:1 |
| Non-text UI elements, icons, and focus indicators |           3:1 |

## Relative luminance

Convert each sRGB channel from `0` to `255` to a value from `0` to `1`:

```text
s = channel / 255
linear = s / 12.92                         if s <= 0.04045
         ((s + 0.055) / 1.055) ^ 2.4       otherwise
```

For an RGB color:

```text
luminance = 0.2126R + 0.7152G + 0.0722B
```

For two colors, `L1` is the lighter luminance and `L2` is the darker:

```text
contrast ratio = (L1 + 0.05) / (L2 + 0.05)
```

Use the raw result for pass/fail decisions. Do not round before comparing it
with the applicable threshold.

## Practical checks

Check text against its actual background, including inherited backgrounds and
gradient regions. Check borders, icons, form field boundaries, and focus rings
against adjacent colors at `3:1`. Check every state separately, including
hover, focus, active, visited, disabled-looking, and error states.
