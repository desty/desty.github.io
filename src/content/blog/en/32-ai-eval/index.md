---
title: "You Think You're Improving Your AI System — You're Actually Rolling Dice"
summary: "You change a prompt, bump the model, tweak RAG chunking. Then you run a few examples, decide 'feels better,' and move on. That's not improvement — it's luck. LLMs have infinite inputs and probabilistic outputs, so eyeballing doesn't measure anything. The real first step isn't building the feature; it's standing up an eval set and a measurement pipeline first. Only with eval does a change resolve into improvement or regression. If you can't measure it, you can't improve it."
date: "2026-07-06T10:00:00"
tags:
  - eval
  - llm-as-judge
  - ai-quality
  - testing
  - observability
draft: false
---

The way people tune an LLM system usually looks like this. Change a prompt, bump the model a tier, tweak the RAG chunking. Then run a handful of examples and go "hm, seems better" and move on.

But that's not improvement. **Touching it without knowing whether it got better or worse is just rolling dice.** And an LLM is a system where that luck is unusually hard to see through.

## Eyeballing doesn't measure anything

LLMs have effectively infinite inputs and probabilistic outputs. The same question yields a different answer each time. So a human glancing at a few outputs and saying "looks fine" is an impression, not a measurement. Five looking good doesn't mean the other thousand improved.

So you flip the order. Don't build the feature first and bolt on eval later — **stand up an eval set and a measurement pipeline first.** Only with eval does each change resolve, by score, into improvement or regression — and only then can you iterate fast. The old line "you can't improve what you can't measure" cuts especially sharp on LLMs.

## Cheap to expensive, as a pyramid

You can't do all evaluation by hand, nor automate all of it. So you stack it in three tiers.

The bottom is automated metrics. Accuracy, regex, code execution — anything scored instantly by machine, at near-zero cost, so you run it on every change in CI. The middle is LLM-as-Judge: a model scores things with no single answer — summary quality, tone, groundedness — against a rubric. The top is humans — the most expensive and slowest, spent sparingly, only at decisive moments like building the gold set or calibrating whether the judge agrees with people.

The point is the pyramid shape. The most at the bottom, less as you go up. Only escalate what the lower tier filtered.

## The judge has to be evaluated too

LLM-as-Judge is powerful, but it has one trap: **trusting the judge's scores unvalidated.** The judge is biased — swap the order of two answers and the verdict flips (position bias), it rates long and wordy answers higher, and it gives high confidence even to wrong answers.

So you have to treat the judge itself as something to evaluate. Measure, against a human gold set, "how well does this judge agree with people," numerically, before you start. Strong models reach 80–90% agreement, but that varies by task — and without the number, there's no basis to trust the judge's scores.

## Eval is the outer loop's instrument panel

Zoom out and this connects to the outer loop from ["Loop Engineering"](/blog/25-loop-engineering). The more you automate generation, retrieval, and agents, the more the quality of the eval gate determines whether you can trust that automation. [Just as code review was the outer loop's verification gate](/blog/31-reviewing-ai-code), eval is the instrument panel that drives it. You don't want to switch on autopilot with no panel.

And an eval isn't a one-time deliverable. It's a living asset that grows by continually absorbing the failures that surface in production. Otherwise the initial gold set drifts away from real traffic.

I wrote up the three-tier architecture, judge biases and mitigations, and the tooling landscape on one page in the [AI Eval Guide](https://desty.github.io/ai-eval-guide/en/).
