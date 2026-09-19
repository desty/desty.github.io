import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const event = JSON.parse(raw);
const path = join(tmpdir(), "jev-context", String(event.session_id), "memory.txt");
try {
  const memory = await readFile(path, "utf8");
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: memory.slice(0, 8000) },
  }));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
