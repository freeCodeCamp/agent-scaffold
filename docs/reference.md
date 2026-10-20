# Command reference

`agent-scaffold` has two commands: `create` and `list`.

## Commands

| Command                 | Flags                                                                  | Purpose                           |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| `agent-scaffold create` | `--yes`, `--name <name>`, `--runtime <runtime>`, `--framework <framework>`, `--pkg-manager <pm>` | Scaffold a new project locally. |
| `agent-scaffold list`   | None                                                                   | List the values that `create` accepts. Alias: `ls`. |

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

## Output of `list`

`list` reads the same templates as `create`. Run `agent-scaffold list --json` before `create` to find the valid values. Without `--json`, it prints a text list and marks the defaults.

```json
{
  "schemaVersion": "1",
  "command": "list",
  "success": true,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "runtimes": [
    {
      "id": "static_web",
      "label": "Static (HTML/CSS/JS)",
      "recommended": true,
      "frameworks": [{ "id": "astro-lite", "label": "Minimal Astro template", "recommended": true }],
      "packageManagers": [{ "id": "pnpm", "label": "pnpm", "recommended": true }]
    }
  ],
  "defaults": {
    "runtime": "static_web",
    "framework": "astro-lite",
    "packageManager": "pnpm"
  }
}
```

- The arrays keep the order of the templates.
- `recommended` is `false` only when the template sets it to `false`.
- `defaults` is the choice that `create --yes` makes when you omit the flags.
- A `defaults` value is `null` when no recommended value exists.

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
  "packageManager": "pnpm",
  "committed": true
}
```

- `packageManager` is `null` when the project has no package manager.
- `committed` is `false` when git has no author identity. The files are staged, but the project has no first commit.

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
| `11` | `EXIT_CONFIG`  | The templates are missing or not valid. |
| `15` | `EXIT_GIT`     | The CLI cannot initialise the git repository. |

## Environment variables

| Variable                       | Effect                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `AGENT_SCAFFOLD_TEMPLATES_DIR` | Path to a templates directory. The CLI uses it instead of the bundled templates. |
