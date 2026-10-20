import { describe, expect, it } from "vitest";
import { UsageError } from "../../../../src/errors.js";
import { composeLayerFiles } from "../../../../src/commands/create/layer-composition/compose-layer-files.js";
import type { ResolvedLayer } from "../../../../src/commands/create/layer-composition/resolve-ordered-layers.js";

describe(composeLayerFiles, () => {
  describe("conflict detection", () => {
    it("throws UsageError for a cross-stage non-config file collision", () => {
      const layers: ResolvedLayer[] = [
        { files: { "setup.sh": "#!/bin/sh\n" }, layerType: "always", name: "always", symlinks: {} },
        {
          files: { "setup.sh": "#!/bin/bash\n" },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
    });

    it("throws UsageError for a same-stage file collision", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "config/shared.txt": "auth" },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
        {
          files: { "config/shared.txt": "email" },
          layerType: "frameworks",
          name: "frameworks/typescript",
          symlinks: {},
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
      expect(() => composeLayerFiles(layers)).toThrow(
        'conflict detected in the frameworks layers between "frameworks/express" and "frameworks/typescript"',
      );
    });
  });

  describe("symlink conflict detection", () => {
    it("throws UsageError when two layers provide symlinks at the same path", () => {
      const layers: ResolvedLayer[] = [
        {
          files: {},
          layerType: "always",
          name: "always",
          symlinks: { "link.ts": "../shared/a.ts" },
        },
        {
          files: {},
          layerType: "runtime",
          name: "runtime/node",
          symlinks: { "link.ts": "../shared/b.ts" },
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
      expect(() => composeLayerFiles(layers)).toThrow('layer conflict on "link.ts"');
    });

    it("throws UsageError when a symlink collides with a regular file (symlink first)", () => {
      const layers: ResolvedLayer[] = [
        {
          files: {},
          layerType: "always",
          name: "always",
          symlinks: { "src/index.ts": "../shared/index.ts" },
        },
        {
          files: { "src/index.ts": "console.log('hello');\n" },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
      expect(() => composeLayerFiles(layers)).toThrow('layer conflict on "src/index.ts"');
    });

    it("throws UsageError when a regular file collides with a symlink (file first)", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "src/index.ts": "console.log('hello');\n" },
          layerType: "always",
          name: "always",
          symlinks: {},
        },
        {
          files: {},
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: { "src/index.ts": "../shared/index.ts" },
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
      expect(() => composeLayerFiles(layers)).toThrow('layer conflict on "src/index.ts"');
    });
  });

  describe("overwriting", () => {
    it("later layer replaces README.md from earlier layer", () => {
      const layers: ResolvedLayer[] = [
        { files: { "README.md": "# Hello\n" }, layerType: "always", name: "always", symlinks: {} },
        {
          files: { "README.md": "# Node\n" },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["README.md"]).toBe("# Node\n");
    });

    it("later layer replaces AGENTS.md from earlier layer", () => {
      const layers: ResolvedLayer[] = [
        { files: { "AGENTS.md": "# Base\n" }, layerType: "always", name: "always", symlinks: {} },
        {
          files: { "AGENTS.md": "# Astro\n" },
          layerType: "frameworks",
          name: "frameworks/astro-react",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["AGENTS.md"]).toBe("# Astro\n");
    });

    it("README.md in nested path is also overwritable", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "docs/README.md": "# Base docs\n" },
          layerType: "always",
          name: "always",
          symlinks: {},
        },
        {
          files: { "docs/README.md": "# Node docs\n" },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["docs/README.md"]).toBe("# Node docs\n");
    });

    it("same-stage README.md collision still throws", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "README.md": "# Auth\n" },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
        {
          files: { "README.md": "# Email\n" },
          layerType: "frameworks",
          name: "frameworks/typescript",
          symlinks: {},
        },
      ];

      expect(() => composeLayerFiles(layers)).toThrow(UsageError);
    });
  });

  describe("merging JSON", () => {
    it("merges two package.json layers and sorts keys alphabetically", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "package.json": '{"scripts":{"build":"tsc"}}' },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
        {
          files: { "package.json": '{"dependencies":{"express":"5.1.0"}}' },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["package.json"]).toBe(
        '{"dependencies":{"express":"5.1.0"},"scripts":{"build":"tsc"}}',
      );
    });

    it("later layer values win for conflicting scalar keys", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "package.json": '{"scripts":{"dev":"node src/index.js"}}' },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
        {
          files: { "package.json": '{"scripts":{"dev":"node --watch src/index.js"}}' },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["package.json"]).toBe(
        '{"scripts":{"dev":"node --watch src/index.js"}}',
      );
    });

    it("merges JSON and YAML config files in the same composition", () => {
      const layers: ResolvedLayer[] = [
        {
          files: {
            "docker-compose.yaml": "services:\n  app:\n    image: node:22\n",
            "package.json": '{"scripts":{"build":"tsc"}}',
          },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
        {
          files: {
            "docker-compose.yaml": "services:\n  app:\n    ports:\n      - '3000:3000'\n",
            "package.json": '{"dependencies":{"express":"5.1.0"}}',
          },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      const result = composeLayerFiles(layers);

      expect(result.files["package.json"]).toBe(
        '{"dependencies":{"express":"5.1.0"},"scripts":{"build":"tsc"}}',
      );
      expect(result.files["docker-compose.yaml"]).toContain("image: node:22");
      expect(result.files["docker-compose.yaml"]).toContain("3000:3000");
      expect(result.files["docker-compose.yaml"]).not.toContain("{");
    });
  });

  describe("merging YAML", () => {
    it("merges .yaml config files and emits valid YAML", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "docker-compose.yaml": "version: '3'\nservices:\n  app:\n    image: node:22\n" },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
        {
          files: {
            "docker-compose.yaml": "services:\n  app:\n    ports:\n      - '3000:3000'\n",
          },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      const output = composeLayerFiles(layers).files["docker-compose.yaml"];

      expect(output).toBeDefined();
      expect(output).toContain("image: node:22");
      expect(output).toContain("3000:3000");
      expect(output).not.toContain("{");
    });

    it("merges .yml config files and emits valid YAML", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "config.yml": "env: base\nshared: common\n" },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
        {
          files: { "config.yml": "env: extended\n" },
          layerType: "frameworks",
          name: "frameworks/express",
          symlinks: {},
        },
      ];

      const output = composeLayerFiles(layers).files["config.yml"];

      expect(output).toContain("env: extended");
      expect(output).toContain("shared: common");
      expect(output).not.toContain("{");
    });
  });

  describe("preinstall injection", () => {
    it("injects preinstall script into existing package.json", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "package.json": '{"scripts":{"build":"tsc"}}' },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers, "npx only-allow pnpm").files["package.json"]).toBe(
        '{"scripts":{"build":"tsc","preinstall":"npx only-allow pnpm"}}',
      );
    });

    it("does not inject preinstall when package.json is absent", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "README.md": "# Hello\n" },
          layerType: "always",
          name: "always",
          symlinks: {},
        },
      ];

      const result = composeLayerFiles(layers, "npx only-allow pnpm");

      expect(result.files["package.json"]).toBeUndefined();
    });

    it("leaves files unchanged when pmPreinstall is undefined", () => {
      const layers: ResolvedLayer[] = [
        {
          files: { "package.json": '{"scripts":{"build":"tsc"}}' },
          layerType: "runtime",
          name: "runtime/node",
          symlinks: {},
        },
      ];

      expect(composeLayerFiles(layers).files["package.json"]).toBe('{"scripts":{"build":"tsc"}}');
    });
  });

  describe("symlinks passthrough", () => {
    it("collects symlinks from all layers into the result", () => {
      const layers: ResolvedLayer[] = [
        {
          files: {},
          layerType: "always",
          name: "always",
          symlinks: { "a.ts": "../shared/a.ts" },
        },
        {
          files: {},
          layerType: "runtime",
          name: "runtime/node",
          symlinks: { "b.ts": "../shared/b.ts" },
        },
      ];

      expect(composeLayerFiles(layers).symlinks).toStrictEqual({
        "a.ts": "../shared/a.ts",
        "b.ts": "../shared/b.ts",
      });
    });
  });
});
