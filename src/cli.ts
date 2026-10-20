import { Command } from "commander";
import { create } from "./commands/create/index.js";
import { list } from "./commands/list.js";
import { outputError } from "./output/format.js";
import { EXIT_USAGE, exitWithCode } from "./output/exit-codes.js";

import pkg from "../package.json" with { type: "json" };

const version = pkg.version;

function handleActionError(command: string, json: boolean, err: unknown): void {
  exitWithCode(outputError({ json, command }, err));
}

function firstPositional(args: readonly string[]): string {
  for (const a of args) {
    if (typeof a === "string" && !a.startsWith("-")) return a;
  }
  return "cli";
}

export async function run(argv = process.argv): Promise<void> {
  const args = argv.slice(2);

  const cli = new Command("agent-scaffold");
  cli.exitOverride();
  cli.configureHelp({ showGlobalOptions: true });
  cli.version(version, "-v, --version", "Show version number");
  cli.option("--json", "Output as JSON");

  cli
    .command("create")
    .description("Scaffold a new project locally")
    .option("--yes", "Skip prompts; use flag values (required for non-TTY/CI)")
    .option("--name <name>", "Project name (required in non-interactive mode)")
    .option("--runtime <runtime>", "Runtime: e.g. node | static_web")
    .option("--framework <framework>", "Framework (must be valid for chosen runtime)")
    .option("--pkg-manager <pm>", "Package manager: e.g pnpm | bun")
    .action(async (_opts, cmd: Command) => {
      const opts = cmd.optsWithGlobals<{
        json?: boolean;
        yes?: boolean;
        name?: string;
        runtime?: string;
        framework?: string;
        pkgManager?: string;
      }>();
      try {
        await create({
          json: opts.json ?? false,
          yes: opts.yes ?? false,
          name: opts.name,
          runtime: opts.runtime,
          framework: opts.framework,
          packageManager: opts.pkgManager,
        });
      } catch (err: unknown) {
        handleActionError("create", opts.json ?? false, err);
      }
    });

  cli
    .command("list")
    .alias("ls")
    .description("List the runtimes, frameworks and package managers that create accepts")
    .action(async (_opts, cmd: Command) => {
      const opts = cmd.optsWithGlobals<{ json?: boolean }>();
      try {
        await list({ json: opts.json ?? false });
      } catch (err: unknown) {
        handleActionError("list", opts.json ?? false, err);
      }
    });

  if (args.length === 0) {
    cli.outputHelp();
    return;
  }

  try {
    cli.parse(argv);
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: unknown }).code
        : undefined;
    const handledByCommander =
      code === "commander.help" ||
      code === "commander.helpDisplayed" ||
      code === "commander.version";
    if (!handledByCommander) {
      const json = args.includes("--json");
      const command = firstPositional(args);
      const message = err instanceof Error ? err.message : "unknown error";
      outputError({ json, command }, EXIT_USAGE, message);
      exitWithCode(EXIT_USAGE);
    }
  }
}
