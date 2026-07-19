---
title: "'A Chinese Open Model Beat Everyone' — Kimi K3, I Rolled the Tape to Check"
summary: "On July 16 Moonshot shipped the 2.8-trillion-parameter Kimi K3, and the headline that an open model beat Fable 5 and GPT-5.6 Sol swallowed the week. In the last two posts (#21, #31) U.S. labs locked their strongest tier behind government gates; China did the opposite and routed around the wall by open-sourcing the biggest one. But is 'beat everyone' true? Rolling the tape on only the comparable numbers, it's half true, half marketing — 4th on overall intelligence, but genuinely #1 on three axes. Here's what's real and what's spin, split by data."
date: "2026-07-18T10:00:00"
tags:
  - kimi-k3
  - llm
  - open-weights
  - model-release
  - agent-engineering
draft: false
---

The last two posts told the same story. In [blog #21](/blog/21-claude-fable-5/), Anthropic put a Mythos-class tier above Opus and locked the strongest model behind the government and a few partners. In [blog #31](/blog/31-gpt-5-6-sol-terra-luna/), OpenAI released GPT-5.6 Sol only to government-approved partners two weeks later. The conclusion: **the frontier is splitting into what you can buy and what's locked away.**

On July 16, China's [Moonshot](https://www.moonshot.ai/) moved the opposite way. [**Kimi K3**](https://kimik3.xyz/) — at 2.8 trillion parameters, the largest open-weight model to date, with full weights promised for July 27. While the U.S. builds a wall, China routed around it by letting you download the biggest one.

And the week's headline compressed to one line. **"A Chinese open model beat both Fable 5 and GPT-5.6 Sol."**

Is that true? This post checks. The short answer: **half true, half marketing.** Let's roll the tape on only the comparable numbers.

---

## First, what happened

- **Scale:** 2.8T total parameters. MoE (LatentMoE), activating 16 of 896 experts per token. Active parameter count undisclosed.
- **Attention:** Kimi Delta Attention (KDA), hybrid linear attention. Instead of a full KV cache, it uses recurrent state to control what to keep and overwrite, sustaining the 1M-token context.
- **Mode:** Native vision, 1M-token context by default, maximum reasoning **always on and non-disableable** (131K default output, up to 1.04M).
- **Price:** $3 in / $15 out per million tokens. Three to four times its predecessor K2.6 ($0.95/$4) — **the priciest a Chinese lab has shipped** — but cheaper than Opus 4.8 ($5/$25).
- **Weights:** Full Hugging Face release promised July 27 (verify the license that day).

That's the spec. Now let's verify "beat everyone" in three pieces.

---

## Check 1: on overall intelligence, it didn't — it's 4th

First, a trap. The SWE-bench / Terminal-Bench / GPQA numbers each lab publishes **shouldn't be compared to each other.** They're self-reported on different agent harnesses, so Moonshot's 88 and Anthropic's 88 aren't the same test. The headlines blur this into "K3 won."

The **one apples-to-apples measure** — one party (Artificial Analysis) running every model on the same methodology — is the overall Intelligence Index. Here's how it lands.

| Model | AA Intelligence Index |
|---|---|
| Claude Fable 5 | 60 (#1) |
| GPT-5.6 Sol | 59 |
| Gemini 3.1 Pro | ~57 |
| **Kimi K3** | **57 (#4)** |
| Claude Opus 4.8 | 56 |

**K3 is 4th.** Fable 5 and Sol are above it, it's effectively tied with Gemini 3.1 Pro, and it narrowly edges Opus 4.8. The "beat everyone" headline collapses here. On raw overall capability, K3 got close to the frontier — it isn't the summit.

On agentic work (GDPval v2 Elo) the gap widens — Fable 5 is at 1,760 vs K3's 1,668 (Opus 4.8 is 1,600). For long autonomous agent runs, Fable 5 is still clearly ahead.

---

## Check 2: but there are three places it genuinely did

Here the other half of the headline comes alive. K3 didn't beat "everyone," but on **three specific axes it genuinely took first place** — and these happen to be the axes you hit most often in real work.

**(1) Among models you can download, it's the runaway #1.**

Being 4th overall flips to: **the strongest model whose weights you can hold.** The three seats above it (Fable 5, Sol, Gemini) are all closed APIs, and the top ones (Mythos 5, Sol) are [locked behind government gates](/blog/31-gpt-5-6-sol-terra-luna/). For a country, company, or lab that can't get Sol, K3 isn't a runner-up — it's effectively the ceiling of what's in reach. The open-weight floor rose to just under the frontier, which is the real reason for the DeepSeek-style market reaction.

**(2) #1 on blind preference for front-end code — beating the closed leaders.**

In Arena's front-end code arena, K3 ranks **#1**. That's not a benchmark measuring correctness — it's a blind comparison where developers see two outputs side by side, not knowing which model made which, and pick the better one. There, people chose K3's front-end output over **Fable 5's and GPT-5.6 Sol's** more often. A model that's 4th overall beat the closed leaders on human preference for a specific job. Not "this model is smarter" — "for this job, I'll use this."

**(3) Cheapest per task.**

The per-token rate went up from K2.6, but what matters is the total cost to finish a task — and K3 uses 21% fewer output tokens than the prior generation. The result:

| Model | Cost per task (AA) |
|---|---|
| **Kimi K3** | **$0.94** |
| GPT-5.6 Sol | $1.04 |
| Claude Opus 4.8 | $1.80 |

For the same job, K3 is cheaper than Sol and nearly half of Opus 4.8. **On the value axis, it genuinely ate everyone's lunch.**

So "beat everyone" is wrong, but "beat open-weights, front-end, and value" is right. The headline inflated those three into "everyone."

---

## Check 3: where it didn't win — and where to be careful

For balance, the other side. K3 has weaknesses the headline hides.

- **Hallucinations went up.** On AA-Omniscience, accuracy rose 33%→46%, but the **hallucination rate rose too, 39%→51%.** It gets more right and makes more up. For factual work (research, fact compilation), that's a red flag.
- **It's slow.** Output runs at 62 tokens/sec, below the median (71) for reasoning models in its price tier. With max reasoning always on, responses are long. Not for latency-sensitive real-time use.
- **Science, facts, vision go to Gemini.** Even within the same #4 tier, K3 earns its points on coding/agentic, while Gemini 3.1 Pro leads on scientific knowledge, factual reliability, and visual reasoning.
- **The conditions on "open."** You can't get the weights yet (as of July 18) — July 27 is the date — and even then you must reproduce a "harness contract" (KDA-specific kernels, reasoning-history preservation, tool-parsing conventions) to behave like the app. Open is not the same as cheap or free.

---

## In practice: what should you actually use?

The takeaway across the three checks: this isn't the era of finding "the one strongest model," it's the era of **attaching whichever model won for that job** (an extension of [#27](/blog/27-domain-specific-models/)). Concretely:

- **Front-end/UI coding, high-volume value work → K3.** #1 blind preference plus cheapest-per-task lands exactly here. But validate over the API first (pre-weights), measure whether it really wins on your workload, then talk self-hosting.
- **Hard multi-step reasoning, long autonomous agents → still Fable 5 (or Sol).** The GDPval Elo gap (1,760 vs 1,668) is where you feel it.
- **Factual-critical work → watch K3's hallucination rate (51%).** Always wrap fact compilation and citation in a verification step.
- **Migration, three rules:** (1) don't drop the reasoning history (`reasoning_content`) across multi-turn; (2) don't switch models mid-conversation (it breaks the state contract); (3) you can't turn thinking off, so [brake](/blog/31-gpt-5-6-sol-terra-luna/) with output caps and task scope. Shape tool calls to what K3 expects, per [MCP tool design](/blog/29-mcp-tool-design/).

---

## So, rereading the headline

Rolling the tape on "a Chinese open model beat everyone":

- **What's wrong:** it's 4th on overall intelligence. Fable 5 and Sol are above it; it trails on agentic work, factual reliability, and speed. "Beat everyone" is spin.
- **What's right:** #1 among downloadable models, #1 on front-end blind preference, #1 on cost per task. It took exactly the three axes you hit most in real work.

In #21 and #31 the frontier split **vertically** — the shelf below you can buy, the top shelf locked behind the government. K3 drew a **horizontal** axis: the closed-API side, and the open side whose weights you can hold. And **the open side's floor rising to just under the frontier is the week's real event.** Strip out the inflated "everyone," and that one fact is still big news.

Closing #31, I wrote the question had become "who can use the strongest model, and what will you assemble from the tier you were given." K3 widens the answer by one slot — for the first time, that assembly list includes **"a just-below-frontier model you can download onto your own servers."** Looking up at the #1 on the leaderboard matters — but so, now, does splitting by data who actually won for the job in front of you.

---

*References: [Kimi K3 (Moonshot AI)](https://kimik3.xyz/), [Kimi K3 – Intelligence, Performance & Price (Artificial Analysis)](https://artificialanalysis.ai/models/kimi-k3), [Kimi's open model K3 nears GPT-5.6 Sol and Fable 5 (The Decoder)](https://the-decoder.com/kimis-open-model-k3-nears-gpt-5-6-sol-and-fable-5-while-signaling-the-end-of-super-cheap-chinese-ai/), [Kimi K3, and what we can still learn from the pelican benchmark (Simon Willison)](https://simonwillison.net/2026/Jul/16/kimi-k3/), [China's Moonshot AI releases Kimi K3, the largest open-source model ever (VentureBeat)](https://venturebeat.com/technology/chinas-moonshot-ai-releases-kimi-k3-the-largest-open-source-model-ever-rivaling-top-u-s-systems), [Moonshot releases 2.8-trillion-parameter Kimi K3 (Tom's Hardware)](https://www.tomshardware.com/tech-industry/artificial-intelligence/moonshot-releases-2-8-trillion-parameter-kimi-k3), [Kimi K3: The 2.8T Model Promising Open Weights—and a Hidden Harness Contract (rohitai)](https://rohitai.com/blog/kimi-k3-open-model-harness-contract). Benchmarks and pricing are as published on 2026-07-18 and may change with the July 27 weights/license release.*
