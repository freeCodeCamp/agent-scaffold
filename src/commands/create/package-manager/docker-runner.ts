import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const IMAGE_TAG = "agent-scaffold-runner:pm";

const ensureImageBuilt = async (cwd: string): Promise<void> => {
  const dockerfile = resolve(cwd, "Dockerfile");
  const context = dirname(dockerfile);

  await execFileAsync(
    "docker",
    ["build", "--file", dockerfile, "--target", "package-manager", "--tag", IMAGE_TAG, context],
    { encoding: "utf8" },
  );
};

const runCmdForFiles = async (
  cwd: string,
  cmd: string[],
  inputs: string[],
  outputs: string[],
): Promise<void> => {
  await ensureImageBuilt(cwd);

  const { stdout: idRaw } = await execFileAsync(
    "docker",
    ["create", "-w", "/app", IMAGE_TAG, ...cmd],
    { encoding: "utf8" },
  );
  const id = idRaw.trim();

  try {
    await Promise.all(
      inputs.map((file) =>
        execFileAsync("docker", ["cp", `${cwd}/${file}`, `${id}:/app/${file}`], {
          encoding: "utf8",
        }),
      ),
    );

    await execFileAsync("docker", ["start", "--attach", id], { encoding: "utf8" });

    await Promise.all(
      outputs.map((file) =>
        execFileAsync("docker", ["cp", `${id}:/app/${file}`, `${cwd}/${file}`], {
          encoding: "utf8",
        }),
      ),
    );
  } catch (err) {
    const error = err as Error & { stdout: string; stderr: string };
    error.message = `${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`;
    throw error;
  } finally {
    await execFileAsync("docker", ["rm", id], { encoding: "utf8" });
  }
};

const runCmdForStdout = async (cwd: string, cmd: string[], inputs: string[]): Promise<string> => {
  await ensureImageBuilt(cwd);

  const { stdout: idRaw } = await execFileAsync(
    "docker",
    ["create", "-w", "/app", IMAGE_TAG, ...cmd],
    { encoding: "utf8" },
  );
  const id = idRaw.trim();

  try {
    await Promise.all(
      inputs.map((file) =>
        execFileAsync("docker", ["cp", `${cwd}/${file}`, `${id}:/app/${file}`], {
          encoding: "utf8",
        }),
      ),
    );

    const { stdout } = await execFileAsync("docker", ["start", "-a", id], { encoding: "utf8" });
    return stdout;
  } catch (err) {
    const error = err as Error & { stdout: string; stderr: string };
    error.message = `${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`;
    throw error;
  } finally {
    await execFileAsync("docker", ["rm", id], { encoding: "utf8" });
  }
};

export { runCmdForFiles, runCmdForStdout };
