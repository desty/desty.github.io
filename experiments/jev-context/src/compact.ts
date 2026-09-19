import { chars, collectCandidates } from "./collect.js";
import { buildState } from "./state.js";
import type {
  CompactOptions,
  CompactResult,
  Decision,
  Judge,
  Judgment,
  Message,
  ToolResultPart,
} from "./types.js";

const defaults = {
  keepThreshold: 0.5,
  preserveRecentMessages: 6,
  truncateHeadChars: 300,
  protectedTools: ["Deploy", "Database", "ExternalAPI", "Permission", "AskUser"],
  cheapTools: ["Read", "Glob", "Grep", "Search", "List", "WebSearch"],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function decide(judgment: Judgment, pinned: boolean, threshold: number): Decision {
  const keepCall = clamp(judgment.keepCall);
  const keepResult = clamp(judgment.keepResult);
  if (pinned) return { ...judgment, keepCall, keepResult, action: "pinned", reason: "policy" };
  if (keepResult >= threshold) {
    return { ...judgment, keepCall, keepResult, action: "keep", reason: "result-needed" };
  }
  if (keepCall >= threshold) {
    return { ...judgment, keepCall, keepResult, action: "truncate", reason: "call-needed" };
  }
  return { ...judgment, keepCall, keepResult, action: "drop", reason: "stale" };
}

export async function compact(
  messages: Message[],
  judge: Judge,
  options: CompactOptions = {},
): Promise<CompactResult> {
  const config = { ...defaults, ...options };
  const candidates = collectCandidates(
    messages,
    config.preserveRecentMessages,
    config.protectedTools,
    config.cheapTools,
  );
  const mutable = candidates.filter((candidate) => !candidate.pinned);
  const judgments = mutable.length
    ? await judge.judge({
        goal: config.goal ?? "",
        state: buildState(messages, candidates, config.goal ?? ""),
        candidates: mutable,
      })
    : [];
  const judgmentById = new Map(judgments.map((judgment) => [judgment.callId, judgment]));

  const decisions = candidates.map((candidate) => {
    const judgment = judgmentById.get(candidate.id) ?? {
      callId: candidate.id,
      keepCall: 1,
      keepResult: 1,
    };
    return decide(judgment, candidate.pinned, config.keepThreshold);
  });
  const decisionById = new Map(decisions.map((decision) => [decision.callId, decision]));

  const output = messages
    .map((message) => ({
      ...message,
      parts: message.parts.flatMap((part) => {
        const id = part.type === "tool_call" ? part.id : part.type === "tool_result" ? part.callId : undefined;
        if (!id) return [part];
        const decision = decisionById.get(id);
        if (!decision || decision.action === "keep" || decision.action === "pinned") return [part];
        if (decision.action === "drop") return [];
        if (part.type === "tool_call") return [part];
        const result = part as ToolResultPart;
        const omitted = Math.max(0, result.output.length - config.truncateHeadChars);
        return [
          {
            ...result,
            output: `${result.output.slice(0, config.truncateHeadChars)}\n[… ${omitted} chars omitted by jev-context …]`,
          },
        ];
      }),
    }))
    .filter((message) => message.parts.length > 0);

  const before = chars(messages);
  const after = chars(output);
  return {
    messages: output,
    decisions,
    stats: {
      messagesBefore: messages.length,
      messagesAfter: output.length,
      charsBefore: before,
      charsAfter: after,
      calls: candidates.length,
      kept: decisions.filter((d) => d.action === "keep" || d.action === "pinned").length,
      truncated: decisions.filter((d) => d.action === "truncate").length,
      dropped: decisions.filter((d) => d.action === "drop").length,
      reductionRatio: before === 0 ? 0 : (before - after) / before,
    },
  };
}
