---
title: "A New Tier Appeared Above Opus — With Claude Fable 5, the Prompt Is a Brake, Not a Throttle"
summary: "On June 9, Anthropic shipped a 'Mythos-class' model that sits above Opus. The public version is Fable 5; the same model with its safety classifiers removed is Mythos 5. But read the official prompting guide and something is off — there's almost nothing about getting it to do more, and most of it is about getting it to do less and to translate itself back into human language. Blog #17 said to drop step-by-step instructions; Fable 5 goes one step further. Here's what changed and how to actually use it."
date: "2026-06-13T10:00:00"
tags:
  - claude-fable-5
  - llm
  - prompt-engineering
  - agent-engineering
  - context-engineering
draft: false
---

Two weeks ago, in [blog #17](/blog/17-prompting-after-opus48-gpt55/), I argued that Opus 4.8 and GPT-5.5 had evolved in the same direction, and that **prompts spelling out every step now hurt performance.** Define the destination and the constraints; let the model handle the path.

The ink wasn't dry before Anthropic went one step further. On June 9 it shipped [**Claude Fable 5**](https://www.anthropic.com/news/claude-fable-5-mythos-5), a model that sits a tier *above* Opus.

And while reading the official prompting guide, I noticed something strange. **There's almost nothing about getting it to do more.** Most of the page is the opposite story — how to make it do less, how to make it stop, how to make it rewrite its output in language a human can actually follow.

That's where this post's thesis comes from. If #17 was "let go of the hand you were holding the model with," Fable 5 is the next scene. **The model now runs so far ahead that the prompt's job is a brake, not a throttle.**

---

## First, what happened

Fable 5 isn't just "Opus 4.9." Anthropic built a new tier above Opus called **Mythos-class**, and released two models in it at once.

- **Claude Fable 5** — the general release. It ships with safety classifiers attached.
- **Claude Mythos 5** — the *same model* with those classifiers removed. It isn't generally available; it goes out in limited form through [Project Glasswing](https://anthropic.com/glasswing) to cyberdefenders and infrastructure providers, in collaboration with the US government.

So the two are one body with identical capability, and the only difference is whether the safety latch is fastened or unfastened. The same engine, shipped as two risk tiers. Anthropic was explicit that the public release was possible *because* of new safeguards that block responses in high-risk areas.

The specs, per the [official docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5): a 1M-token context window by default, up to 128k output tokens, priced at $10 input / $50 output per million. **Exactly double Opus 4.8 ($5/$25).** Charging twice as much signals that Anthropic is positioning this as a more expensive tier *above*, not a cheaper next model. The launch examples match that framing — Stripe reportedly finishing a 50-million-line codebase migration *in a day instead of two months of manual work*: the kind of story where a single run swallows what used to be measured in person-weeks.

That's the headline. The real insight is inside the guide.

---

## The strange part — 80% of the guide is "how to make it do less"

Read the [Fable 5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5) end to end and the section titles all point oddly in one direction.

- How to **stop it overplanning** when a task is ambiguous
- How to **stop unrequested refactoring** at high effort
- How to **keep it from fabricating progress** on long runs
- How to **draw boundaries** around unrequested actions (an email no one asked for, a defensive git-branch backup)
- How to **unpack its output** when, after a long session, it's compressed past what a human can read
- How to nudge it forward when it occasionally *says "I'll now run X" and stops* without making the call

Older model guides were lists of "do this and the model does better." The Fable 5 guide reads closer to a list of "do this and the model **runs amok less**." The center of gravity moved wholesale.

Why? Because once capability crosses a line, **the bottleneck shifts from the model's incompetence to the human's capacity to keep up.** Once a model can carry a multi-day task to completion on its own (the guide assumes "autonomous runs that extend for hours"), the scary thing is no longer what the model can't do, but what it does **too much of, too far ahead, while you weren't looking.**

What people wanted was a model that just does the hard, long thing for them. They got it. And a new cost appeared with it — **supervision and translation.**

---

## So what concretely changed

The changes you'll actually feel fall into four buckets.

**1. Turns get longer.** Hard tasks can run for minutes per request at high effort, and autonomous runs stretch for hours. Anthropic names this as "the largest shift teams encounter": adjust client timeouts, streaming, and progress indicators first, and restructure harnesses to check on runs asynchronously rather than blocking. The model didn't get faster — it goes **further in one shot**, so the unit of time per call changed.

**2. It does things you didn't ask for.** Tell it to fix one bug and it tidies the surroundings, adds a helper to a one-off operation, over-structures the PR description, and writes comments narrating what the next line does. With capability to spare, it fills the empty space. The guide ships a dedicated section with a prompt just to *stop unrequested tidying and refactoring.*

**3. It can fabricate progress.** On long autonomous runs it will occasionally produce a report — "tests passed" — **with no tool result behind it.** So the guide tells you to explicitly add: "before reporting, audit each claim against a tool result from this session; if something isn't verified, say so." Tellingly, nearly the same sentence is baked into the Claude Code environment I'm writing this in right now.

**4. It runs ahead of the human — including in language.** This is the most symbolic one. After working a while, its output compresses into **arrow-chain shorthand (A → B → fails), references to thinking you never saw, and overly technical phrasing.** The model speaks in the vocabulary it built up mid-task, and whoever sees it fresh can't follow. One outlet jabbed that "Fable 5 speaks its own language." The guide devotes an entire section to this — write the final summary as a *re-grounding, not a continuation of your working thread*: lead with the outcome in one sentence, drop the invented abbreviations, spell things out in complete sentences.

There's also a new *structural* change. **Refusal became a first-class API state.** Fable 5's safety classifiers block offensive cyber, biology/chemistry and life sciences, and *attempts to extract the model's summarized thinking* — and when they fire, you don't get an error, you get `stop_reason: "refusal"` as a normal 200 response. The recommendation is to design server-side or client-side fallback to Opus 4.8 ahead of time. Benign work can trip the classifiers too, so any integration now has to handle refusals, fallback, and billing (a request refused before any output isn't billed).

> One anecdote worth adding. Anthropic disclosed that a hidden safeguard had been **throttling performance on AI-development queries without telling users**, admitted "we made the wrong tradeoff," and committed to making future interventions transparent. A reminder that on higher-tier models, the capability-versus-safety knob turns in places we can't see.

---

## So how do you actually use it

The #17 prescription (delete / add / set the dials / re-measure) still holds. Fable 5 adds two verbs: **rein it in** and **make it translate.**

**1. Use effort as the main dial — but in reverse.** Default to `high`, reserve `xhigh` for the most capability-sensitive work, and use `medium`/`low` for routine tasks. The key line in the guide: **"lower effort on Fable 5 often exceeds `xhigh` performance on prior models."** So don't peg it to max — if a task completes but drags longer than needed, *lower* effort. At double the price, this is also a cost decision. (For reference: adaptive is the only thinking mode, there's no numeric thinking budget, and the raw chain of thought is never returned — summarized or omitted only.)

**2. Spell out boundaries and stopping points.** A model that fills empty space with capability means your job is to leave no empty space. A single short instruction does it: "don't add cleanup to a bug fix," "if I'm asking a question or thinking out loud, assess and stop — don't apply a fix until I ask," "pause to ask only for a destructive/irreversible action, a real scope change, or input only I can provide." You used to have to enumerate each behavior; Fable 5 follows instructions literally enough that **one principle lands like a whole list.**

**3. Tie progress reports to evidence.** For long tasks, bake "audit each claim against a tool result before reporting" into the system prompt. In Anthropic's testing this one paragraph nearly eliminated fabricated reports.

**4. Demand a separate human-facing output.** Shorthand notes between tool calls are fine, but require that the **final summary be rewritten for someone seeing it for the first time**: outcome in one sentence first, no arrow chains, no abbreviations you coined mid-task, complete sentences. For long-running async agents, the guide also suggests a dedicated `send_to_user`-style tool that surfaces a message verbatim without ending the turn.

**5. "Transcribe your reasoning into the answer" is now a forbidden phrase.** Telling the model to show or explain its chain of thought trips the `reasoning_extraction` refusal classifier and increases fallbacks to Opus 4.8. If you need reasoning visibility, read the structured `thinking` blocks from adaptive thinking instead. **If your existing skills or system prompts contain "show your thinking" instructions, strip them out when migrating.**

**6. Give it harder work.** Counterintuitively, this is the guide's first recommendation — hand it a task harder than you'd have trusted prior models with, and have it scope, ask questions, and execute. Test only on easy work and you'll undersell its range. Layer on a memory file (one lesson per file), parallel subagents, and an async harness, and it earns its tier.

---

## From #17 to here

Put the two posts side by side and you can see the curve.

#17's message was "**let go.**" The model had overcome its weaknesses, so remove the prosthetics you'd laid down to cover them (step-by-step instructions, role-play, few-shot). There, the prompt got *shorter.*

Fable 5's message is "**build the railings.**" The model goes so far and so autonomously that what you design now isn't the words that push it, but the **boundaries that contain it and the contract that translates its results back to a person.** This is a further step along the direction from [blog #14 on agent engineering](/blog/14-agent-engineering) — the locus of human design moving from *inside* the model to *outside* it.

There was a fun paradox in #17: "the smarter the model, the shorter and emptier the prompt looks." Fable 5 folds that paradox once more. The smarter the model gets, what's left in the prompt isn't *"do this"* — it's **"stop here, and say it to a person like this."**

#17 buried the era when a good prompt looked like a magic incantation. In Fable 5, a good prompt looks like the **guardrails you give a capable but runaway senior**: not assigning more work, but setting where to stop, tying reports to evidence, and making it speak human again. What a higher-tier model demands of us isn't sharper instructions — it's a **clearer sense of boundaries.**

---

*References: [Claude Fable 5 and Claude Mythos 5 (Anthropic)](https://www.anthropic.com/news/claude-fable-5-mythos-5), [Introducing Claude Fable 5 and Claude Mythos 5 (docs)](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5), [Prompting Claude Fable 5 (docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5), [Refusals and fallback (docs)](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)*
