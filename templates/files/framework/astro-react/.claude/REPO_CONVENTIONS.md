# Repository Conventions

## Architecture

- Reusable UI goes in `src/components/`.
- Task components go in `src/components/tasks/`.
- Framework-agnostic logic goes in `src/lib/`.
- Shared client-side reactive logic used by multiple components goes in `src/hooks/` as real React hooks, not plain utilities wrapped by each component.
  Single-use logic stays with the consuming component.

## UI

- CSS classes use kebab-case.

## TypeScript

- Use `type` for object shapes, not `interface`.
- Zod schemas use a `Schema` suffix.
- Exported functions require explicit return types.

## Existing Patterns

Before creating new functionality:

1. Search for existing implementations.
2. Find the closest pattern.
3. Extend it rather than creating a parallel system.

If introducing a genuinely new pattern, document it here.

## Code Discovery

When investigating existing behavior, start here:

- Curriculum/task schemas: `src/lib/curriculum-tasks.ts`
- Task UI: `src/components/tasks/`
- Pages: `src/pages`
- Shared UI: `src/components/`

## Naming

- Filenames should follow kebab-case.

## Maintenance

- Keep this file accurate: update or remove stale rules when code moves.
- Remove unused code after changes.
