import { existsSync, lstatSync, mkdtempSync, readFileSync, readlinkSync, rmSync } from "node:fs";
import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UsageError } from "../../../../src/errors.js";
import { LocalProjectWriter } from "../../../../src/commands/create/io/local-project-writer.js";
import { afterEach, describe, expect, it } from "vitest";

const tempDirectories: string[] = [];

describe(LocalProjectWriter, () => {
  afterEach(() => {
    for (const directory of tempDirectories) {
      rmSync(directory, { force: true, recursive: true });
    }

    tempDirectories.length = 0;
  });

  it("writes scaffold files into the target directory", async () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), "agent-scaffold-writer-"));
    const writer = new LocalProjectWriter();
    const targetDirectory = join(rootDirectory, "hello-scaffold");

    tempDirectories.push(rootDirectory);

    await writer.writeProject(targetDirectory, {
      ".gitignore": "node_modules\n",
      "src/index.ts": "console.log('hello scaffold');\n",
    });

    expect(readFileSync(join(targetDirectory, "src/index.ts"), "utf8")).toBe(
      "console.log('hello scaffold');\n",
    );
  });

  it("creates symlinks in the target directory", async () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), "agent-scaffold-writer-"));
    const writer = new LocalProjectWriter();
    const targetDirectory = join(rootDirectory, "hello-scaffold");

    tempDirectories.push(rootDirectory);

    await writer.writeProject(targetDirectory, {
      "src/index.ts": "console.log('hello');\n",
    });

    await writer.createSymlinks(targetDirectory, {
      "src/start.ts": "src/index.ts",
    });

    const linkPath = join(targetDirectory, "src/start.ts");
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(linkPath)).toBe("src/index.ts");
  });

  it("removes target directory when symlink creation fails", async () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), "agent-scaffold-writer-"));
    const targetDirectory = join(rootDirectory, "hello-scaffold");
    const writer = new LocalProjectWriter({
      mkdir,
      rm,
      symlink: () => Promise.reject(new Error("symlink failed")),
      writeFile,
    });

    tempDirectories.push(rootDirectory);

    await writer.writeProject(targetDirectory, {
      "src/index.ts": "console.log('hello');\n",
    });

    await expect(
      writer.createSymlinks(targetDirectory, { "src/start.ts": "src/index.ts" }),
    ).rejects.toThrow(UsageError);
    expect(existsSync(targetDirectory)).toBe(false);
  });

  it("removes partial scaffold output after an unrecoverable write failure", async () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), "agent-scaffold-writer-"));
    const targetDirectory = join(rootDirectory, "hello-scaffold");
    const writeUtf8 = (
      filePath: Parameters<typeof writeFile>[0],
      content: Parameters<typeof writeFile>[1],
    ) => writeFile(filePath, content, "utf8");
    const writePlan = [writeUtf8, () => Promise.reject(new Error("disk full")), writeUtf8];
    const writer = new LocalProjectWriter({
      mkdir,
      rm,
      symlink,
      writeFile: (filePath, content) => writePlan.shift()!(filePath, content),
    });

    tempDirectories.push(rootDirectory);

    const act = () =>
      writer.writeProject(targetDirectory, {
        ".gitignore": "node_modules\n",
        "src/index.ts": "console.log('hello scaffold');\n",
      });

    await expect(act()).rejects.toThrow(UsageError);
    expect(existsSync(targetDirectory)).toBe(false);
  });
});
