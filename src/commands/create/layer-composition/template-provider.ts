import { lstat, readdir, readFile, readlink } from "node:fs/promises";
import { join } from "node:path";

import { ConfigError } from "../../../errors.js";
import type { LayerData, LayerRegistry } from "./resolve-ordered-layers.js";
import {
  AlwaysSchema,
  FrameworkSchema,
  PackageManagerSchema,
  RuntimeSchema,
} from "./schemas/layers.js";
import { LabelsSchema, type Labels } from "./schemas/labels.js";

const EXPECTED_LAYER_FILES = [
  "always.json",
  "framework.json",
  "package-manager.json",
  "runtime.json",
] as const;

const EXPECTED_ROOT_ENTRIES = ["files", "labels.json", "layers"] as const;

interface TemplateData {
  labels: Labels;
  registry: LayerRegistry;
}

const validateEntries = (expected: readonly string[], actual: string[]): void => {
  const expectedSet = new Set<string>(expected);
  const actualSet = new Set(actual);

  const missing = [...expectedSet].filter((f) => !actualSet.has(f));
  if (missing.length > 0) {
    throw new ConfigError(`Expected files missing from templates: ${missing.join(", ")}`);
  }

  const extra = [...actualSet].filter((f) => !expectedSet.has(f));
  if (extra.length > 0) {
    throw new ConfigError(`Unexpected files in templates directory: ${extra.join(", ")}`);
  }
};

const validateStructure = async (dir: string): Promise<void> => {
  let rootEntries: string[];
  try {
    rootEntries = await readdir(dir);
  } catch {
    throw new ConfigError(`Template directory not found: ${dir}`);
  }

  validateEntries(EXPECTED_ROOT_ENTRIES, rootEntries);

  const layersDir = join(dir, "layers");
  let layerEntries: string[];
  try {
    layerEntries = await readdir(layersDir);
  } catch {
    throw new ConfigError(`Template layers directory not found: ${layersDir}`);
  }

  validateEntries(EXPECTED_LAYER_FILES, layerEntries);
};

const walkDir = async (
  dir: string,
  prefix: string,
  files: Record<string, string>,
  symlinks: Record<string, string>,
): Promise<void> => {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  const read = await Promise.all(
    entries.sort().map(async (name) => {
      const fullPath = join(dir, name);
      const relativePath = prefix === "" ? name : `${prefix}/${name}`;
      const stat = await lstat(fullPath);

      if (stat.isSymbolicLink()) {
        return {
          kind: "symlink" as const,
          relativePath,
          target: await readlink(fullPath),
        };
      }
      if (stat.isFile()) {
        return {
          kind: "file" as const,
          relativePath,
          content: await readFile(fullPath, "utf-8"),
        };
      }
      if (stat.isDirectory()) {
        return { kind: "directory" as const, relativePath, fullPath };
      }
      return { kind: "other" as const };
    }),
  );

  for (const entry of read) {
    if (entry.kind === "symlink") {
      symlinks[entry.relativePath] = entry.target;
    } else if (entry.kind === "file") {
      files[entry.relativePath] = entry.content;
    } else if (entry.kind === "directory") {
      await walkDir(entry.fullPath, entry.relativePath, files, symlinks);
    }
  }
};

const readLayerFiles = async (
  filesDir: string,
  layerType: string,
  optionName: string,
): Promise<LayerData> => {
  const optionDir = join(filesDir, layerType, optionName);
  const files: Record<string, string> = {};
  const symlinks: Record<string, string> = {};

  await walkDir(optionDir, "", files, symlinks);

  return { files, symlinks };
};

const addLayerData = async <T extends Record<string, unknown>>(
  parsed: T,
  filesDir: string,
  layerType: string,
): Promise<{ [K in keyof T]: T[K] & LayerData }> => {
  const result = {} as { [K in keyof T]: T[K] & LayerData };

  const loaded = await Promise.all(
    Object.keys(parsed).map(
      async (key) => [key, await readLayerFiles(filesDir, layerType, key)] as const,
    ),
  );

  for (const [key, layerFiles] of loaded) {
    const value = parsed[key] as Record<string, unknown>;
    result[key as keyof T] = { ...value, ...layerFiles } as T[keyof T] & LayerData;
  }

  return result;
};

const loadFromDir = async (dir: string): Promise<TemplateData> => {
  await validateStructure(dir);

  try {
    const readLayer = (name: string) => readFile(join(dir, "layers", name), "utf-8");
    const readRoot = (name: string) => readFile(join(dir, name), "utf-8");
    const filesDir = join(dir, "files");

    const [labels, always, framework, packageManager, runtime] = await Promise.all([
      readRoot("labels.json").then((raw) => LabelsSchema.parse(JSON.parse(raw))),
      readLayer("always.json").then((raw) => AlwaysSchema.parse(JSON.parse(raw))),
      readLayer("framework.json").then((raw) => FrameworkSchema.parse(JSON.parse(raw))),
      readLayer("package-manager.json").then((raw) => PackageManagerSchema.parse(JSON.parse(raw))),
      readLayer("runtime.json").then((raw) => RuntimeSchema.parse(JSON.parse(raw))),
    ]);

    const [alwaysWithFiles, frameworkWithFiles, pmWithFiles, runtimeWithFiles] = await Promise.all([
      addLayerData(always, filesDir, "always"),
      addLayerData(framework, filesDir, "framework"),
      addLayerData(packageManager, filesDir, "package-manager"),
      addLayerData(runtime, filesDir, "runtime"),
    ]);

    return {
      labels,
      registry: {
        always: alwaysWithFiles,
        frameworks: frameworkWithFiles,
        "package-managers": pmWithFiles,
        runtime: runtimeWithFiles,
      },
    };
  } catch (err) {
    if (err instanceof ConfigError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new ConfigError(`Template validation failed: ${message}`);
  }
};

export { EXPECTED_LAYER_FILES, EXPECTED_ROOT_ENTRIES, loadFromDir, validateStructure };
export type { TemplateData };
