import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { ConfigError } from "../../../errors.js";

const execFileAsync = promisify(execFile);

const TARBALL = "templates.tgz";

const moduleDir = (): string =>
  typeof __dirname === "string" ? __dirname : dirname(fileURLToPath(import.meta.url));

const cacheBase = (): string => {
  const xdg = process.env["XDG_CACHE_HOME"];
  return join(xdg && xdg.length > 0 ? xdg : join(homedir(), ".cache"), "agent-scaffold");
};

// npm drops .gitignore files and symlinks from a published package, so the
// build ships templates as dist/templates.tgz. Extract it once per content hash.
const extractTarball = async (tarball: string, base: string): Promise<string> => {
  const hash = createHash("sha256")
    .update(await readFile(tarball))
    .digest("hex")
    .slice(0, 16);
  const target = join(base, "templates", hash);
  if (existsSync(join(target, "labels.json"))) return target;

  const tmp = `${target}.tmp-${process.pid}`;
  await mkdir(tmp, { recursive: true });
  try {
    await execFileAsync("tar", ["xzf", tarball, "-C", tmp]);
    await rename(tmp, target);
  } catch (err) {
    await rm(tmp, { force: true, recursive: true });
    if (existsSync(join(target, "labels.json"))) return target;
    const message = err instanceof Error ? err.message : String(err);
    throw new ConfigError(`Template extraction failed: ${message}`);
  }
  return target;
};

// From a source checkout (tsx, tests), use the repo-root templates/ dir.
const findCheckoutTemplates = (start: string): string => {
  let dir = start;
  for (;;) {
    const candidate = join(dir, "templates");
    if (existsSync(join(candidate, "labels.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new ConfigError(`templates directory not found above ${start}`);
    dir = parent;
  }
};

const bundledTemplatesDir = async (
  start: string = moduleDir(),
  base: string = cacheBase(),
): Promise<string> => {
  const tarball = join(start, TARBALL);
  if (existsSync(tarball)) return extractTarball(tarball, base);
  return findCheckoutTemplates(start);
};

export { bundledTemplatesDir };
