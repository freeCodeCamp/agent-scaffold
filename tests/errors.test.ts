import { describe, it, expect } from "vitest";
import { CliError, ConfigError, GitError, UsageError } from "../src/errors.js";
import { EXIT_CONFIG, EXIT_GIT, EXIT_USAGE } from "../src/output/exit-codes.js";

describe("CliError hierarchy", () => {
  it("ConfigError extends CliError with exitCode EXIT_CONFIG", () => {
    const err = new ConfigError("bad config");
    expect(err).toBeInstanceOf(CliError);
    expect(err).toBeInstanceOf(Error);
    expect(err.exitCode).toBe(EXIT_CONFIG);
    expect(err.message).toBe("bad config");
  });

  it("GitError carries EXIT_GIT", () => {
    expect(new GitError("x").exitCode).toBe(EXIT_GIT);
  });

  it("UsageError carries EXIT_USAGE", () => {
    expect(new UsageError("x").exitCode).toBe(EXIT_USAGE);
  });

  it("preserves the error name for instanceof-style checks", () => {
    expect(new ConfigError("x").name).toBe("ConfigError");
    expect(new GitError("x").name).toBe("GitError");
  });
});
