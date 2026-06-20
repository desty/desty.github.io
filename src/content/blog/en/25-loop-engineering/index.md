---
title: "Remove the Person Who Prompts the Agent — Loop Engineering's Real News Is the Outer Loop"
summary: "Half of the 'loop engineering' buzz is something you already know. The inner loop that helps an agent finish a task well is a harness problem outside the model, and that's been covered. The new half is one layer out — who decides what the agent works on. A trigger replaces the person, and multiple loops compound by learning from a shared memory. But the real skill in an unattended loop isn't fancy automation; it's designing when to stop. Which means the work left for a human loops right back to judgment."
date: "2026-06-21T10:00:00"
tags:
  - agent-engineering
  - ai-agent
  - llm
  - agentic-coding
  - ai-coding
draft: false
---

At 1 a.m. the PRs start landing. The team isn't working late. A handful of agent loops are each finding work, fixing it, verifying it, and opening PRs — without anyone prompting them one by one. [It's the scene Jason Zhou described from his own company](https://github.com/JayZeeDesign/loop-engineer-template), and lately people call it "loop engineering."

The first reaction is: another agent buzzword? Half right. But dig in and there's a genuinely new half mixed in. The problem is that the two are tangled together, so the new part is hard to see.

## The half you've already seen: the inner loop

Most write-ups split the loop into two layers. The inner one is the agent runtime we use every day. Hand a task to Claude Code or Codex and it reads context, uses tools, checks results, and runs to completion. Reason, act, observe, reason again — that cycle. The question this layer answers is one: *how do we help the agent finish this task reliably?*

That layer is, in the end, a "outside the model" problem. Context, skills, tool definitions, task decomposition, verifiers. The evaluator-optimizer pattern Anthropic laid out in [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents), the Runner abstraction in OpenAI's Agents SDK, the thing Martin Fowler calls [harness engineering](https://martinfowler.com/articles/harness-engineering.html) — all of it is craft for running the inner loop well. Böckeler's one-liner is clean: **Agent = Model + Harness.**

But this is exactly what I covered at length before, in ["The War Outside the Model."](/blog/14-agent-engineering) `Plan → Act → Observe → Verify`, treating the evaluator as a first-class component, the state machine, holding a human gate on actions. The inner-loop talk in loop-engineering pieces is mostly a rerun of that. So I'll move past it fast. The new thing sits one notch further out.

## The new half: who hands out the work

Addy Osmani's [definition of the outer loop](https://addyosmani.com/blog/loop-engineering/) cuts right to it.

> Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead.

If the inner loop asks "how do I finish this task," the outer loop asks "**who decides what to do next?**" The answer isn't a person; it's a trigger — cron, a webhook, an incident, another agent. Nobody has to sit at the prompt box. That's why the PRs piled up at 1 a.m.

So far this sounds like "automation with a scheduler bolted on." The difference shows up at the next step.

## Where loops compound: shared memory

A single loop is just a well-built cron job. It gets interesting when several loops start **reading each other's records**.

The structure Zhou's template uses is simple. Durable artifacts (signals, tickets, tasks, docs) live in folders, and every loop reads and writes the same folders. Plus one global `LOG.md`. Before major work an agent reads the last few entries; after, it leaves one line.

Why does that matter? A support loop gets five "I can't find where export is" tickets and creates a signal. At the same time the SEO loop spots a page with good traffic but poor conversion and leaves another signal. The product loop reads both at once and concludes export is a bigger problem than the analytics alone suggested. The "high-CTR keyword with no organic content backing it" that the ads loop found becomes the SEO loop's input directly.

The loops aren't isolated automations; they run on top of *a shared knowledge base of what the company has learned*. That's what "compound" actually means here. Each loop's result changes the next loop's judgment. In LangChain's [piece that frames this as four nested loops](https://www.langchain.com/blog/the-art-of-loop-engineering), the same proposition is the core: one cycle of the outer loop makes the inner loops more effective.

## The real hard part of an unattended loop: knowing when to stop

There's a trap people fall into here: treating the outer loop as "fancier automation." But the hardest part of a loop running 24/7 without a person isn't *starting* work — it's *stopping*. An agent that doesn't know where the end is burns tokens, or worse, confidently repeats the wrong thing.

What's interesting about the [Loop Library](https://signals.forwardfuture.ai/loop-library) Matthew Berman's side has gathered is that each of its 31 loops states a stop condition. Collect the conditions and they fall into a few types.

- **Goal-reached** — stop when a verifiable number is hit: "load time under 50ms," "100% test coverage."
- **Exhaustion** — sweep production errors until there's nothing left to fix, then stop.
- **Attempt cap** — give up if a bug can't be reproduced twice.
- **Streak** — stop after N consecutive passes; one failure resets the streak.
- **Beating baseline** — adopt the new version only when it beats the old one on a holdout set.
- **Budget exhausted** — stop when the token/time budget runs out.

Osmani's `/goal` pattern is the same. It runs *until a verifiable condition becomes true*, like "all tests in `test/auth` pass and lint is clean." And crucially, **the implementing agent doesn't get to make that completion call itself**. A separate model or sub-agent grades it. Let an agent grade its own answer and the loop always says "done."

One more layer is needed on top: durability. A loop that runs for hours dies midway. That's [why LangGraph put durable execution front and center in 1.0](https://github.com/langchain-ai/langgraph) — it checkpoints state at every node, so a crash resumes from where it stopped. Waiting for a human's approval is treated exactly like waiting on a clock. To actually run an unattended loop, this infrastructure comes before any clever prompt.

## Everyone's naming the same thing differently

The fun part is that the name differs by camp. Zhou and Forward Future say loop engineering, Fowler says harness engineering, Osmani says "replace yourself as the prompter," LangChain says four nested loops. Karpathy looks at it from further out. With his term [autonomy slider](https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again), he argues autonomy isn't a thing you crank to the max in one go but a dial you raise slowly, only as far as your system and your evals improve alongside it. His line that it's not "the year of agents" but "the *decade* of agents" is about the most honest stance toward unattended loops.

By the open-source lineage, this is no neologism either. In 2023 AutoGPT (170k stars) showed the prototype of the autonomous loop, and OpenHands (70k stars) and its CodeAct is the execute-check-loop-again cycle itself. Only the label is new; the current has been running for three years.

## In the end, back to judgment

So loop engineering's conclusion is, surprisingly, not flashy. The more you run execution unattended, the human's work doesn't shrink — it **moves up**. Deciding what to trigger, which signal to trust, when to stop, where a human holds the gate.

Osmani's warning is exact. A loop without verification compounds errors (unattended mistakes), fast automation opens a gap between the shipped code and your understanding of it (comprehension debt), and comfortable automation tempts you to stop thinking critically (cognitive surrender).

> Build the loop. But build it like someone who intends to stay the engineer, not just the person who presses go.

This meets up with what I wrote before in ["The Bottleneck Already Moved to Judgment."](/blog/22-recursive-self-improvement) I argued the bottleneck moved to judgment once writing code became nearly free; loop engineering is the version where that judgment moves into *system design*. How you write the stop conditions, who you hand verification to, how far you turn the autonomy dial — that's now what an engineer actually designs. The company that pulls ahead isn't the one that runs loops fast. It's the one with a system that keeps learning while everyone sleeps.
