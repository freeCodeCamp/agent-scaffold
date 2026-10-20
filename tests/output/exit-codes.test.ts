import { describe, it, expect, vi, afterEach } from "vitest";
import {
  EXIT_SUCCESS,
  EXIT_USAGE,
  EXIT_CONFIG,
  EXIT_GIT,
  exitWithCode,
} from "../../src/output/exit-codes.js";

describe("exit code constants", () => {
  it("EXIT_SUCCESS is 0", () => {
    expect(EXIT_SUCCESS).toBe(0);
  });

  it("EXIT_USAGE is 10", () => {
    expect(EXIT_USAGE).toBe(10);
  });

  it("EXIT_CONFIG is 11", () => {
    expect(EXIT_CONFIG).toBe(11);
  });

  it("EXIT_GIT is 15", () => {
    expect(EXIT_GIT).toBe(15);
  });

  // Round-trip contract. Locks the FULL set so future renumbering
  // breaks tests, not consumers.
  it("exposes the full numeric contract without duplicates", () => {
    const codes = {
      EXIT_SUCCESS,
      EXIT_USAGE,
      EXIT_CONFIG,
      EXIT_GIT,
    };
    expect(codes).toEqual({
      EXIT_SUCCESS: 0,
      EXIT_USAGE: 10,
      EXIT_CONFIG: 11,
      EXIT_GIT: 15,
    });
    const values = Object.values(codes);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("exitWithCode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls process.exit with the given code", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    exitWithCode(11);
    expect(exitSpy).toHaveBeenCalledWith(11);
  });

  // Regression: exitWithCode used to accept a `message` arg and write it
  // to stderr, which double-printed every error path (pretty render +
  // raw dump). Callers now own user-facing output exclusively. See
  // src/output/exit-codes.ts docstring.
  it("never writes to stderr", () => {
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    exitWithCode(15);
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
