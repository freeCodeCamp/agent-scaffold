import type { PackageManagerOption } from "../layer-composition/schemas/layers.js";

interface CreateSelections {
  name: string;
  runtime: string;
  framework: string;
  packageManager?: PackageManagerOption;
}

interface Prompt {
  promptForCreateInputs(): Promise<CreateSelections | null>;
}

export type { CreateSelections, PackageManagerOption, Prompt };
