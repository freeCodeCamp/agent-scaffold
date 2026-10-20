// oxlint-disable typescript/require-await
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { UsageError } from "../../../../src/errors.js";
import {
  BunPackageManager,
  extractVersions,
} from "../../../../src/commands/create/package-manager/bun-package-manager.js";

describe(extractVersions, () => {
  it("extracts versions from bun list output", () => {
    const output = `
node_modules (2)
├── foo@1.2.3
└── bar@4.5.6
`;
    const versions = extractVersions(output);
    expect(versions).toStrictEqual({ bar: "4.5.6", foo: "1.2.3" });
  });

  it("handles @scoped packages", () => {
    const output = `
node_modules (2)
├── @scope/foo@1.2.3
└── @scope/bar@4.5.6
`;
    const versions = extractVersions(output);
    expect(versions).toStrictEqual({ "@scope/bar": "4.5.6", "@scope/foo": "1.2.3" });
  });
});

describe(BunPackageManager, () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "bun-pm-test-"));
    await writeFile(
      join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { foo: "^1.0.0" } }),
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tmpDir, { force: true, recursive: true });
  });

  describe("specifyDeps", () => {
    it("throws UsageError when there are no dependencies in the bun list output", async () => {
      const runner = {
        async installLockfileOnly(cwd: string) {
          await writeFile(join(cwd, "bun.lock"), "", "utf8");
        },
        async list(_cwd: string) {
          return "node_modules (0)\n";
        },
      };
      const adapter = new BunPackageManager(runner);

      await expect(adapter.specifyDeps(tmpDir, "1.0.0")).rejects.toBeInstanceOf(UsageError);
    });
  });
});
