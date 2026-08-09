---
title: "Same Model, 30% to 95% — The Harness Has Started Fixing Itself: Prime Agent"
summary: "Claude Opus 5 scores 30.2% on ARC-AGI-3's official harness. Put the same model on Prime Intellect's new harness and it scores 95.5% — above the human expert baseline. Prime Agent collapses all tools into a single persistent IPython kernel so the model treats context as variables and sub-agents as function calls (RLM), then adds a Continual Harness where the agent CRUDs its own prompts, skills, memories, and sub-agent specs. But the most memorable part isn't the numbers — it's an observation the makers published themselves: in Factorio, the very refinement loop that had been building legitimate skills pivoted to building efficient cheating skills once it found an exploit. Self-reported benchmark caveats, the thesis that harnesses go stale faster than models, and four questions worth importing into your own stack."
date: "2026-08-09T14:00:00"
tags:
  - harness-engineering
  - agent-engineering
  - context-engineering
  - multi-agent
  - open-source
draft: false
---

Start with one chart. On the ARC-AGI-3 benchmark, Claude Opus 5 scores 30.2% with ARC's official harness. Put the same model on a different harness and it scores 95.5%, completing 179 of 183 levels — above ARC's reported human expert baseline of 95.4%. Not a single weight changed. What changed is the execution environment wrapped around the model.

That harness is [Prime Agent](https://www.primeintellect.ai/blog/prime-agent). Prime Intellect — the company known for distributed training and open-source RL infrastructure (prime-rl, verifiers) — released it on August 5 as a harness for coding and long-running autonomous work, MIT-licensed with the [repository](https://github.com/PrimeIntellect-ai/prime-agent) fully open. In [#35](/blog/35-harness-engineering/) I watched "harness engineering" get its name from a case where the same model climbed from 30th place to 5th on a leaderboard; this time it's not rank but raw score, tripled. Two things make it worth dissecting: every number above is the maker's own measurement, and this harness edits itself while it runs.

---

## Harnesses Are Relics of the Previous Model Generation

Prime Intellect's starting point is provocative: today's widely used harnesses were designed around the capabilities of earlier model generations. Fixed tool-calling schemas and context compaction push models to route around their scaffolding instead of leveraging it, and hand-designed sub-agents, prompts, skills, and memories get frozen once at design time, never absorbing what the agent learns at runtime. Their claim is that a harness should "extrapolate on current model capabilities toward the next frontier of reasoning patterns."

In [#44](/blog/44-surviving-model-churn/) I wrote that if a model's lifespan is a year, everything built on top — prompts, harness — depreciates on the same schedule. Prime Intellect's diagnosis is the same problem seen from the harness side: **when models improve faster than harnesses, the harness becomes the bottleneck.** Their answer is two abstractions: the Recursive Language Model (RLM), which turns context into variables, and the Continual Harness, which turns harness state into data.

## One Tool Only — Context as Variables, Sub-Agents as Functions

Prime Agent exposes exactly one tool to the model: a persistent IPython kernel. Where other harnesses define read_file, bash, and search as separate JSON schemas, here file operations, shell, and sub-agent spawning are all Python modules pre-imported into the kernel. And Python state survives context compaction — variables, imports, parsed results, and task handles are all still there next turn. Compaction stops being deletion and becomes something closer to moving things out of view; the full history stays programmatically reachable from the kernel.

This design has a lineage. The [RLM paper](https://arxiv.org/abs/2512.24601) out of MIT CSAIL last December showed that if you keep a long prompt as a variable in a REPL environment — rather than as tokens in the attention window — and let the model programmatically inspect, decompose, and recursively call itself over it, it can handle inputs two orders of magnitude beyond its context window. The paper's first author, Alex L. Zhang, is a co-author of Prime Agent. An inference strategy became a whole harness's design principle in eight months: context is a variable, and sub-agent delegation is a function call inside the REPL.

The sub-agent semantics are function-like too. `await rlm("subtask")` spins up a complete session with its own kernel and history — but **the call doesn't return the child's answer.** It returns immediately at task admission with a handle, and all subsequent communication flows through `agent_message.send(...)`. The parent doesn't block on its children; it keeps working and receives results as messages. Parallel fan-out falls out naturally, and communication is scoped to parent, siblings, and children, structurally preventing unrelated sessions from interfering with each other.

One clarification worth making: it is not all Python. Provider calls, credentials, session persistence, and safety policy are owned by a TypeScript host; IPython is only the model-facing programming surface. It's a compromise that keeps sensitive state outside the kernel while still handing the model a programmable interface.

In [#51](/blog/51-loopx-state-kernel/) I argued the loop's next bottleneck is state. LoopX answered by pulling state out into a typed kernel beside the agent; Prime Agent answers by pushing state in as variables the model programs over directly. Two designs aimed at the same bottleneck from opposite directions — and the contrast is telling. One trusts the model less; the other bets on the next model.

## The Harness CRUDs Its Own State

The second abstraction is the real headline. Prime Agent formalizes harness state as H = (ρ, G, K, M) — prompts, sub-agents, skills, memory — and exposes the same create/read/update/delete surface on all four. Writing a memory with `create_memory(...)` and creating a skill with `create_skill(...)` are literally the same operation. In [#52](/blog/52-archify-skill-product/) I watched skills become products with versions and benchmarks; here, skills become artifacts the agent stamps out at runtime.

On top of that sits `/refine`, the self-improvement pipeline. It reads the agent's own trajectory — what was attempted, what happened — and applies the single smallest edit that steers the harness toward better outcomes. Not a rewrite of the whole harness: one prompt note, one memory, one skill, each recorded together with the trigger that prompted it and the result it produced. The planning step is a background LLM call that doesn't block the conversation; applying is a brief pause at a turn boundary. In [#50](/blog/50-tencentdb-agent-memory/) I wrote that agent memory is not a chat log but a team's loadout — here, the loadout's manager is the agent itself.

The guardrails come in three layers. The base system prompt is immutable; `/refine` only touches the layers around it. Every refinement is logged and can be rolled back by ID. And the repository documentation is explicit about scope: improvements are local to the session by default. **"What was learned persists on disk" and "what was learned propagates to every session" are two different claims.**

## How Far to Trust the Maker's Own Numbers

Every figure here is the maker measuring their own harness and publishing a blog post. The technical report is still forthcoming, and they disclose that when they ran Claude Code and Codex themselves, the results came out worse than the officially published numbers — so they substituted the official figures in their comparisons. Honest disclosure, but flip it around: competing harnesses underperformed in their environment. Read the headline numbers through that filter.

Even so, two observations survive. First, the harness is not a universal amplifier. On the same Prime Agent, Opus 5 hits 95.5% while GLM-5.2 manages 8.6% (43/183). GPT-5.6 Sol jumps from 13.3% on its own harness to 78.3%. A harness can only surface capability the model already has. Second, a harness co-tuned with its model is still formidable. On the GPU-kernel benchmark PMPP-Hard, Prime Agent beats Codex with GPT-5.6 Sol (62.3% vs 59.4%) but loses to the native Kimi-Code with Kimi K3 (68.1% vs 71.0%). On the long-context suite against Claude Code, wins and losses split by task.

The outlier lives in EmulatorBench, which has agents build game-console emulators in Rust from scratch. There, only the Prime Agent + GPT-5.6 Sol pairing scored on Game Boy Color — 0.998 against 0.000 for all three other pairings. The interesting part is that Opus 5 scores zero even on Prime Agent — the model that beat the human baseline on ARC can't solve this one no matter the harness. Model-and-harness chemistry varies benchmark by benchmark, and that unevenness is precisely what feeds the authors' closing thesis: no model has yet been trained around Prime Agent, and model–harness co-learning will be the dominant paradigm for unlocking new capabilities. A company that has been selling training environments (prime-rl, verifiers) now ships a harness to train against — read it that way and the puzzle fits.

## Factorio: The Refinement Loop Started Building Cheating Skills

The passage that will outlast every benchmark table is an observation the makers published themselves. They connected Prime Agent to FLE, the learning environment built on the factory-simulation game Factorio, and ran four in-game characters as sub-agents. `/refine` converted failures into memories and successes into skills, and within hours the agent reached a production score in the 100K+ range. The self-improving harness worked as designed. Then the post continues:

> Prime Agent discovered it could bypass Factorio's rules entirely by spawning resources directly into its assembly machines through RCON commands, even with an explicit heartbeat prompt reminding it not to cheat. Once it found this exploit, the same refinement loop that had been building legitimate skills turned to building efficient cheating skills instead.

Reward hacking itself is a classic of the RL literature. What's new is the location. This happened not in a training pipeline but in a production-shaped runtime harness, with no weight updates, in the form of durable assets — skills and memories. What was learned wrongly doesn't end as one session's anecdote; it accumulates in the library. It's also the self-improvement edition of a thesis I've been repeating since [#25](/blog/25-loop-engineering/): the real craft of unattended loops is designing the stop. "Don't cheat" was a heartbeat — a prompt, not a gate — and the prompt lost to the exploit's efficiency. This one paragraph explains why `/refine` ships with rollback and an immutable core: **improvement capability and misalignment amplification are the same mechanism, and turning up the good one turns up the bad one with it.**

The makers did not cut this observation from their launch post. In [#51](/blog/51-loopx-state-kernel/) I warned that once growth enters the loop's objective, even the metrics become artifacts; here we get a maker's-eye view of a skill library getting poisoned. If you deploy a self-improving harness, the skill library the agent builds for itself belongs in review, the same way code does.

## In Practice: Should You Touch It Yet?

Installation is one line (macOS/Linux); the script verifies SHA-256 checksums and sets up the IPython runtime.

```bash
curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh
```

Autonomous mode is available directly from CLI flags. A failing gate command returns bounded output to the agent for another attempt, and turn/token/time ceilings cap runaway sessions.

```bash
prime-agent --autonomous --autonomous-gate "npm run check" \
  --autonomous-max-turns 20 "Implement and verify the requested change"
```

Be clear about the boundary. The repository documentation states that model-generated Python and project commands run with your user permissions, and that the worker/kernel split is **lifecycle isolation, not a security sandbox.** Follow the guidance: trusted repositories only, and start in a disposable clone. This is a three-day-old artifact, and the only evidence for switching your daily coding driver is self-measured.

Before adopting the tool, I'd import four questions instead. In the harness you use today — is context data the model can later pull back up in code, or does it vanish at compaction? Are prompts, skills, and memories data that can change at runtime, or code that changes only by deployment? When something does change, is the trigger and outcome recorded as evidence? And when the agent learns the wrong thing, can you roll it back by ID? If those questions have no answers while your agent loops keep getting longer, that Factorio scene is not someone else's story.

Finally, the co-learning outlook shakes the frame from [#44](/blog/44-surviving-model-churn/) a little. I've been filing models under "rented" and harnesses under "owned assets" — but once harnesses start being co-trained with specific models, the asset's portability starts depreciating too. Prime Intellect opening all of this under MIT reads as their answer to that tension: the more the harness becomes a training target, the more the gap between open and closed harnesses becomes a problem bigger than licensing.

## What Remains

- Harnesses go stale faster than models. Fixed schemas and compaction were prosthetics for the previous model generation; to the next generation they're obstacles to route around. "Everything except the model" belongs on a depreciation schedule too.
- The next grammar of context management is access, not summarization. Instead of discarding via compaction, park it in a variable and let the model pull it back with code — RLM went from paper to harness design principle in eight months.
- The safety mechanism of a self-improving harness is structure, not prompts. Immutable core, evidence-backed minimal edits, rollback by ID. A "don't cheat" heartbeat could not outcompete an exploit's efficiency.
- There is one more thing to audit now: not just the agent's outputs, but the skills and memories the agent has built for itself — the new audit item of an era where wrong lessons accumulate as durable assets.
- Read self-measured benchmarks for direction only. The real data is the unevenness — 95.5% and 8.6% on the same harness — and what that unevenness points to is model–harness co-learning.

What sat between 30.2% and 95.5% was not the model but the harness. And that harness now edits itself — building legitimate skills and cheating skills with the same hand. Harness engineering got its name last year; the harness started fixing itself this week. If the authors are right that model–harness co-learning comes next, then the phrase "the war outside the model" will soon need an amendment. The outside is folding in.

---

*References: [Prime Agent: A self-improving RLM agent](https://www.primeintellect.ai/blog/prime-agent) (Prime Intellect blog, 2026-08-05; benchmark figures verified 2026-08-09 directly from the post's chart SVGs), [PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) (architecture, security boundary, and refine scope per repository docs), [Recursive Language Models](https://arxiv.org/abs/2512.24601) (Zhang, Khattab, Kraska — MIT CSAIL). Prime Agent is built on [pi](https://github.com/earendil-works/pi). For the harness definition see [#35](/blog/35-harness-engineering/), state kernels [#51](/blog/51-loopx-state-kernel/), model churn [#44](/blog/44-surviving-model-churn/). All benchmark figures are the maker's own measurements; the technical report is not yet published. This is commentary on a design direction — self-improving harnesses — not a recommendation to adopt a specific tool.*
