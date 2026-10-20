import { describe, expect, it } from "vitest";
import { UsageError } from "../../../src/errors.js";
import type {
  CreateSelections,
  PackageManagerOption,
} from "../../../src/commands/create/prompt/prompt.port.js";
import { CreateInputValidationService } from "../../../src/commands/create/create-input-validation-service.js";
import { RuntimeSchema } from "../../../src/commands/create/layer-composition/schemas/layers.js";
import runtimeFixture from "../../fixtures/templates/layers/runtime.json";

const runtimeData = RuntimeSchema.parse(runtimeFixture);

const validNodeSelection: CreateSelections = {
  framework: "express",
  name: "hello-scaffold",
  packageManager: "pnpm",
  runtime: "node",
};

describe(CreateInputValidationService, () => {
  it("accepts supported Node.js combinations", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const result = service.validateCreateInput(validNodeSelection);

    expect(result).toStrictEqual(validNodeSelection);
  });

  it("accepts bun as package manager for Node runtime", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const result = service.validateCreateInput({
      ...validNodeSelection,
      packageManager: "bun",
    });

    expect(result.packageManager).toBe("bun");
  });

  it("accepts supported Static combination", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const result = service.validateCreateInput({
      framework: "html-css-js",
      name: "site-app",
      packageManager: "pnpm",
      runtime: "static_web",
    });

    expect(result.runtime).toBe("static_web");
  });

  it("rejects invalid project names", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const act = () =>
      service.validateCreateInput({
        ...validNodeSelection,
        name: "InvalidName",
      });

    expect(act).toThrow(UsageError);
    expect(act).toThrow(
      'invalid project name "InvalidName": use lowercase letters and digits, with single hyphens between them (no leading, trailing, or double hyphen)',
    );
  });

  it("rejects existing target directory", () => {
    const service = new CreateInputValidationService(() => true, runtimeData);

    const act = () => service.validateCreateInput(validNodeSelection);

    expect(act).toThrow(UsageError);
  });

  it("rejects unsupported runtimes", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const act = () =>
      service.validateCreateInput({
        ...validNodeSelection,
        runtime: "Python",
      });

    expect(act).toThrow(UsageError);
  });

  it("rejects unsupported frameworks for Node runtime", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const act = () =>
      service.validateCreateInput({
        ...validNodeSelection,
        framework: "Flask",
      });

    expect(act).toThrow(UsageError);
  });

  it("rejects missing package manager for Node runtime", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);
    const { packageManager: _pm, ...selectionWithoutPm } = validNodeSelection;

    const act = () => service.validateCreateInput(selectionWithoutPm);

    expect(act).toThrow(UsageError);
  });

  it("rejects unsupported package manager for Node runtime", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const act = () =>
      service.validateCreateInput({
        ...validNodeSelection,
        packageManager: "npm" as unknown as PackageManagerOption,
      });

    expect(act).toThrow(UsageError);
  });

  it("rejects missing package manager for static_web runtime", () => {
    const service = new CreateInputValidationService(() => false, runtimeData);

    const act = () =>
      service.validateCreateInput({
        framework: "html-css-js",
        name: "site-app",
        runtime: "static_web",
      });

    expect(act).toThrow(UsageError);
  });
});
