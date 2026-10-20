import { isCancel, multiselect, select, text } from "@clack/prompts";
import type { CreateSelections, PackageManagerOption, Prompt } from "./prompt.port.js";
import {
  recommendedFrameworkOptions,
  recommendedPackageManagerOptions,
  recommendedRuntimeOptions,
} from "../layer-composition/allowed-configuration.js";
import type { Labels } from "../layer-composition/schemas/labels.js";
import type {
  Framework,
  PackageManager as PackageManagerRegistry,
  Runtime,
} from "../layer-composition/schemas/layers.js";
import { getLabel } from "../layer-composition/labels.js";
import type { LabelCategory } from "../layer-composition/labels.js";
import { UsageError } from "../../../errors.js";
import { PROJECT_NAME_PATTERN, PROJECT_NAME_RULE } from "../create-input-validation-service.js";

interface ClackPromptApi {
  isCancel(value: unknown): value is symbol;
  multiselect(options: {
    message: string;
    options: { label: string; value: string }[];
    required?: boolean;
  }): Promise<string[] | symbol>;
  select(options: {
    message: string;
    options: { label: string; value: string }[];
  }): Promise<string | symbol>;
  text(options: {
    message: string;
    placeholder?: string;
    validate?: (value: string | undefined) => string | Error | undefined;
  }): Promise<string | symbol>;
}

const defaultClackApi: ClackPromptApi = {
  isCancel,
  multiselect,
  select,
  text,
};

class ClackPrompt implements Prompt {
  private readonly api: ClackPromptApi;
  private readonly frameworks: Framework;
  private readonly labels: Labels;
  private readonly packageManagers: PackageManagerRegistry;
  private readonly runtimeData: Runtime;

  constructor(
    runtimeData: Runtime,
    labels: Labels,
    frameworks: Framework,
    packageManagers: PackageManagerRegistry,
    api: ClackPromptApi = defaultClackApi,
  ) {
    this.runtimeData = runtimeData;
    this.labels = labels;
    this.frameworks = frameworks;
    this.packageManagers = packageManagers;
    this.api = api;
  }

  private toPromptOptions<T extends string>(
    values: T[],
    category: LabelCategory,
  ): { label: string; value: T }[] {
    return values.map((value) => ({
      label: getLabel(this.labels, category, value),
      value,
    }));
  }

  async promptForCreateInputs(): Promise<CreateSelections | null> {
    const name = await this.api.text({
      message: "Enter project name",
      placeholder: "my-project",
      validate: (value) => {
        if (value !== undefined && PROJECT_NAME_PATTERN.test(value)) {
          return undefined;
        }

        return `Name: ${PROJECT_NAME_RULE}.`;
      },
    });

    if (this.api.isCancel(name)) {
      return null;
    }

    const runtimes = recommendedRuntimeOptions(this.runtimeData);
    if (runtimes.length === 0) {
      throw new UsageError("No recommended runtimes available — update your templates.");
    }

    let runtime: string;
    if (runtimes.length === 1) {
      runtime = runtimes[0];
    } else {
      const runtimeResult = await this.api.select({
        message: "Select runtime",
        options: this.toPromptOptions(runtimes, "runtime"),
      });

      if (this.api.isCancel(runtimeResult)) {
        return null;
      }
      runtime = runtimeResult;
    }

    const frameworks = recommendedFrameworkOptions(this.runtimeData, runtime, this.frameworks);
    if (frameworks.length === 0) {
      throw new UsageError(
        `No recommended frameworks for runtime "${runtime}" — update your templates.`,
      );
    }

    let framework: string;
    if (frameworks.length === 1) {
      framework = frameworks[0];
    } else {
      const frameworkResult = await this.api.select({
        message: "Select framework",
        options: this.toPromptOptions(frameworks, "framework"),
      });

      if (this.api.isCancel(frameworkResult)) {
        return null;
      }
      framework = frameworkResult;
    }

    const recPackageManagers = recommendedPackageManagerOptions(
      this.runtimeData,
      runtime,
      this.packageManagers,
    );
    if (recPackageManagers.length === 0) {
      throw new UsageError(
        `No recommended package managers for runtime "${runtime}" — update your templates.`,
      );
    }

    let packageManager: string | symbol | undefined;
    if (recPackageManagers.length === 1) {
      packageManager = recPackageManagers[0];
    } else {
      packageManager = await this.api.select({
        message: "Select package manager",
        options: this.toPromptOptions(
          recPackageManagers as PackageManagerOption[],
          "packageManager",
        ),
      });

      if (this.api.isCancel(packageManager)) {
        return null;
      }
    }

    return {
      framework,
      name,
      runtime,
      ...(packageManager !== undefined && {
        packageManager: packageManager as PackageManagerOption,
      }),
    };
  }
}

export { ClackPrompt };
export type { ClackPromptApi };
