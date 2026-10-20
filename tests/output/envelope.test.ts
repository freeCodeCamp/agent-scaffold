import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildEnvelope, buildErrorEnvelope } from "../../src/output/envelope.js";

describe("buildEnvelope", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns envelope with schemaVersion, command, success, and timestamp", () => {
    const result = buildEnvelope("create", true);
    expect(result).toEqual({
      schemaVersion: "1",
      command: "create",
      success: true,
      timestamp: "2026-04-13T12:00:00.000Z",
    });
  });

  it("schemaVersion is the string '1', not a number", () => {
    const result = buildEnvelope("create", true);
    expect(typeof result.schemaVersion).toBe("string");
    expect(result.schemaVersion).toBe("1");
  });

  it("spreads additional data into envelope", () => {
    const result = buildEnvelope("create", true, {
      path: "/tmp/my-app",
      template: "node",
    });
    expect(result).toEqual({
      schemaVersion: "1",
      command: "create",
      success: true,
      timestamp: "2026-04-13T12:00:00.000Z",
      path: "/tmp/my-app",
      template: "node",
    });
  });

  it("works with success=false", () => {
    const result = buildEnvelope("create", false);
    expect(result.success).toBe(false);
    expect(result.command).toBe("create");
  });
});

describe("buildErrorEnvelope", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error envelope with code and message", () => {
    const result = buildErrorEnvelope("create", 11, "config not found");
    expect(result).toEqual({
      schemaVersion: "1",
      command: "create",
      success: false,
      timestamp: "2026-04-13T12:00:00.000Z",
      error: {
        code: 11,
        message: "config not found",
      },
    });
  });

  it("includes issues array when provided", () => {
    const result = buildErrorEnvelope("create", 11, "config not found", [
      "missing bucket",
      "missing region",
    ]);
    expect(result.error).toEqual({
      code: 11,
      message: "config not found",
      issues: ["missing bucket", "missing region"],
    });
  });

  it("omits issues when not provided", () => {
    const result = buildErrorEnvelope("create", 10, "bad flag");
    expect(result.error).not.toHaveProperty("issues");
  });

  it("always has success=false", () => {
    const result = buildErrorEnvelope("create", 15, "git failed");
    expect(result.success).toBe(false);
  });
});
