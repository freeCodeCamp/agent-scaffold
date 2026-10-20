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

  async initialise(projectDirectory: string): Promise<{ committed: boolean }> {
    try {
      await this.run("git", ["init"], projectDirectory);
      const committable = await this.hasAuthorIdentity(projectDirectory);
      await this.run("git", ["add", "."], projectDirectory);
      if (committable) {
        await this.run("git", ["commit", "-m", "chore: initial commit"], projectDirectory);
      }
      return { committed: committable };
    } catch (error) {
      throw new GitError((error as Error).message);
    }
  }

  private async hasAuthorIdentity(projectDirectory: string): Promise<boolean> {
    for (const ident of ["GIT_AUTHOR_IDENT", "GIT_COMMITTER_IDENT"]) {
      try {
        await this.run("git", ["var", ident], projectDirectory);
      } catch {
        return false;
      }
    }
    return true;
  }
}

export { GitRepoInitialiser };
export type { RunCommand };
