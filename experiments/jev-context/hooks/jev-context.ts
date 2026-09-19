import { compact, fromClaudeMessages, JevJudge, toClaudeMessages } from "../dist/src/index.js";

type Options = Record<string, unknown>;

function numberOption(options: Options, key: string, fallback: number): number {
  const value = options[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export const register = (on: any, options: Options) => {
  const keepThreshold = numberOption(options, "keepThreshold", 0.3);
  const preserveRecentMessages = numberOption(options, "preserveRecentMessages", 6);
  const compactAtPercent = numberOption(options, "compactAtPercent", 60);
  const minReductionRatio = numberOption(options, "minReductionRatio", 0.25);
  const truncateHeadChars = numberOption(options, "truncateHeadChars", 300);
  let compacting = false;

  on("session.compact", async ($: any, event: any, next: any) => {
    try {
      const configured = typeof options.apiKey === "string" ? options.apiKey : undefined;
      const apiKey = configured || (await $.env.get("TYPESAFE_API_KEY"));
      if (!apiKey) throw new Error("TYPESAFE_API_KEY is not configured");
      const fetchAdapter: typeof globalThis.fetch = async (input, init) => {
        const url = typeof input === "string" || input instanceof URL ? String(input) : input.url;
        const response = await $.http.fetch(url, init);
        return {
          ok: response.ok,
          status: response.status,
          text: async () => response.text,
          json: async () => JSON.parse(response.text),
        } as Response;
      };
      const result = await compact(
        fromClaudeMessages(event.messages),
        new JevJudge({ apiKey, fetch: fetchAdapter, batchSize: 40 }),
        { keepThreshold, preserveRecentMessages, truncateHeadChars },
      );
      if (result.stats.reductionRatio < minReductionRatio) {
        $.ui.log(`jev-context: native fallback; reduction ${(result.stats.reductionRatio * 100).toFixed(1)}%`);
        return next(event);
      }
      $.ui.toast(
        `jev-context: ${(result.stats.reductionRatio * 100).toFixed(1)}% reduction, ${result.stats.dropped} calls dropped`,
        { timeoutMs: 12_000 },
      );
      return { messages: toClaudeMessages(result.messages) };
    } catch (error) {
      $.ui.log(`jev-context: native fallback (${error instanceof Error ? error.message : String(error)})`);
      return next(event);
    }
  });

  on("turn.complete", async ($: any, event: any, next: any) => {
    if (compacting) return next(event);
    try {
      const { context } = await $.session.usage();
      if ((context.percent ?? 0) >= compactAtPercent) {
        compacting = true;
        await $.session.compact();
      }
    } finally {
      compacting = false;
    }
    return next(event);
  });
};
