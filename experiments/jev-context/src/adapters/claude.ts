import type { Message, Part } from "../types.js";

export interface ClaudeToolUse {
  tool_use_id: string;
  tool: string;
  input: unknown;
  text?: string;
  isError?: boolean;
}

export interface ClaudeToolResult {
  tool_use_id: string;
  text: string;
  isError?: boolean;
}

export interface ClaudeSessionMessage {
  role: "user" | "assistant";
  text: string;
  toolUses: ClaudeToolUse[];
  toolResults?: ClaudeToolResult[];
  ref?: unknown;
}

export function fromClaudeMessages(input: readonly ClaudeSessionMessage[]): Message[] {
  return input.map((message, index) => {
    const parts: Part[] = [];
    if (message.text) parts.push({ type: "text", text: message.text });
    for (const tool of message.toolUses) {
      parts.push({
        type: "tool_call",
        id: tool.tool_use_id,
        name: tool.tool,
        input: tool.input,
      });
    }
    for (const result of message.toolResults ?? []) {
      parts.push({
        type: "tool_result",
        callId: result.tool_use_id,
        output: result.text,
        isError: result.isError,
      });
    }
    return { id: `claude-${index}`, role: message.role, parts };
  });
}

export function toClaudeMessages(input: readonly Message[]): ClaudeSessionMessage[] {
  return input.map((message) => {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");
    const toolUses = message.parts
      .filter((part) => part.type === "tool_call")
      .map((part) => ({ tool_use_id: part.id, tool: part.name, input: part.input }));
    const toolResults = message.parts
      .filter((part) => part.type === "tool_result")
      .map((part) => ({
        tool_use_id: part.callId,
        text: part.output,
        ...(part.isError === undefined ? {} : { isError: part.isError }),
      }));
    return {
      role: message.role === "tool" ? "user" : message.role,
      text,
      toolUses,
      ...(toolResults.length ? { toolResults } : {}),
    };
  });
}
