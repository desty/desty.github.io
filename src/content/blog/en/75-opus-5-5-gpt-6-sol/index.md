---
title: "Before You Switch to Opus 5.5 or GPT-6 Sol — Default Effort, Cost per Task, and the Math Behind \"Cheaper\""
summary: "On September 22, Anthropic and OpenAI shipped cheaper models 90 minutes apart. Claude Opus 5.5 cuts per-token prices 20% from Opus 5; GPT-6 Sol and Luna halve GPT-5.6. Working through Artificial Analysis's per-effort cost-per-task data shows the savings come from different places. Opus 5.5 halves cost at low and high effort but is 2% more expensive than Opus 5 at max. GPT-6 Sol uses roughly the same tokens as before; only the price per token fell. Picking the cheapest configuration for each target score gives Luna up to 37 points, Sol up to 48, and Opus 5.5 above that. Also covered: the migration items for Opus 5.5 (whose default effort dropped to medium), what to check before moving to GPT-6 Sol, and a procedure for comparing them on your own tasks."
date: "2026-09-24T18:00:00+09:00"
tags:
  - claude-opus-5-5
  - gpt-6
  - llm
  - model-release
  - agent-engineering
draft: false
---

This is the sixth post in the series where I look at new model releases, and once again there are two at once. On September 22, Anthropic released **Claude Opus 5.5**, and about 90 minutes later OpenAI released **GPT-6 Sol** and **GPT-6 Luna**. Both announcements led with price rather than capability. Anthropic said Opus 5.5 costs "40% less than Opus 5 at default settings"; OpenAI said Sol and Luna are "50% cheaper" than GPT-5.6.

I wanted to know whether the two "cheaper" claims mean the same thing. I didn't run the models myself. Instead I collected the Intelligence Index (v4.3.2) scores and cost-per-task figures that Artificial Analysis (AA) publishes for each model at each reasoning-effort level, and did the arithmetic. The AA index is a weighted average of ten evaluations across agentic work, coding, knowledge, and scientific reasoning; cost per task is the tokens each model actually used on those evaluations multiplied by list prices.

So every number here reflects AA's task mix, not necessarily yours. The last section describes how to check the same things on your own workload. Note also that the AA index has been restructured since [#57](/blog/57-gemini-grok-migration/), so scores quoted there aren't comparable with the ones below.

---

## What the two companies announced

Prices per million tokens:

| Model | Input | Cache read | Output | Predecessor |
|---|---|---|---|---|
| Claude Opus 5.5 | $4 | $0.20 | $20 | Opus 5: $5 / $0.50 / $25 |
| GPT-6 Sol | $2 | $0.20 | $10 | GPT-5.6 Sol: $4 / $20 |
| GPT-6 Luna | $0.10 | $0.01 | $0.50 | GPT-5.6 Luna: $0.20 / $1.20 |

Anthropic's 40% comes with conditions: "at default settings it will cost 40% less than Opus 5 on typical workloads." The per-token price dropped 20%; the rest is the claim that the model finishes the same work with fewer tokens.

OpenAI's 50% is measured against GPT-5.6's **promotional** pricing. The announcement says so, and several outlets reported that GPT-5.6 pricing was always meant to be temporary while GPT-6 pricing is permanent.

Both new models also default to `medium` effort. Opus 5 defaulted to `high`, so Opus 5.5 runs one level lower when effort is omitted. That turns out to matter more than it sounds.

---

## Same effort level, very different savings

Here are AA's per-effort numbers next to each predecessor. "Token change" is backed out by dividing the cost change by the price change, which works because input and output prices moved by the same ratio.

**Opus 5 → Opus 5.5** (per-token price -20%)

| Effort | Index | Cost per task | Cost change | Token change (derived) |
|---|---|---|---|---|
| low | 39 → 42 | $1.10 → $0.55 | -50% | -38% |
| medium | 45 → 51 | $2.19 → $1.34 | -39% | -24% |
| high | 48 → 54 | $3.61 → $1.82 | -50% | -37% |
| xhigh | 50 → 56 | $4.88 → $3.46 | -29% | -11% |
| max | 51 → 58 | $5.86 → $5.98 | **+2%** | +28% |

**GPT-5.6 Sol → GPT-6 Sol** (per-token price -50%)

| Effort | Index | Cost per task | Cost change | Token change (derived) |
|---|---|---|---|---|
| low | 33 → 34 | $0.26 → $0.13 | -50% | 0% |
| medium | 39 → 40 | $0.50 → $0.25 | -50% | 0% |
| high | 42 → 43 | $0.81 → $0.37 | -54% | -9% |
| xhigh | 44 → 44 | $1.18 → $0.53 | -55% | -10% |
| max | 47 → 48 | $1.99 → $1.06 | -47% | +7% |

The two tables tell different stories.

Opus 5.5 gains 3 to 7 index points at every effort level, but the savings depend heavily on effort. At medium it's -39%, so Anthropic's 40% holds up against AA's measurements. At xhigh the saving shrinks to -29%, and at max Opus 5.5 is 2% more expensive than Opus 5: it uses enough extra tokens to cancel the 20% price cut. Anthropic's own migration guide says as much: "At a given level, Claude Opus 5.5 tends to think more per turn than Claude Opus 5, especially at xhigh and max." **Teams running Opus 5 at max get none of this price cut.**

GPT-6 Sol is the opposite case. Cost fell almost exactly in half at every level, and the derived token usage moved between -10% and +7%. It does the same work with the same tokens, at half the price. Scores rose by 0 or 1 point. The launch-day reaction on X, "cheaper and more efficient, but not a smarter model," matches these numbers.

If your code doesn't set effort at all, the picture changes again. Opus 5 falls back to high and Opus 5.5 to medium, so swapping only the model name moves you from **Opus 5 high ($3.61, 48 points) to Opus 5.5 medium ($1.34, 51 points)**: 63% cheaper and 3 points higher. That's a bigger saving than the announcement claims.

---

## The cheapest configuration for each target score

Next I put every configuration on one list and asked: for a target score, what's the cheapest setting that reaches it?

| Target index | Cheapest configuration | Cost per task |
|---|---|---|
| up to 37 | GPT-6 Luna (by effort) | $0.0045 – $0.07 |
| 40 | GPT-6 Sol medium | $0.25 |
| 43 | GPT-6 Sol high | $0.37 |
| 44 | GPT-6 Sol xhigh | $0.53 |
| 48 | GPT-6 Sol max | $1.06 |
| 51 | Claude Opus 5.5 medium | $1.34 |
| 54 | Claude Opus 5.5 high | $1.82 |
| 56 | Claude Opus 5.5 xhigh | $3.46 |
| 58 | Claude Opus 5.5 max | $5.98 |

A few things stand out.

- **OpenAI is cheapest up to 48 points; Anthropic is cheapest above that.** GPT-6 Sol tops out at 48 even at max. Opus 5.5's cheapest setting, low, scores 42 for $0.55, which is both lower and more expensive than Sol high (43 points, $0.37).
- **Luna beats Sol at low effort.** Luna max scores 37 for $0.07; Sol low scores 34 for $0.13. Anything you run on Sol low is worth trying on Luna max.
- **GPT-6 Astra never makes the list.** Astra max scores 53 for $3.26, while Opus 5.5 high scores 54 for $1.82. On the AA index there's no reason to choose Astra. OpenAI does say Astra remains the best model for computer use, and the AA index barely covers that area.
- **Opus 5.5's cost per point rises steeply.** Going from low to medium costs $0.09 per point and medium to high $0.16, but high to xhigh costs $0.82 and xhigh to max $1.26. The last four points ($4.16) cost more than three medium runs.

---

## What the announcements played down

OpenAI's announcement presents DeepSWE v1.1 (software-engineering tasks in real codebases) like this: "GPT-6 Sol at max effort scores 68.8%, within 1.1 percentage points of Claude Fable 5's highest score… at approximately 80% lower cost per task." The text doesn't mention GPT-5.6 Sol's score, which is on the same chart: 72.7%. **The new model is 3.9 points behind its predecessor.** This was the first thing commenters on Hacker News and X picked up on.

Other coding measures disagree. On AA's Coding Agent Index, GPT-6 Sol max scores 57, two points above GPT-5.6 Sol, while Luna drops two points. When "coding" evaluations point in opposite directions, no single number settles the question. If you use GPT-5.6 Sol for coding agents, measure before switching.

The choice of comparison models matters too. OpenAI says GPT-6 Sol at xhigh beats "Claude Opus 5 at max effort at just 9% of Opus 5's cost per task" on AutomationBench. That's Opus 5, not Opus 5.5, which shipped the same morning. Anthropic's announcement puts Opus 5.5 at 40.0% on AutomationBench; OpenAI puts GPT-6 Sol xhigh at 33.2%.

On Anthropic's side, the 40% claim holds at medium effort, as shown above. What the announcement doesn't say is that the saving disappears at max. You only see that by checking the AA tables yourself.

---

## Caching narrows the gap

Everything above uses AA's task mix. In agent loops that resend a long history every turn, caching changes the arithmetic. As covered in [#48](/blog/48-cache-hit-rate/), cache reads make up a large share of the bill in these workloads.

The notable detail this time is that **both models charge the same $0.20 for cache reads.** Opus 5.5's uncached input is twice Sol's price, but cached input costs the same. Here's one turn with a 100K-token prompt and 2K output tokens at different cache hit rates (cache writes excluded):

| Cache hit rate | Opus 5.5 | GPT-6 Sol | Ratio |
|---|---|---|---|
| 0% | $0.440 | $0.220 | 2.0x |
| 90% | $0.098 | $0.058 | 1.7x |
| 95% | $0.079 | $0.049 | 1.6x |

The higher the hit rate, the more the input-side gap shrinks, leaving only the 2x output gap. For a well-cached agent, the price difference between the two models is smaller than the price sheet suggests.

One condition cuts the other way. For GPT-6 Sol, **prompts over 272K tokens are billed at 2x input and cache rates and 1.5x output for the entire request** (OpenAI model docs). The context window is 1.05M tokens, but if your design lets conversations grow past 272K, the ratios above shift against Sol. Anthropic's announcement mentions no such surcharge. One Hacker News commenter reported that cache-read costs wipe out the margin on large-codebase work. That's one person's experience, but it fits the broader point: for long-context work, cache design drives the bill more than the price sheet.

---

## Moving from Opus 5 to Opus 5.5

Anthropic's migration guide says existing Opus 5 prompts "should perform well out of the box," but lists four breaking changes in the request format. All four return a 400, so they'll surface in pre-deployment testing.

**Required changes**

- **Thinking can't be disabled.** Opus 5 accepted `thinking: {type: "disabled"}` at high effort or below; Opus 5.5 returns 400 at every level, and `budget_tokens` is rejected too. Remove the `thinking` field and control depth with `output_config.effort`. If a route disabled thinking for latency, start at `low`.
- **Forced tool use (`tool_choice` `any` or `tool`) returns 400.** Switch to `auto`, name the tool in the prompt, and set `strict: true` on the tool definition. Since `auto` doesn't guarantee a call, check that one happened and retry if not. If the forced call existed only to get JSON back, use structured outputs instead.
- **Computer use accepts only `computer_toolset_20260801`.** The older `computer_20251124` tool returns 400. The action now arrives as the block's `name` rather than `input.action`, and a single turn can contain several calls, so the agent loop needs changes too.
- **Thinking blocks are bound to the model and the conversation.** On the Claude API, only Fable 5.1 and Mythos 5.1 read Opus 5.5's thinking blocks. If a refusal fallback or router hands a conversation to Opus 5, later turns proceed without Opus 5.5's reasoning, and because the request succeeds, nothing raises an error. Accounts created on or after August 31, 2026 get a 400 when earlier history is edited.

**Settings to revisit**

- **Set effort explicitly.** Omitting it means medium. That's cheaper, but if your quality bar was tuned against Opus 5 at high, results may differ. Anthropic reports that Opus 5.5 at medium beats Opus 5 at high on coding and knowledge work; check that it holds for your tasks.
- **Pinned xhigh or max means more tokens.** As the table shows, max actually costs more. The guide recommends lowering effort before adding "think less" instructions to the prompt.
- **Leave room in `max_tokens`.** Thinking counts toward it. For long agentic coding turns, 64K is the suggested starting point.
- **Notes between tool calls arrive as `thinking` blocks.** Under the default display they're empty, so a UI that renders only `text` blocks goes quiet during long turns. The `thinking.display: "updates"` beta returns short progress summaries.

**No change needed:** the 1M context, 128K max output, and tokenizer are the same as Opus 5, so token counts don't need re-baselining.

---

## Moving from GPT-5.6 Sol to GPT-6 Sol

OpenAI didn't announce request-format breaking changes. What to check is performance and billing conditions.

- **Measure coding workloads before switching.** GPT-6 Sol scores below GPT-5.6 Sol on DeepSWE. If coding agents are your main use, keep 5.6 running, compare on the same tasks, and switch only if quality holds. Whether a small drop is worth half the cost is each team's call.
- **Effort has six levels, `none` through `max`, with `medium` as the default.** The model docs say Chat Completions supports function calling only with `reasoning_effort: none`, and point to the Responses API for reasoning plus function calling. If you run a tool-using agent on Chat Completions, check this first.
- **Design around the 272K surcharge.** Past it, the whole request is billed at 2x input and 1.5x output. Long conversations need summarization or compaction before that point.
- **Changing effort no longer breaks the cache.** OpenAI says GPT-6 preserves earlier context for cache reuse when you change reasoning effort or available tools mid-conversation, so raising effort only on hard turns is cheaper than before.
- **Try Luna first for bulk work.** For summarization, extraction, and classification with a clear goal, Luna is cheaper than Sol low and scores higher. But AA measured Luna dropping about 75 Elo on GDPval-AA (knowledge work), so check separately where output quality matters, such as documents and presentations.

---

## How to check this on your own work

Everything above is based on AA's tasks. A real switching decision needs your own numbers. I haven't run this myself; it's a proposed procedure.

1. **Pick 20 to 50 representative tasks** from production logs, and define completion criteria (tests pass, human approval) for each in advance.
2. **Measure your current setup as the baseline.** Keep model, effort, and prompts as they are. Record success rate, cost per task, time, and how often a human had to step in.
3. **Swap only the model.** Set effort explicitly to the same value. With Opus 5.5 this is mandatory, since omitting it means medium.
4. **Sweep effort.** Run one level below and one level above. Separating the model swap from the setting change is how you learn which one made the difference.
5. **Compute cost per completed task.** A cheap request isn't cheap if it needs more retries. Divide the cost of all attempts, failures included, by the number of successful tasks.
6. **Decide rollback conditions up front**, for example "stay if success rate drops more than 2 points below baseline." That keeps a price-driven switch from hiding a quality regression.

For example, a team running a coding agent on Opus 5 with effort omitted (high) would measure both Opus 5.5 high and medium in step 3. If medium holds quality, AA's numbers suggest roughly 60% lower cost; if it doesn't, staying at high still saves about 50%. Either way, any route running at max needs to be measured separately, since it gets no benefit from the price cut.

---

## Summary

Both announcements said "cheaper," but AA's numbers show the savings come from different places. GPT-6 Sol uses the same tokens at half the price; its scores barely moved and fell on DeepSWE. Opus 5.5 improved at every effort level and cut costs sharply from low through high, but the savings shrink as effort rises and vanish at max.

So which model is cheaper depends on the quality you need. For an AA index of 48 or below, GPT-6 Sol and Luna are cheaper; above that, Opus 5.5 at medium or high is. For cache-heavy agents, the gap between the two is smaller than the price sheet suggests.

The first practical step is to set effort explicitly in code. Opus 5.5's default dropped to medium, and the same effort name means a different amount of thinking on each model. In [#40](/blog/40-claude-opus-5/) the question was what to delete from your prompts, and in [#57](/blog/57-gemini-grok-migration/) it was what quietly changed on the price sheet. This time, add one more: **cost per task at each effort level.**

---

*Sources: [Introducing Claude Opus 5.5 (Anthropic, 2026-09-22)](https://www.anthropic.com/claude-opus-5-5), [Introducing GPT-6 Sol and Luna (OpenAI, 2026-09-22)](https://openai.com/index/introducing-gpt-6-sol-and-luna/), [GPT-6 Sol model docs (OpenAI)](https://developers.openai.com/api/docs/models/gpt-6-sol), [Artificial Analysis — Claude Opus 5.5](https://artificialanalysis.ai/models/releases/claude-opus-5-5), [Claude Opus 5](https://artificialanalysis.ai/models/releases/claude-opus-5), [GPT-6 Sol](https://artificialanalysis.ai/models/releases/gpt-6-sol), [GPT-5.6 Sol](https://artificialanalysis.ai/models/releases/gpt-5-6-sol), [GPT-6 Luna](https://artificialanalysis.ai/models/releases/gpt-6-luna), [GPT-6 Astra](https://artificialanalysis.ai/models/gpt-6-astra), [GPT-6 Sol and Luna push the cost efficiency frontier](https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier), [AA index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking), [The Decoder](https://the-decoder.com/openais-gpt-6-sol-and-luna-cut-prices-in-half-but-barely-move-the-needle-on-performance/), [SiliconANGLE](https://siliconangle.com/2026/09/22/anthropic-releases-claude-opus-5-5-and-openai-counters-with-two-cheaper-gpt-6-models/), [Hacker News discussion](https://news.ycombinator.com/item?id=49805509). AA figures are as of 2026-09-24 (index v4.3.2). AA does not detail how caching is applied in its cost-per-task figures. Token changes are estimates derived from cost and price changes. GPT-5.6 Sol's DeepSWE score (72.7%) is from The Decoder's reporting of OpenAI's launch chart. Opus 5.5 migration items follow Anthropic's official migration guide. All comparisons are calculated from public data; I did not call the APIs to measure them.*
