import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RepoInitialiser } from "./repo-initialiser.port.js";
import { GitError } from "../../../errors.js";

type RunCommand = (command: string, args: string[], cwd: string) => Promise<void>;

const execFileAsync = promisify(execFile);

const defaultRun: RunCommand = async (command, args, cwd) => {
  await execFileAsync(command, args, { cwd });
};

class GitRepoInitialiser implements RepoInitialiser {
  private readonly run: RunCommand;

  constructor(run: RunCommand = defaultRun) {
    this.run = run;
  }

  async initialise(projectDirectory: string): Promise<void> {
    try {
      await this.run("git", ["init"], projectDirectory);
      await this.run("git", ["add", "."], projectDirectory);
      await this.run("git", ["commit", "-m", "chore: initial commit"], projectDirectory);
    } catch (error) {
      if ((error as Error).message.includes("Author identity unknown")) return;
      throw new GitError((error as Error).message);
    }
  }
}

export { GitRepoInitialiser };
export type { RunCommand };
