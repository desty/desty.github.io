---
title: "The New Model Wins While Thinking Less — Real-World Accounting for Migrating a Production Agent"
summary: "For four months, Claude Opus 4.8 was unbeaten on Ploy's production evals. Then GPT-5.6 took the crown: 27% lower cost per completion, 2.2x faster, higher quality — while emitting half the output tokens. On this workload, the new model produced more with less. Roughly a third of the first run's raw failures came not from the model but from a harness bent around Opus; tool schemas, caching, and reasoning replay had to migrate with it for a fair comparison. [#35](/blog/35-harness-engineering/) asked 'is that the model's score, or the harness's?' — this is that question in live production."
date: "2026-07-19T18:00:00"
tags:
  - gpt-5-6
  - model-migration
  - harness-engineering
  - agent-engineering
  - ai-coding
draft: false
---

There are two common ways to compare models: benchmark scores, or price per million tokens. If you run a production agent, both are half-measures. The benchmark isn't your workload, and the price sheet hides the fact that different models burn very different token volumes for the same job.

That's what makes [Ploy's migration write-up from earlier this month](https://ploy.ai/blog/migrating-a-production-ai-agent-to-gpt-5-6) valuable. Their production agent builds entire marketing websites — plans the page, reads the codebase, writes components, generates imagery, screenshots its own work, and decides when it's done. They moved it from Claude Opus 4.8 to GPT-5.6 and published every pothole and the final accounting.

The summary first: **for four months, no frontier model beat Opus on their production evals — GPT-5.6 was the first to clear it.** Cost per completion fell 27%, wall-clock time was 2.2x shorter, and quality scored higher. But the first run also mixed model behavior with harness-compatibility failures; separating them was necessary for a fair comparison.

---

## The twist: your evals are bent around the incumbent

Plugging GPT-5.6 into the existing pipeline produced strong aggregate results but also exposed several failure modes. When they triaged the traces, **roughly a third of the raw failures came from harness assumptions, not model behavior.**

The signature example is the tool-call budget. Opus tends to call tools sequentially, so the pipeline's call limits were tuned to that rhythm. GPT-5.6 fires several calls in parallel. It was doing the same work, blowing through a limit, and getting marked as a failure. The model didn't fail; the referee was holding the old rulebook.

I think this is the most valuable lesson in the piece. Run one model for months and your prompts, tool schemas, call budgets, and eval criteria all bend, degree by degree, around that model's habits. Nobody intends it; it happens anyway. Drop a new model into that pipeline and score it, and **you're making the challenger play an away game in the incumbent's home stadium.** In Ploy's words: triage the traces before trusting the pass rate.

[#35 argued the harness is the asset that survives model swaps.](/blog/35-harness-engineering/) True — and this case shows the flip side. **Assets have inertia.** The harness accumulated in your repository hardens into the shape of the incumbent, and that inertia masks what the new model can do.

---

## Three renovations: schemas, caching, reasoning replay

Migrating the harness came down to three jobs. What they share: every fix was structural, not prompt-level.

**1) Tool schemas — when prompting can't fix it, the schema can.** Their file-reading tool had 1 required parameter and 24 optional ones. Opus sent only the 2–3 it needed; GPT-5.6 filled in **all 25, on every one of 6,635 calls** — inventing values when it had none. Those invented offsets meant 52% of file reads came back empty. The prompt instruction "leave optional parameters empty" did nothing. The fix was a schema change: make every optional parameter **required but nullable**, and the model sends explicit nulls instead of inventions. Empty reads went from 52% to 0%, and total tool calls dropped about 30%. It's a live replay of [#29's thesis that tool design is agent quality](/blog/29-mcp-tool-design/).

**2) Caching — never compare costs on a cold cache.** Anthropic's cache tolerates partial prefix matches, so a sloppy layout still hit. OpenAI's requires exact matching and charges a 1.25x write premium. Ported as-is, first calls in new conversations hit the cache 0% of the time. Only after redesigning around workspace-scoped keys and hierarchical breakpoints (tools + static prefix → workspace context → session turns) did they get **83.7% first-call cache hits** and 28% fewer uncached input tokens. Cache strategies differ per vendor — which means **a cost comparison taken before the cache migration can be biased against the challenger.**

**3) Reasoning replay — don't park state on the server.** GPT-5.6's Responses API replays prior-turn reasoning, and the server-side reference mode failed intermittently in production ("Item not found"). Setting `store: false` switched to self-contained encrypted reasoning content carried in the request, which fixed it.

---

## The accounting: the new model wins while thinking less

The final numbers, after the renovations. The sample is small: 11 completed Opus builds and 10 GPT-5.6 builds.

| Metric | Claude Opus 4.8 | GPT-5.6 | Change |
|---|---|---|---|
| Avg. cost per completion | $3.06 | $2.22 | **−27%** |
| Wall-clock time | 8m 00s | 3m 42s | **2.2x faster** |
| Input tokens | 2.60M | 1.70M | −35% |
| Output tokens | 33.0K | 17.1K | **−48%** |
| Quality (visual score) | 0.936 | 0.970 | +0.034 |

The row to stare at isn't cost — it's **output tokens.** GPT-5.6 says half as much as Opus and scores higher. The generated code points the same way: Opus produced a 17,957-character globals.css with 174 CSS variables; GPT-5.6 built the same page with 2,508 characters and 45 variables.

What this workload showed is narrower: **the new model scored higher with fewer output tokens while reducing both completion cost and time.** [The Sol benchmarks in #31 pointed in a similar direction](/blog/31-gpt-5-6-sol-terra-luna/), but whether the result holds elsewhere requires each team's own evaluation.

It isn't free, though. The three renovations above are the precondition for this table. GPT-5.6 measured on a cold cache with the old schemas is not the model in this table.

---

## In practice: four checks before you compare models

The transplantable checklist is four lines.

**1) Triage traces before trusting the pass rate.** Split the new model's failures into model failures and harness failures and count them. For Ploy it was one third harness. Without that split, "the new model wasn't great" isn't measurement — it's home-field advantage.

**2) Fit tool schemas to the new model's habits.** Parallel-call tendencies and parameter-filling behavior differ per model and resist prompting. For tools with many optional parameters, consider the required-but-nullable pattern.

**3) Redesign caching for the vendor's structure, then measure cost.** Prefix matching, write premiums, and key scoping all differ. Cost comparisons taken before the cache migration are void.

**4) Account in cost per completion as well as price per token.** The price sheet alone cannot express differences in token use and success rate. "Dollars and minutes per successful task on my workload" is a fairer companion metric.

One prerequisite underneath all four: without [#32's eval pipeline](/blog/32-ai-eval/), there's no comparison to run at all. Ploy can say "nothing beat Opus for four months" only because a production eval met every challenger at the door.

---

## What people actually wanted

Ask why this post took off on HN, and the demand underneath isn't the scoreboard of "GPT beat Claude." It's **the freedom to switch.** In an era where frontier models flip rankings every few months, what organizations truly fear isn't a bad model — it's a better model showing up and being unable to move.

And as this case shows, lock-in no longer lives in price sheets or API compatibility. **Lock-in lives in harness assumptions.** Tool schemas, cache layouts, call budgets, eval criteria — all quietly bent around the incumbent's habits, accruing into switching costs. Ploy paid that cost down and collected 27% and 2.2x.

[#35 ended by asking "is that the model's score, or the harness's?"](/blog/35-harness-engineering/) This post is that question inverted, in live production: **is that low score the model failing, or the harness holding it back?** Only teams that can answer both turn the pace of model churn into an advantage. For tier selection basics see [#31](/blog/31-gpt-5-6-sol-terra-luna/); for the general harness argument, [#35](/blog/35-harness-engineering/).

---

*References: [Migrating a production AI agent to GPT-5.6 (Ploy, Lorenzo Gentile, 2026-07-09)](https://ploy.ai/blog/migrating-a-production-ai-agent-to-gpt-5-6), [GPT-5.6 pricing and prompt caching (OpenAI)](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna), [HN discussion](https://news.ycombinator.com/item?id=48882716). Figures are from Ploy's 11 completed Opus builds and 10 GPT-5.6 builds. This is one company and one workload, so the result should not be generalized.*
