# freeCodeCamp Scaffold Tool

Make coding agents less dumb. Save time, money, sanity.

## Install

```sh
# Run directly
npx @freecodecamp/agent-scaffold create

# Or install globally
npm i -g @freecodecamp/agent-scaffold
agent-scaffold create
```

Node.js 26 or later is required. Docker is recommended. Without Docker, pnpm projects work through `npx`, and bun projects are not available.

## Use

Agents: run `npx @freecodecamp/agent-scaffold list --json` first. It lists the values that `create` accepts.

### Interactive

Run `agent-scaffold create`. Answer the prompts. The CLI creates a new directory in the current directory.

### Non-interactive

Use `--yes` and `--name` to skip the prompts. Add `--json` for output that a program can parse.

```sh
agent-scaffold create --yes --json --name my-app --runtime node --framework express --pkg-manager pnpm
```

Omit `--runtime`, `--framework`, or `--pkg-manager` to use the recommended value.

## Docs

See the [command reference](docs/reference.md) for flags, JSON output, and exit codes.

## License

Copyright © 2014 freeCodeCamp.org

The content of this repository is bound by the following license:

- The computer software is licensed under the [BSD-3-Clause](LICENSE) license.
