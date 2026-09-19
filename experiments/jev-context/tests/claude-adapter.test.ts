import assert from "node:assert/strict";
import test from "node:test";
import { fromClaudeMessages, toClaudeMessages } from "../src/adapters/claude.js";

test("round-trips Claude session messages through the normalized format", () => {
  const input = [
    { role: "user" as const, text: "Fix it", toolUses: [] },
    {
      role: "assistant" as const,
      text: "",
      toolUses: [{ tool_use_id: "t1", tool: "Read", input: { file_path: "src/a.ts" } }],
    },
    {
      role: "user" as const,
      text: "",
      toolUses: [],
      toolResults: [{ tool_use_id: "t1", text: "export const a = 1" }],
    },
  ];
  const output = toClaudeMessages(fromClaudeMessages(input));
  assert.deepEqual(output, input);
});
