import { createPackageSpecifier } from "./package-json-specifier.js";
import type { PackageSpecifier } from "./package-specifier.port.js";
import { runCmdForFiles, runCmdForStdout } from "./docker-runner.js";

/**
 * These values are intrinsic to bun. If they change, also update
 * layer-composition/layers/package-manager.json (manifests/lockfile fields).
 */
const LOCKFILE = "bun.lock";
const MANIFESTS = ["package.json", "bunfig.toml"];

interface BunRunner {
  installLockfileOnly(cwd: string): Promise<void>;
  list(cwd: string): Promise<string>;
}

const bunRunner: BunRunner = {
  async installLockfileOnly(cwd) {
    await runCmdForFiles(cwd, ["bun", "install", "--lockfile-only"], MANIFESTS, [LOCKFILE]);
  },
  list(cwd) {
    return runCmdForStdout(cwd, ["bun", "list"], [...MANIFESTS, LOCKFILE]);
  },
};

// Parses the tree output from `bun list` (not JSON)
const extractVersions = (listOutput: string): Record<string, string> => {
  const versions: Record<string, string> = {};
  // Match lines like: ├── the-answer@1.0.0, └── typescript@5.9.3 or ├── @types/node@18.16.18
  const regex = /^[├└]──\s+(@?[^@\s]+)@([\w.-]+)/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(listOutput)) !== null) {
    const [, name, version] = match;
    if (
      typeof name === "string" &&
      typeof version === "string" &&
      name.length > 0 &&
      version.length > 0
    ) {
      versions[name] = version;
    }
  }
  return versions;
};

class BunPackageManager implements PackageSpecifier {
  private readonly runner: BunRunner;

  constructor(runner: BunRunner = bunRunner) {
    this.runner = runner;
  }

  specifyDeps(projectDirectory: string, _pmVersion: string): Promise<void> {
    const specifier = createPackageSpecifier({
      deleteBeforeFirstInstall: true,
      extractVersions,
      lockfileName: LOCKFILE,
      runner: this.runner,
    });
    return specifier.run(projectDirectory);
  }
}

export { BunPackageManager, extractVersions };
