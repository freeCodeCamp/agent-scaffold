import { EXIT_CONFIG, EXIT_GIT, EXIT_USAGE } from "./output/exit-codes.js";

/**
 * Domain error hierarchy. Each subclass binds to a stable EXIT_* code from
 * `output/exit-codes`.
 */

export abstract class CliError extends Error {
  abstract readonly exitCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConfigError extends CliError {
  readonly exitCode = EXIT_CONFIG;
}

export class GitError extends CliError {
  readonly exitCode = EXIT_GIT;
}

export class UsageError extends CliError {
  readonly exitCode = EXIT_USAGE;
}
