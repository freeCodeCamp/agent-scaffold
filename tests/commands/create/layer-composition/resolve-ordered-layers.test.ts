import { describe, expect, it } from "vitest";
import { resolveOrderedLayers } from "../../../../src/commands/create/layer-composition/resolve-ordered-layers.js";
import type { LayerRegistry } from "../../../../src/commands/create/layer-composition/resolve-ordered-layers.js";

// ---------------------------------------------------------------------------
// Minimal registry — empty files; only layer existence matters here
// ---------------------------------------------------------------------------

const minimalRegistry: LayerRegistry = {
  always: { always: { files: {}, symlinks: {} } },
  frameworks: {
    express: { devCopySource: "", files: {}, port: 3000, symlinks: {}, watchSync: [] },
    "html-css-js": { devCopySource: "", files: {}, port: 3000, symlinks: {}, watchSync: [] },
    typescript: { devCopySource: "", files: {}, port: 3000, symlinks: {}, watchSync: [] },
  },
  "package-managers": {
    bun: {
      devCmd: [],
      files: {},
      lockfile: "bun.lock",
      manifests: [],
      pmInstall: "",
      pmVersion: "0.0.0",
      symlinks: {},
    },
    pnpm: {
      devCmd: [],
      files: {},
      lockfile: "pnpm-lock.yaml",
      manifests: [],
      pmInstall: "",
      pmVersion: "0.0.0",
      symlinks: {},
    },
  },
  runtime: {
    node: {
      baseImage: "",
      files: {},
      frameworks: [],
      packageManagers: [],
      symlinks: {},
    },
    static_web: {
      baseImage: "",
      files: {},
      frameworks: [],
      packageManagers: [],
      symlinks: {},
    },
  },
};

// ---------------------------------------------------------------------------
// Combination coverage helpers
// ---------------------------------------------------------------------------

const NODE_FRAMEWORKS = ["express", "typescript"] as const;
const NODE_PACKAGE_MANAGERS = ["pnpm", "bun"] as const;

const expectedNodeLayerNames = ({
  framework,
  packageManager,
}: {
  framework: (typeof NODE_FRAMEWORKS)[number];
  packageManager: (typeof NODE_PACKAGE_MANAGERS)[number];
}): string[] => [
  "always",
  "runtime/node",
  `package-managers/${packageManager}`,
  `frameworks/${framework}`,
];

interface NodeCase {
  framework: (typeof NODE_FRAMEWORKS)[number];
  packageManager: (typeof NODE_PACKAGE_MANAGERS)[number];
}

const nodeCombinations: NodeCase[] = NODE_PACKAGE_MANAGERS.flatMap((packageManager) =>
  NODE_FRAMEWORKS.map((framework) => ({ framework, packageManager })),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe(resolveOrderedLayers, () => {
  it("resolves node layers in stage order", () => {
    const result = resolveOrderedLayers(
      {
        framework: "express",
        name: "hello-scaffold",
        packageManager: "pnpm",
        runtime: "node",
      },
      minimalRegistry,
    );

    expect(result.map((layer) => layer.name)).toStrictEqual([
      "always",
      "runtime/node",
      "package-managers/pnpm",
      "frameworks/express",
    ]);
  });

  it("resolves bun as the package manager layer", () => {
    const result = resolveOrderedLayers(
      {
        framework: "express",
        name: "test",
        packageManager: "bun",
        runtime: "node",
      },
      minimalRegistry,
    );

    expect(result.map((l) => l.name)).toStrictEqual([
      "always",
      "runtime/node",
      "package-managers/bun",
      "frameworks/express",
    ]);
  });

  it("resolves static_web runtime to always, runtime/static_web, package-managers/pnpm, and frameworks/html-css-js", () => {
    const result = resolveOrderedLayers(
      {
        framework: "html-css-js",
        name: "test",
        packageManager: "pnpm",
        runtime: "static_web",
      },
      minimalRegistry,
    );

    expect(result.map((l) => l.name)).toStrictEqual([
      "always",
      "runtime/static_web",
      "package-managers/pnpm",
      "frameworks/html-css-js",
    ]);
  });

  it.each(nodeCombinations)(
    "resolves Node.js + $framework + $packageManager",
    ({ framework, packageManager }) => {
      const result = resolveOrderedLayers(
        { framework, name: "test", packageManager, runtime: "node" },
        minimalRegistry,
      );

      expect(result.map((l) => l.name)).toStrictEqual(
        expectedNodeLayerNames({ framework, packageManager }),
      );
    },
  );
});
