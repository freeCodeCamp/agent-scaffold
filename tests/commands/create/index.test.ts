import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "../../../src/commands/create/index.js";
import type {
  PackageManager,
  RunOptions,
} from "../../../src/commands/create/package-manager/package-manager.service.js";
import { CreateInputValidationService } from "../../../src/commands/create/create-input-validation-service.js";
import type { CreateSelections, Prompt } from "../../../src/commands/create/prompt/prompt.port.js";
import type { DonationConfigWriter } from "../../../src/commands/create/io/donation-config-writer.port.js";
import type { RepoInitialiser } from "../../../src/commands/create/io/repo-initialiser.port.js";
import type { ResolvedLayerSet } from "../../../src/commands/create/layer-composition/layer-composition-service.js";
import { UsageError } from "../../../src/errors.js";
import { loadFromDir } from "../../../src/commands/create/layer-composition/template-provider.js";
import { RuntimeSchema } from "../../../src/commands/create/layer-composition/schemas/layers.js";
import runtimeFixture from "../../fixtures/templates/layers/runtime.json";

vi.mock("../../../src/commands/create/docker-check.js", () => ({
  isDockerAvailable: vi.fn(() => true),
}));

const FIXTURES_DIR = resolve("tests/fixtures/templates");
const runtimeData = RuntimeSchema.parse(runtimeFixture);

class StubDonationConfigWriter implements DonationConfigWriter {
  async write(_projectDirectory: string): Promise<void> {
    // No-op
  }
}

interface MakeDepsOptions {
  packageManager?: PackageManager;
  repoInitialiser?: RepoInitialiser;
}

const createPromptPort = (selection: CreateSelections | null): Prompt => ({
  promptForCreateInputs() {
    return Promise.resolve(selection);
  },
});

class StubRepoInitialiser implements RepoInitialiser {
  async initialise(_projectDirectory: string): Promise<{ committed: boolean }> {
    return { committed: true };
  }
}

const resolvedLayerFiles = {
  ".gitignore": "node_modules\n",
  Procfile: "web: node dist/index.js\n",
  "README.md": "# hello-scaffold\n",
  "compose.yaml": "services:{}\n",
  "package.json": '{"name":"hello-scaffold"}',
  "src/index.ts": "console.log('hello scaffold');\n",
  "tsconfig.json": '{"compilerOptions":{}}',
};

const createPromptResult: CreateSelections = {
  framework: "express",
  name: "hello-scaffold",
  packageManager: "pnpm",
  runtime: "node",
};

const createNodeSelection = (selection: {
  framework: "express" | "typescript";
  name: string;
}): CreateSelections => ({
  framework: selection.framework,
  name: selection.name,
  packageManager: "pnpm",
  runtime: "node",
});

const createStaticSelection = (name: string): CreateSelections => ({
  framework: "html-css-js",
  name,
  packageManager: "pnpm",
  runtime: "static_web",
});

const collectGeneratedFiles = (directory: string): Record<string, string> => {
  const files: Record<string, string> = {};
  const stack = [directory];

  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (currentPath !== undefined) {
      const entries = readdirSync(currentPath, { withFileTypes: true }).sort((left, right) =>
        left.name.localeCompare(right.name),
      );

      for (const entry of entries) {
        const entryPath = join(currentPath, entry.name);

        if (entry.isSymbolicLink()) {
          const relativePath = relative(directory, entryPath).replaceAll("\\", "/");
          files[relativePath] = `symlink:${readlinkSync(entryPath)}`;
        } else if (entry.isDirectory()) {
          stack.push(entryPath);
        } else {
          const relativePath = relative(directory, entryPath).replaceAll("\\", "/");

          files[relativePath] = readFileSync(entryPath, "utf8");
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  );
};

const makeDeps = (cwd: string, prompt: Prompt, options: MakeDepsOptions = {}) => {
  const {
    packageManager = { specifyDeps: vi.fn(() => Promise.resolve()) },
    repoInitialiser = new StubRepoInitialiser(),
  } = options;
  return {
    cwd,
    donationConfigWriter: new StubDonationConfigWriter(),
    exit: vi.fn(),
    isTTY: true,
    logger: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warn: vi.fn() },
    packageManager,
    prompt,
    repoInitialiser,
    spinner: { message: vi.fn(), start: vi.fn(), stop: vi.fn(), error: vi.fn() },
    validator: new CreateInputValidationService((path) => existsSync(join(cwd, path)), runtimeData),
  };
};

describe("create", () => {
  let rootDirectory: string;

  beforeEach(() => {
    vi.stubEnv("AGENT_SCAFFOLD_TEMPLATES_DIR", FIXTURES_DIR);
    rootDirectory = mkdtempSync(join(tmpdir(), "agent-scaffold-create-"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(rootDirectory, { force: true, recursive: true });
  });

  it("scaffolds Node.js + typescript", async () => {
    const selection = createNodeSelection({
      framework: "typescript",
      name: "node-bare",
    });

    const deps = makeDeps(rootDirectory, createPromptPort(selection));
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(existsSync(join(rootDirectory, selection.name))).toBe(true);
  });

  it("creates symlinks from template fixtures in the output directory", async () => {
    const selection = createNodeSelection({
      framework: "express",
      name: "symlink-test",
    });

    const deps = makeDeps(rootDirectory, createPromptPort(selection));
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();

    const linkPath = join(rootDirectory, "symlink-test", "src/start.ts");
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(linkPath)).toBe("index.ts");
    expect(existsSync(linkPath)).toBe(true);
  });

  it("snapshots generated Node.js scaffold output", async () => {
    const selection = createNodeSelection({
      framework: "express",
      name: "snapshot-node-app",
    });

    const deps = makeDeps(rootDirectory, createPromptPort(selection));
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();

    const generatedFiles = collectGeneratedFiles(join(rootDirectory, selection.name));

    expect(generatedFiles).toMatchSnapshot();
  });

  it("calls packageManager.specifyDeps with the target directory for Node.js scaffold", async () => {
    const name = "node-install-spy";
    const selection = createNodeSelection({
      framework: "typescript",
      name,
    });

    const specifyDeps = vi.fn((_opts: RunOptions) => Promise.resolve());

    const deps = makeDeps(rootDirectory, createPromptPort(selection), {
      packageManager: { specifyDeps },
    });
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(specifyDeps).toHaveBeenCalledWith({
      manager: "pnpm",
      pmVersion: "9.0.0",
      projectDirectory: join(rootDirectory, name),
    });
  });

  it("calls packageManager.specifyDeps with the target directory for Static scaffold", async () => {
    const name = "static-no-install-spy";
    const selection = createStaticSelection(name);

    const specifyDeps = vi.fn((_opts: RunOptions) => Promise.resolve());

    const deps = makeDeps(rootDirectory, createPromptPort(selection), {
      packageManager: { specifyDeps },
    });
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(specifyDeps).toHaveBeenCalledWith({
      manager: "pnpm",
      pmVersion: "9.0.0",
      projectDirectory: join(rootDirectory, name),
    });
  });

  it("calls repoInitialiser.initialise with the target directory for Node.js scaffold", async () => {
    const name = "node-repo-init-spy";
    const selection = createNodeSelection({
      framework: "typescript",
      name,
    });

    const repoInitialiser = {
      initialise: vi.fn((_dir: string) => Promise.resolve({ committed: true })),
    };

    const deps = makeDeps(rootDirectory, createPromptPort(selection), {
      repoInitialiser,
    });
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(repoInitialiser.initialise).toHaveBeenCalledWith(join(rootDirectory, name));
  });

  it("calls repoInitialiser.initialise with the target directory for Static scaffold", async () => {
    const name = "static-repo-init-spy";
    const selection = createStaticSelection(name);

    const repoInitialiser = {
      initialise: vi.fn((_dir: string) => Promise.resolve({ committed: true })),
    };

    const deps = makeDeps(rootDirectory, createPromptPort(selection), {
      repoInitialiser,
    });
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(repoInitialiser.initialise).toHaveBeenCalledWith(join(rootDirectory, name));
  });

  it("snapshots generated Static scaffold output", async () => {
    const selection = createStaticSelection("snapshot-static-app");

    const deps = makeDeps(rootDirectory, createPromptPort(selection));
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();

    const generatedFiles = collectGeneratedFiles(join(rootDirectory, selection.name));

    expect(generatedFiles).toMatchSnapshot();
  });

  it("writes the resolved scaffold artifacts to disk", async () => {
    const writerCalls: {
      files: Record<string, string>;
      targetDirectory: string;
    }[] = [];
    const deps = {
      ...makeDeps("/workspace", createPromptPort(createPromptResult)),
      donationConfigWriter: new StubDonationConfigWriter(),
      filesystemWriter: {
        createSymlinks() {
          return Promise.resolve();
        },
        writeProject(targetDirectory: string, files: Record<string, string>) {
          writerCalls.push({ files, targetDirectory });
          return Promise.resolve();
        },
      },
      layerResolver: {
        resolveLayers(_input: CreateSelections): ResolvedLayerSet {
          return { files: resolvedLayerFiles, layers: [], symlinks: {} };
        },
      },
    };

    await create({ json: false }, deps);

    expect(writerCalls).toStrictEqual([
      {
        files: resolvedLayerFiles,
        targetDirectory: "/workspace/hello-scaffold",
      },
      {
        files: { LICENSE: expect.stringContaining("BSD 3-Clause License") },
        targetDirectory: "/workspace/hello-scaffold",
      },
    ]);
    expect(deps.logger.success).toHaveBeenCalled();
  });

  it("returns non-zero when prompt flow is cancelled", async () => {
    const deps = makeDeps("/workspace", createPromptPort(null));

    await create({ json: false }, deps);
    expect(deps.exit).toHaveBeenCalledWith(10);
  });

  it("returns actionable feedback for invalid input", async () => {
    // 'json' should be false since we're interested in user-facing errors.
    const deps = {
      ...makeDeps("/workspace", createPromptPort(createPromptResult)),
      validator: {
        validateCreateInput(_input: CreateSelections): never {
          throw new UsageError("InvalidName");
        },
      },
    };

    await create({ json: false }, deps);

    expect(deps.logger.error).toHaveBeenCalledWith("InvalidName");
  });

  it("throws a typed write failure when scaffold output cannot be written", async () => {
    const message = (target: string) => `Failed to write files to ${target}`;
    const deps = {
      ...makeDeps("/workspace", createPromptPort(createPromptResult)),
      donationConfigWriter: new StubDonationConfigWriter(),
      filesystemWriter: {
        createSymlinks() {
          return Promise.resolve();
        },
        writeProject(targetDirectory: string) {
          return Promise.reject(new Error(message(targetDirectory)));
        },
      },
      layerResolver: {
        resolveLayers(_input: CreateSelections): ResolvedLayerSet {
          return { files: resolvedLayerFiles, layers: [], symlinks: {} };
        },
      },
    };

    await create({ json: false }, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(message("/workspace/hello-scaffold"));
  });

  describe("non-interactive mode", () => {
    it("scaffolds with explicit flags and skips prompts", async () => {
      const prompt = createPromptPort(null);
      const promptSpy = vi.spyOn(prompt, "promptForCreateInputs");

      const deps = {
        ...makeDeps(rootDirectory, prompt),
        isTTY: false,
      };

      await create(
        {
          json: false,
          yes: true,
          name: "non-interactive-app",
          runtime: "node",
          framework: "express",
          packageManager: "pnpm",
        },
        deps,
      );

      expect(promptSpy).not.toHaveBeenCalled();
      expect(deps.exit).not.toHaveBeenCalled();
      expect(existsSync(join(rootDirectory, "non-interactive-app"))).toBe(true);
      expect(deps.logger.success).toHaveBeenCalled();
    });

    it("emits a JSON success envelope when --json is set", async () => {
      const written: string[] = [];
      const writeSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation((chunk: string | Uint8Array) => {
          written.push(String(chunk));
          return true;
        });

      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
      };

      await create(
        {
          json: true,
          yes: true,
          name: "json-app",
          runtime: "node",
          framework: "express",
          packageManager: "pnpm",
        },
        deps,
      );

      writeSpy.mockRestore();

      expect(deps.exit).not.toHaveBeenCalled();

      expect(written).toHaveLength(1);
      const envelope = JSON.parse(written[0]);
      expect(envelope).toMatchObject({
        schemaVersion: "1",
        command: "create",
        success: true,
        name: "json-app",
        runtime: "node",
        framework: "express",
        packageManager: "pnpm",
      });
      expect(envelope.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(envelope.path).toMatch(/json-app$/);
    });

    it("defaults to the first recommended runtime when --runtime is omitted", async () => {
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
      };
      const validateSpy = vi.spyOn(deps.validator, "validateCreateInput");

      await create(
        {
          json: false,
          yes: true,
          name: "rec-default-app",
          framework: "express",
          packageManager: "pnpm",
        },
        deps,
      );

      expect(deps.exit).not.toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalledWith(expect.objectContaining({ runtime: "node" }));
    });

    it("defaults to the first recommended framework when --framework is omitted", async () => {
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
      };
      const validateSpy = vi.spyOn(deps.validator, "validateCreateInput");

      await create(
        {
          json: false,
          yes: true,
          name: "rec-fw-default",
          runtime: "node",
          packageManager: "pnpm",
        },
        deps,
      );

      expect(deps.exit).not.toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalledWith(expect.objectContaining({ framework: "express" }));
    });

    it("defaults to the first recommended PM when --packageManager is omitted", async () => {
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
      };
      const validateSpy = vi.spyOn(deps.validator, "validateCreateInput");

      await create(
        {
          json: false,
          yes: true,
          name: "rec-pm-default",
          runtime: "node",
          framework: "express",
        },
        deps,
      );

      expect(deps.exit).not.toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalledWith(expect.objectContaining({ packageManager: "pnpm" }));
    });

    it("honours an explicit non-recommended flag value", async () => {
      const modifiedLoader = async (dir: string) => {
        const base = await loadFromDir(dir);
        const basePm = base.registry["package-managers"];
        const partialPm = {
          pnpm: { ...basePm["pnpm"], recommended: true },
          bun: { ...basePm["bun"], recommended: false },
        };
        return { ...base, registry: { ...base.registry, "package-managers": partialPm } };
      };
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
        loadLayersFn: modifiedLoader,
      };

      await create(
        {
          json: false,
          yes: true,
          name: "explicit-bun-app",
          runtime: "node",
          framework: "express",
          packageManager: "bun",
        },
        deps,
      );

      expect(deps.exit).not.toHaveBeenCalled();
      expect(existsSync(join(rootDirectory, "explicit-bun-app"))).toBe(true);
    });

    it("errors when no recommended runtimes and --runtime is omitted", async () => {
      const modifiedLoader = async (dir: string) => {
        const base = await loadFromDir(dir);
        const baseRt = base.registry.runtime;
        const noRecRuntime = {
          node: { ...baseRt["node"], recommended: false },
          static_web: { ...baseRt["static_web"], recommended: false },
        };
        return { ...base, registry: { ...base.registry, runtime: noRecRuntime } };
      };
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
        loadLayersFn: modifiedLoader,
      };

      await create({ json: false, yes: true, name: "no-rec-runtime" }, deps);

      expect(deps.exit).toHaveBeenCalled();
      expect(deps.logger.error).toHaveBeenCalledWith(
        expect.stringContaining("No recommended runtimes"),
      );
    });

    it("errors when no recommended frameworks and --framework is omitted", async () => {
      const modifiedLoader = async (dir: string) => {
        const base = await loadFromDir(dir);
        const baseFw = base.registry.frameworks;
        const noRecFramework = {
          ...baseFw,
          express: { ...baseFw["express"], recommended: false },
          "html-css-js": { ...baseFw["html-css-js"], recommended: false },
          "react-vite": { ...baseFw["react-vite"], recommended: false },
          "tanstack-shadcn": { ...baseFw["tanstack-shadcn"], recommended: false },
          typescript: { ...baseFw["typescript"], recommended: false },
        };
        return { ...base, registry: { ...base.registry, frameworks: noRecFramework } };
      };
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
        loadLayersFn: modifiedLoader,
      };

      await create({ json: false, yes: true, name: "no-rec-fw", runtime: "node" }, deps);

      expect(deps.exit).toHaveBeenCalled();
      expect(deps.logger.error).toHaveBeenCalledWith(
        expect.stringContaining("No recommended frameworks"),
      );
    });

    it("errors when no recommended PMs and --packageManager is omitted", async () => {
      const modifiedLoader = async (dir: string) => {
        const base = await loadFromDir(dir);
        const basePm = base.registry["package-managers"];
        const noRecPm = {
          pnpm: { ...basePm["pnpm"], recommended: false },
          bun: { ...basePm["bun"], recommended: false },
        };
        return { ...base, registry: { ...base.registry, "package-managers": noRecPm } };
      };
      const deps = {
        ...makeDeps(rootDirectory, createPromptPort(null)),
        isTTY: false,
        loadLayersFn: modifiedLoader,
      };

      await create(
        { json: false, yes: true, name: "no-rec-pm", runtime: "node", framework: "express" },
        deps,
      );

      expect(deps.exit).toHaveBeenCalled();
      expect(deps.logger.error).toHaveBeenCalledWith(
        expect.stringContaining("No recommended package managers"),
      );
    });
  });

  it("warns when Docker daemon is unavailable during scaffolding", async () => {
    const { isDockerAvailable } = await import("../../../src/commands/create/docker-check.js");
    vi.mocked(isDockerAvailable).mockReturnValue(false);

    const deps = makeDeps(rootDirectory, createPromptPort(createPromptResult));
    await create({ json: false }, deps);

    expect(deps.exit).not.toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("docker is the preferred"),
    );

    vi.mocked(isDockerAvailable).mockReturnValue(true);
  });

  it("rejects bun without Docker before it writes any file", async () => {
    const { isDockerAvailable } = await import("../../../src/commands/create/docker-check.js");
    vi.mocked(isDockerAvailable).mockReturnValue(false);

    const deps = makeDeps(
      rootDirectory,
      createPromptPort({ ...createPromptResult, packageManager: "bun" }),
    );
    await create({ json: false }, deps);

    expect(deps.exit).toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith(
      "bun needs Docker to pin dependencies. Start Docker, or use --pkg-manager pnpm.",
    );
    expect(existsSync(join(rootDirectory, createPromptResult.name))).toBe(false);

    vi.mocked(isDockerAvailable).mockReturnValue(true);
  });

  it("warns and reports committed: false when git has no author identity", async () => {
    const repoInitialiser = { initialise: vi.fn(() => Promise.resolve({ committed: false })) };
    const deps = makeDeps(rootDirectory, createPromptPort(createPromptResult), { repoInitialiser });
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await create(
      {
        json: true,
        yes: true,
        name: createPromptResult.name,
        runtime: createPromptResult.runtime,
        framework: createPromptResult.framework,
        packageManager: "pnpm",
      },
      deps,
    );

    const envelope = JSON.parse(String(write.mock.calls.at(-1)?.[0]));
    write.mockRestore();
    expect(envelope).toMatchObject({ success: true, committed: false });
    expect(deps.logger.warn).toHaveBeenCalledWith(expect.stringContaining("user.email"));
  });
});
