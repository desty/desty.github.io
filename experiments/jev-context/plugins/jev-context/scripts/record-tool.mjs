import { mkdir, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const event = JSON.parse(raw);
const root = join(tmpdir(), "jev-context", String(event.session_id));
await mkdir(root, { recursive: true });
const record = {
  at: new Date().toISOString(),
  tool_name: event.tool_name,
  tool_use_id: event.tool_use_id,
  tool_input: event.tool_input,
  response_chars: JSON.stringify(event.tool_response ?? "").length,
  // Deliberately omit result bodies until local secret filtering exists.
};
await appendFile(join(root, "tools.jsonl"), `${JSON.stringify(record)}\n`, { mode: 0o600 });
