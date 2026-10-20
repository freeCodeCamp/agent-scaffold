import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { loadFromDir } from "../../../../src/commands/create/layer-composition/template-provider.js";

const FIXTURES_DIR = resolve("tests/fixtures/templates");

describe("loadFromDir", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "agent-scaffold-tpl-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { force: true, recursive: true });
  });

  it("keeps every layer map in its declared key order across repeated loads", async () => {
    const declared = {
      runtime: ["node", "static_web"],
      frameworks: ["express", "html-css-js", "react-vite", "tanstack-shadcn", "typescript"],
    };

    for (let i = 0; i < 12; i += 1) {
      const { registry } = await loadFromDir(FIXTURES_DIR);
      expect(Object.keys(registry.runtime)).toEqual(declared.runtime);
      expect(Object.keys(registry.frameworks)).toEqual(declared.frameworks);
    }
  });

  it("loads layers from a valid directory", async () => {
    const { labels, registry } = await loadFromDir(FIXTURES_DIR);

    expect(registry.always).toHaveProperty("always");
    expect(registry.frameworks).toHaveProperty("express");
    expect(registry["package-managers"]).toHaveProperty("pnpm");
    expect(registry.runtime).toHaveProperty("node");
    expect(labels).toHaveProperty("runtime");
  });

  it("result does not contain version field", async () => {
    const result = await loadFromDir(FIXTURES_DIR);
    expect(result).not.toHaveProperty("version");
  });

  it("throws when directory does not exist", async () => {
    await expect(loadFromDir(join(tmpDir, "does-not-exist"))).rejects.toThrow(
      "Template directory not found",
    );
  });

  it("throws when directory has missing files", async () => {
    const incompleteDir = join(tmpDir, "incomplete");
    await mkdir(incompleteDir, { recursive: true });
    await writeFile(join(incompleteDir, "always.json"), "{}");

    await expect(loadFromDir(incompleteDir)).rejects.toThrow(
      "Expected files missing from templates",
    );
  });

  it("throws when directory has extra unexpected files", async () => {
    const extraDir = join(tmpDir, "extra");
    await cp(FIXTURES_DIR, extraDir, { recursive: true });
    await writeFile(join(extraDir, "bonus.json"), "{}");

    await expect(loadFromDir(extraDir)).rejects.toThrow("Unexpected files in templates directory");
  });

  it("loads symlinks into the symlinks map with correct targets", async () => {
    const { registry } = await loadFromDir(FIXTURES_DIR);

    expect(registry.frameworks["express"].symlinks).toStrictEqual({
      "src/start.ts": "index.ts",
    });
  });

  it("throws when JSON content fails Zod validation", async () => {
    const badDir = join(tmpDir, "bad-schema");
    await cp(FIXTURES_DIR, badDir, { recursive: true });
    await writeFile(join(badDir, "layers", "always.json"), JSON.stringify({ wrong_key: {} }));

    await expect(loadFromDir(badDir)).rejects.toThrow("Template validation failed");
  });
});
