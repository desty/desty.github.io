---
title: "I Swapped the Model and Got Worse Results — Why Opus 4.8 and GPT-5.5 Make You Rewrite Your Prompts"
summary: "Opus 4.8 and GPT-5.5 evolved in the same direction, as if by agreement. Prompts that spell out every step now hurt performance. Here are each model's strengths, why your old prompts have to go, and how to rewrite them."
date: "2026-05-31T18:00:00"
tags:
  - opus-4-8
  - gpt-5-5
  - prompt-engineering
  - llm
  - context-engineering
---

If you swapped in the latest model ID and your results got *worse*, it isn't a bug. The problem is that you left the prompt alone.

Claude Opus 4.8 and GPT-5.5, both shipped in the first half of 2026, evolved in the **same direction** — almost as if the two labs had agreed on it. And both say nearly the same thing in their official docs: *your old prompts now get in the way.*

This post has one thesis. **The era of spelling out every step is over.** You define the destination and the constraints; the model handles the path. Whoever can't do that gets worse output from a smarter model.

---

## The same direction, two models

Big picture first. Put the two official guides side by side and you get almost the same sentence.

- **OpenAI (GPT-5.5):** "Describe the destination, don't pave every step of the way for the model."
- **Anthropic (Opus 4.8):** This model follows instructions more *literally* than any prior Opus. If a rule applies to every item, say so. If you want it to implement rather than suggest, say so.

Different words, same core idea. **Once a model is smart enough, instructions about the process become noise, not help.** Older models needed their hand held so they wouldn't get lost. Today's models get dragged around when you hold their hand.

---

## Opus 4.8: dials replace prose

Opus 4.8 is built on 4.7. Default 1M-token context, up to 128k output, same price as 4.7 ($5/$25 per M). More important than the benchmark numbers: **the control surface changed.**

**Effort is the main dial now.** The default is `high` on every surface (API and Claude Code). But this model respects effort *strictly*. At low and medium it does only what you asked and won't go the extra mile on its own. Anthropic's recommendation is conservative — start at `xhigh` for coding and agentic work, `high` for most else, and step down only once measurements show quality holds. **Where you used to tune effort with phrases like "analyze thoroughly," you now tune it with a parameter.**

**Adaptive thinking is the only thinking mode.** Pinning a thinking budget with `budget_tokens` is now a 400 error. Instead, turn on `thinking: {type: "adaptive"}` and the model decides per turn whether it needs to think. Simple lookups get a direct answer; complex problems get reasoning first. At the same effort level it wastes fewer thinking tokens than 4.7. Note that `temperature`, `top_p`, and `top_k` are still unsupported (400). **Drop the sampling-tweak habit and steer behavior through the prompt instead.**

Other changes you feel in practice:

- **Literalness.** Especially at lower effort. Leave something vague and it gets handled vaguely. Not "use a tool if needed" but "when and why to use this tool."
- **Better tool triggering.** The 4.7 complaint of "it clearly should call the tool but doesn't" is improved.
- **Mid-conversation system messages.** You can inject a `role: "system"` message partway through a long conversation to update instructions — without resending the whole system prompt, so the earlier prompt cache stays warm.
- **Honesty.** About 4× less likely to miss a code flaw than its predecessor. You feel it when you have it review code.
- **Dynamic workflows (Claude Code research preview).** Runs hundreds of subagents in parallel for large-scale work like codebase migrations.

---

## GPT-5.5: six changes the guide spells out

OpenAI is even more direct. The GPT-5.5 prompting guide says you need to rewrite old prompts and names six things.

1. **Be outcome-oriented.** Not "first analyze, then break down, then execute," but "deliver an actionable plan that explains the problem and gives a minimal modification path."
2. **Cut process specification.** Steps with no control value are noise. The guide names five kinds: generalized step lists, absolutes like ALWAYS/NEVER, repeated persona claims, decorative output requirements, hardcoded tool sequences.
3. **State success criteria explicitly.** If completion conditions are implicit, even a strong model wobbles across inputs. Spell out: covers the key requirements, conclusions are evidence-backed, format matches, blockers are listed.
4. **Reassess reasoning effort.** Don't default to maximum. A task that needed `high` on GPT-5.4 may only need `medium` on 5.5. Start at `low` for classification and extraction.
5. **Keep tool boundaries, drop the filler.** Retain security/data/cost rules, confirmation requirements, failure recovery, stopping conditions. Delete only the redundant procedural steps.
6. **Define the output contract.** Not generic formatting — structure fields, types, and validation rules around the actual use case.

On top of that, the old habits the guide says to **drop**:

- **Role-play is obsolete.** "You are a copywriter with 20 years of experience" was useful scaffolding in the GPT-4 days; now it only adds ambiguity the model must interpret before reaching your actual request.
- **"Think step by step" doesn't help.** GPT-5.5 does structured reasoning natively. Removing the phrase actually improves results.
- **Few-shot can backfire.** Zero-shot is strong enough on well-specified tasks. Examples anchor the model to their style and structure, reducing variety.
- **Stop repeating constraints.** Say it clearly once.
- **System prompt = behavior, user turn = task.** Persona, format, and constraints in the system prompt; the specific task in the user turn.

The guide's example sums it all up:

```
[Old] "You are an expert B2B copywriter... Write a cold email...
       Remember, the goal is to get a meeting, not to sell..."

[New] "Write a cold email to a VP of Marketing.
       Goal: book a 20-minute discovery call. Length: under 120 words.
       Include: one specific pain point."
```

It drops the role-play, removes the goal repetition, and adds precise specs GPT-5.5 follows reliably. And GPT-5.5 is concise and direct by default. Where you need warmth — customer-facing work — you have to ask for that tone **explicitly**.

---

## Why it changed

This is the crux. There's a reason both labs say the same thing at the same time.

**Ninety percent of old prompting techniques were prosthetics for the model's weaknesses.** "Think step by step" was a prescription for an era when models skipped reasoning. Role-play was a trick to load context weight onto the model. Few-shot was a worked example laid down in case the model didn't understand the task. Step lists were rails laid down in case it got lost halfway.

Once a model overcomes those weaknesses, the prosthetics **stay and obstruct.** In the GPT-5.5 guide's words, "over-specification shrinks search space." The model could find a thousand good solutions, but the five-step procedure you laid down cages it into one mediocre path. The result: a more mechanical answer from a smarter model.

So the center of gravity of control shifted — **from "prose instructions about process" to "outcome + constraints + structured parameters."** Opus's effort and adaptive-thinking dials sit exactly here. You used to tune effort with sentences; now you tune it with a dial and use the prompt only to point at the destination.

This is the continuation of ["agent engineering" from post #14](/en/blog/14-agent-engineering). The higher the model climbs, the more the human designs not the model's internals but the **contract around it** — goals, constraints, success criteria, tool boundaries.

---

## So how do you rewrite?

If you're moving an existing prompt to either model, work in this order.

**1. Delete (both models)**
- Incantations like "think step by step," "take a deep breath," "act like an expert"
- "You are a ___ with N years of experience" role-play openers
- Procedure lists with no control value, hardcoded tool sequences
- Repeated statements of the same constraint
- Few-shot examples on well-specified tasks (unless the intent is to enforce a style)

**2. Add (both models)**
- The deliverable and success criteria, up front, in one paragraph
- An output contract: format, fields, length as concrete numbers ("under 120 words," not "short")
- Tool boundaries: when/why to use them, destructive actions that need confirmation, stopping conditions

**3. Set the dials (per model)**
- **Opus 4.8:** experiment with effort actively. Start coding at `xhigh` and step down after measuring. Turn on `thinking: {type: "adaptive"}` when reasoning is needed. Strip out any `temperature` tweaks.
- **GPT-5.5:** reassess reasoning effort. Test on real samples whether something that was `high` on an older model is now fine at `medium`. Start classification and extraction at `low`.

**4. Re-baseline**
A model upgrade is not "just swap the ID." It's re-baselining effort, thinking, caching, and prompt behavior. Run the rewritten prompt in staging, diff it against the old output, then ship.

---

## Closing

There's a fun paradox here. The smarter the model, the **shorter and emptier** the prompt looks. Where the flashy role-play and elaborate step-by-step lived, only "what, within which constraints, judged by what criteria" remains.

The days when a good prompt looked like an intricate magic spell are ending. A good prompt now resembles a **well-written work order**: make the destination clear, name the constraints, and trust a capable worker with the rest. What Opus 4.8 and GPT-5.5 demand of us isn't fancier prompt craft — it's **clearer thinking**.

---

*References: [Anthropic — What's new in Claude Opus 4.8](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-8), [Introducing Claude Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8), [OpenAI — GPT-5.5 prompting guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)*
