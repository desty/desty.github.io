import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { compact } from "../src/compact.js";
import { JevJudge } from "../src/jev.js";
import { redactSecrets } from "../src/state.js";
import type { Message, Part } from "../src/types.js";

type JsonRecord = Record<string, unknown>;

const transcript = process.argv[2];
if (!transcript) throw new Error("Usage: node dist/bench/claude-session-replay.js <transcript.jsonl> [output.json]");
const outputPath = process.argv[3];

const raw = await readFile(resolve(transcript), "utf8");
const records = raw.split("\n").filter(Boolean).map((line) => JSON.parse(line) as JsonRecord);
const messages: Message[] = [];
let contentChars = 0;
let toolResultChars = 0;

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? "");
}

for (const [recordIndex, record] of records.entries()) {
  const message = record.message as JsonRecord | undefined;
  if (!message || (message.role !== "user" && message.role !== "assistant")) continue;
  const rawContent = message.content;
  const blocks = Array.isArray(rawContent) ? rawContent as JsonRecord[] : [{ type: "text", text: rawContent }];
  const parts: Part[] = [];
  for (const block of blocks) {
    if (block.type === "text" && typeof block.text === "string") {
      contentChars += block.text.length;
      parts.push({ type: "text", text: redactSecrets(block.text) });
    } else if (block.type === "tool_use" && typeof block.id === "string" && typeof block.name === "string") {
      parts.push({ type: "tool_call", id: block.id, name: block.name, input: block.input });
    } else if (block.type === "tool_result" && typeof block.tool_use_id === "string") {
      const output = redactSecrets(contentText(block.content));
      contentChars += output.length;
      toolResultChars += output.length;
      parts.push({
        type: "tool_result",
        callId: block.tool_use_id,
        output,
        isError: block.is_error === true,
      });
    }
  }
  if (parts.length) messages.push({
    id: typeof record.uuid === "string" ? record.uuid : `record-${recordIndex}`,
    role: message.role === "assistant" ? "assistant" : "user",
    parts,
    createdAt: typeof record.timestamp === "string" ? record.timestamp : undefined,
  });
}

const calls = messages.flatMap((message, messageIndex) => message.parts.flatMap((part) =>
  part.type === "tool_call" ? [{ ...part, messageIndex }] : [],
));
if (calls.length < 40) throw new Error(`Transcript has only ${calls.length} tool calls`);

const mutating = /^(?:Write|Edit|MultiEdit|NotebookEdit|Deploy|Database|ExternalAPI|Permission|AskUser)/;
const locatorPattern = /(?:https?:\/\/[^\s"'`<>]+|(?:\.{0,2}\/|\/)[A-Za-z0-9_.@%+~/-]+|[A-Za-z0-9_.-]+\/(?:[A-Za-z0-9_.@%+~-]+\/)*[A-Za-z0-9_.@%+~-]+)/g;

function locators(value: unknown): Set<string> {
  const text = JSON.stringify(value ?? "");
  return new Set((text.match(locatorPattern) ?? [])
    .map((item) => item.replace(/[),:;]+$/, "").toLowerCase())
    .filter((item) => item.length >= 5));
}

function laterLocatorSet(afterMessageIndex: number): Set<string> {
  const found = new Set<string>();
  for (const message of messages.slice(afterMessageIndex + 1)) {
    for (const part of message.parts) {
      if (part.type === "tool_call") for (const value of locators(part.input)) found.add(value);
      if (part.type === "text") for (const value of locators(part.text)) found.add(value);
    }
  }
  return found;
}

const judge = new JevJudge({ batchSize: 40, timeoutMs: 15_000 });
const checkpoints = [0.5, 0.7, 0.85];
const runs: unknown[] = [];

for (const fraction of checkpoints) {
  const boundaryCall = calls[Math.max(0, Math.ceil(calls.length * fraction) - 1)];
  const prefix = messages.slice(0, boundaryCall.messageIndex + 1);
  const latestUser = [...prefix].reverse().find((message) => message.role === "user");
  const goal = latestUser?.parts.find((part) => part.type === "text")?.text.slice(0, 2_000) ??
    "Continue the current coding task.";
  const future = laterLocatorSet(boundaryCall.messageIndex);
  const started = performance.now();
  const result = await compact(prefix, judge, {
    goal,
    keepThreshold: 0.3,
    preserveRecentMessages: 6,
    protectedTools: ["Write", "Edit", "MultiEdit", "NotebookEdit", "Deploy", "Database", "ExternalAPI", "Permission", "AskUser"],
  });
  const elapsedMs = performance.now() - started;
  const callById = new Map(calls.map((call) => [call.id, call]));
  const evaluated = result.decisions.filter((decision) => {
    const call = callById.get(decision.callId);
    return call && !mutating.test(call.name) && decision.reason !== "policy";
  });
  const reused = evaluated.filter((decision) => {
    const call = callById.get(decision.callId);
    return call && [...locators(call.input)].some((locator) => future.has(locator));
  });
  const retained = (decision: (typeof evaluated)[number]) => decision.action !== "drop";
  const truePositive = reused.filter(retained).length;
  const irrelevant = evaluated.filter((decision) => !reused.includes(decision));
  const trueNegative = irrelevant.filter((decision) => !retained(decision)).length;
  const thresholdSweep = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5].map((threshold) => {
    const keep = (decision: (typeof evaluated)[number]) =>
      decision.keepCall >= threshold || decision.keepResult >= threshold;
    const reusedKept = reused.filter(keep).length;
    const irrelevantDropped = irrelevant.filter((decision) => !keep(decision)).length;
    return {
      threshold,
      futureReuseRecall: reused.length ? reusedKept / reused.length : null,
      irrelevantRemovalRate: irrelevant.length ? irrelevantDropped / irrelevant.length : null,
    };
  });
  runs.push({
    checkpoint: fraction,
    callsSeen: result.stats.calls,
    evaluatedRecoverableCalls: evaluated.length,
    futureReusedCalls: reused.length,
    futureReusedRetained: truePositive,
    futureReuseRecall: reused.length ? truePositive / reused.length : null,
    notFutureReusedCalls: irrelevant.length,
    notFutureReusedDropped: trueNegative,
    irrelevantRemovalRate: irrelevant.length ? trueNegative / irrelevant.length : null,
    thresholdSweep,
    charsBefore: result.stats.charsBefore,
    charsAfter: result.stats.charsAfter,
    reductionRatio: result.stats.reductionRatio,
    jevWallMs: Math.round(elapsedMs),
  });
}

const cost = [...records].reverse().find((record) => record.type === "cost-state");
const report = {
  benchmark: "real completed Claude Code transcript replay",
  transcript: basename(transcript),
  transcriptBytes: raw.length,
  parsedMessages: messages.length,
  toolCalls: calls.length,
  toolResultChars,
  modelContentChars: contentChars,
  toolResultShare: contentChars ? toolResultChars / contentChars : 0,
  observedSessionCostUSD: typeof cost?.totalCostUSD === "number" ? cost.totalCostUSD : null,
  method: {
    checkpoints,
    threshold: 0.3,
    oracle: "A recoverable call is future-reused when a path or URL in its input occurs after the checkpoint.",
    exclusions: "Mutating and human-interaction tools are protected and excluded from accuracy scoring.",
    limitation: "Replay measures pruning and future-reference recall, not counterfactual task success or billed savings.",
  },
  runs,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(resolve(outputPath), serialized, "utf8");
console.log(serialized);
