# agent-scaffold

freeCodeCamp Scaffold Tool: a TypeScript CLI that scaffolds new projects for humans and coding agents. Commands: `create` and `list`.

- Read [`docs/README.md`](docs/README.md) before you change CLI code.
- Read [`docs/reference.md`](docs/reference.md) for flags, JSON output, and exit codes.
- Read [`docs/RELEASING.md`](docs/RELEASING.md) for the release flow.
- `src/cli.ts` defines the commands and flags. Update `docs/reference.md` when you change a flag.
- Tests live under `tests/` and mirror `src/`. Do not co-locate tests.
- Callers import the exit code constants from `src/output/exit-codes.ts`. Do not use integers.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before you commit.
