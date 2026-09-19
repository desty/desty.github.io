#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const source = args.get("--repo");
const promptFile = args.get("--prompt");
const testCommand = args.get("--test");
const budget = Number(args.get("--budget") ?? "1");
const model = args.get("--model") ?? "sonnet";
const execute = args.get("--execute") === "yes";
const claudeBin = args.get("--claude") ?? "/Users/desty/.local/bin/claude";
const timeoutMs = Number(args.get("--timeout-ms") ?? "180000");

if (!source || !promptFile || !testCommand) {
  console.error("Usage: node bench/agent-ab.mjs --repo PATH --prompt FILE --test COMMAND [--budget 1] [--model sonnet] [--execute yes]");
  process.exit(2);
}

const sourcePath = resolve(source);
const prompt = await readFile(resolve(promptFile), "utf8");
const runRoot = await mkdir(join(tmpdir(), "jev-context-ab"), { recursive: true }).then(() =>
  join(tmpdir(), "jev-context-ab", `${Date.now()}-${basename(sourcePath)}`),
);
await mkdir(runRoot, { recursive: true });

const variants = ["native", "jev"];
for (const variant of variants) {
  const destination = join(runRoot, variant);
  await cp(sourcePath, destination, {
    recursive: true,
    filter: (path) => {
      const local = relative(sourcePath, path);
      return !/(?:^|\/)(?:\.git|node_modules)(?:\/|$)/.test(local);
    },
  });
}

const plan = {
  source: sourcePath,
  runRoot,
  model,
  maxBudgetUsdPerRun: budget,
  testCommand,
  promptChars: prompt.length,
  variants,
  claudeBin,
  timeoutMs,
};
await writeFile(join(runRoot, "plan.json"), JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));

if (!execute) {
  console.log("Dry run only. Add --execute yes after reviewing the copied workspaces and budget.");
  process.exit(0);
}

async function command(command, options) {
  const started = performance.now();
  return await new Promise((resolvePromise) => {
    const child = spawn(command[0], command.slice(1), { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => resolvePromise({
      code: null,
      stdout,
      stderr: `${stderr}${error.message}`,
      wallMs: Math.round(performance.now() - started),
    }));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolvePromise({
      code,
      signal,
      stdout,
      stderr,
      wallMs: Math.round(performance.now() - started),
      });
    });
  });
}

const results = [];
for (const variant of variants) {
  const cwd = join(runRoot, variant);
  const claudeArgs = [
    "-p", prompt,
    "--model", model,
    "--autocompact", "100k",
    "--max-budget-usd", String(budget),
    "--output-format", "json",
    "--permission-mode", "acceptEdits",
    "--permission-prompts", "none",
    "--allowedTools", "Read,Glob,Grep,Bash,Write,Edit",
  ];
  if (variant === "jev") claudeArgs.push("--plugin-dir", resolve("."));
  const env = {
    ...process.env,
    CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: "1",
  };
  const agent = await command([claudeBin, ...claudeArgs], { cwd, env });
  const tests = await command(["/bin/zsh", "-lc", testCommand], { cwd, env: process.env });
  results.push({ variant, agent, tests });
  await writeFile(join(runRoot, `${variant}.json`), JSON.stringify({ variant, agent, tests }, null, 2));
}
await writeFile(join(runRoot, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ variant, agent, tests }) => ({
  variant,
  agentExit: agent.code,
  agentWallMs: agent.wallMs,
  testExit: tests.code,
  testWallMs: tests.wallMs,
})), null, 2));
