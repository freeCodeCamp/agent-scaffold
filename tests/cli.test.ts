import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run } from "../src/cli.js";

vi.mock("../src/output/format.js", async () => {
  const actual =
    await vi.importActual<typeof import("../src/output/format.js")>("../src/output/format.js");
  return {
    ...actual,
    outputError: vi.fn(actual.outputError),
  };
});
vi.mock("../src/output/exit-codes.js", async () => {
  const actual = await vi.importActual<typeof import("../src/output/exit-codes.js")>(
    "../src/output/exit-codes.js",
  );
  return {
    ...actual,
    exitWithCode: vi.fn(),
  };
});
vi.mock("../src/commands/create/index.js", () => ({
  create: vi.fn(),
}));

import { outputError } from "../src/output/format.js";
import { exitWithCode } from "../src/output/exit-codes.js";
import { create } from "../src/commands/create/index.js";

const mockOutputError = vi.mocked(outputError);
const mockExitWithCode = vi.mocked(exitWithCode);
const mockCreate = vi.mocked(create);

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 50));

describe("CLI module", () => {
  it("exports a run function", () => {
    expect(typeof run).toBe("function");
  });

  it("uses only static imports for command modules (SEA useCodeCache compat)", () => {
    const cliPath = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.ts");
    const source = readFileSync(cliPath, "utf8");
    expect(source).not.toMatch(/await\s+import\s*\(/);
  });
});

describe("top-level CLI", () => {
  let output: string;

  beforeEach(() => {
    vi.clearAllMocks();
    output = "";
    vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
      output += String(chunk);
      return true;
    }) as never);
    vi.spyOn(process.stderr, "write").mockImplementation((() => true) as never);
    vi.spyOn(console, "log").mockImplementation(((...args: unknown[]) => {
      output += args.map(String).join(" ") + "\n";
    }) as never);
    vi.spyOn(console, "info").mockImplementation(((...args: unknown[]) => {
      output += args.map(String).join(" ") + "\n";
    }) as never);
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('--help shows "create" as a command', () => {
    run(["node", "agent-scaffold", "--help"]);
    expect(output).toContain("agent-scaffold");
    expect(output).toContain("create");
  });

  it("--help shows the global --json and --version options", () => {
    run(["node", "agent-scaffold", "--help"]);
    expect(output).toContain("--json");
    expect(output).toContain("--version");
  });

  it("prints help when run with no arguments", async () => {
    await run(["node", "agent-scaffold"]);
    expect(output).toContain("create");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("create --help shows the create options", () => {
    run(["node", "agent-scaffold", "create", "--help"]);
    expect(output).toContain("--yes");
    expect(output).toContain("--name");
    expect(output).toContain("--runtime");
    expect(output).toContain("--framework");
    expect(output).toContain("--pkg-manager");
    expect(output).toContain("--json");
  });

  it.each(["--version", "-v"])("%s outputs package version", async (flag) => {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
    );
    await run(["node", "agent-scaffold", flag]);
    expect(output).toContain(pkg.version);
  });
});

describe("create command wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process.stdout, "write").mockImplementation((() => true) as never);
    vi.spyOn(process.stderr, "write").mockImplementation((() => true) as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults json and yes to false", async () => {
    mockCreate.mockResolvedValue(undefined);
    run(["node", "agent-scaffold", "create"]);
    await settle();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ json: false, yes: false }));
  });

  it("maps flags to create options (--pkg-manager becomes packageManager)", async () => {
    mockCreate.mockResolvedValue(undefined);
    run([
      "node",
      "agent-scaffold",
      "create",
      "--yes",
      "--name",
      "my-app",
      "--runtime",
      "node",
      "--framework",
      "express",
      "--pkg-manager",
      "pnpm",
    ]);
    await settle();
    expect(mockCreate).toHaveBeenCalledWith({
      json: false,
      yes: true,
      name: "my-app",
      runtime: "node",
      framework: "express",
      packageManager: "pnpm",
    });
  });

  it("global --json BEFORE 'create' is forwarded", async () => {
    mockCreate.mockResolvedValue(undefined);
    run(["node", "agent-scaffold", "--json", "create", "--yes", "--name", "my-app"]);
    await settle();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ json: true, yes: true }));
  });

  it("global --json AFTER 'create' is forwarded", async () => {
    mockCreate.mockResolvedValue(undefined);
    run(["node", "agent-scaffold", "create", "--json"]);
    await settle();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ json: true }));
  });
});

describe("top-level error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process.stdout, "write").mockImplementation((() => true) as never);
    vi.spyOn(process.stderr, "write").mockImplementation((() => true) as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("catches errors from the create action and routes through outputError", async () => {
    const err = new Error("config file not found");
    mockCreate.mockRejectedValue(err);

    run(["node", "agent-scaffold", "create"]);
    await settle();

    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "create", json: false }),
      err,
    );
    expect(mockExitWithCode).toHaveBeenCalled();
  });

  it("maps CliError subclasses to their declared exit code", async () => {
    const { ConfigError } = await import("../src/errors.js");
    const { EXIT_CONFIG, EXIT_USAGE } = await import("../src/output/exit-codes.js");
    const err = new ConfigError("bad config");
    mockCreate.mockRejectedValue(err);

    run(["node", "agent-scaffold", "create"]);
    await settle();

    expect(mockExitWithCode).toHaveBeenCalledWith(EXIT_CONFIG);
    expect(mockExitWithCode).not.toHaveBeenCalledWith(EXIT_USAGE);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "create" }),
      err,
    );
  });

  it("falls back to EXIT_USAGE for raw Error instances", async () => {
    const { EXIT_USAGE } = await import("../src/output/exit-codes.js");
    const err = new Error("mystery failure");
    mockCreate.mockRejectedValue(err);

    run(["node", "agent-scaffold", "create"]);
    await settle();

    expect(mockExitWithCode).toHaveBeenCalledWith(EXIT_USAGE);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "create" }),
      err,
    );
  });

  it("forwards --json to outputError when the create action fails", async () => {
    const err = new Error("boom");
    mockCreate.mockRejectedValue(err);

    run(["node", "agent-scaffold", "create", "--json"]);
    await settle();

    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "create", json: true }),
      err,
    );
  });

  it("unknown command routes through outputError with EXIT_USAGE, no uncaught throw", async () => {
    const { EXIT_USAGE } = await import("../src/output/exit-codes.js");
    expect(() => run(["node", "agent-scaffold", "bogus"])).not.toThrow();
    expect(mockExitWithCode).toHaveBeenCalledWith(EXIT_USAGE);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "bogus", json: false }),
      EXIT_USAGE,
      expect.stringContaining("unknown command"),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("removed commands are unknown commands", async () => {
    const { EXIT_USAGE } = await import("../src/output/exit-codes.js");
    run(["node", "agent-scaffold", "login"]);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "login" }),
      EXIT_USAGE,
      expect.stringContaining("unknown command"),
    );
  });

  it("create unknown option routes through outputError, no throw", async () => {
    const { EXIT_USAGE } = await import("../src/output/exit-codes.js");
    expect(() => run(["node", "agent-scaffold", "create", "--bogus"])).not.toThrow();
    expect(mockExitWithCode).toHaveBeenCalledWith(EXIT_USAGE);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "create", json: false }),
      EXIT_USAGE,
      expect.stringContaining("unknown option"),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("unknown command with --json emits a JSON error envelope", async () => {
    const { EXIT_USAGE } = await import("../src/output/exit-codes.js");
    run(["node", "agent-scaffold", "bogus", "--json"]);
    expect(mockOutputError).toHaveBeenCalledWith(
      expect.objectContaining({ command: "bogus", json: true }),
      EXIT_USAGE,
      expect.any(String),
    );
    expect(mockExitWithCode).toHaveBeenCalledWith(EXIT_USAGE);
  });
});
