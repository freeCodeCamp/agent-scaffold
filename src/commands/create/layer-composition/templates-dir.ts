import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, utimes } from "node:fs/promises";
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

const CACHE_ENTRY = /^[0-9a-f]{16}$/;
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

// Best effort: remove cache entries of other template hashes that no run has
// used for STALE_AFTER_MS. Another installed version can still use a recent
// entry. Temporary directories do not match CACHE_ENTRY, so they stay.
const pruneStaleExtractions = async (
  templatesRoot: string,
  keep: string,
  now: number = Date.now(),
): Promise<void> => {
  try {
    const entries = (await readdir(templatesRoot)).filter(
      (entry) => entry !== keep && CACHE_ENTRY.test(entry),
    );
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(templatesRoot, entry);
        if (now - (await stat(path)).mtimeMs > STALE_AFTER_MS) {
          await rm(path, { force: true, recursive: true });
        }
      }),
    );
  } catch {
    // Ignore: a stale cache entry is harmless.
  }
};

const markUsed = async (path: string): Promise<void> => {
  const now = new Date();
  await utimes(path, now, now).catch(() => undefined);
};

// npm drops .gitignore files and symlinks from a published package, so the
// build ships templates as dist/templates.tgz. Extract it once per content hash.
const extractTarball = async (tarball: string, base: string): Promise<string> => {
  const hash = createHash("sha256")
    .update(await readFile(tarball))
    .digest("hex")
    .slice(0, 16);
  const target = join(base, "templates", hash);
  if (existsSync(join(target, "labels.json"))) {
    await markUsed(target);
    return target;
  }

  const tmp = `${target}.tmp-${process.pid}`;
  await mkdir(tmp, { recursive: true });
  try {
    await execFileAsync("tar", ["xzf", tarball, "-C", tmp]);
    await rename(tmp, target);
    await pruneStaleExtractions(join(base, "templates"), hash);
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
