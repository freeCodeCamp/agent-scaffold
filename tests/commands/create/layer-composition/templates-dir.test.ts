import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bundledTemplatesDir } from "../../../../src/commands/create/layer-composition/templates-dir.js";

const tempDirectories: string[] = [];

const makeTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "agent-scaffold-templates-dir-"));
  tempDirectories.push(dir);
  return dir;
};

describe(bundledTemplatesDir, () => {
  afterEach(() => {
    for (const directory of tempDirectories) {
      rmSync(directory, { force: true, recursive: true });
    }

    tempDirectories.length = 0;
  });

  it("finds the repo-root templates directory walking up from the source tree", async () => {
    const start = resolve("src/commands/create/layer-composition");

    await expect(bundledTemplatesDir(start, makeTempDir())).resolves.toBe(resolve("templates"));
  });

  it("extracts templates.tgz into the cache base and reuses the extraction", async () => {
    const start = makeTempDir();
    const base = makeTempDir();
    const source = makeTempDir();
    writeFileSync(join(source, "labels.json"), "{}\n");
    writeFileSync(join(source, ".gitignore"), "node_modules\n");
    execFileSync("tar", ["czf", join(start, "templates.tgz"), "-C", source, "."]);

    const first = await bundledTemplatesDir(start, base);

    expect(first.startsWith(join(base, "templates"))).toBe(true);
    expect(readFileSync(join(first, "labels.json"), "utf8")).toBe("{}\n");
    expect(readFileSync(join(first, ".gitignore"), "utf8")).toBe("node_modules\n");
    await expect(bundledTemplatesDir(start, base)).resolves.toBe(first);
  });

  it("removes cache entries of older template hashes after extraction", async () => {
    const start = makeTempDir();
    const base = makeTempDir();
    const source = makeTempDir();
    const stale = join(base, "templates", "0123456789abcdef");
    mkdirSync(stale, { recursive: true });
    writeFileSync(join(source, "labels.json"), "{}\n");
    execFileSync("tar", ["czf", join(start, "templates.tgz"), "-C", source, "."]);

    const extracted = await bundledTemplatesDir(start, base);

    expect(existsSync(extracted)).toBe(true);
    expect(existsSync(stale)).toBe(false);
  });

  it("throws a ConfigError when templates.tgz cannot be extracted", async () => {
    const start = makeTempDir();
    writeFileSync(join(start, "templates.tgz"), "not a tarball");

    await expect(bundledTemplatesDir(start, makeTempDir())).rejects.toThrow(
      "Template extraction failed",
    );
  });

  it("throws when no templates directory exists above the start directory", async () => {
    const dir = makeTempDir();

    await expect(bundledTemplatesDir(dir, makeTempDir())).rejects.toThrow(
      "templates directory not found",
    );
  });
});
