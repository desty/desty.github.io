---
title: "Grok 4.6 Gained 5 Points in a Month, Gemini 3.7 Flash Shipped Three Weeks After Its Predecessor — What to Check Before You Switch"
summary: "Two new models landed in the second week of August: Grok 4.6 on the 12th, Gemini 3.7 Flash on the 13th. The benchmark tables look great, but if you're the one migrating, the things worth checking sit outside the tables. Gemini's half price runs through December 31 and reverts on January 1 to exactly what 3.6 Flash costs today. Grok was reported as holding prices flat, but cache reads went up 67% — and long-running agents, the very workload this model targets, are the workload that hits cache reads hardest. I go through what actually improved over the previous versions, and what to check in your code and on the price sheet before you flip the model string: xhigh quietly starting to work, the vanished minimal level, the 200K pricing boundary, and the five parameters you now delete."
date: "2026-08-16T15:10:00"
tags:
  - gemini
  - grok
  - llm
  - model-release
  - prompt-engineering
  - agent-engineering
draft: false
---

This is the fifth entry in the series where I take apart new model releases: [Fable 5 (#21)](/blog/21-claude-fable-5/), [the GPT-5.6 trio (#31)](/blog/31-gpt-5-6-sol-terra-luna/), [Kimi K3 (#33)](/blog/33-kimi-k3/), and [Opus 5 (#40)](/blog/40-claude-opus-5/). This time it's two at once: **Grok 4.6**, released August 12, and **Gemini 3.7 Flash**, released the next day.

The reason to look at them together isn't just the overlapping dates. Both companies **raised their scores without a new foundation model.** xAI changed the training recipe instead of building a new base and gained five points in about a month; Google, with its flagship Gemini 3.5 Pro still delayed, is stamping out workhorse Flash releases three weeks apart. The center of gravity of improvement is moving out of pretraining — the pattern from [#54](/blog/54-prime-agent-self-improving-harness/) — and this week two frontier labs confirmed it at once.

And from a migrating developer's seat, the two releases share one more thing: **the changes that break your bill are bigger than the changes that break your code.** Let's take them one at a time.

---

## Grok 4.6: +5 points in a month, same base

One housekeeping note first: xAI was acquired by SpaceX in February and now goes by SpaceXAI, but the domain, the API, and the legal entity are all still x.ai / X.AI LLC, so I'll keep writing xAI here.

Here's how xAI says it improved the model. A **longer supplemental training run** than Grok 4.5 (improved optimizer and training recipe, curated model-generated data), **SFT trajectories regenerated from scratch** using Grok 4.5 itself, and **agentic RL** across knowledge work, coding, and domain-specific environments. Not a word about new architecture. No parameter count or structure was disclosed (the "1.5T" figure floating around is carried over from Grok 4.5-era press coverage, not an xAI spec).

The results, with the context window unchanged at 500K and a knowledge cutoff of February 1, 2026:

| Benchmark | Grok 4.6 | Grok 4.5 | Notes |
|---|---|---|---|
| Artificial Analysis Index | **61** | 56 | Tied with GPT-5.6 Sol; third behind Opus 5 (63) and Fable 5 (62) |
| AA-Briefcase (Elo) | **1577** | 1313 | Biggest jump. Long-horizon knowledge work |
| GDPVal-AA v2 (Elo) | **1753** | 1526 | Second only to Opus 5 here |
| DeepSWE v1.1 | **65.9%** | 54% | Up a lot, still behind GPT-5.6 Sol Max (73%) |
| APEX-Agents | **57.5%** | 47.1% | |
| Terminal-Bench v3.0 | **26%** | 15.7% | Still far behind GPT-5.6 Sol Max (34.6%) |
| CursorBench v3.2 | **69.9%** | 66.7% | The smallest gain in the table |

The announcement leans on "long-running agents." On longer trajectories, xAI says **the model started doing more self-testing and verification** — phrased as something observed rather than engineered. There's one third-party number that backs the claim up. In Artificial Analysis's AA-Briefcase measurement, Grok 4.6 finished tasks in **about 53 turns and 0.5B input tokens.** Claude Opus 5 took about 103 turns and 2.0B input tokens on the same tasks. The per-token price is lower and the token count is less than half, so the real-cost gap compounds. AA measured the cost of running its Intelligence Index at **$0.84 per task.**

So Grok 4.6's seat is not "the smartest model" — it trails GPT-5.6 and Claude on pure coding benchmarks. Its seat is **the executor that finishes long agent loops in fewer turns at a lower price**, and the usage pattern already being reported in developer communities matches: have an expensive model do the planning, hand the implementation to Grok.

---

## Three things to check before switching to Grok 4.6

Changing the model string from `grok-4.5` to `grok-4.6` breaks nothing by itself. There are no announced breaking changes, and 4.5 isn't retired. The problems come after.

**First, xhigh now actually works.** 4.6 adds a new top level, `xhigh`, to `reasoning_effort` (the default stays `high`). The trap is in the old model's behavior: **4.5 silently treated `xhigh` as `high`, with no error.** If someone put xhigh in your config "just in case," it has been a no-op all along — and the moment you flip the model string, that line starts spending real money and real latency. There's already a real-world incident: Hermes Agent had a compatibility shim from the 4.5 days silently rewriting `xhigh` to `high`, and the bug was only caught when [the same prompt showed 362 vs 1,767 reasoning tokens](https://github.com/NousResearch/hermes-agent/issues/84799). That incident also hands you the verification method: **don't trust the config file, read `usage.reasoning_tokens` in the response.** Whether a setting actually landed is only visible at the token-accounting layer.

Is xhigh worth using? Per external tracking, CursorBench goes from 69.9% at high to 70.8% at xhigh — **0.9 points for roughly 20% more cost per task.** That's not a global default; it's a per-step lever for the turns that keep failing (a hard planning turn, a gnarly refactor). One more thing: `reasoning_effort` can't be combined with `stop`, `presencePenalty`, or `frequencyPenalty` — the API errors out. Code that uses `stop` will break the moment someone adds an effort setting, so audit that ahead of time.

**Second, cache reads got 67% more expensive.** The base rates — $2 input / $6 output per million tokens — are identical to 4.5, which is why this got reported as a price freeze. Read one more line of the price sheet and you find **cached input went from $0.30 to $0.50** (and from $0.60 to $1.00 in the 200K-plus tier). Here's why that matters: a long-running agent loop re-sends the accumulated conversation every turn, and most of that lands as cache hits. The more your workload looks like the one this model was built for, the more of your bill is cache reads — and that's the exact rate that went up. The countermeasure is in the docs: **pin conversations to the same server with `prompt_cache_key`** so cache hits stay reliable — without it, requests can land on a cache-cold server and pay full input rates. In [#48 I called cache hit rate the report card of your prompt design](/blog/48-cache-hit-rate/); on Grok, routing configuration is now on the report card too.

**Third, the context window is 500K, but budget for 200K.** The price sheet splits at 200K prompt tokens, and once you cross it, **the entire request** is billed at $4 input / $12 output. Run the arithmetic on the published rates: a 180K prompt plus 20K output is about $0.48; push the prompt past 200K and the same output costs about $1.04. Twenty thousand more input tokens, double the bill. xAI's own docs recommend context compaction for agent workflows. The point is to design around summarizing and compacting inside 200K from the start, instead of trusting the 500K window and letting conversations pile up. In [#55 I wrote that partition key design is cost design](/blog/55-dynamodb-vector-search/); here, context length sits in that same seat.

One footnote. Grok 4.5 is not retired, but when xAI retired eight legacy models in May, it didn't 404 the old model names — it **redirected them to a newer model and billed at the new model's rates.** If 4.5 ever retires, your build won't break. Your bill will just change.

---

## Gemini 3.7 Flash: a workhorse every three weeks, a Pro that keeps slipping

The Google story starts with the release cadence. 3.5 Flash on May 19, 3.6 Flash on July 21, 3.7 Flash on August 13 — **three weeks between the last two.** Meanwhile Gemini 3.5 Pro, promised for June, still doesn't exist. Bloomberg's reporting says its coding performance fell short of internal expectations; on the earnings call, Pichai skipped the Pro timeline and pivoted to "releasing models almost at a monthly cadence." The picture is a company covering a stalled frontier tier with rapid workhorse iterations.

3.7 Flash itself is a genuine coding-and-agents upgrade. Against 3.6 Flash, on Google's own benchmarks:

| Benchmark | 3.7 Flash | 3.6 Flash |
|---|---|---|
| DeepSWE v1.1 | **65.3%** | 49.0% |
| FrontierCode 1.1 (Main) | **43.6%** | 34.4% |
| AutomationBench | **30.4%** | 17.0% |
| Terminal-bench 2.1 | **85.8%** | 78.0% |
| WebDev Arena (Elo) | **1588** | 1538 |
| GDP.pdf (finance, legal, biosciences) | **34.0%** | 22.0% |

On WebDev Arena it now leads Claude Sonnet 5 (1541) and GPT-5.6 Terra (1523). But it still trails GPT-5.6 Terra on DeepSWE (69.6%), and its Artificial Analysis Index is 56 (at high) — not frontier territory. Context 1M, output 64K, cutoff March 2026. This is a leap within the workhorse tier.

Pricing is the headline of this release, and it comes with an expiration date. **$0.75 input / $3.75 output runs through December 31; on January 1 it reverts to $1.50 / $7.50.** And that reversion price is exactly what 3.6 Flash costs today. In other words, this is not a permanent cut — it's a 4.5-month promotion, and next year's budget should be built on $1.50/$7.50, not on your current invoice. Token efficiency deserves a look too. 3.6 Flash's selling point was a 17% cut in output tokens; the 3.7 announcement makes no efficiency claim at all. One outside review (eesel) actually measured 3.7 using roughly 40% more tokens per task than 3.6 — a single source, so not settled, but if true, the effective discount on the half-price sticker is smaller than it looks, and the moment the promotion ends, the effective per-task cost comes out above 3.6.

---

## Migrating to Gemini 3.7 Flash: start by deleting

When [Opus 5 came out](/blog/40-claude-opus-5/), the first item on the migration checklist was "what do I delete." Gemini points the same way — but where Opus 5 told you to delete prompt instructions, Gemini tells you to **delete API parameters.**

**Delete: `temperature`, `top_p`, `top_k`, `candidate_count`, and prefilled model turns.** Sampling parameters are deprecated wholesale on the latest Gemini models (as of the July 21 changes). For temperature in particular, the official docs warn that touching the default of 1.0 causes looping and degraded output. The years-old habit of "output looks weird, go tune temperature" is now a forbidden item on this model family.

**Replace: the `thinking_budget` integer with the `thinking_level` string.** Three levels — low / medium / high — defaulting to medium, and sending both parameters in one request is an error. Google's per-level guidance: low for latency-sensitive work (real-time chat, drafting), medium for most tasks and agent use, high for hard math and the most difficult coding.

**Gone: `minimal`.** This is the change that hurts most in production. The lowest thinking level, present through 3.5 Flash, 3.5 Flash-Lite, and 3.6 Flash, is gone in 3.7 — sending it returns an error. Minimal was the floor that made high-volume, low-unit-cost pipelines viable: OCR, ticket classification, tagging. In 3.7 that floor has moved up to low, so **the right move for those workloads may be to not migrate them at all and leave them on 3.5 Flash-Lite ($0.30/$2.50, defaults to minimal).** The good news: there is no forced migration — no retirement dates have been announced for the 3.5 or 3.6 lines. The only pressure is the promotional price.

**What to change in prompts.** The official Gemini 3 guidance compresses to one line: turn the dial instead of engineering the prompt. Rather than pasting in the chain-of-thought scaffolding you've accumulated over the years, raise `thinking_level` and make the prompt itself short and direct. For long context, put the question after the data; the default voice is terse, so if you want a conversational tone, say so explicitly with a persona. Tool calling needs an audit: `FunctionResponse` now requires `call_id` and `name`, and multimodal assets must go inside the response payload (no separate transmission).

---

## Before you trust the benchmark table

These two releases produced an unusual crop of benchmark-reading lessons. Three of them.

**The same model scores 26% and 88.4%.** Grok 4.6's Terminal-Bench score is 26% in xAI's table (v3.0) and 88.4% in Artificial Analysis's measurement (v2.1). Different versions, different difficulty — and a number circulating without its version tag is meaningless either way. Even on the identical v2.1, two measurers (AA and Vals) came out 10 points apart: harness alone moves the number that much. In [#38 I argued harness comparisons need parentheses](/blog/38-tofu-white-box-harness/); benchmark versions need them too.

**What "1753 ELO" actually is.** The number Musk posted context-free — "Grok 4.6 reaches 1753 ELO" — is not LMArena. It's the Elo from GDPval-AA v2. A number stripped of its source, circulating and getting misread as a more famous metric: a textbook case of benchmark-number laundering.

**Read the footnote.** xAI's table carries this footnote: third-party model scores are "the best of self-reported or publicly available results." Their own numbers are single-config; competitors' are cherry-picked bests — not an apples-to-apples comparison from the start. Google's table is entirely self-reported by the publisher. This is [the same point as #40](/blog/40-claude-opus-5/), so I'll just repeat it: wait for third-party reproduction.

---

## Which model for which job

Neither of these is a frontier-tier model. Sorting the decisions by cost:

- **High-volume classification, tagging, OCR** — don't move to 3.7 Flash. With minimal gone, the floor price went up. Leave these on 3.5 Flash-Lite, or if they're already on 3.6, leaving them there is fine too (no retirement date).
- **Coding and agent workhorse** — 3.7 Flash is now the strongest thing in the workhorse tier, and through year-end it's genuinely cheap at $0.75/$3.75. But budget 2027 at $1.50/$7.50, and when the promotion ends, re-run the comparison against staying on 3.6 or going elsewhere.
- **The implementer inside long agent loops** — this is the seat Grok 4.6 is aiming for, and the numbers back it ($0.84 per task, half the turns). The reported division of labor is: frontier model plans, Grok implements. But only after you've set `prompt_cache_key` and designed to a 200K budget.
- **Where you need the best quality, period** — neither. Overall intelligence still goes Opus 5, Fable 5, GPT-5.6; Grok 4.6 is third at 61 and 3.7 Flash sits at 56.

---

## Closing

This week's two releases are two versions of the same story. In a stretch where new foundations aren't arriving, xAI reworked its training recipe and got five points in a month, and Google is refreshing its workhorse tier every three weeks. The benchmark race has moved out of pretraining and into everything that comes after it.

And once again, the changes that actually matter to developers sat outside the announcement headlines. Gemini's half price has an expiration date; Grok's "price freeze" arrived together with a 67% cache-rate hike. Parameters to delete (the temperature family), a parameter that quietly starts working (xhigh), a vanished tier (minimal), a boundary that doubles your bill (200K) — none of it shows up in the one-line diff that changes the model string. [The question #40 left](/blog/40-claude-opus-5/) was "what do I delete from my prompt this time." This week added one more: **what quietly changed on the price sheet?**

---

*References: [Grok 4.6 announcement (xAI, 2026-08-12)](https://x.ai/news/grok-4-6), [Grok 4.6 docs](https://docs.x.ai/developers/grok-4-6), [xAI models & pricing](https://docs.x.ai/developers/models), [xAI reasoning docs](https://docs.x.ai/developers/model-capabilities/text/reasoning), [Artificial Analysis — Grok 4.6 analysis](https://artificialanalysis.ai/articles/grok-4-6-benchmarks-and-analysis), [Hermes Agent issue #84799](https://github.com/NousResearch/hermes-agent/issues/84799), [Gemini 3.7 Flash announcement (Google, 2026-08-13)](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/), [Gemini 3.7 Flash model card](https://deepmind.google/models/model-cards/gemini-3-7-flash/), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog), [Gemini 3 developer guide](https://ai.google.dev/gemini-api/docs/gemini-3), [InfoWorld](https://www.infoworld.com/article/4209622/google-cuts-gemini-3-7-flash-prices-as-enterprise-ai-economics-diverge-and-pro-cadence-slows.html), [Bloomberg](https://www.bloomberg.com/news/articles/2026-08-13/google-debuts-new-gemini-flash-while-top-ai-model-still-delayed). Benchmark figures are as of 2026-08-16 and, unless noted, publisher claims. Grok 4.6's xhigh benchmark numbers and the 3.7 Flash token-usage increase come from external tracking and a single review respectively; neither has official confirmation.*
