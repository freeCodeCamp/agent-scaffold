import { log } from "@clack/prompts";
import { CliError } from "../errors.js";
import { buildEnvelope, buildErrorEnvelope } from "./envelope.js";
import { EXIT_USAGE } from "./exit-codes.js";
import { redact, redactObject } from "./redact.js";

export type OutputContext = {
  json: boolean;
  command: string;
};

/**
 * Options passed as 4th positional to `outputError`. The 4th arg also
 * still accepts a bare `string[]` issues array for back-compat with the
 * pre-T28 signature.
 */
export interface OutputErrorOptions {
  /** Sub-errors / hints rendered into envelope.error.issues. */
  issues?: string[];
  /**
   * Extra top-level keys spliced into the JSON envelope. Used by
   * promote/rollback drift to carry `current` so scripted callers can
   * re-pin expectedCurrent on retry without re-querying the alias.
   */
  extras?: Record<string, unknown>;
  /**
   * Dep-injected logger for the non-JSON branch. Defaults to clack
   * `log.error`. Commands pass their dep's logError so unit tests can
   * spy without monkey-patching the clack module.
   */
  logError?: (msg: string) => void;
  kind?: string;
  requestId?: string;
}

export function emitJson(envelope: object): void {
  process.stdout.write(JSON.stringify(envelope) + "\n");
}

export function outputSuccess(
  ctx: OutputContext,
  humanMessage: string,
  data: Record<string, unknown>,
): void {
  if (ctx.json) {
    const envelope = buildEnvelope(ctx.command, true, data);
    process.stdout.write(JSON.stringify(envelope) + "\n");
  } else {
    log.success(humanMessage);
  }
}

export function outputError(
  ctx: OutputContext,
  exitCode: number,
  message: string,
  optsOrIssues?: OutputErrorOptions | string[],
): number;
export function outputError(ctx: OutputContext, err: unknown, opts?: OutputErrorOptions): number;
export function outputError(
  ctx: OutputContext,
  exitCodeOrErr: number | unknown,
  messageOrOpts?: string | OutputErrorOptions | string[],
  maybeOpts?: OutputErrorOptions | string[],
): number {
  // A raw number as `err` would match this branch — callers must pass Error objects.
  if (typeof exitCodeOrErr === "number") {
    return renderError(ctx, exitCodeOrErr, messageOrOpts as string, maybeOpts);
  }
  const { exitCode, message, kind, requestId } = parseError(ctx.command, exitCodeOrErr);
  const opts = (messageOrOpts ?? {}) as OutputErrorOptions;
  return renderError(ctx, exitCode, message, {
    ...opts,
    kind: opts.kind ?? kind,
    requestId: opts.requestId ?? requestId,
  });
}

function renderError(
  ctx: OutputContext,
  exitCode: number,
  message: string,
  optsOrIssues?: OutputErrorOptions | string[],
): number {
  const opts: OutputErrorOptions = Array.isArray(optsOrIssues)
    ? { issues: optsOrIssues }
    : (optsOrIssues ?? {});
  const redactedMessage = redact(message);
  const redactedIssues = opts.issues?.map(redact);

  if (ctx.json) {
    const envelope = buildErrorEnvelope(
      ctx.command,
      exitCode,
      redactedMessage,
      redactedIssues,
      opts.kind,
      opts.requestId,
    );
    // opts.extras passes through redactObject so a future caller who
    // stuffs a token / credential into the extras map doesn't leak it.
    // Today's only callers (promote / rollback drift) pass `{ current:
    // <deployId> }`; redact() is a no-op on a deploy id, so the
    // observable behaviour is unchanged.
    const payload = opts.extras ? { ...envelope, ...redactObject(opts.extras) } : envelope;
    process.stdout.write(JSON.stringify(payload) + "\n");
  } else {
    (opts.logError ?? ((m: string) => log.error(m, { output: process.stderr })))(redactedMessage);
  }
  return exitCode;
}

/**
 * Format an error into a normalized envelope.
 *
 *   CliError   → preserve message verbatim
 *   Error      → preserve message verbatim
 *   other      → String(err)
 */
export function parseError(
  _command: string,
  err: unknown,
): { exitCode: number; message: string; kind?: string; requestId?: string } {
  if (err instanceof CliError) {
    return { exitCode: err.exitCode, message: err.message };
  }
  if (err instanceof Error) {
    return { exitCode: EXIT_USAGE, message: err.message };
  }
  return { exitCode: EXIT_USAGE, message: String(err) };
}
