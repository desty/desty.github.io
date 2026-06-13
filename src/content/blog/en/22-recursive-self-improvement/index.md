---
title: "AI Has Started Building AI — and the Bottleneck Already Moved to 'Judgment'"
summary: "The Anthropic Institute published its own numbers in a piece called 'When AI Builds Itself.' Claude writes 80%+ of Anthropic's production code, and per-engineer code output is up roughly 8× in two years. The far-future story of recursive self-improvement (RSI) isn't the point. The real message is in what's already happened — writing code has become nearly free, and the bottleneck moved to judging what's right. And uncomfortably, even that last refuge of judgment sits on the same curve."
date: "2026-06-13T16:00:00"
tags:
  - ai-safety
  - agent-engineering
  - llm
  - ai-agent
  - anthropic
draft: false
---

Anthropic published a piece called [**"When AI Builds Itself."**](https://www.anthropic.com/institute/recursive-self-improvement) It comes from the newly formed Anthropic Institute, and the subject is heavy — **recursive self-improvement (RSI)**: the point where an AI designs and trains its own successor without a human in the loop.

Writing like this usually reads as science fiction. What makes this piece uncomfortable isn't the future scenario, though. It's that they **open up their own current numbers** to show you.

That's where this post's thesis starts. Nobody knows yet whether RSI arrives. But there's a change on the way to it that has **already happened**, and that part feels far more real. Writing code has become nearly free. The bottleneck moved to judging. And the most uncomfortable part is that this last refuge — judgment — sits on the same curve.

---

## It sounds far off, but the numbers say "already"

The internal data Anthropic disclosed isn't an abstract benchmark; it's their own work logs.

- **Claude writes 80%+ of production code** (as of May 2026). Before February 2025 it was single-digit percent.
- **Per-engineer code output per quarter is up roughly 8×** in two years (Q2 2026 vs. 2024).
- Many employees estimate their own output is up **about 4×** with model assistance.

The benchmarks point the same way. The **time horizon** a model can carry on its own — how many minutes or hours a task would take a human — is doubling about every four months. It used to be seven. The curve got steeper. The coding benchmark SWE-bench saturated in two years, and CORE-Bench, which scores research reproduction, climbed from around 20% to near-saturation in fifteen months.

One thing worth flagging here. This isn't the usual "AI got smarter" story. It's that **AI got smarter at building AI**. The capability entered the loop that improves itself — that's the starting point of the RSI discussion, and the numbers above are offered as evidence the loop has already started turning.

---

## The bottleneck moved — execution is free, humans judge

What matters more than the numbers is how they changed the way work happens.

The stages the report sketches are simple. In 2021–2023 humans wrote all the code. In 2023–2025 chatbots produced snippets and humans pasted them in. In 2025–2026 coding agents wrote and edited files directly. Today agents run the code and hand work off to other agents. The next box is empty — *agents build and train the successor model.*

The core of this arc is that **the price of execution converges to zero**. Turning an idea into code, testing it, evaluating it — the model does that an order of magnitude faster than a person. So what's left? To paraphrase an engineer the report quotes, the human's comparative advantage right now lies in **seeing the bigger picture and thinking beyond the immediate task**: choosing what to solve, which direction is right, whether the result is any good.

In other words, **the bottleneck moved from writing code to judgment.** The report names two new bottlenecks — humans not being able to review the flood of code, and the judgment of which research to do next. When execution is free, the scarce thing becomes "knowing what's right."

This is the same spot I wrote about last time. In [blog #21](/blog/21-claude-fable-5/), on Fable 5, I argued the prompt's job had flipped from throttle to brake — and that very shift, seen inside one model, is happening at the scale of the whole industry. The human's place isn't pushing; it's **choosing, stopping, and verifying.**

---

## The uncomfortable part — even judgment is on the curve

If it ended here, it would land on the familiar comfort that "humans should focus on judgment." The report is uncomfortable because it refuses to leave that comfort intact.

Judgment is being measured too, and it's climbing. On real research sessions, the rate at which a model's choice of "what to do next" beat a human's rose from 51% in November 2025 to 64% in April 2026. In experimental optimization, the speedup a model produced jumped from 3× to 52× in a year (a skilled human gets around 4× on the same task). Code quality was worse than human-written late in 2025, is roughly at parity now, and Anthropic expects it to be **strictly better within a year.**

The "judgment and taste" that was supposed to be the last refuge has become the next candidate for automation. The report is honest here — it admits it **doesn't yet know** whether today's training methods actually unlock that research sense. And it lays three futures side by side.

1. **It stalls.** Scaling returns diminish and physical limits like chips and power bite. This gives the most time to adapt, but Anthropic considers it unlikely.
2. **Compounding efficiency (most likely).** AI handles execution while humans set direction and verify. A 100-person company produces the output of tens of thousands, and a productivity revolution follows. At the same time, large-scale misuse risks like surveillance and manipulation grow alongside it.
3. **Full RSI.** Pace is set only by available compute, and the human role shrinks to oversight and verification. Science broadly could be upended, but whether alignment can keep up with that acceleration is uncertain.

Anthropic's prescription is strong. A unilateral pause by one lab only changes who's in front, so what's needed is a **coordinated slowdown where multiple countries and labs verifiably slow down at the same time.** They pledge to slow down themselves if verifiable coordination exists. They add the caveat that, unlike nuclear arms control, training runs are easier to hide, which makes it harder.

---

## So what should you watch

Because the piece ends in policy recommendations and grand framing, it can feel distant to an individual or a team. But strip away the comfort and one thing is practically clear.

**The capability to grow now is judgment, not execution.** The ability to write code fast and in volume is becoming common and cheap. What grows scarce is the eye for choosing what to solve, the eye for reviewing the flood of output and catching what's wrong, the eye for seeing the big picture and setting direction. This continues the thread from [blog #11 on "cognitive debt"](/blog/11-cognitive-debt-and-agentic-coding) and [#14 on agent engineering](/blog/14-agent-engineering) — the locus of human design moving from inside the code to the contracts and judgment outside it.

One thing, though, deserves to be left honest: that "judgment" isn't a permanent shelter either — and this time it's the company that builds the models saying so with its own data. So this isn't a reassuring piece. It's one that deliberately puts even the last square of comfort up on the curve.

Whether RSI truly arrives, nobody knows. But the front of that curve is already inside our workplaces. Before fearing a distant ending, the first move is to reflect the change that's already near — **execution became free, judgment became scarce** — in how we work.

---

*Reference: [Anthropic Institute — When AI Builds Itself](https://www.anthropic.com/institute/recursive-self-improvement)*
