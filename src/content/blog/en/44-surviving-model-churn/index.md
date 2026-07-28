---
title: "The Model Is Rented, the Eval Is Owned — Building on Models with a One-Year Lifespan"
summary: "Measure the deprecation pages of the big three labs and you get a hard number: GA models actually live 12–16 months. Prompts and agent harnesses are structures built on top, so they depreciate on the same one-year clock. #36 treated migration as an event; this post starts from the premise that it's a cycle. The paradox where instructions that patched an old model's weaknesses become liabilities on the new one, how prompt-transfer failure earned an academic name — 'Model Drifting' — and how to move your investment into the assets that survive a model swap: evals, schemas, and specs. Ends with a six-item checklist for making the model-dependent parts of your system cheap to replace."
date: "2026-08-04T10:00:00"
tags:
  - model-migration
  - eval
  - prompt-engineering
  - agent-engineering
  - ai-quality
draft: false
---

When [#36](/blog/36-model-migration/) covered model migration, the premise was that migration is an occasional event. Same for [#40](/blog/40-claude-opus-5/), which walked through prompt migration for Opus 5 — a big model came out, so let's move once. But what if that premise is wrong? If migration is not an event but a **cycle,** a question comes before "how do we move": **what do we keep, and what do we let go?**

This post's thesis is one sentence. Prompts and harnesses are interior decoration built inside a rented model, so they depreciate along with it; the assets that remain are evals, schemas, and specs. Shifting your investment to the latter is the whole of "development that survives model changes."

---

## Start by Measuring the Lifespan — a One-Year Depreciation Cycle

This is measurement, not vibes. Put the three labs' deprecation pages side by side:

- Anthropic: [Claude Opus 4 was retired about 13 months after launch](https://platform.claude.com/docs/en/about-claude/model-deprecations), Sonnet 3.7 exactly 12 months after. The notice obligation for public models is a minimum of 60 days.
- OpenAI: GA models get [at least 6 months' notice](https://developers.openai.com/api/docs/deprecations). gpt-5-chat and gpt-5-codex were shut down in under a year, and it's not just models — **the API surface itself** moves too: the Assistants API goes away entirely in August 2026.
- Google: there's a preview model that was [shut down after 2.5 months](https://ai.google.dev/gemini-api/docs/deprecations), and GA models run 12–16 months. The one that really hurts is embedding-model retirement. text-embedding-004 went down this January, and retiring an embedding model doesn't force a prompt edit — it forces a **full index rebuild.**

So: real GA lifespan is 12–16 months, which means prompt assets depreciate on what is effectively a one-year clock. Just as important as the number is that all three labs are converging in the same direction: removing sampling parameters like temperature and top_p (on Opus 4.7+ they're a 400 error), banning assistant prefill, unifying around thinking/effort controls. More interesting still, all three now ship **migration automation agents** — Anthropic's `/claude-api migrate`, OpenAI Codex's migration skill, Google's Antigravity. The vendors themselves have productized the equation "model swap = prompt rework."

---

## Migration Is Subtraction, Not Addition

The word "migration" suggests writing something new for the new model, but the 2026 vendor docs say the opposite. [Anthropic's Opus 5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) tells you to **remove** verification instructions like "double-check your answer" — they overlap with the model's own behavior, adding cost without adding quality. The Fable 5 docs are blunter: "Skills developed for prior models are often too prescriptive and can **degrade** output quality." OpenAI says the same thing with numbers: in internal tests for the [GPT-5.6 prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance), lean prompts improved eval scores by 10–15% while **cutting tokens 41–66%.** For GPT-5.5 the advice was to skip porting your prompt stack entirely and [start from a fresh baseline](https://simonwillison.net/2026/apr/25/gpt-5-5-prompting-guide/).

The reason is simple. A large share of any production prompt is not task specification but **compensation code for that generation's weaknesses.** Step-by-step scaffolding, mandatory-verification clauses, walls of ALWAYS and NEVER — all crutches that made an older model do what it couldn't do alone. The moment the model does those things natively, the crutch becomes a burden. As one practitioner [put it](https://agent-hypervisor.ai/posts/bitter-lesson-of-agentic-coding/): "The scaffolding you built to compensate for the old model's weaknesses becomes the thing preventing you from benefiting from the new model's strengths."

July delivered a live incident report. Every's mature multi-step agent workflow fell apart on Opus 5 — early exits, over-verification — and the [review's](https://www.ai.joaoqueiros.com/blog/claude-opus-5-review-effort-skills-migration) conclusion is this post's argument verbatim: **"a stronger model can perform worse inside a system designed around its predecessor."** [Another analysis](https://kenhuangus.substack.com/p/claude-fable-5-what-changed-and-how) compared handing the model a meticulous 22-step migration prompt versus just goals and constraints; the latter won. The problem was the model faithfully following the user's three wrong steps.

One less-discussed angle: this is not only a quality problem but a **security problem.** In Promptfoo's measurements, merely upgrading GPT-4o to 4.1 dropped prompt-injection resistance [from 94% to 71%](https://www.promptfoo.dev/blog/model-upgrades-break-agent-safety/). The cause: the newer model was trained to follow instructions more literally. A capability gain became an attack surface — which is why a model swap should be treated as a security event, not a feature release.

---

## The Phenomenon Got a Name — Model Drifting

That prompts don't transfer across models is well documented in the literature. The origin point, the [2023 FormatSpread study](https://arxiv.org/abs/2310.11324), showed accuracy spreads of up to 76 points from formatting changes alone — and left an even more important sentence: **"format performance only weakly correlates between models."** A format that works on one model has no reason to work on another. Last October a follow-up showed that [a single delimiter character in in-context examples](https://arxiv.org/abs/2510.05152) can swing MMLU scores by ±23%. To be fair, there's a counterargument — [a good chunk of measured sensitivity is an artifact of evaluation methodology](https://arxiv.org/abs/2509.01790) rather than a model flaw; switch scoring to LLM-as-judge and the variance shrinks considerably. Keep that caveat attached.

Still, the direction is clear, and last December the phenomenon got a name. The [PromptBridge paper](https://arxiv.org/abs/2512.01420) labeled the collapse that happens when a prompt optimized for one model is moved to another **"Model Drifting,"** and proposed a framework that adapts prompts to a target model using a small calibration set. Prompt-transfer failure is now a formal research subject.

Move up to agents and another layer appears: the harness ([#35](/blog/35-harness-engineering/)). A position paper this May is provocative from the title on — ["Stop Comparing LLM Agents Without Disclosing the Harness"](https://arxiv.org/abs/2605.23950) — arguing that on long-horizon tasks, **harness-induced performance variance exceeds model-induced variance,** with cases where model rankings invert depending on the harness. [Another experiment](https://arxiv.org/abs/2605.05716) showed that stacking scaffolding components can make things worse through cross-component interference, and that **the optimal combination differs by model size.** Even METR noted that swapping the scaffold in its evaluation infrastructure [measurably changed the same model's scores](https://metr.org/blog/2026-1-29-time-horizon-1-1/). The finding keeps recurring: performance is a property of the model-harness pair, not of the model.

And distrust the phrase "a better model" itself. In the [ReCatcher study](https://arxiv.org/abs/2507.19390), GPT-4o beats 3.5-turbo overall but **regresses by up to 50%** on specific axes like missing-import handling. There is no strict upgrade. A model swap is not an upgrade; it's a regression-testing event.

---

## What Do You Own?

If that's the problem, the sentence that best compresses the answer arrived this June: **"The model is rented. The eval is owned."** It's from [Adnan Masood's essay](https://medium.com/@adnanmasood/eval-is-the-moat-59484866dacb), and the argument runs: the model is a rental anyone can lease at the same price, so it can't be a moat; the eval system built from your data and your business logic — the definition of "what good looks like" in your domain — is the only asset competitors can't copy. A [Forbes column the same month](https://www.forbes.com/sites/lutzfinger/2026/05/26/the-missing-moat-in-ai-your-eval-data/) hits the same note: "One new prompt, one model update, and the whole chain quietly breaks." The eval is the device that makes that quiet break loud.

A company case from July shows this isn't theory. In [Ploy AI's GPT-5.6 migration write-up](https://ploy.ai/blog/migrating-a-production-ai-agent-to-gpt-5-6), the team ran every new model through its own evals for four months; nothing beat their existing setup, so they didn't move. When GPT-5.6 finally won, they moved — the decision criterion was **their own eval suite,** not benchmarks. One detail is especially instructive: a third of the failures in the first run came from stale harness assumptions, not the model. Their migration procedure therefore has a Step 0: validate the evaluation tooling itself. How to build eval practice is covered in [#32](/blog/32-ai-eval/) and the [eval pipeline guide](https://desty.github.io/ai-eval-guide/), so I won't repeat it here. The point is singular — before an eval is a quality tool, it is **migration insurance.**

The market moved the same way. In January, ClickHouse [acquired Langfuse](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability), the prompt-management and eval platform; in February, Braintrust raised an [$80M Series B](https://www.braintrust.dev/blog/announcing-series-b). Prompt and eval infrastructure has started to be treated as an asset worth acquiring by data-infrastructure companies.

Two more assets belong next to the eval. One is the **contract:** structured-output schemas, tool definitions, output validators — things enforced at the code level regardless of model. Instead of begging for a format in the prompt, enforce it with a schema; then whether the contract passes becomes your fitness test for a new model. The other is the **spec.** GitHub's Spec Kit crossed 120k stars, and AWS Kiro spent the first half of this year deepening its spec features while swapping the underlying model through Sonnet 5, GPT-5.6, and Opus 5 in succession. **Keeping the spec fixed and replacing only the model** is already running in product form. If requirements are the source and code and prompts are build artifacts, artifact depreciation is nothing to fear.

---

## Compiling Prompts

Go one step further and you can stop hand-rewriting prompts altogether. That's DSPy's view: a prompt is not source code but a **compiler output;** the source is the task signature and the evaluation metric. When the model changes, recompile. The optimization engines behind this view took a big step last year — [GEPA](https://arxiv.org/abs/2507.19457) evolves prompts through natural-language reflection on execution traces and beat weight-updating reinforcement learning (GRPO) by 6% on average, up to 20%, while using 35× fewer rollouts.

There's production precedent too. Of the entries on the [official DSPy use-cases page](https://dspy.ai/community/use-cases/), the one that matches this post exactly is AWS: they needed to migrate prompts from a large model to the smaller Nova family while holding performance, and solved it by recompiling instead of rewriting by hand. The three labs' migration agents, PromptBridge's calibration transfer, DSPy/GEPA recompilation — different tools, same picture: **moving prompt adaptation out of human hands and into a pipeline.**

---

## In Practice: Six Ways to Make the Model-Dependent Parts Cheap

1. **Never swap models without a frozen eval baseline.** Fix one eval set and record your current configuration's scores. Without it, migration is a full rewrite by feel; with it, it's mechanical — read the diff, fix the broken cases.
2. **Separate prompts from code and version them.** If prompts live in code strings, a model swap becomes a code deploy. Record eval results per (prompt version × model version) pair and rollbacks and A/B tests come free.
3. **Enforce format with contracts, not prompts.** Structured-output schemas, tool signatures, code-level validators. The contract doesn't change when the model does, and passing it becomes the fitness test.
4. **Make the first migration question "what can we delete."** Verification clauses, ALWAYS/NEVER rules, step-by-step procedures — strip the old model's crutches first, baseline with a minimal prompt, then restore only what's needed. Exception: preserve safety and compliance rules explicitly.
5. **Measure more than accuracy.** Token counts (Opus 5's tokenizer change alone adds up to 35%), latency, refusal rates, tool-call rates, and injection resistance. One axis rising while another sinks is the default, not the exception.
6. **Put the deprecation calendar in CI.** Automatically audit for soon-to-retire model IDs; roll out replacements canary-first, in stages. And remember that resale channels like Bedrock and Vertex run their own separate calendars.

---

## What to Watch

At the extreme end of scaffolding skepticism, someone has already called the harness [a "90-day artifact"](https://leehanchung.github.io/blogs/2026/05/08/hidden-technical-debt-agent-harness/). [Browser Use's founder](https://browser-use.com/posts/bitter-lesson-agent-frameworks) wrote "the less you build, the more it works," and [You.com's CTO](https://stackoverflow.blog/2026/07/07/agent-orchestration-is-so-two-years-ago/) says 2024-style orchestration is now a liability. It's the same narrative when Anthropic made a point, in the Fable 5 announcement, of noting that a Pokémon game older models couldn't beat even with helper tools was cleared **with a minimal harness.** On the other side, the framework camp is answering with structure — separating harness (control) from compute (execution) so the harness survives a model swap. Whichever side wins, both share the premise: the closer code sits to the model, the shorter it lives.

Frontend is the right analogy. Browsers change constantly, and nobody stops shipping over it. What makes it survivable is the test matrix and the standards contract. LLM development is heading to the same place — the model is a runtime, and runtimes are meant to be swapped.

On the day the next model announcement drops, there will be two kinds of teams: the ones opening their prompts and guessing what will break, and the ones running their evals and reading the diff. That difference isn't made that day. It's made today.
