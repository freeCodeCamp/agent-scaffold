import { EXIT_USAGE } from "../output/exit-codes.js";
import { redact } from "../output/redact.js";

export function formatFatal(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `agent-scaffold: ${redact(message)}`;
}

function defaultOnFatal(err: unknown): never {
  process.stderr.write(formatFatal(err) + "\n");
  process.exit(EXIT_USAGE);
}

export function installFatalHandlers(onFatal: (err: unknown) => void = defaultOnFatal): void {
  process.on("unhandledRejection", onFatal);
  process.on("uncaughtException", onFatal);
}
