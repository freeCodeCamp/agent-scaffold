---
name: astro
description: Guidelines for working on Astro projects. Use whenever you detect an Astro project e.g. the project contains one or more .astro files or has astro as a dependency.
---

# Astro Guidelines

## Minimal props

Components should specify a minimal `Props` interface that contains just the data a component needs. Do not anticipate future needs, if the component does not currently use a property it should not be in the `Props`.

Any data passed into the component should not include properties that are not specified in the `Props`. Extra fields should be stripped out, otherwise they will end up in the production html.

### Example

If a `Button` component has

```ts
interface Props {
  user: { name: string };
}
```

and the parent has the following data

```ts
const aUser = {
  name: "Any Thing",
  id: "123abc",
};
```

strip the 'id' in the component script first, so you have

```ts
const propUser = {
  name: "Any Thing",
};
```

and only use `propUser` in the template

```astro
---
import Button from './Button.astro';
const propUser = {
  name: 'Any Thing',
}
---
<Button user={propUser} />
```

## Avoid null returns

If using both @astro/react and @astro/mdx, components rendered with client:\* directive should not return `null`. If they do, they will trigger a spurious "Invalid hook call." warning.
To avoid this, return `<></>` (i.e. an empty fragment) instead of `null`.

## Fonts

Do not use `@import url(...)` or `@font-face{}` to add fonts to style sheets. Instead use Astro's `fontProviders` which will optimize font loading. [Guide](https://docs.astro.build/en/guides/fonts/#applying-custom-fonts).

## Prefer .astro components

Even if the application supports other UI frameworks (React, Vue etc.), use them sparingly. If a component does not need interactivity, use a .astro component instead.
This makes it clear that hydration is not possible and gives access to powerful .astro specific features like script directives and build time javascript execution.

When creating new components, only use a UI framework component if either of the following is true. The component is inherently interactive or it needs to be imported by a
UI framework component. If the static component can be passed into the UI component via a `<slot>`, then the static component should come from a .astro file.
