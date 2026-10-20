import { UsageError } from "../../errors.js";
import {
  frameworkOptions,
  packageManagerOptions,
} from "./layer-composition/allowed-configuration.js";
import type { RuntimeCombinations } from "./layer-composition/allowed-configuration.js";
import type { Runtime } from "./layer-composition/schemas/layers.js";
import type { CreateSelections } from "./prompt/prompt.port.js";

type PathExists = (path: string) => boolean;

const PROJECT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CreateInputValidator {
  validateCreateInput(input: CreateSelections): CreateSelections;
}

class CreateInputValidationService implements CreateInputValidator {
  private readonly pathExists: PathExists;
  private readonly runtimeData: Runtime;

  constructor(pathExists: PathExists, runtimeData: Runtime) {
    this.pathExists = pathExists;
    this.runtimeData = runtimeData;
  }

  validateCreateInput(input: CreateSelections): CreateSelections {
    this.validateName(input.name);

    if (this.pathExists(input.name)) {
      throw new UsageError(`directory "${input.name}" already exists`);
    }

    this.validateRuntimeAndCombinations(input);

    return input;
  }

  private validateName(name: string): void {
    if (PROJECT_NAME_PATTERN.test(name)) {
      return;
    }

    throw new UsageError(
      `invalid project name "${name}": use lowercase letters and digits, with single hyphens between them (no leading, trailing, or double hyphen)`,
    );
  }

  private validateRuntimeAndCombinations(input: CreateSelections): void {
    const isValidRuntime = input.runtime in this.runtimeData;

    if (!isValidRuntime) {
      throw new UsageError(`unsupported runtime "${input.runtime}"`);
    }

    const config: RuntimeCombinations = {
      frameworks: frameworkOptions(this.runtimeData, input.runtime),
      packageManagers: packageManagerOptions(this.runtimeData, input.runtime),
    };

    this.validateRuntimeSelections(input, config);
  }

  private validateRuntimeSelections(input: CreateSelections, config: RuntimeCombinations): void {
    if (!config.frameworks.includes(input.framework)) {
      throw new UsageError(
        `unsupported framework "${input.framework}" for runtime "${input.runtime}"`,
      );
    }

    if (config.packageManagers.length > 0) {
      if (
        input.packageManager === undefined ||
        !config.packageManagers.includes(input.packageManager)
      ) {
        throw new UsageError(
          `Runtime requires a supported package manager (${config.packageManagers.join(", ")})`,
        );
      }
    } else if (input.packageManager !== undefined) {
      throw new UsageError("This runtime does not support a package manager");
    }
  }
}

export { CreateInputValidationService };
export type { PathExists, CreateInputValidator };
