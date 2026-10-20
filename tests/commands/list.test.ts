import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EXIT_CONFIG } from "../../src/output/exit-codes.js";
import { ConfigError } from "../../src/errors.js";
import {
  recommendedFrameworkOptions,
  recommendedPackageManagerOptions,
  recommendedRuntimeOptions,
} from "../../src/commands/create/layer-composition/allowed-configuration.js";
import {
  loadFromDir,
  type TemplateData,
} from "../../src/commands/create/layer-composition/template-provider.js";
import { buildListData, formatListText, list } from "../../src/commands/list.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "templates");

describe("list", () => {
  let templates: TemplateData;

  beforeAll(async () => {
    templates = await loadFromDir(fixtureDir);
  });

  describe("buildListData", () => {
    it("lists runtimes in registry order with labels", () => {
      const { runtimes } = buildListData(templates);
      expect(runtimes.map((r) => r.id)).toEqual(Object.keys(templates.registry.runtime));
      expect(runtimes[0]).toMatchObject({ id: "node", label: "Node.js", recommended: true });
    });

    it("lists frameworks and package managers in the runtime's order", () => {
      const { runtimes } = buildListData(templates);
      for (const runtime of runtimes) {
        const source = templates.registry.runtime[runtime.id];
        expect(runtime.frameworks.map((f) => f.id)).toEqual(source?.frameworks);
        expect(runtime.packageManagers.map((pm) => pm.id)).toEqual(source?.packageManagers);
      }
      expect(runtimes[0]?.frameworks[0]).toEqual({
        id: "express",
        label: "Express",
        recommended: true,
      });
      expect(runtimes[0]?.packageManagers[1]).toEqual({
        id: "bun",
        label: "bun",
        recommended: true,
      });
    });

    it("sets defaults to the choice that create --yes makes", () => {
      const { registry } = templates;
      const runtime = recommendedRuntimeOptions(registry.runtime)[0] as string;
      const framework = recommendedFrameworkOptions(
        registry.runtime,
        runtime,
        registry.frameworks,
      )[0];
      const packageManager = recommendedPackageManagerOptions(
        registry.runtime,
        runtime,
        registry["package-managers"],
      )[0];
      expect(buildListData(templates).defaults).toEqual({ runtime, framework, packageManager });
    });

    it("sets recommended to false only when the entry flag is false, and skips it for defaults", () => {
      const { registry } = templates;
      const modified: TemplateData = {
        labels: templates.labels,
        registry: {
          ...registry,
          runtime: {
            ...registry.runtime,
            node: { ...registry.runtime["node"]!, recommended: false },
          },
          frameworks: {
            ...registry.frameworks,
            "html-css-js": { ...registry.frameworks["html-css-js"]!, recommended: false },
          },
          "package-managers": {
            ...registry["package-managers"],
            pnpm: { ...registry["package-managers"].pnpm!, recommended: false },
          },
        },
      };
      const data = buildListData(modified);
      expect(data.runtimes[0]?.recommended).toBe(false);
      expect(data.runtimes[1]?.recommended).toBe(true);
      expect(data.runtimes[1]?.frameworks[0]).toMatchObject({
        id: "html-css-js",
        recommended: false,
      });
      expect(data.runtimes[1]?.packageManagers[0]).toMatchObject({
        id: "pnpm",
        recommended: false,
      });
      expect(data.defaults).toEqual({
        runtime: "static_web",
        framework: "react-vite",
        packageManager: "bun",
      });
    });
  });

  describe("formatListText", () => {
    it("marks the defaults", () => {
      const text = formatListText(buildListData(templates));
      expect(text).toContain("node - Node.js (default)");
      expect(text).toContain("frameworks: express (default), react-vite");
      expect(text).toContain("package managers: pnpm (default), bun");
      expect(text).toContain("static_web - Static (HTML/CSS/JS)\n");
    });
  });

  describe("list command", () => {
    let output: string;
    const originalEnv = process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"];

    beforeEach(() => {
      output = "";
      process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"] = fixtureDir;
      vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
        output += String(chunk);
        return true;
      }) as never);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      if (originalEnv === undefined) delete process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"];
      else process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"] = originalEnv;
    });

    it("prints one JSON envelope with --json", async () => {
      const exit = vi.fn();
      await list({ json: true }, { exit });
      const lines = output.trim().split("\n");
      expect(lines).toHaveLength(1);
      const envelope = JSON.parse(lines[0] as string);
      expect(envelope).toMatchObject({ schemaVersion: "1", command: "list", success: true });
      expect(envelope.runtimes).toEqual(buildListData(templates).runtimes);
      expect(envelope.defaults).toEqual(buildListData(templates).defaults);
      expect(exit).not.toHaveBeenCalled();
    });

    it("prints the text list without --json", async () => {
      const write = vi.fn();
      await list({ json: false }, { write });
      expect(write).toHaveBeenCalledWith(formatListText(buildListData(templates)));
      expect(output).toBe("");
    });

    it("loads the templates from AGENT_SCAFFOLD_TEMPLATES_DIR", async () => {
      const loadTemplates = vi.fn(async () => templates);
      await list({ json: true }, { loadTemplates });
      expect(loadTemplates).toHaveBeenCalledWith(fixtureDir);
    });

    it("emits a JSON error envelope and exits with the error code when loading fails", async () => {
      const exit = vi.fn();
      const loadTemplates = vi.fn(async () => {
        throw new ConfigError("templates missing");
      });
      await list({ json: true }, { exit, loadTemplates });
      const envelope = JSON.parse(output.trim());
      expect(envelope).toMatchObject({
        command: "list",
        success: false,
        error: { code: EXIT_CONFIG, message: "templates missing" },
      });
      expect(exit).toHaveBeenCalledWith(EXIT_CONFIG);
    });
  });
});
