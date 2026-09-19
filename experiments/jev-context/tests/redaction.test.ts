import assert from "node:assert/strict";
import test from "node:test";
import { buildState, redactSecrets } from "../src/state.js";

test("redacts common credentials before state leaves the machine", () => {
  const input = 'Authorization: Bearer abc.def.ghi api_key="super-secret-value" token=tok_123456789012345';
  const output = redactSecrets(input);
  assert.equal(output.includes("abc.def.ghi"), false);
  assert.equal(output.includes("super-secret-value"), false);
  assert.equal(output.includes("tok_123456789012345"), false);
  assert.match(output, /redacted/);
});

test("state stays within the long-session request budget", () => {
  const messages = Array.from({ length: 100 }, (_, index) => ({
    id: `message-${index}`,
    role: "assistant" as const,
    parts: [{ type: "text" as const, text: `line-${index} ${"x".repeat(1_000)}` }],
  }));
  const state = buildState(messages, [], "continue");
  assert.ok(state.length <= 12_000);
  assert.match(state, /line-99/);
});
