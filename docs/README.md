# agent-scaffold

`agent-scaffold` is the freeCodeCamp Scaffold Tool. It has two commands: `create` scaffolds a new project, and `list` shows the values that `create` accepts. See [reference.md](reference.md) for flags, JSON output, and exit codes.

## The create pipeline

`src/commands/create/index.ts` runs these steps in order:

1. Prompt. In interactive mode, ask for the project inputs. In non-interactive mode, read the flags.
1. Validate. Check the inputs against the template registry.
1. Compose layers. Merge the template layers that match the inputs.
1. Write files. Write the project files and the symlinks to a new directory. The agent skills ship inside the templates in `.agents/skills/`. The symlinks in `.claude/skills/` link to them.
1. Pin dependencies. Run the package manager to pin the dependency versions.
1. Initialise git. Run `git init` in the new directory.

## Repo layout

```
src/
  cli.ts          # commander entry and command wiring
  errors.ts       # typed errors with exit codes
  index.ts        # bin entry
  commands/       # command handlers (create)
  lib/            # shared helpers
  output/         # exit codes, JSON envelopes, terminal output
templates/        # vendored template layers
tests/            # unit tests that mirror src/
dist/             # build output (index.cjs, templates.tgz)
```

## Develop

Node.js 26 or later is required.

| Command          | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `pnpm install`   | Install dependencies.                        |
| `pnpm dev`       | Run the CLI from source with `tsx`.          |
| `pnpm build`     | Build `dist/` with tsdown. Pack the templates into `dist/templates.tgz`.                 |
| `pnpm test`      | Run the tests with vitest.                   |
| `pnpm lint`      | Run oxlint.                                  |
| `pnpm typecheck` | Type-check `src` and `tests`.                |
| `pnpm fmt`       | Format the code with oxfmt.                  |
| `pnpm fmt:check` | Check the formatting.                        |

A husky pre-commit hook runs when you commit.

## Conventions

- Put tests under `tests/`. Mirror the `src/` layout.
- Import the exit code constants from `src/output/exit-codes.ts`. Do not use integers.
- Update [reference.md](reference.md) when you change a flag. `tests/cli.flags-docs.test.ts` checks this.
- Report bugs and request features in [GitHub issues](https://github.com/freeCodeCamp/agent-scaffold/issues).
