import { compact } from "../src/compact.js";
import type { Judge, Message } from "../src/types.js";

const messages: Message[] = [
  { id: "goal", role: "user", parts: [{ type: "text", text: "Refactor routing and keep the public API stable." }] },
];

for (let index = 0; index < 120; index += 1) {
  const important = index % 17 === 0;
  const callId = `call-${index}`;
  messages.push({
    id: `a-${index}`,
    role: "assistant",
    parts: [{ type: "tool_call", id: callId, name: important ? "Bash" : "Read", input: { path: `packages/router/src/file-${index}.ts` } }],
  });
  messages.push({
    id: `t-${index}`,
    role: "tool",
    parts: [{
      type: "tool_result",
      callId,
      output: `${important ? "FAILING INVARIANT public-api" : "source snapshot"}\n`.repeat(250),
      isError: important,
    }],
  });
}
messages.push({ id: "last", role: "assistant", parts: [{ type: "text", text: "Continue from the failing public API invariants." }] });

const oracle: Judge = {
  async judge({ candidates }) {
    return candidates.map((candidate) => ({
      callId: candidate.id,
      keepCall: candidate.name === "Bash" ? 0.98 : 0.08,
      keepResult: candidate.name === "Bash" ? 0.95 : 0.04,
    }));
  },
};

const started = performance.now();
const result = await compact(messages, oracle, {
  goal: "Refactor routing and keep the public API stable.",
  preserveRecentMessages: 6,
});
const elapsed = performance.now() - started;

console.log(JSON.stringify({ ...result.stats, localDecisionMs: Number(elapsed.toFixed(2)) }, null, 2));
