# freeCodeCamp Scaffold Tool

Make coding agents less dumb. Save time, money, sanity.

Create a new project that is ready for you and your coding agent.

## Requirements

Node.js 26 or later, and git. Docker is recommended. Without Docker, you cannot use bun.

## Use

```sh
npx @freecodecamp/agent-scaffold create
```

Answer the prompts: project name, runtime, framework. Then start the project:

```sh
cd <name>
docker compose up --watch
```

### From an agent or a script

```sh
npx @freecodecamp/agent-scaffold list --json
npx @freecodecamp/agent-scaffold create --yes --json --name my-app
```

- `list --json` shows the values that `create` accepts.
- Add `--runtime`, `--framework`, or `--pkg-manager` to change the defaults.

## Options

| Runtime                | Frameworks                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `static_web` (default) | `astro-lite` (default), `html-css-js`, `react-vite`, `tanstack-shadcn`, `astro-react` |
| `node`                 | `express` (default), `typescript`                                                     |

Package managers: `pnpm` (default) and `bun`. The prompts do not offer bun. Use `--pkg-manager bun`.

## What you get

- `AGENTS.md`, with `CLAUDE.md` as a symlink to it.
- Agent skills in `.agents/skills/`, linked from `.claude/skills/`.
- `Dockerfile`, `compose.yaml`, and `.devcontainer/`.
- Pinned dependencies and a first git commit.

The CLI does not deploy. See the [command reference](docs/reference.md) for all flags, JSON output, and exit codes.

## License

Copyright © 2014 freeCodeCamp.org

The content of this repository is bound by the following license:

- The computer software is licensed under the [BSD-3-Clause](LICENSE) license.
