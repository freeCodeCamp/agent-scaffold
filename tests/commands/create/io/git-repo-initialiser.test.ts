import { describe, it, expect, vi } from "vitest";
import { GitError } from "../../../../src/errors.js";
import { GitRepoInitialiser } from "../../../../src/commands/create/io/git-repo-initialiser.js";

describe(GitRepoInitialiser, () => {
  it("checks the author identity, then runs git init, add and commit in order", async () => {
    const calls: [string, string[]][] = [];
    const run = vi.fn((command: string, args: string[]) => {
      calls.push([command, args]);
      return Promise.resolve();
    });
    const adapter = new GitRepoInitialiser(run);

    await expect(adapter.initialise("/some/project")).resolves.toStrictEqual({ committed: true });

    expect(calls).toStrictEqual([
      ["git", ["init"]],
      ["git", ["var", "GIT_AUTHOR_IDENT"]],
      ["git", ["var", "GIT_COMMITTER_IDENT"]],
      ["git", ["add", "."]],
      ["git", ["commit", "-m", "chore: initial commit"]],
    ]);
  });

  it("throws GitError when a git command exits non-zero", async () => {
    const run = vi.fn(() => Promise.reject(new Error("git exited with code 128")));
    const adapter = new GitRepoInitialiser(run);

    await expect(adapter.initialise("/some/project")).rejects.toBeInstanceOf(GitError);
  });

  it("stages the files without a commit when git has no author identity", async () => {
    const calls: string[] = [];
    const run = vi.fn((_command: string, args: string[]) => {
      calls.push(args.join(" "));
      return args.join(" ") === "var GIT_COMMITTER_IDENT"
        ? Promise.reject(new Error("exit code 1"))
        : Promise.resolve();
    });
    const adapter = new GitRepoInitialiser(run);

    await expect(adapter.initialise("/some/project")).resolves.toStrictEqual({ committed: false });
    expect(calls).toStrictEqual([
      "init",
      "var GIT_AUTHOR_IDENT",
      "var GIT_COMMITTER_IDENT",
      "add .",
    ]);
  });
});
