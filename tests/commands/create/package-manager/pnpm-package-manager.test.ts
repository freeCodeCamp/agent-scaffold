// oxlint-disable typescript/require-await
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import {
  dockerRunnerFactory,
  hostRunnerFactory,
  PnpmPackageManager,
} from "../../../../src/commands/create/package-manager/pnpm-package-manager.js";
import type { PnpmRunnerFactory } from "../../../../src/commands/create/package-manager/pnpm-package-manager.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("../../../../src/commands/create/package-manager/docker-runner.js", () => ({
  runCmdForFiles: vi.fn(),
  runCmdForStdout: vi.fn(),
}));

const PNPM_LIST_OUTPUT_NO_LODASH = JSON.stringify([
  {
    dependencies: { express: { version: "5.1.2" } },
    devDependencies: { typescript: { version: "5.9.3" } },
    name: "my-app",
  },
]);

const makeRunnerFactory =
  (overrides?: {
    installLockfileOnly?: (cwd: string) => Promise<void>;
    list?: (cwd: string) => Promise<string>;
  }): PnpmRunnerFactory =>
  (_pmVersion) => ({
    installLockfileOnly:
      overrides?.installLockfileOnly ??
      (async (cwd: string) => {
        await writeFile(join(cwd, "pnpm-lock.yaml"), "", "utf8");
      }),
    list: overrides?.list ?? (async (_cwd: string) => PNPM_LIST_OUTPUT_NO_LODASH),
  });

describe(PnpmPackageManager, () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "pnpm-pm-test-"));
    await writeFile(
      join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { express: "^5" }, devDependencies: { typescript: "^5" } }),
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tmpDir, { force: true, recursive: true });
  });

  describe("specifyDeps", () => {
    it("throws when pnpm list does not include an expected dependency (lodash, in this case)", async () => {
      await writeFile(
        join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { express: "^5", lodash: "^4" } }),
        "utf8",
      );

      const factory = makeRunnerFactory();
      const adapter = new PnpmPackageManager(factory);

      await expect(async () => adapter.specifyDeps(tmpDir, "10.0.0")).rejects.toThrow(
        /no pinned version found for package "lodash"/,
      );
    });

    it("creates runner with the provided pmVersion", async () => {
      const factorySpy = vi.fn(makeRunnerFactory());
      const adapter = new PnpmPackageManager(factorySpy);

      await adapter.specifyDeps(tmpDir, "10.12.1");

      expect(factorySpy).toHaveBeenCalledWith("10.12.1");
    });

    it("calls installLockfileOnly via the factory-created runner", async () => {
      const installSpy = vi.fn(async (cwd: string) => {
        await writeFile(join(cwd, "pnpm-lock.yaml"), "", "utf8");
      });
      const factory = makeRunnerFactory({ installLockfileOnly: installSpy });
      const adapter = new PnpmPackageManager(factory);

      await adapter.specifyDeps(tmpDir, "10.0.0");

      expect(installSpy).toHaveBeenCalled();
    });
  });
});

type MockCallback = (err: Error | null, result?: { stdout: string; stderr: string }) => void;

describe(hostRunnerFactory, () => {
  let hostTmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    hostTmpDir = await mkdtemp(join(tmpdir(), "host-runner-test-"));
    await writeFile(
      join(hostTmpDir, "package.json"),
      JSON.stringify({ name: "test-project", dependencies: { express: "^5" } }),
      "utf8",
    );
    vi.mocked(execFile).mockImplementation(((...rawArgs: unknown[]) => {
      const callback = rawArgs[rawArgs.length - 1] as MockCallback;
      callback(null, { stderr: "", stdout: "" });
    }) as never);
  });

  afterEach(async () => {
    await rm(hostTmpDir, { force: true, recursive: true });
  });

  it("writes the pinned packageManager to package.json before the install", async () => {
    const runner = hostRunnerFactory("10.0.0");
    await runner.installLockfileOnly(hostTmpDir);

    const pkg = JSON.parse(await readFile(join(hostTmpDir, "package.json"), "utf8"));
    expect(pkg.packageManager).toBe("pnpm@10.0.0");
  });

  it("installLockfileOnly runs the pinned pnpm through npx, without corepack", async () => {
    const runner = hostRunnerFactory("10.0.0");
    await runner.installLockfileOnly(hostTmpDir);

    expect(execFile).toHaveBeenCalledWith(
      "npx",
      ["--yes", "pnpm@10.0.0", "install", "--lockfile-only"],
      expect.objectContaining({ cwd: hostTmpDir }),
      expect.any(Function),
    );
  });

  it("list runs the pinned pnpm through npx", async () => {
    const runner = hostRunnerFactory("10.0.0");
    await runner.list(hostTmpDir);

    expect(execFile).toHaveBeenCalledWith(
      "npx",
      ["--yes", "pnpm@10.0.0", "list", "--json", "--depth=0", "--lockfile-only"],
      expect.objectContaining({ cwd: hostTmpDir }),
      expect.any(Function),
    );
  });
});

describe(dockerRunnerFactory, () => {
  it("installLockfileOnly delegates to runCmdForFiles", async () => {
    const { runCmdForFiles: mockRunCmdForFiles } =
      await import("../../../../src/commands/create/package-manager/docker-runner.js");

    const runner = dockerRunnerFactory("10.0.0");
    await runner.installLockfileOnly("/project");

    expect(mockRunCmdForFiles).toHaveBeenCalledWith(
      "/project",
      ["sh", "-c", "corepack use pnpm@10.0.0 && pnpm install --lockfile-only"],
      ["package.json", "pnpm-workspace.yaml"],
      ["pnpm-lock.yaml", "package.json"],
    );
  });

  it("list delegates to runCmdForStdout", async () => {
    const { runCmdForStdout: mockRunCmdForStdout } =
      await import("../../../../src/commands/create/package-manager/docker-runner.js");

    const runner = dockerRunnerFactory("10.0.0");
    await runner.list("/project");

    expect(mockRunCmdForStdout).toHaveBeenCalledWith(
      "/project",
      ["pnpm", "list", "--json", "--depth=0", "--lockfile-only"],
      ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"],
    );
  });
});
