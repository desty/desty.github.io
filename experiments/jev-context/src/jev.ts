import type { Judge, JudgeInput, Judgment } from "./types.js";

export interface JevJudgeOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fetch?: typeof globalThis.fetch;
  batchSize?: number;
  timeoutMs?: number;
}

export class JevJudge implements Judge {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly request: typeof globalThis.fetch;
  private readonly batchSize: number;
  private readonly timeoutMs: number;

  constructor(options: JevJudgeOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.TYPESAFE_API_KEY ?? "";
    this.baseUrl = options.baseUrl ?? "https://api.typesafe.ai/v1/systemone";
    this.model = options.model ?? "jev-latest";
    this.request = options.fetch ?? globalThis.fetch;
    this.batchSize = options.batchSize ?? 40;
    this.timeoutMs = options.timeoutMs ?? 5_000;
    if (!this.apiKey) throw new Error("TYPESAFE_API_KEY is required for JevJudge");
  }

  async judge(input: JudgeInput): Promise<Judgment[]> {
    const batches: typeof input.candidates[] = [];
    for (let index = 0; index < input.candidates.length; index += this.batchSize) {
      batches.push(input.candidates.slice(index, index + this.batchSize));
    }
    const results = await Promise.all(
      batches.map((candidates) => this.judgeBatch({ ...input, candidates })),
    );
    return results.flat();
  }

  private async judgeBatch(input: JudgeInput): Promise<Judgment[]> {
    const questions = Object.fromEntries(
      input.candidates.flatMap((candidate) => {
        const label = `${candidate.id} (${candidate.name} ${JSON.stringify(candidate.input).slice(0, 500)})`;
        return [
        [
          `${candidate.id}:call`,
          {
            type: "noul",
            instructions:
              `For ${label}, should this call remain in context because knowing it happened or ` +
              `seeing its exact input still matters for the goal?`,
          },
        ],
        [
          `${candidate.id}:result`,
          {
            type: "noul",
            instructions:
              `For ${label}, should this result remain verbatim because its contents still matter ` +
              `and re-running it would not recover the same information?`,
          },
        ],
      ];
      }),
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.request(this.baseUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, state: input.state, questions }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Jev returned HTTP ${response.status}: ${detail}`);
    }
    const body = (await response.json()) as { answers?: Record<string, { noul?: number }> };
    if (!body.answers) throw new Error("Jev response has no answers");
    return input.candidates.map((candidate) => {
      const keepCall = body.answers?.[`${candidate.id}:call`]?.noul;
      const keepResult = body.answers?.[`${candidate.id}:result`]?.noul;
      if (typeof keepCall !== "number" || typeof keepResult !== "number") {
        throw new Error(`Jev response is missing answers for ${candidate.id}`);
      }
      return { callId: candidate.id, keepCall, keepResult };
    });
  }
}
