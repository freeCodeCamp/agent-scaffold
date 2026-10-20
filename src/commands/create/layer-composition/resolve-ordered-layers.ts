import { UsageError } from "../../../errors.js";
import type { CreateSelections } from "../prompt/prompt.port.js";
import type { Framework, PackageManager, PackageManagerOption, Runtime } from "./schemas/layers.js";

type LayerType = "always" | "frameworks" | "package-managers" | "runtime";

interface LayerData {
  files: Record<string, string>;
  symlinks: Record<string, string>;
}

type FrameworkLayerData = Framework[string] & LayerData;
type PackageManagerLayerData = PackageManager[PackageManagerOption] & LayerData;
type RuntimeEntryData = Runtime[string];

interface LayerRegistry {
  always: Record<string, LayerData>;
  frameworks: Record<string, FrameworkLayerData>;
  "package-managers": Record<string, PackageManagerLayerData>;
  runtime: Record<string, RuntimeEntryData & LayerData>;
}

interface ResolvedLayer {
  files: Record<string, string>;
  layerType: LayerType;
  name: string;
  symlinks: Record<string, string>;
}

const resolveOrderedLayers = (input: CreateSelections, layers: LayerRegistry): ResolvedLayer[] => {
  const isNode = input.runtime === "node";
  const runtimeId = isNode ? "node" : "static_web";

  const refs: { id: string; layerType: LayerType }[] = [
    { id: "always", layerType: "always" },
    { id: runtimeId, layerType: "runtime" },
    ...(input.packageManager === undefined
      ? []
      : [{ id: input.packageManager, layerType: "package-managers" as const }]),
    { id: input.framework, layerType: "frameworks" },
  ];

  return refs.map(({ id, layerType }) => {
    const layer = layers[layerType]?.[id];
    const name = layerType === "always" ? id : `${layerType}/${id}`;

    if (layer === undefined) {
      throw new UsageError(`missing layer "${name}"`);
    }

    return { files: layer.files, layerType, name, symlinks: layer.symlinks };
  });
};

export { resolveOrderedLayers };
export type {
  FrameworkLayerData,
  LayerData,
  LayerRegistry,
  LayerType,
  PackageManagerLayerData,
  ResolvedLayer,
};
