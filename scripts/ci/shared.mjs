import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WINDOWS_COMMAND_EXTENSIONS = [".cmd", ".exe", ".bat"];

export const projectRoot = path.resolve(__dirname, "../..");
export const portableNodeHome = path.join(projectRoot, ".tools", "node-v24.14.0-win-x64");
export const portableCorepackHome = path.join(projectRoot, ".tools", "corepack-home");
const preferredPortableNodeExecutable = path.join(
  portableNodeHome,
  process.platform === "win32" ? "node.exe" : "node"
);
export const portableNodeExecutable = existsSync(preferredPortableNodeExecutable)
  ? preferredPortableNodeExecutable
  : process.execPath;
export const portablePnpmCli = path.join(
  portableNodeHome,
  "node_modules",
  "corepack",
  "dist",
  "pnpm.js"
);
const portableCorepackPnpmDist = path.join(
  portableCorepackHome,
  "v1",
  "pnpm",
  "9.1.0",
  "dist",
  "pnpm.cjs"
);

function uniquePathEntries(entries) {
  return [...new Set(entries.filter(Boolean))];
}

function resolveExistingDirectories(entries) {
  return entries.filter((entry) => entry && existsSync(entry));
}

function resolveGitHubDesktopGitEntries() {
  if (process.platform !== "win32") {
    return [];
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return [];
  }

  const desktopRoot = path.join(localAppData, "GitHubDesktop");
  if (!existsSync(desktopRoot)) {
    return [];
  }

  return readdirSync(desktopRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("app-"))
    .flatMap((entry) =>
      resolveExistingDirectories([
        path.join(desktopRoot, entry.name, "resources", "app", "git", "cmd"),
        path.join(desktopRoot, entry.name, "resources", "app", "git", "bin")
      ])
    );
}

function resolveCommonWindowsToolEntries() {
  if (process.platform !== "win32") {
    return [];
  }

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA ?? "";
  const appData = process.env.APPDATA ?? "";
  const userProfile = process.env.USERPROFILE ?? "";

  return [
    ...resolveExistingDirectories([
      path.join(programFiles, "nodejs"),
      path.join(programFiles, "Git", "cmd"),
      path.join(programFiles, "Git", "bin"),
      path.join(programFilesX86, "Git", "cmd"),
      path.join(programFilesX86, "Git", "bin"),
      path.join(programFiles, "Docker", "Docker", "resources", "bin"),
      path.join(localAppData, "pnpm"),
      path.join(appData, "npm"),
      path.join(userProfile, "scoop", "shims")
    ]),
    ...resolveGitHubDesktopGitEntries()
  ];
}

function resolvePortablePythonEntries() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return [];
  }

  const programsRoot = path.join(localAppData, "Programs", "Python");
  if (!existsSync(programsRoot)) {
    return [];
  }

  const pythonHomes = readdirSync(programsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^Python3\d{2,}$/.test(entry.name))
    .map((entry) => path.join(programsRoot, entry.name))
    .sort((left, right) => right.localeCompare(left));

  return resolveExistingDirectories([
    ...pythonHomes.flatMap((home) => [home, path.join(home, "Scripts")]),
    path.join(programsRoot, "Launcher")
  ]);
}

export function buildEnv(overrides = {}) {
  const workspaceBin = path.join(projectRoot, "node_modules", ".bin");
  const pathEntries = uniquePathEntries([
    workspaceBin,
    portableNodeHome,
    ...resolveCommonWindowsToolEntries(),
    ...resolvePortablePythonEntries(),
    overrides.PATH,
    process.env.PATH,
  ]);

  const resolvedCorepackHome = (() => {
    const overrideCorepackHome = overrides.COREPACK_HOME;
    if (typeof overrideCorepackHome === "string" && overrideCorepackHome.trim().length > 0) {
      return overrideCorepackHome;
    }

    const envCorepackHome = process.env.COREPACK_HOME;
    if (typeof envCorepackHome === "string" && envCorepackHome.trim().length > 0) {
      return envCorepackHome;
    }

    if (process.platform === "win32" && existsSync(portableCorepackPnpmDist)) {
      return portableCorepackHome;
    }

    return null;
  })();

  const env = {
    ...process.env,
    ...overrides
  };

  if (resolvedCorepackHome) {
    env.COREPACK_HOME = resolvedCorepackHome;
  } else {
    delete env.COREPACK_HOME;
  }

  if ("Path" in env) delete env.Path;
  if ("path" in env) delete env.path;

  env.PATH = pathEntries.join(path.delimiter);
  if (process.platform === "win32") {
    env.Path = env.PATH;
  }
  return env;
}

function findCommandInPath(command, env = process.env) {
  const pathValue = env.PATH ?? "";
  const candidates = process.platform === "win32"
    ? WINDOWS_COMMAND_EXTENSIONS.map((extension) => `${command}${extension}`)
    : [command];

  for (const entry of pathValue.split(path.delimiter)) {
    if (!entry) {
      continue;
    }

    for (const candidate of candidates) {
      const fullPath = path.join(entry, candidate);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

export function resolvePnpmInvocation() {
  const env = buildEnv();
  const npmExecPath = process.env.npm_execpath;
  const bundledCorepackPnpmCli = path.join(
    path.dirname(process.execPath),
    "node_modules",
    "corepack",
    "dist",
    "pnpm.js"
  );

  if (existsSync(portableNodeExecutable) && existsSync(portablePnpmCli)) {
    return {
      argsPrefix: [portablePnpmCli],
      command: portableNodeExecutable,
      env
    };
  }

  if (npmExecPath && npmExecPath.toLowerCase().includes("pnpm")) {
    return {
      argsPrefix: [npmExecPath],
      command: process.execPath,
      env
    };
  }

  if (existsSync(bundledCorepackPnpmCli)) {
    return {
      argsPrefix: [bundledCorepackPnpmCli],
      command: process.execPath,
      env
    };
  }

  const pnpmPath = findCommandInPath("pnpm", env);

  if (pnpmPath) {
    return {
      argsPrefix: [],
      command: pnpmPath,
      env
    };
  }

  throw new Error(
    "Unable to resolve pnpm. Run scripts/bootstrap/install-node-portable.ps1 or install pnpm/corepack in PATH."
  );
}

function shouldUseShell(command) {
  if (process.platform !== "win32") {
    return false;
  }

  return /\.(cmd|bat)$/i.test(command);
}

export function run(command, args, options = {}) {
  const env = buildEnv(options.env);
  console.log(`\n[agent-ci] >>> ${[command, ...args].join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: "utf8",
    env,
    shell: options.shell ?? shouldUseShell(command),
    stdio: options.stdio ?? "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`Command failed: ${[command, ...args].join(" ")}`);
  }

  return result;
}

export function runCapture(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: "utf8",
    env: buildEnv(options.env),
    shell: options.shell ?? shouldUseShell(command),
    stdio: "pipe"
  });
}

export function runPnpm(args, options = {}) {
  const invocation = resolvePnpmInvocation();
  const envOverrides = {
    ...invocation.env,
    ...(options.env ?? {})
  };

  return run(invocation.command, [...invocation.argsPrefix, ...args], {
    ...options,
    env: envOverrides
  });
}

export function capturePnpm(args, options = {}) {
  const invocation = resolvePnpmInvocation();
  const envOverrides = {
    ...invocation.env,
    ...(options.env ?? {})
  };

  return runCapture(invocation.command, [...invocation.argsPrefix, ...args], {
    ...options,
    env: envOverrides
  });
}

export function commandVersion(command, args = ["--version"]) {
  const result = runCapture(command, args);
  if ((result.status ?? 1) !== 0) {
    return null;
  }

  return (result.stdout || result.stderr || "").trim() || null;
}

export function formatNow() {
  return new Date().toISOString();
}
