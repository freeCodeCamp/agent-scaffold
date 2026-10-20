import { afterEach, describe, expect, it, vi } from "vitest";
import { formatFatal, installFatalHandlers } from "../../src/lib/fatal.js";

describe("formatFatal", () => {
  it("prefixes and stringifies an Error message", () => {
    expect(formatFatal(new Error("boom"))).toBe("agent-scaffold: boom");
  });

  it("stringifies a non-Error value", () => {
    expect(formatFatal("nope")).toBe("agent-scaffold: nope");
  });

  it("redacts a bearer token in the message", () => {
    const secret = "abcdef1234567890abcdef1234567890";
    const out = formatFatal(new Error(`Bearer ${secret}`));
    expect(out).not.toContain(secret);
    expect(out).toContain("****");
  });
});

describe("installFatalHandlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers handlers for unhandledRejection and uncaughtException", () => {
    const onSpy = vi.spyOn(process, "on").mockReturnValue(process as unknown as NodeJS.Process);
    installFatalHandlers(vi.fn());
    const events = onSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain("unhandledRejection");
    expect(events).toContain("uncaughtException");
  });
});
