import {
  recommendedFrameworkOptions,
  recommendedPackageManagerOptions,
  recommendedRuntimeOptions,
} from "./create/layer-composition/allowed-configuration.js";
import { getLabel } from "./create/layer-composition/labels.js";
import { loadFromDir, type TemplateData } from "./create/layer-composition/template-provider.js";
import { bundledTemplatesDir } from "./create/layer-composition/templates-dir.js";
import { buildEnvelope } from "../output/envelope.js";
import { exitWithCode } from "../output/exit-codes.js";
import { emitJson, outputError } from "../output/format.js";

export interface ListOptions {
  json: boolean;
}

export interface ListDeps {
  exit?: (code: number) => void;
  loadTemplates?: (dir: string) => Promise<TemplateData>;
  write?: (text: string) => void;
}

export interface ListItem {
  id: string;
  label: string;
  recommended: boolean;
}

export interface ListRuntime extends ListItem {
  frameworks: ListItem[];
  packageManagers: ListItem[];
}

export interface ListDefaults {
  runtime: string | null;
  framework: string | null;
  packageManager: string | null;
}

export interface ListData {
  runtimes: ListRuntime[];
  defaults: ListDefaults;
}

export const buildListData = ({ labels, registry }: TemplateData): ListData => {
  const runtimes = Object.entries(registry.runtime).map(([id, entry]): ListRuntime => {
    return {
      id,
      label: getLabel(labels, "runtime", id),
      recommended: entry.recommended !== false,
      frameworks: entry.frameworks.map((frameworkId) => ({
        id: frameworkId,
        label: getLabel(labels, "framework", frameworkId),
        recommended: registry.frameworks[frameworkId]?.recommended !== false,
      })),
      packageManagers: entry.packageManagers.map((pmId) => ({
        id: pmId,
        label: getLabel(labels, "packageManager", pmId),
        recommended:
          registry["package-managers"][pmId as keyof (typeof registry)["package-managers"]]
            ?.recommended !== false,
      })),
    };
  });

  const runtime = recommendedRuntimeOptions(registry.runtime)[0];
  const framework =
    runtime === undefined
      ? undefined
      : recommendedFrameworkOptions(registry.runtime, runtime, registry.frameworks)[0];
  const packageManager =
    runtime === undefined
      ? undefined
      : recommendedPackageManagerOptions(
          registry.runtime,
          runtime,
          registry["package-managers"],
        )[0];

  return {
    runtimes,
    defaults: {
      runtime: runtime ?? null,
      framework: framework ?? null,
      packageManager: packageManager ?? null,
    },
  };
};

export const formatListText = ({ runtimes, defaults }: ListData): string => {
  const mark = (isDefault: boolean): string => (isDefault ? " (default)" : "");
  const lines: string[] = [];

  for (const runtime of runtimes) {
    const isDefaultRuntime = runtime.id === defaults.runtime;
    lines.push(`${runtime.id} - ${runtime.label}${mark(isDefaultRuntime)}`);
    lines.push(
      `  frameworks: ${runtime.frameworks
        .map((f) => `${f.id}${mark(isDefaultRuntime && f.id === defaults.framework)}`)
        .join(", ")}`,
    );
    lines.push(
      `  package managers: ${runtime.packageManagers
        .map((pm) => `${pm.id}${mark(isDefaultRuntime && pm.id === defaults.packageManager)}`)
        .join(", ")}`,
    );
  }

  return lines.join("\n") + "\n";
};

export const list = async (options: ListOptions, deps: ListDeps = {}): Promise<void> => {
  const exit = deps.exit ?? exitWithCode;
  const loadTemplates = deps.loadTemplates ?? loadFromDir;
  const write = deps.write ?? ((text: string) => void process.stdout.write(text));

  try {
    const envDir = process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"];
    const templateDir = envDir && envDir.length > 0 ? envDir : await bundledTemplatesDir();
    const data = buildListData(await loadTemplates(templateDir));

    if (options.json) {
      emitJson(buildEnvelope("list", true, { ...data }));
      return;
    }
    write(formatListText(data));
  } catch (err) {
    exit(outputError({ json: options.json, command: "list" }, err));
  }
};
