import { describe, it, expect, vi } from "vitest";
import { GitError } from "../../../../src/errors.js";
import { GitRepoInitialiser } from "../../../../src/commands/create/io/git-repo-initialiser.js";

describe(GitRepoInitialiser, () => {
  it("runs git init, git add ., and git commit in order", async () => {
    const calls: [string, string[]][] = [];
    const run = vi.fn((command: string, args: string[]) => {
      calls.push([command, args]);
      return Promise.resolve();
    });
    const adapter = new GitRepoInitialiser(run);

    await adapter.initialise("/some/project");

    expect(calls).toStrictEqual([
      ["git", ["init"]],
      ["git", ["add", "."]],
      ["git", ["commit", "-m", "chore: initial commit"]],
    ]);
  });

  it("throws RepoInitialisationError when any git command exits non-zero", async () => {
    const run = vi.fn(() => Promise.reject(new Error("git exited with code 128")));
    const adapter = new GitRepoInitialiser(run);

    await expect(adapter.initialise("/some/project")).rejects.toBeInstanceOf(GitError);
  });

  it("keeps the repo with staged files when git has no author identity", async () => {
    const calls: string[] = [];
    const run = vi.fn((_command: string, args: string[]) => {
      calls.push(args[0] ?? "");
      return args[0] === "commit"
        ? Promise.reject(new Error("Command failed: git commit\nAuthor identity unknown"))
        : Promise.resolve();
    });
    const adapter = new GitRepoInitialiser(run);

    await expect(adapter.initialise("/some/project")).resolves.toBeUndefined();
    expect(calls).toStrictEqual(["init", "add", "commit"]);
  });
});
