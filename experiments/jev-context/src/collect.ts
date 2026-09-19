import type { Candidate, Message, ToolCallPart, ToolResultPart } from "./types.js";

const DEFAULT_CHEAP_TOOLS = ["Read", "Glob", "Grep", "Search", "List", "WebSearch"];

export function collectCandidates(
  messages: Message[],
  preserveRecentMessages: number,
  protectedTools: string[],
  cheapTools: string[] = DEFAULT_CHEAP_TOOLS,
): Candidate[] {
  const results = new Map<string, { part: ToolResultPart; messageIndex: number }>();
  messages.forEach((message, messageIndex) => {
    for (const part of message.parts) {
      if (part.type === "tool_result") results.set(part.callId, { part, messageIndex });
    }
  });

  const pinFrom = Math.max(0, messages.length - preserveRecentMessages);
  const candidates: Candidate[] = [];

  messages.forEach((message, messageIndex) => {
    for (const part of message.parts) {
      if (part.type !== "tool_call") continue;
      const call = part as ToolCallPart;
      const result = results.get(call.id);
      const protectedTool = protectedTools.some((pattern) => new RegExp(pattern).test(call.name));
      const cheap = cheapTools.some((pattern) => new RegExp(pattern).test(call.name));
      candidates.push({
        id: call.id,
        name: call.name,
        input: call.input,
        result: result?.part,
        messageIndex,
        resultMessageIndex: result?.messageIndex,
        pinned: messageIndex === 0 || messageIndex >= pinFrom || protectedTool,
        recoverability: protectedTool ? "expensive" : cheap ? "cheap" : "unknown",
      });
    }
  });

  return candidates;
}

export function chars(messages: Message[]): number {
  return messages.reduce((total, message) => total + JSON.stringify(message).length, 0);
}
