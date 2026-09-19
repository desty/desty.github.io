import { readdir, readFile, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { compact } from "../src/compact.js";
import { JevJudge } from "../src/jev.js";
import type { Judge, Message } from "../src/types.js";

const astroRoot = resolve(process.cwd(), "../../node_modules/astro");
const task = "Trace how Astro resolves routes and builds the route manifest without changing its public API.";

async function filesUnder(root: string): Promise<string[]> {
  const output: string[] = [];
  async function walk(directory: string): Promise<void> {
    for (const name of await readdir(directory)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const path = resolve(directory, name);
      const info = await stat(path);
      if (info.isDirectory()) await walk(path);
      else if (/\.(?:js|mjs|d\.ts)$/.test(name) && info.size > 200 && info.size < 120_000) output.push(path);
    }
  }
  await walk(root);
  return output.sort();
}

const available = await filesUnder(astroRoot);
const relevantFiles = available.filter((file) => /(route|routing|manifest)/i.test(relative(astroRoot, file)));
const irrelevantFiles = available.filter((file) => !/(route|routing|manifest)/i.test(relative(astroRoot, file)));
const files = [...relevantFiles.slice(0, 60), ...irrelevantFiles.slice(0, 180)].sort();
if (files.length < 50) throw new Error(`Expected a framework-sized fixture, found ${files.length} files`);

const messages: Message[] = [
  { id: "goal", role: "user", parts: [{ type: "text", text: task }] },
];
const relevant = new Set<string>();

for (const [index, file] of files.entries()) {
  const path = relative(astroRoot, file);
  const callId = `read-${index}`;
  if (/(route|routing|manifest)/i.test(path)) relevant.add(callId);
  messages.push({
    id: `assistant-${index}`,
    role: "assistant",
    parts: [{ type: "tool_call", id: callId, name: "Read", input: { path } }],
  });
  messages.push({
    id: `tool-${index}`,
    role: "tool",
    parts: [{ type: "tool_result", callId, output: await readFile(file, "utf8") }],
  });
}
messages.push({
  id: "tail",
  role: "assistant",
  parts: [{ type: "text", text: "Continue with the route and manifest implementation files." }],
});

const pathOracle: Judge = {
  async judge({ candidates }) {
    return candidates.map((candidate) => ({
      callId: candidate.id,
      keepCall: relevant.has(candidate.id) ? 0.98 : 0.05,
      keepResult: relevant.has(candidate.id) ? 0.95 : 0.02,
    }));
  },
};

const live = process.argv.includes("--jev");
const judge: Judge = live ? new JevJudge({ batchSize: 40 }) : pathOracle;

const started = performance.now();
const result = await compact(messages, judge, {
  goal: task,
  preserveRecentMessages: 6,
});
const elapsed = performance.now() - started;
const relevantDecisions = result.decisions.filter((decision) => relevant.has(decision.callId));
const captured = new Map(result.decisions.map((decision) => [decision.callId, decision]));
const threshold03 = await compact(messages, {
  async judge({ candidates }) {
    return candidates.map((candidate) => {
      const decision = captured.get(candidate.id);
      if (!decision) throw new Error(`Missing captured judgment for ${candidate.id}`);
      return { callId: candidate.id, keepCall: decision.keepCall, keepResult: decision.keepResult };
    });
  },
}, {
  goal: task,
  preserveRecentMessages: 6,
  keepThreshold: 0.3,
});
const thresholdSweep = [0.2, 0.3, 0.4, 0.5].map((threshold) => {
  const retained = (keepCall: number, keepResult: number, reason: string) =>
    reason === "policy" || keepCall >= threshold || keepResult >= threshold;
  return {
    threshold,
    relevantRetained: result.decisions.filter(
      (decision) => relevant.has(decision.callId) &&
        retained(decision.keepCall, decision.keepResult, decision.reason),
    ).length,
    irrelevantRetained: result.decisions.filter(
      (decision) => !relevant.has(decision.callId) &&
        retained(decision.keepCall, decision.keepResult, decision.reason),
    ).length,
  };
});

console.log(JSON.stringify({
  fixture: "installed astro package",
  frameworkFilesRead: files.length,
  goldRelevantCalls: relevant.size,
  goldRelevantRetained: relevantDecisions.filter((decision) => decision.action !== "drop").length,
  irrelevantRetained: result.decisions.filter(
    (decision) => !relevant.has(decision.callId) && decision.action !== "drop",
  ).length,
  thresholdSweep,
  threshold03Stats: threshold03.stats,
  ...result.stats,
  localDecisionMs: Number(elapsed.toFixed(2)),
  judge: live ? "jev-live" : "path-oracle",
  caveat: live
    ? "Jev sees call metadata and conversation state, not tool-result bodies."
    : "Path oracle measures the reducible upper bound; it is not a Jev accuracy result.",
}, null, 2));
