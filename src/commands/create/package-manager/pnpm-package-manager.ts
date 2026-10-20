import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { createPackageSpecifier } from "./package-json-specifier.js";
import type { PackageSpecifier } from "./package-specifier.port.js";
import { isDockerAvailable } from "../docker-check.js";
import { runCmdForFiles, runCmdForStdout } from "./docker-runner.js";

const execFileAsync = promisify(execFile);

/**
 * These values are intrinsic to pnpm. If they change, also update
 * layer-composition/layers/package-manager.json (manifests/lockfile fields).
 */

const LOCKFILE = "pnpm-lock.yaml";
const MANIFESTS = ["package.json", "pnpm-workspace.yaml"];

interface PnpmRunner {
  installLockfileOnly(cwd: string): Promise<void>;
  list(cwd: string): Promise<string>;
}

interface ListedDependency {
  version: string;
}

interface ListedPackage {
  dependencies?: Record<string, ListedDependency>;
  devDependencies?: Record<string, ListedDependency>;
}

type PnpmRunnerFactory = (pmVersion: string) => PnpmRunner;

const dockerRunnerFactory: PnpmRunnerFactory = (pmVersion) => ({
  async installLockfileOnly(cwd) {
    await runCmdForFiles(
      cwd,
      ["sh", "-c", `corepack use pnpm@${pmVersion} && pnpm install --lockfile-only`],
      MANIFESTS,
      [LOCKFILE, "package.json"],
    );
  },
  list(cwd) {
    return runCmdForStdout(
      cwd,
      ["pnpm", "list", "--json", "--depth=0", "--lockfile-only"],
      [...MANIFESTS, LOCKFILE],
    );
  },
});

const setPackageManager = async (cwd: string, pmVersion: string): Promise<void> => {
  const path = join(cwd, "package.json");
  const pkg = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  if (!pkg["packageManager"]) {
    pkg["packageManager"] = `pnpm@${pmVersion}`;
    await writeFile(path, JSON.stringify(pkg, null, 2), "utf8");
  }
};

const runPinnedPnpm = async (pmVersion: string, args: string[], cwd: string): Promise<string> => {
  try {
    const { stdout } = await execFileAsync("npx", ["--yes", `pnpm@${pmVersion}`, ...args], {
      cwd,
      encoding: "utf8",
    });
    return stdout;
  } catch (err) {
    const error = err as Error & { stdout: string; stderr: string };
    error.message = `${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`;
    throw error;
  }
};

const hostRunnerFactory: PnpmRunnerFactory = (pmVersion) => ({
  async installLockfileOnly(cwd) {
    await setPackageManager(cwd, pmVersion);
    await runPinnedPnpm(pmVersion, ["install", "--lockfile-only"], cwd);
  },
  list(cwd) {
    return runPinnedPnpm(pmVersion, ["list", "--json", "--depth=0", "--lockfile-only"], cwd);
  },
});

const defaultRunnerFactory: PnpmRunnerFactory = (pmVersion) => {
  let resolvedRunner: PnpmRunner | undefined;

  const resolve = (): PnpmRunner => {
    if (resolvedRunner === undefined) {
      const useDocker = isDockerAvailable();
      resolvedRunner = useDocker ? dockerRunnerFactory(pmVersion) : hostRunnerFactory(pmVersion);
    }
    return resolvedRunner;
  };

  return {
    async installLockfileOnly(cwd) {
      const runner = resolve();
      await runner.installLockfileOnly(cwd);
    },
    async list(cwd) {
      const runner = resolve();
      return runner.list(cwd);
    },
  };
};

const extractVersions = (listOutput: string): Record<string, string> => {
  const packages = JSON.parse(listOutput) as ListedPackage[];
  const root = packages[0] ?? {};
  const versions: Record<string, string> = {};

  for (const [name, dep] of Object.entries(root.dependencies ?? {})) {
    versions[name] = dep.version;
  }

  for (const [name, dep] of Object.entries(root.devDependencies ?? {})) {
    versions[name] = dep.version;
  }

  return versions;
};

class PnpmPackageManager implements PackageSpecifier {
  private readonly createRunner: PnpmRunnerFactory;

  constructor(createRunner: PnpmRunnerFactory = defaultRunnerFactory) {
    this.createRunner = createRunner;
  }

  async specifyDeps(projectDirectory: string, pmVersion: string): Promise<void> {
    const runner = this.createRunner(pmVersion);
    const specifier = createPackageSpecifier({
      deleteBeforeFirstInstall: false,
      extractVersions,
      lockfileName: LOCKFILE,
      runner,
    });
    await specifier.run(projectDirectory);
  }
}

export { dockerRunnerFactory, hostRunnerFactory, PnpmPackageManager };
export type { PnpmRunnerFactory };
