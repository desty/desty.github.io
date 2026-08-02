---
title: "Cache Hit Rate Is Your Prompt Design Report Card — What's Behind That 98%"
summary: "In July, Musinsa's tech blog posted numbers you rarely see from a Korean company: 64% LLM cost reduction, 98% cache hit rate. It's effectively the first Korean tech blog post to publish measured prompt-caching results. But what lingers isn't the savings — it's the nature of the number itself. Cache hit rate isn't a discount line on your invoice; it's a graded score on one design question: did you put what never changes in front and what always changes at the end? This post lines up the other answer sheets to the same exam — a security agent that jumped from 7% to 84%, Anthropic declaring incidents when hit rate drops, Manus calling KV-cache hit rate 'the single most important metric for a production agent' — and walks from how one token breaks the hash chain, through a four-provider caching policy comparison, to the order in which to raise your own score."
date: "2026-08-16T10:00:00"
tags:
  - prompt-caching
  - llm-cost
  - context-engineering
  - agents
draft: false
---

In early July, Musinsa's tech blog published [a post titled "64% LLM Cost Reduction, 98% Cache Hit Rate"](https://techblog.musinsa.com/llm-%EB%B9%84%EC%9A%A9-64-%EC%A0%88%EA%B0%90-%EC%BA%90%EC%8B%9C-%ED%9E%88%ED%8A%B8%EC%9C%A8-98-%EB%8B%AC%EC%84%B1%EA%B8%B0-d568135bd40e). It's a record of the 29CM Pricing team applying Prompt Caching to a product-attribute extraction pipeline on AWS Bedrock — and effectively the first Korean tech blog post to publish measured caching numbers. SK Planet [wrote up a Bedrock caching adoption](https://techtopic.skplanet.com/chatdic-ai-text2sql/) last year, but published neither savings nor hit rate.

The numbers, briefly: a single attribute-extraction API accounted for **92% of all LLM tokens**, and every request had the same shape — an identical 15K-token system prompt followed by 2K tokens of product data. After separating the fixed part from the variable part and placing a cache point, a week of measurement showed a 98% hit rate and a 64% reduction in the total bill.

It's a solid write-up, but if you summarize it as "turn on caching, save money" and move on, you miss the most important part. What deserves attention is the **nature of the number.** Cache hit rate is not a discount item on your invoice — it's a graded score on whether your prompt is structurally well designed. It refreshes on every request, it never drops without a cause, and there's no partial credit. And as we'll see, in the agent era this report card is becoming the number-one metric for production LLM systems.

---

## One token breaks the chain

Start with the mechanism. A transformer computes attention Key and Value tensors for every token it processes, and each entry in this KV cache is conditioned on "given that the preceding tokens were exactly these" — change what comes before and the value is unusable. Serving engines encode this property directly into the cache key: in [vLLM's prefix caching design](https://docs.vllm.ai/en/latest/design/prefix_caching.html), each KV block's hash is computed from that block's tokens **plus the entire preceding prefix**. Reuse is therefore only ever possible as a prefix extending from the start, and changing one token in the middle severs the hash chain of every block after it. That's why leaving the tail of your prompt untouched buys you nothing.

The API-level rules are a literal translation of that physics. Per [Anthropic's documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), a request renders in the order tools → system → messages, and a cache hit requires a **100% identical prefix** up to the breakpoint. Change an upper layer and every cache below it is invalidated. Edit one tool definition and the cached system prompt and conversation history go with it; switch models and you're writing in a different ledger entirely (caches are per-model).

This rule is what turns hit rate into a report card. A low hit rate is not bad luck — it means **something near the front of your prompt is changing,** and that something always exists. A timestamp embedded in the system prompt, a user ID, JSON serialization without sorted keys, a tool list that varies per request. The nasty part is that the grading is silent — when caching fails, the API throws no error; `cache_read_input_tokens` just reads zero. Fall below the minimum cacheable length (512\~4,096 tokens depending on model) and it's equally silent. A student who never opens the report card doesn't get notified of the failing grade.

## 29CM's answer sheet

Where the Musinsa post earns its keep is that it treats caching not as a one-line option but as this structural problem. The sequence is textbook.

**First, visibility.** The Bedrock console shows only daily token totals, so the team couldn't tell which API was generating cost. They started by wiring LangChain4j's `ChatModelListener` plus a servlet filter to push per-API, per-token-type metrics (input/output/cache_read/cache_write) into Prometheus. Only after that dashboard lit up did the 92% culprit become visible.

**Second, they restructured the prompt before placing any cache point.** The existing code had a blurry boundary between fixed values (extraction rules, examples, schema) and variable ones (product data). Moving the fixed content into system prompt blocks and the variable content into user messages came first; the cache marker came after. Most of the real work of adopting caching lives here.

**Third, they compared prediction against measurement.** Before applying, they ran a cost simulation with call patterns, price tables, and measured token distributions as inputs — letting the LLM build scenarios but keeping the final arithmetic on a deterministic path (measured tokens × unit price). The simulation's predicted hit rate matched actuals **within one percentage point.** That's not luck; it's the nature of the mechanism. With a fixed call pattern, hit rate is arithmetic, not probability. To reuse the metaphor: this exam publishes its entire syllabus.

One appendix-grade detail. At the time, LangChain4j's Bedrock module had no cache-TTL parameter — only the 5-minute default — so the team bypassed the library with direct SDK calls and [submitted an upstream PR adding a cacheTtl parameter](https://github.com/langchain4j/langchain4j/pull/4920). It was the author's first contribution to the project, and it was merged. The post says they're "waiting for the next release," but it has in fact [already shipped in 1.14.0](https://github.com/langchain4j/langchain4j/releases/tag/1.14.0) — a gap discovered during cost optimization flowing back as an open-source contribution, the most pleasing passage in the piece.

## Answer sheets from those who took the exam earlier

How universal this grading rubric is becomes clear when you line up the other answer sheets.

**ProjectDiscovery, from 7% to 84%.** The team behind the security-testing agent Neo published [the most rigorous production measurement to date](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching) in April. Their system prompt runs over 20K tokens, yet their hit rate sat at 7%. The culprit: values that change every step — working memory, runtime context — were wedged into the **middle** of the prompt. Moving those dynamic sections to a user message at the tail of the conversation jumped the hit rate to 74% overnight, settling at 84%. They also kept template placeholders in the system prompt instead of rendering actual values, making it "byte-identical across all users, all threads, all days" — so concurrent users share a single cache. Results: 59% cost reduction, 9.8 billion tokens served through cache. On an extreme 1,225-step task they hit 91.8%, which came out **60× cheaper** than a comparable pre-optimization task at 3.2%.

**The parallelism paradox, via Thomson Reuters Labs.** [This one](https://medium.com/tr-labs-ml-engineering-blog/prompt-caching-the-secret-to-60-cost-reduction-in-llm-applications-6c792a0ac29b) is a worked example around a hypothetical 30K-token document rather than production data — worth stating upfront — but the trap it identifies is real. A cache entry only becomes readable after the first response begins streaming. Fire ten questions at the same document **simultaneously** and none of them can read each other's cache: everyone pays full price. Measured hit rate: 4.2%, essentially zero. The fix is one synchronous warming call first (2\~4 seconds to populate the cache), then the volley. Parallelizing for speed doubles your cost — the same item the Musinsa post lists among its anti-patterns as "simultaneous parallel fire."

The phrasing varies; the rule converges. **Low-churn content in front, high-churn content in back.** Manus says "don't put a second-precision timestamp at the top of your system prompt." Anthropic says "don't edit the system prompt; deliver updates as next-turn messages." ProjectDiscovery says "move working memory to the tail." It's all one sentence.

## Agents made this the number-one metric

Caching itself has existed since 2024. So why does hit rate get this much respect only in 2025\~2026? Because agents changed the shape of the workload.

An agent appends each action and observation to its context and resends the whole thing on every tool call. Yichao 'Peak' Ji of Manus [disclosed in July 2025](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) that Manus averages a **100:1 input-to-output token ratio**, writing: "If I had to choose just one metric, I'd argue that the KV-cache hit rate is the single most important metric for a production-stage AI agent." A [workload characterization study this year](https://arxiv.org/abs/2605.26297) confirmed the intuition with numbers — agents' raw input:output ratios run from 53.9× to 559.8×, yet the genuinely new increment per turn is only 1.5\~7.3× the output. Most of the input is retransmission of prior turns, which is why the theoretical cache hit rate reaches 87.9\~99.3%. An agent without caching rereads the same book from page one on every turn.

The provider side says the same thing. In April the Claude Code team published a post titled ["Prompt caching is everything"](https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything), revealing that they run alerts on cache hit rate and **declare SEVs — incident-grade alarms — when it drops too low.** "Monitor your cache hit rate like you monitor uptime," as the post puts it. A few percentage points of miss rate dramatically move cost and latency; by Anthropic's official figures, caching cuts cost by up to 90% and **latency by up to 85%** — time-to-first-token on a conversation with a 100K-token document drops from 11.5 to 2.4 seconds. Hit rate is a UX metric before it's a cost metric.

Academic validation followed. PwC researchers' [Don't Break the Cache](https://arxiv.org/abs/2601.06007) (January 2026) evaluated caching across OpenAI, Anthropic, and Google over 500+ agent sessions, measuring 41\~80% cost reduction and 13\~31% TTFT improvement. There's a twist, too: naively caching the full context can actually **increase** latency, and strategic boundary control — dynamic content at the end, session-specific tool results kept outside cache boundaries — consistently wins. Turning it on isn't enough; you have to design for it. The paper states this post's thesis outright.

Put it on a timeline and the convergence is visible. July 2025: Manus states the proposition. January 2026: a paper validates it across three providers. April 2026: the provider (Anthropic) and a heavy user (ProjectDiscovery) each confirm it from their side. July 2026: a Korean measurement (29CM) joins. Within a year, "the number-one metric for agent cost and latency optimization" became consensus.

## The order in which to raise your score

Reassembled as a prescription, the cases read like this.

**1. Don't start without instrumentation.** Begin by splitting the response usage fields (`cache_read_input_tokens`, `cache_creation_input_tokens`) per API. Total input = input + cache_read + cache_creation, so your hit rate calculation falls out of the same data. Cache failure is silent — without a dashboard, nobody notifies you of the failing grade.

**2. Fixed/variable separation is the real work.** Open the system prompt and split "what's identical on every call" from "what changes." Timestamps, user IDs, and request IDs move to user messages; JSON serialization gets forced key ordering; tool lists get a fixed order. Everything derives from the single rule that a change in front kills everything behind it.

**3. Choose TTL by call interval.** The break-even is explicit — on Anthropic, cache writes cost 1.25× base input for the 5-minute TTL and 2× for the 1-hour TTL, while reads cost 0.1×, so a 5-minute cache pays for itself on the second request and a 1-hour cache needs at least three reads. The TTL resets at no extra cost on every hit, so if calls arrive more often than every 5 minutes, the 5-minute cache is enough. Workloads with gaps between batches — like 29CM's — are where the 1-hour TTL belongs. On Bedrock, 1-hour support varies by model (Claude Opus 4.6 and Sonnet 4.6 are still 5-minute only), so check the docs.

**4. A warming call before any parallel volley.** The cache becomes readable only after the first response starts. Simultaneous fire means everyone misses.

**5. Treat hit rate like uptime.** Set alerts; when it drops, suspect a deploy. The [Claude Code documentation's list of cache-breaking actions](https://code.claude.com/docs/en/prompt-caching) is a good reference — model switches, effort-level changes, even toggling an MCP server are all part of the cache key. [#44](/blog/44-surviving-model-churn/) discussed the cost of model migration; full cache invalidation is one more line on that invoice.

Provider policies diverge more than you'd expect. In summary:

| | Anthropic | OpenAI | Gemini | Bedrock |
|---|---|---|---|---|
| Mechanism | Explicit `cache_control` | Automatic (implicit); explicit mode added in GPT-5.6+ | Implicit by default + explicit (cache objects) | Explicit `cachePoint` |
| Minimum tokens | 512\~4,096 (per model) | 1,024 | 2,048\~4,096 | 1,024\~4,096 (summed across 3 sections) |
| TTL | 5 min default, 1 h option, resets on hit | Fixed 30 min (5.6+) | Explicit defaults to 1 h, arbitrary values | 5 min default, 1 h on some models |
| Write cost | 1.25× (5 min) / 2× (1 h) | 1.25× (5.6+; free before) | None — hourly storage fee instead | Varies by model |
| Read discount | 90% | 90% | 90% (implicit: no savings guarantee) | "Discounted rate" per model |

The structures split three ways. Anthropic and Bedrock run the explicit "pay a premium to write, save 90% on reads" model; OpenAI started automatic and is converging toward explicit control; only Gemini's explicit mode charges an **hourly storage fee** instead of a write premium — a different axis entirely. Under all of them, the grading rubric is identical: static content first. One more note — on Bedrock, Prompt Caching is on-demand only and cannot be combined with the Batch inference API. The Musinsa post's next lever is a Batch API migration, and the two levers are mutually exclusive at the request level; factor that into the math.

## A well-designed prompt is a cheap prompt

The surface narrative of the Musinsa post is cost reduction, but one layer down the narrative is this: the 98% hit rate isn't the performance of a caching feature — **it's the score of that team's prompt structure.** They got 98% because fixed and variable content were cleanly separated, and that's also why prediction and measurement landed within one point of each other.

The nice thing about this report card is that its grading rubric coincides exactly with good design. Pin the unchanging rules up front, push the per-request values to the back, make serialization deterministic, express state changes as appends rather than prefix edits — the list of things that raise cache hit rate is, item for item, the list of context engineering fundamentals. Use context sloppily and it gets expensive; use it with discipline and it gets cheap. Metrics where cost and design quality point the same way are rare.

So if your LLM cost graph is climbing, the order is: instrument the hit rate first, and if it's low, find the thing near the front of your prompt that changes. Moving it to the back is usually a few lines of code, and the payoff — as the cases here measured repeatedly — is more than half the bill. The report card is already being issued on every request. You just have to open it.
