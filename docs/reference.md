# Command reference

`agent-scaffold` has one command: `create`.

## Commands

| Command                 | Flags                                                                  | Purpose                           |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| `agent-scaffold create` | `--yes`, `--name <name>`, `--runtime <runtime>`, `--framework <framework>`, `--pkg-manager <pm>` | Scaffold a new project locally. |

## Flags for `create`

| Flag                       | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| `--yes`                    | Skip the prompts. Use the flag values. Required for non-TTY and CI.  |
| `--name <name>`            | Project name. Required in non-interactive mode.                      |
| `--runtime <runtime>`      | Runtime, for example `node` or `static_web`.                         |
| `--framework <framework>`  | Framework. It must be valid for the runtime.                         |
| `--pkg-manager <pm>`       | Package manager, for example `pnpm` or `bun`.                        |

The CLI runs in interactive mode when stdin is a TTY and neither `--yes` nor `--json` is set. Otherwise it runs in non-interactive mode.

In non-interactive mode, the CLI uses the recommended runtime, framework, and package manager for each omitted flag.

## Global flags

| Flag              | Description         |
| ----------------- | ------------------- |
| `--json`          | Output as JSON.     |
| `-v`, `--version` | Show version number. |

## JSON output

With `--json`, the CLI writes one JSON object to stdout. Log messages go to stderr.

Success:

```json
{
  "schemaVersion": "1",
  "command": "create",
  "success": true,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/work/my-app",
  "name": "my-app",
  "runtime": "node",
  "framework": "express",
  "packageManager": "pnpm"
}
```

`packageManager` is `null` when the project has no package manager.

Error:

```json
{
  "schemaVersion": "1",
  "command": "create",
  "success": false,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "error": {
    "code": 10,
    "message": "--name is required in non-interactive mode"
  }
}
```

`error.code` is the exit code. `error.issues` and `error.kind` appear only for some errors.

## Exit codes

| Code | Name           | Meaning                                       |
| ---- | -------------- | --------------------------------------------- |
| `0`  | `EXIT_SUCCESS` | The command succeeded.                        |
| `10` | `EXIT_USAGE`   | A flag or an input is not valid.              |
| `11` | `EXIT_CONFIG`  | The CLI cannot get the templates.             |
| `15` | `EXIT_GIT`     | The CLI cannot initialise the git repository. |

## Environment variables

| Variable                       | Effect                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `AGENT_SCAFFOLD_TEMPLATES_DIR` | Path to a templates directory. The CLI uses it instead of the bundled templates. |
