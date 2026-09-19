import assert from "node:assert/strict";
import test from "node:test";
import { compact } from "../src/compact.js";
import type { Judge, Message } from "../src/types.js";

const judge: Judge = {
  async judge({ candidates }) {
    return candidates.map((candidate) =>
      candidate.id === "read-old"
        ? { callId: candidate.id, keepCall: 0.1, keepResult: 0.05 }
        : { callId: candidate.id, keepCall: 0.8, keepResult: 0.2 },
    );
  },
};

const messages: Message[] = [
  { id: "m0", role: "user", parts: [{ type: "text", text: "Fix auth without changing the public API." }] },
  {
    id: "m1",
    role: "assistant",
    parts: [{ type: "tool_call", id: "read-old", name: "Read", input: { path: "src/old.ts" } }],
  },
  {
    id: "m2",
    role: "tool",
    parts: [{ type: "tool_result", callId: "read-old", output: "old file".repeat(200) }],
  },
  {
    id: "m3",
    role: "assistant",
    parts: [{ type: "tool_call", id: "test", name: "Bash", input: { command: "npm test" } }],
  },
  {
    id: "m4",
    role: "tool",
    parts: [{ type: "tool_result", callId: "test", output: "failure details".repeat(100), isError: true }],
  },
  { id: "m5", role: "assistant", parts: [{ type: "text", text: "The test exposes the remaining bug." }] },
];

test("drops stale pairs and truncates results whose call still matters", async () => {
  const result = await compact(messages, judge, { preserveRecentMessages: 1, truncateHeadChars: 40 });
  assert.equal(result.decisions.find((d) => d.callId === "read-old")?.action, "drop");
  assert.equal(result.decisions.find((d) => d.callId === "test")?.action, "truncate");
  assert.equal(JSON.stringify(result.messages).includes("read-old"), false);
  assert.match(JSON.stringify(result.messages), /chars omitted by jev-context/);
  assert.ok(result.stats.reductionRatio > 0.5);
});

test("protects expensive tool classes without asking the judge", async () => {
  const protectedMessages: Message[] = [
    messages[0],
    {
      id: "p1",
      role: "assistant",
      parts: [{ type: "tool_call", id: "deploy", name: "Deploy", input: { env: "prod" } }],
    },
    {
      id: "p2",
      role: "tool",
      parts: [{ type: "tool_result", callId: "deploy", output: "release-id=abc" }],
    },
    ...messages.slice(3),
  ];
  const result = await compact(protectedMessages, judge, { preserveRecentMessages: 1 });
  assert.equal(result.decisions.find((d) => d.callId === "deploy")?.action, "pinned");
  assert.match(JSON.stringify(result.messages), /release-id=abc/);
});
