import { describe, expect, it } from "vitest";
import type {
  CreateSelections,
  Prompt,
} from "../../../../src/commands/create/prompt/prompt.port.js";
import { ClackPrompt } from "../../../../src/commands/create/prompt/clack-prompt.js";
import type { ClackPromptApi } from "../../../../src/commands/create/prompt/clack-prompt.js";
import {
  FrameworkSchema,
  PackageManagerSchema,
  RuntimeSchema,
} from "../../../../src/commands/create/layer-composition/schemas/layers.js";
import { LabelsSchema } from "../../../../src/commands/create/layer-composition/schemas/labels.js";
import runtimeFixture from "../../../fixtures/templates/layers/runtime.json";
import frameworkFixture from "../../../fixtures/templates/layers/framework.json";
import packageManagerFixture from "../../../fixtures/templates/layers/package-manager.json";
import labelsFixture from "../../../fixtures/templates/labels.json";

const runtimeData = RuntimeSchema.parse(runtimeFixture);
const frameworkData = FrameworkSchema.parse(frameworkFixture);
const packageManagerData = PackageManagerSchema.parse(packageManagerFixture);
const labelsData = LabelsSchema.parse(labelsFixture);
const CANCELLED = Symbol("cancelled");

const createMockApi = (selectResponses: string[] = ["node", "express", "pnpm"]): ClackPromptApi => {
  const selectQueue = [...selectResponses];

  return {
    isCancel(value: unknown): value is symbol {
      return value === CANCELLED;
    },
    multiselect() {
      return Promise.resolve([]);
    },
    select() {
      return Promise.resolve(selectQueue.shift() ?? "None");
    },
    text() {
      return Promise.resolve("hello-scaffold");
    },
  };
};

describe(ClackPrompt, () => {
  it("prompts in the required order for Node runtime", async () => {
    const events: string[] = [];
    const selectQueue = ["node", "typescript", "pnpm"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["node", "typescript", "pnpm"]),
      select(options) {
        events.push(options.message);
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
      text(options) {
        events.push(options.message);
        return Promise.resolve("hello-scaffold");
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    await adapter.promptForCreateInputs();

    expect(events).toStrictEqual([
      "Enter project name",
      "Select runtime",
      "Select framework",
      "Select package manager",
    ]);
  });

  it("prompts for package manager when runtime is static_web (2 package managers)", async () => {
    const events: string[] = [];
    const selectQueue = ["static_web", "html-css-js", "pnpm"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["static_web", "html-css-js", "pnpm"]),
      select(options) {
        events.push(options.message);
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
      text(options) {
        events.push(options.message);
        return Promise.resolve("hello-scaffold");
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    await adapter.promptForCreateInputs();

    expect(events).toStrictEqual([
      "Enter project name",
      "Select runtime",
      "Select framework",
      "Select package manager",
    ]);
  });

  it("returns null when cancelled", async () => {
    const mockApi: ClackPromptApi = {
      ...createMockApi(),
      text() {
        return Promise.resolve(CANCELLED);
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    const result = await adapter.promptForCreateInputs();

    expect(result).toBeNull();
  });

  it("provides actionable validation feedback for invalid names", async () => {
    let validationMessage = "";
    const mockApi: ClackPromptApi = {
      ...createMockApi(),
      text(options) {
        const validate = options.validate as (
          value: string | undefined,
        ) => string | Error | undefined;
        validationMessage = validate("InvalidName") as string;
        return Promise.resolve("hello-scaffold");
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    await adapter.promptForCreateInputs();

    expect(validationMessage).toBe(
      "Name must be lowercase kebab-case, start with a letter, and be 3–50 characters long.",
    );
  });

  it("returns selected values including package manager for Node runtime", async () => {
    const expected: CreateSelections = {
      framework: "express",
      name: "hello-scaffold",
      packageManager: "pnpm",
      runtime: "node",
    };

    const mockApi = createMockApi(["node", "express", "pnpm"]);

    const adapter: Prompt = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    const result = await adapter.promptForCreateInputs();

    expect(result).toStrictEqual(expected);
  });

  it("returns selected values with package manager for Static runtime", async () => {
    const expected: CreateSelections = {
      framework: "html-css-js",
      name: "hello-scaffold",
      packageManager: "pnpm",
      runtime: "static_web",
    };

    const mockApi = createMockApi(["static_web", "html-css-js", "pnpm"]);

    const adapter: Prompt = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );

    const result = await adapter.promptForCreateInputs();

    expect(result).toStrictEqual(expected);
  });

  it("auto-selects the sole package manager without showing the prompt", async () => {
    const singlePm = PackageManagerSchema.parse({
      pnpm: { ...packageManagerFixture["pnpm"], recommended: true },
      bun: { ...packageManagerFixture["bun"], recommended: false },
    });
    const events: string[] = [];
    const selectQueue = ["node", "express"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["node", "express"]),
      select(options) {
        events.push(options.message);
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
    };

    const adapter = new ClackPrompt(runtimeData, labelsData, frameworkData, singlePm, mockApi);
    const result = await adapter.promptForCreateInputs();

    expect(result?.packageManager).toBe("pnpm");
    expect(events).not.toContain("Select package manager");
  });

  it("auto-selects runtime when exactly 1 is recommended", async () => {
    const singleRuntime = RuntimeSchema.parse({
      node: { ...runtimeFixture["node"], recommended: true },
      static_web: { ...runtimeFixture["static_web"], recommended: false },
    });
    const events: string[] = [];
    const selectQueue = ["express", "pnpm"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["express", "pnpm"]),
      select(options) {
        events.push(options.message);
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
    };

    const adapter = new ClackPrompt(
      singleRuntime,
      labelsData,
      frameworkData,
      packageManagerData,
      mockApi,
    );
    const result = await adapter.promptForCreateInputs();

    expect(result?.runtime).toBe("node");
    expect(events).not.toContain("Select runtime");
  });

  it("throws UsageError when 0 runtimes are recommended", async () => {
    const noRuntime = RuntimeSchema.parse({
      node: { ...runtimeFixture["node"], recommended: false },
      static_web: { ...runtimeFixture["static_web"], recommended: false },
    });

    const adapter = new ClackPrompt(
      noRuntime,
      labelsData,
      frameworkData,
      packageManagerData,
      createMockApi(),
    );

    await expect(adapter.promptForCreateInputs()).rejects.toThrow("No recommended runtimes");
  });

  it("auto-selects framework when exactly 1 is recommended", async () => {
    const singleFramework = FrameworkSchema.parse({
      ...frameworkFixture,
      express: { ...frameworkFixture["express"], recommended: true },
      "react-vite": { ...frameworkFixture["react-vite"], recommended: false },
      "tanstack-shadcn": { ...frameworkFixture["tanstack-shadcn"], recommended: false },
      typescript: { ...frameworkFixture["typescript"], recommended: false },
    });
    const events: string[] = [];
    const selectQueue = ["node", "pnpm"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["node", "pnpm"]),
      select(options) {
        events.push(options.message);
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      singleFramework,
      packageManagerData,
      mockApi,
    );
    const result = await adapter.promptForCreateInputs();

    expect(result?.framework).toBe("express");
    expect(events).not.toContain("Select framework");
  });

  it("throws UsageError when 0 frameworks are recommended", async () => {
    const noFramework = FrameworkSchema.parse({
      ...frameworkFixture,
      express: { ...frameworkFixture["express"], recommended: false },
      "html-css-js": { ...frameworkFixture["html-css-js"], recommended: false },
      "react-vite": { ...frameworkFixture["react-vite"], recommended: false },
      "tanstack-shadcn": { ...frameworkFixture["tanstack-shadcn"], recommended: false },
      typescript: { ...frameworkFixture["typescript"], recommended: false },
    });

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      noFramework,
      packageManagerData,
      createMockApi(["node"]),
    );

    await expect(adapter.promptForCreateInputs()).rejects.toThrow("No recommended frameworks");
  });

  it("throws UsageError when 0 package managers are recommended", async () => {
    const noPm = PackageManagerSchema.parse({
      pnpm: { ...packageManagerFixture["pnpm"], recommended: false },
      bun: { ...packageManagerFixture["bun"], recommended: false },
    });

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      frameworkData,
      noPm,
      createMockApi(["node", "express"]),
    );

    await expect(adapter.promptForCreateInputs()).rejects.toThrow(
      "No recommended package managers",
    );
  });

  it("shows only recommended options when >1 are recommended", async () => {
    const partialFrameworks = FrameworkSchema.parse({
      ...frameworkFixture,
      express: { ...frameworkFixture["express"], recommended: true },
      typescript: { ...frameworkFixture["typescript"], recommended: true },
      "react-vite": { ...frameworkFixture["react-vite"], recommended: false },
      "tanstack-shadcn": { ...frameworkFixture["tanstack-shadcn"], recommended: false },
    });
    let frameworkOptions: { label: string; value: string }[] = [];
    const selectQueue = ["node", "express", "pnpm"];
    const mockApi: ClackPromptApi = {
      ...createMockApi(["node", "express", "pnpm"]),
      select(options) {
        if (options.message === "Select framework") {
          frameworkOptions = options.options;
        }
        const nextSelection = selectQueue.shift() as string;
        return Promise.resolve(nextSelection);
      },
    };

    const adapter = new ClackPrompt(
      runtimeData,
      labelsData,
      partialFrameworks,
      packageManagerData,
      mockApi,
    );
    await adapter.promptForCreateInputs();

    const values = frameworkOptions.map((o) => o.value);
    expect(values).toStrictEqual(["express", "typescript"]);
  });
});
