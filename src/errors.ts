import {
  EXIT_CONFIG,
  EXIT_CONFIRM,
  EXIT_CREDENTIALS,
  EXIT_GIT,
  EXIT_PARTIAL,
  EXIT_STORAGE,
  EXIT_USAGE,
} from "./output/exit-codes.js";

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

export class CredentialError extends CliError {
  readonly exitCode = EXIT_CREDENTIALS;
}

export class StorageError extends CliError {
  readonly exitCode = EXIT_STORAGE;
}

export class GitError extends CliError {
  readonly exitCode = EXIT_GIT;
}

export class ConfirmError extends CliError {
  readonly exitCode = EXIT_CONFIRM;
}

export class PartialUploadError extends CliError {
  readonly exitCode = EXIT_PARTIAL;
}

export class UsageError extends CliError {
  readonly exitCode = EXIT_USAGE;
}
