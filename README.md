# freeCodeCamp Scaffold Tool

Make coding agents less dumb. Save time, money, sanity.

`agent-scaffold` creates a new project for you and your coding agent. Each project has agent instructions, agent skills, Docker files, and a first git commit.

## Requirements

- Node.js 26 or later.
- git.
- Docker is recommended. Without Docker, pnpm projects work through `npx`, and bun projects are not available.

## Quick start

```sh
npx @freecodecamp/agent-scaffold create
```

To install the command globally:

```sh
npm i -g @freecodecamp/agent-scaffold
agent-scaffold create
```

## Create a project interactively

Run `agent-scaffold create` and answer the prompts:

1. **Enter project name.** Use lowercase letters and digits, with single hyphens between them. For example, `demo-site`.
1. **Select runtime.** Select `Static (HTML/CSS/JS)` or `Node.js`.
1. **Select framework.** Use the arrow keys, then press Enter.
1. **Select package manager.** The CLI asks only when more than one package manager is recommended. Otherwise it uses pnpm.

The CLI then creates the `demo-site` directory in the current directory and pins the dependencies. When it finishes, it prints the command that starts the project:

```sh
cd demo-site
docker compose up --watch
```

## Create a project from an agent or a script

Use `--yes` and `--name` to skip the prompts. Add `--json` to get one JSON object on stdout.

```sh
npx @freecodecamp/agent-scaffold list --json
npx @freecodecamp/agent-scaffold create --yes --json --name my-app --runtime node --framework express
```

- Run `list --json` first. It shows the values that `create` accepts and the defaults.
- Omit `--runtime`, `--framework`, or `--pkg-manager` to use the default.
- Use `--pkg-manager bun` to select bun. The prompts do not offer bun.

## Options

| Runtime      | Frameworks                                                                  | Default      |
| ------------ | --------------------------------------------------------------------------- | ------------ |
| `static_web` | `astro-lite`, `html-css-js`, `react-vite`, `tanstack-shadcn`, `astro-react` | `astro-lite` |
| `node`       | `express`, `typescript`                                                     | `express`    |

The default runtime is `static_web`. The default package manager is `pnpm`. The other package manager is `bun`.

## What you get

- `AGENTS.md` with instructions for coding agents. `CLAUDE.md` is a symlink to it.
- Agent skills in `.agents/skills/`, linked from `.claude/skills/`. The `static_web` frameworks add an accessibility skill, and the Astro frameworks add an Astro skill.
- `Dockerfile`, `compose.yaml`, and a `.devcontainer/` directory.
- A lockfile with pinned dependencies.
- A git repository with the first commit `chore: initial commit`. If git has no author identity, the files are staged but not committed.

The CLI does not deploy the project. Deployment is your choice.

## Docs

See the [command reference](docs/reference.md) for all flags, the JSON output, and the exit codes.

## License

Copyright © 2014 freeCodeCamp.org

The content of this repository is bound by the following license:

- The computer software is licensed under the [BSD-3-Clause](LICENSE) license.
