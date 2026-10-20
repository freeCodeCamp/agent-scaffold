import { existsSync } from "node:fs";
import type { ProjectWriter } from "./io/project-writer.port.js";
import {
  LayerCompositionService,
  type LayerComposer,
} from "./layer-composition/layer-composition-service.js";
import {
  PackageManagerService,
  type PackageManager,
} from "./package-manager/package-manager.service.js";
import { BunPackageManager } from "./package-manager/bun-package-manager.js";
import { PnpmPackageManager } from "./package-manager/pnpm-package-manager.js";
import type { CreateSelections, Prompt } from "./prompt/prompt.port.js";
import { ClackPrompt } from "./prompt/clack-prompt.js";
import type { DonationConfigWriter } from "./io/donation-config-writer.port.js";
import { LocalDonationConfigWriter } from "./io/local-donation-config-writer.js";
import type { RepoInitialiser } from "./io/repo-initialiser.port.js";
import { GitRepoInitialiser } from "./io/git-repo-initialiser.js";
import type { SkillInstaller } from "./io/skill-installer.port.js";
import { NpxSkillInstaller } from "./io/npx-skill-installer.js";
import {
  CreateInputValidationService,
  type CreateInputValidator,
} from "./create-input-validation-service.js";
import {
  recommendedFrameworkOptions,
  recommendedPackageManagerOptions,
  recommendedRuntimeOptions,
} from "./layer-composition/allowed-configuration.js";
import type { PackageManagerOption } from "./layer-composition/schemas/layers.js";
import { getLabel } from "./layer-composition/labels.js";
import { clackLogger, silentLogger, type Logger } from "../../output/logger.js";
import { clackSpinner, silentSpinner, type Spinner } from "../../output/spinner.js";
import { exitWithCode } from "../../output/exit-codes.js";
import { UsageError } from "../../errors.js";
import { buildEnvelope } from "../../output/envelope.js";
import { emitJson, outputError } from "../../output/format.js";
import { LocalProjectWriter } from "./io/local-project-writer.js";
import { loadFromDir, type TemplateData } from "./layer-composition/template-provider.js";
import { bsd3ClauseLicense } from "./layer-composition/licenses/bsd-3-clause.js";
import { bundledTemplatesDir } from "./layer-composition/templates-dir.js";
import { isDockerAvailable } from "./docker-check.js";

export interface HandlerResult {
  exitCode: number;
  meta?: Record<string, string>;
}

const defaultFilesystemWriter: ProjectWriter = new LocalProjectWriter();

export interface CreateOptions {
  json: boolean;
  yes?: boolean;
  name?: string;
  runtime?: string;
  framework?: string;
  packageManager?: string;
}

export interface CreateDeps {
  cwd?: string;
  donationConfigWriter?: DonationConfigWriter;
  exit?: (code: number) => void;
  filesystemWriter?: ProjectWriter;
  isTTY?: boolean;
  layerResolver?: LayerComposer;
  logger?: Logger;
  packageManager?: PackageManager;
  prompt?: Prompt;
  repoInitialiser?: RepoInitialiser;
  skillInstaller?: SkillInstaller;
  spinner?: Spinner;
  loadLayersFn?: (dir: string) => Promise<TemplateData>;
  validator?: CreateInputValidator;
}

export const create = async (options: CreateOptions, deps: CreateDeps = {}): Promise<void> => {
  const cwd = deps.cwd ?? process.cwd();
  const exit = deps.exit ?? exitWithCode;
  const filesystemWriter = deps.filesystemWriter ?? defaultFilesystemWriter;
  const logger = deps.logger ?? (options.json ? silentLogger : clackLogger);
  const packageManager =
    deps.packageManager ??
    new PackageManagerService({
      pnpm: new PnpmPackageManager(),
      bun: new BunPackageManager(),
    });
  const donationConfigWriter = deps.donationConfigWriter ?? new LocalDonationConfigWriter();
  const repoInitialiser = deps.repoInitialiser ?? new GitRepoInitialiser();
  const skillInstaller = deps.skillInstaller ?? new NpxSkillInstaller();
  const isTTY = process.stdin.isTTY;
  const spinner = deps.spinner ?? (options.json || !isTTY ? silentSpinner() : clackSpinner());

  try {
    const envDir = process.env["AGENT_SCAFFOLD_TEMPLATES_DIR"];
    const templateDir = envDir && envDir.length > 0 ? envDir : await bundledTemplatesDir();

    const loadLayersFn = deps.loadLayersFn ?? loadFromDir;
    const { labels, registry } = await loadLayersFn(templateDir);

    const isTTY = deps.isTTY ?? Boolean(process.stdin.isTTY);
    const interactive = isTTY && !options.yes && !options.json;

    const prompt =
      deps.prompt ??
      new ClackPrompt(registry.runtime, labels, registry.frameworks, registry["package-managers"]);
    const layerResolver = deps.layerResolver ?? new LayerCompositionService(labels, registry);
    const validator =
      deps.validator ??
      new CreateInputValidationService((path) => existsSync(path), registry.runtime);

    let selections: CreateSelections;

    if (!isDockerAvailable()) {
      logger.warn(
        "docker is the preferred tool for scaffolding projects.\nLocal alternatives will be used where possible, but docker should be used for predictable results.",
      );
    }

    if (interactive) {
      const promptResult = await prompt.promptForCreateInputs();

      if (promptResult === null) {
        throw new UsageError("Create cancelled.");
      }

      const summaryLines = [
        `Creating project with:`,
        `- Name: ${promptResult.name}`,
        `- Runtime: ${getLabel(labels, "runtime", promptResult.runtime)}`,
        `- Framework: ${getLabel(labels, "framework", promptResult.framework)}`,
      ];

      if (promptResult.packageManager !== undefined) {
        summaryLines.push(
          `- Package manager: ${getLabel(labels, "packageManager", promptResult.packageManager)}`,
        );
      }

      logger.info(summaryLines.join("\n"));

      selections = promptResult;
    } else {
      if (!options.name) {
        throw new UsageError("--name is required in non-interactive mode");
      }

      const recRuntimes = recommendedRuntimeOptions(registry.runtime);
      const runtime = options.runtime ?? recRuntimes[0];
      if (runtime === undefined) {
        throw new UsageError(
          "No recommended runtimes — specify --runtime explicitly or update templates.",
        );
      }

      const recFrameworks = recommendedFrameworkOptions(
        registry.runtime,
        runtime,
        registry.frameworks,
      );
      const framework = options.framework ?? recFrameworks[0];
      if (framework === undefined) {
        throw new UsageError(
          `No recommended frameworks for runtime "${runtime}" — specify --framework explicitly or update templates.`,
        );
      }

      const recPMs = recommendedPackageManagerOptions(
        registry.runtime,
        runtime,
        registry["package-managers"],
      );
      const pm =
        options.packageManager !== undefined
          ? (options.packageManager as PackageManagerOption)
          : recPMs.length > 0
            ? (recPMs[0] as PackageManagerOption)
            : undefined;
      if (pm === undefined) {
        throw new UsageError(
          `No recommended package managers for runtime "${runtime}" — specify --packageManager explicitly or update templates.`,
        );
      }

      selections = {
        name: options.name,
        runtime,
        framework,
        ...(pm !== undefined ? { packageManager: pm } : {}),
      };
    }

    spinner.start("Preparing your project");

    const validatedInput = validator.validateCreateInput(selections);

    spinner.message("Composing project layers");
    const resolvedLayers = layerResolver.resolveLayers(validatedInput);
    const targetDirectory = `${cwd}/${validatedInput.name}`;

    spinner.message("Writing project files");
    await filesystemWriter.writeProject(targetDirectory, resolvedLayers.files);

    if (Object.keys(resolvedLayers.symlinks).length > 0) {
      spinner.message("Creating symlinks");
      await filesystemWriter.createSymlinks(targetDirectory, resolvedLayers.symlinks);
    }

    spinner.message("Adding LICENSE");
    await filesystemWriter.writeProject(targetDirectory, {
      LICENSE: bsd3ClauseLicense,
    });

    const manager = validatedInput.packageManager;

    if (manager !== undefined) {
      spinner.message(`Pinning dependencies with ${manager}`);
      await packageManager.specifyDeps({
        manager,
        pmVersion: registry["package-managers"][manager]?.pmVersion ?? "",
        projectDirectory: targetDirectory,
      });
    }

    const skills = registry.frameworks[validatedInput.framework]?.skills;
    if (skills && skills.length > 0) {
      spinner.message("Installing skills");
      try {
        await skillInstaller.installSkills(skills, targetDirectory);
      } catch (err) {
        // Non-fatal: the project is already scaffolded. Route the failure to
        // the logger (stderr / silent in --json mode) so it never lands on
        // stdout and corrupts emitJson's envelope.
        logger.error(err instanceof Error ? err.message : String(err));
      }
    }

    spinner.message("Writing donation config");
    await donationConfigWriter.write(targetDirectory);

    spinner.message("Initialising git repository");
    await repoInitialiser.initialise(targetDirectory);

    spinner.stop("Project scaffolded");

    if (isDockerAvailable()) {
      logger.success(
        `cd into ${validatedInput.name} and run ` +
          "`docker compose up --watch` to start the project",
      );
    }

    if (options.json) {
      emitJson(
        buildEnvelope("create", true, {
          path: targetDirectory,
          name: validatedInput.name,
          runtime: validatedInput.runtime,
          framework: validatedInput.framework,
          packageManager: validatedInput.packageManager ?? null,
        }),
      );
      return;
    }
  } catch (err) {
    spinner.error("Create failed");
    exit(outputError({ json: options.json, command: "create" }, err, { logError: logger.error }));
  }
};
