import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { databasePackageRoot } from "./paths.js";

export type CommandResult = {
  code: number;
  output: string;
};

export function getPrismaBinaryPath(): string {
  return resolve(
    databasePackageRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.CMD" : "prisma"
  );
}

export async function runCommand(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }
): Promise<CommandResult> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd ?? databasePackageRoot,
      env: {
        ...process.env,
        ...options?.env
      },
      shell: false,
      stdio: "pipe"
    });

    let output = "";
    const appendOutput = (chunk: Buffer | string) => {
      output += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    };

    child.stdout.on("data", appendOutput);

    child.stderr.on("data", appendOutput);

    child.on("error", reject);
    child.on("close", (code) => {
      resolveResult({
        code: code ?? 1,
        output
      });
    });
  });
}
