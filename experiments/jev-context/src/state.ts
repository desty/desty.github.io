import type { Candidate, Message } from "./types.js";

export function redactSecrets(text: string): string {
  return text
    .replace(/(authorization["'\s:=]+bearer\s+)[^\s"']+/gi, "$1<redacted>")
    .replace(/((?:api[_-]?key|token|secret|password)["'\s:=]+)[^\s,"'}]+/gi, "$1<redacted>")
    .replace(/\b(?:sk|key|tok)_[A-Za-z0-9_-]{12,}\b/g, "<redacted-token>")
    .replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
      "<redacted-private-key>");
}

function compactInput(value: unknown, limit = 600): string {
  const text = redactSecrets(JSON.stringify(value));
  return text.length <= limit ? text : `${text.slice(0, limit)}…`;
}

export function buildState(messages: Message[], candidates: Candidate[], goal: string): string {
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const heading = `Goal: ${redactSecrets(goal || "Continue the current coding task.").slice(0, 2_000)}`;
  const lines: string[] = [];

  for (const message of messages) {
    const parts: string[] = [];
    for (const part of message.parts) {
      if (part.type === "text") parts.push(redactSecrets(part.text));
      if (part.type === "tool_call") {
        const candidate = candidateById.get(part.id);
        parts.push(
          `[${part.id}] ${part.name} ${compactInput(part.input)}` +
            (candidate ? ` recoverability=${candidate.recoverability}` : ""),
        );
      }
      if (part.type === "tool_result") {
        parts.push(
          `[${part.callId}] ${part.isError ? "error" : "ok"}, ${part.output.length} chars (body omitted)`,
        );
      }
    }
    if (parts.length) lines.push(`${message.role}: ${parts.join("\n")}`);
  }

  // JEV scores each call from its question as well as this state. Keep the newest
  // conversation evidence, but enforce a hard request budget for long sessions.
  const budget = 12_000 - heading.length - 1;
  const selected: string[] = [];
  let used = 0;
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index].slice(0, 2_000);
    if (used + line.length + 1 > budget) continue;
    selected.push(line);
    used += line.length + 1;
  }
  return [heading, ...selected.reverse()].join("\n");
}
