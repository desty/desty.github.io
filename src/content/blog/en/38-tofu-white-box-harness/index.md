---
title: "Models Frozen, Three Harnesses Swapped — The Paper That Beat Claude Code on 28% Fewer Tokens"
summary: "[#35](/blog/35-harness-engineering/) ended with the question 'did the model earn that score, or did the harness carry it?' — and six days later a paper answered it with a controlled experiment. ToFu, an open-source harness from the NiuTrans lab (Northeastern University, China) and Meituan, froze three models, swapped only the harness, and ran SWE-bench Verified: 28.4% fewer tokens than Claude Code on average, with Pass@1 3.8 points higher. The three-layer context compaction behind it, the Opus plot twist where saving tokens didn't save money, and a multilingual pipeline that doesn't help Korean yet."
date: "2026-07-19T21:00:00"
tags:
  - harness-engineering
  - agent-engineering
  - ai-agent
  - agentic-coding
  - context-engineering
draft: false
---

I ended [#35](/blog/35-harness-engineering/) with this question: **"Did the model earn that score, or did the harness carry it?"** The evidence in that post — LangChain, Faros — was all self-improvement reporting: "we fixed our harness and our numbers went up." Persuasive, but not a comparison.

Six days later, a paper ran that comparison head-on. [ToFu: A White-Box, Token-Efficient Agent Harness for Researchers](https://arxiv.org/abs/2607.11423) froze three models and swapped **only the harness** — three of them — across SWE-bench Verified. The headline: with the model untouched, accuracy moved by up to 9 points.

---

## The experiment design is exactly that question

The authors took Claude Opus 4.6, GLM 5.1, and DeepSeek-v4-pro and ran each through three harnesses — their own ToFu, Claude Code, and the open-source [OpenCode](https://github.com/sst/opencode) — on the 500 problems of SWE-bench Verified. Here's Table 1 from the paper:

| Model | Harness | Pass@1 | Avg tokens | Avg cost |
|---|---|---|---|---|
| Opus 4.6 | ToFu | **83.2%** | 663,881 | $5.13 |
| | Claude Code | 79.6% | 837,764 | $4.97 |
| | OpenCode | 74.2% | 757,925 | $7.00 |
| GLM 5.1 | ToFu | **80.4%** | 575,255 | $1.19 |
| | Claude Code | 77.6% | 1,020,453 | $1.67 |
| | OpenCode | 71.6% | 568,097 | $0.81 |
| DeepSeek-v4-pro | ToFu | **80.2%** | 1,110,192 | $1.66 |
| | Claude Code | 75.2% | 1,401,574 | $1.86 |
| | OpenCode | 71.8% | 831,294 | $1.08 |

Averaged across the three models, ToFu beats Claude Code by 3.8 points and OpenCode by 8.7 points on Pass@1, while using 28.4% fewer tokens than Claude Code — up to 43.6% fewer with GLM 5.1.

What matters in this table isn't the ranking — it's **the size of the gaps.** The same GLM 5.1 swings from 71.6% to 80.4% depending on the harness. That 9-point spread is what you'd expect from a model generation upgrade, and not a single model weight changed. When [#35 claimed the "benchmark rank = model quality" equation had broken](/blog/35-harness-engineering/), this is the controlled number it was missing.

And one more thing: the side that spent more tokens scored lower. Claude Code used more tokens than ToFu on all three models and lost on all three. The test-time-compute intuition — more tokens, better results — doesn't hold at the harness layer. Wasted tokens aren't computation; they're noise.

---

## The trick: three-layer context compaction

ToFu saves tokens in stages, not in one big event. From Section 2.2 of the paper:

**Layer 1 — externalize tool outputs.** Large results from search, command execution, and web fetches never ride in context whole. They're written out to files, replaced with a short preview and a recoverable reference. The model keeps knowing *where* the evidence is without carrying its full text everywhere. File reads get conservative treatment, though — evicting a file only to re-read it is the waste this layer exists to avoid.

**Layer 2 — cache-aware micro-compaction.** Older tool outputs and stale reasoning blocks get replaced with terse placeholders. The clever part: this pass is **deterministic, with no LLM call,** and it never touches cached prefixes. It avoids the double loss of paying tokens to summarize and invalidating your prompt cache in the same move.

**Layer 3 — query-aware semantic compaction.** Only when the conversation approaches the context limit does a lightweight model summarize older turns. The criterion isn't "is it old" but **"is it relevant to the current query"** — critical turns are preserved near-verbatim, tangential ones get a line, irrelevant ones are dropped.

If you use Claude Code, this will remind you of auto-compact — and the difference is structural. Auto-compact is one big event: at a threshold, an LLM summarizes the whole conversation. ToFu keeps bleeding pressure off with two cheap mechanisms (externalization, deterministic substitution) so the expensive summarization comes later and less often. It takes the principle from [#30's context engineering](/blog/30-context-engineering/) — context is a finite budget — and stratifies it by when you spend.

---

## Saving tokens didn't save money

Look at the table again and one row is strange. On Opus 4.6, ToFu used 21% fewer tokens but **cost $0.16 more** ($5.13 vs $4.97). On GLM and DeepSeek, token savings translated straight into cost savings; only Opus flips.

The paper doesn't analyze why, and the authors themselves list the lack of a quantitative efficiency-vs-performance analysis as a limitation. But anyone who's read an API bill has a suspect. Cost isn't token count — it's **token count × unit price, and unit price differs by roughly 10× depending on cache hits.** Claude Code is a harness aggressively optimized for its own model's cache economics. Touch the context and total tokens can go down while cache reuse breaks — and on an expensive frontier model, that loss can swallow the savings.

The practical takeaway is clear: **when evaluating a harness, don't stop at the "% tokens saved" number — verify against the bill.** Depending on how a compaction trick interacts with caching, the same technique can be a 30% saving on GLM and a net loss on Opus.

---

## Not for Korean users — yet

ToFu's multilingual feature is translate-then-reason — translate non-English input into English, reason in English, translate the answer back. The paper reports it improved performance in 7 of 10 languages tested, and you'd expect Korean to be on that list. **It isn't.** The seven improved languages are Spanish, German, Arabic, Russian, Japanese, Portuguese, and Hindi; **Korean sits with Hebrew and Italian in the three that were flat or slightly worse** (Section 4.3, Figure 3).

The paper doesn't explain why Korean missed out. It could be translation quality on code-issue text; it could be that frontier models' Korean is now good enough that the English detour buys nothing. Either way, the conclusion is the same: the old trick of "translate to English before reasoning" is now something to **verify per language, not assume.** Behind a headline average of +2.5 points, your language can be the one below the average.

---

## Three cautions before you quote this paper

**First, every benchmark number is author-reported.** No third-party reproduction yet. Harness comparisons are sensitive enough to setup that [there's a paper specifically demanding harness disclosure](https://arxiv.org/abs/2605.23950) in agent evaluations. Keep the "according to the authors" qualifier attached.

**Second, there's no ablation.** Three-layer compaction, a planner-worker-critic loop, BM25 long-term memory — the paper never isolates which component did the lifting. "The three-layer compaction won it" is a plausible story, but it's currently an inference, not a demonstration.

**Third, two names invite misreading.** The authors' "Northeastern University" is not Boston — it's **Northeastern University in Shenyang, China,** home of the NiuTrans machine-translation lab (Tong Xiao, Jingbo Zhu), collaborating with Meituan. The care invested in the multilingual pipeline makes sense read against that background. And [the GitHub repo](https://github.com/NiuTrans/ToFu) introduces itself not as "the coding harness that beats Claude Code" but as a self-hosted Flask-based AI assistant. There's a gap between the paper's framing and the product's positioning worth knowing about before you adopt either.

---

## What people actually wanted: a harness you can open

Three cautions notwithstanding, I'd argue this paper's value lies less in the precision of its numbers than in **the nature of the artifact.** The "white-box" in the title is the point.

[#35 argued harness engineering had become a job](/blog/35-harness-engineering/) — and a job needs a workbench. Until now, the best-performing harnesses were all commercial black boxes. You can't see when exactly Claude Code's compaction fires or what it discards, you can't read its system prompt, and you certainly can't modify it and re-run. Everyone now knows the harness drives performance; nobody could open one up. That's the demand ToFu aims at. The full code is MIT-licensed — you can turn the compaction thresholds and re-run the benchmark, or lift Layer 2 alone into your own harness. The ablation the authors didn't publish is one the community can now run for them.

[The closing question of #35](/blog/35-harness-engineering/) — did the model earn that score, or did the harness carry it — just got answered in the form of a controlled experiment. Which adds one more question to ask at the next benchmark announcement: **can you open that harness?**

---

*References: [ToFu: A White-Box, Token-Efficient Agent Harness for Researchers (arXiv 2607.11423, 2026-07-13)](https://arxiv.org/abs/2607.11423), [NiuTrans/ToFu (GitHub, MIT)](https://github.com/NiuTrans/ToFu), [Stop Comparing LLM Agents Without Disclosing the Harness (arXiv)](https://arxiv.org/abs/2605.23950). Figures are author-reported from paper v1 as of 2026-07-19; no third-party reproduction exists yet.*
