export type TextPart = { type: "text"; text: string };
export type ToolCallPart = {
  type: "tool_call";
  id: string;
  name: string;
  input: unknown;
};
export type ToolResultPart = {
  type: "tool_result";
  callId: string;
  output: string;
  isError?: boolean;
};

export type Part = TextPart | ToolCallPart | ToolResultPart;

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  parts: Part[];
  createdAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  input: unknown;
  result?: ToolResultPart;
  messageIndex: number;
  resultMessageIndex?: number;
  pinned: boolean;
  recoverability: "cheap" | "expensive" | "unknown";
}

export interface Judgment {
  callId: string;
  keepCall: number;
  keepResult: number;
}

export interface JudgeInput {
  goal: string;
  state: string;
  candidates: Candidate[];
}

export interface Judge {
  judge(input: JudgeInput): Promise<Judgment[]>;
}

export interface CompactOptions {
  goal?: string;
  keepThreshold?: number;
  preserveRecentMessages?: number;
  truncateHeadChars?: number;
  protectedTools?: string[];
  cheapTools?: string[];
}

export interface Decision extends Judgment {
  action: "keep" | "truncate" | "drop" | "pinned";
  reason: string;
}

export interface CompactResult {
  messages: Message[];
  decisions: Decision[];
  stats: {
    messagesBefore: number;
    messagesAfter: number;
    charsBefore: number;
    charsAfter: number;
    calls: number;
    kept: number;
    truncated: number;
    dropped: number;
    reductionRatio: number;
  };
}
