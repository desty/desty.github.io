---
title: "Nobody Asked for a Smarter Model — Reading What Developers Actually Want Through 4 Trending Repos"
summary: "This month's GitHub trending threw codegraph, Understand-Anything, ECC, and pi up at once. I cloned all four, read the code, and traced why people got so excited. The striking part — nobody was asking for a smarter model. Everyone wanted what sits around the model."
date: "2026-05-31T18:00:00"
tags:
  - ai-agent
  - coding-agent
  - claude-code
  - mcp
  - open-source
  - knowledge-graph
  - agent-engineering
draft: false
---

This month's GitHub trending filled up with AI coding repos. **codegraph** (#2 on trending May 23, +2,400 stars in 24 hours), **Understand-Anything**, **ECC** (160K stars), **pi**. Like [last time](/en/blog/15-hermes-vs-openclaw/), I cloned all four and read the source — and this time I went further and traced **why people got so excited: the issues, the discussions, the HN/Reddit reactions.**

One thing stood out. None of them caught fire because "the model got smarter." A line from a codegraph writeup nailed it:

> "It doesn't make the model smarter — it helps it **get less lost.**"

What people wanted wasn't the model itself; it was **everything around the model.** And that want split three ways — **stop it getting lost (grounding), set it up once (reuse), let me control it (trust).** The four trending repos each answer one of those.

---

## Want ① "I wish the agent would stop thrashing" — codegraph & Understand-Anything

Anyone who's used a coding agent knows it. One question and the agent spends ages `grep`ping, reading files, following imports, figuring out "what this codebase even is" before it can answer. That's the discovery phase, and in a per-token billing world it's pure cost. One developer's reaction to codegraph resonated widely:

> "Hit this exact pain. Explore agents kept re-scanning the same files with no shared symbol cache. A pre-built graph the agent consults before grepping is a real UX gain, not just perf."

Same itch — but **the two repos target a different thing getting lost.**

### codegraph — so the agent gets less lost

**What it is.** Parses code with tree-sitter, puts functions, classes, imports, and call relationships into a local **SQLite graph**, and the AI agent queries it through an **MCP server** (10 tools like `codegraph_search`, `callers`, `callees`, `trace`, `impact`).

**Why it landed.** The wins were concrete and repeatable. On the VS Code repo, "how does the extension host talk to the main process" dropped from **52 tool calls to 3.** Across 7 real codebases: ~57% fewer tokens, ~62% fewer tool calls (author-run benchmarks, so read the *direction*, not the exact percent). And it's **100% local — no LLM, no embeddings, no API keys** — not a line of code leaves the machine. tree-sitter gives mechanically-derived facts, so no hallucination.

The most telling signal: people **immediately wanted more.** The top issue request was to import **docs and specs into the graph too**, not just code. Someone ported it to Kiro within days ("the idea was brilliant, so I ported it"). The demand is spilling past the tool into "a map of the whole project's knowledge."

> **When to use it**
> When you can see the agent thrashing and burning tokens in a large codebase. When you want it plugged into Claude Code / Codex / Cursor via MCP. When code can't leave the building (internal / security-sensitive). It's **fuel the agent eats.**

### Understand-Anything — so the human gets less lost

**What it is.** Same "code → knowledge graph," but the output is **for people.** An LLM multi-agent pipeline scans and summarizes the project, groups it into architectural layers, and visualizes it as an **interactive dashboard.**

**Why it landed.** The creator's slogan hit a nerve — **"Graphs that teach > graphs that impress."** It was a reaction against prior repo-map tools that produced "a giant graph that looks impressive but doesn't actually help you understand the code." What people loved most wasn't the flashy dependency hairball but the **business-logic view** ("how code maps to real business processes — domains, flows, steps") and the **persona-adaptive view** (detail level shifts for junior dev / PM / power user). On HN the creator said it plainly: *"Engineers love the business knowledge mode."*

The next want was just as clear. The most-requested thing in discussions: **a team-shared, remotely stored graph** — so everyone doesn't regenerate it — growing into a "long-term agent-memory companion."

> **When to use it**
> When you've joined an unfamiliar codebase and **a human needs to understand the structure fast.** Team onboarding, mapping legacy, explaining a system to a non-technical stakeholder. A better intro than "read the README and ask questions."

| | codegraph | Understand-Anything |
|---|---|---|
| Who gets less lost | **the agent** | **the human** |
| Output | SQLite graph (MCP queries) | visual dashboard (viewing, onboarding) |
| Strength | token/tool-call savings, 100% local | business-logic & persona views |
| What people wanted next | docs & specs in the graph | team-shared, remote graphs |

They aren't competitors — they're **two faces of the same want.** And both are shouting the same "next": more knowledge, shared across the team. Grounding is moving from a one-off tool to a **shared asset.**

---

## Want ② "I don't want to set this up from scratch every time" — ECC

ECC (Everything Claude Code) hit **160K stars** not because of its skill count. The reason people cited most was the **empty-config problem.** Augment Code put it precisely:

> "The tools ship with almost no configuration. So you rebuild the same hooks, guardrails, and memory setup on every project. Teams write custom CLAUDE.md files, Cursor rules, and MCP configs, then repeat it all on the next project."

ECC is the **batteries-included** answer to that repetition. It grew out of an Anthropic hackathon win in Sept 2025 (the config behind an app "built in Claude Code in 8 hours"), ships as one MIT repo with a sub-2-minute install and language-specific rules via `./install.sh python`.

**Why it landed — what people specifically named.**
- **AgentShield security** (1,282 tests, an `--opus` red-team/blue-team/auditor pipeline) — "the first thing I'd evaluate if your team runs MCP configs or CLAUDE.md in production."
- **Instincts / memory** — "extracts patterns from coding sessions, scores them by confidence, clusters them into reusable skills." A direct answer to long-session context loss.
- **Cross-harness portability** — "for teams running Claude Code on the backend and Cursor on the frontend, ECC becomes a single config source." Someone called it **"the .editorconfig for AI coding tools,"** and the analogy stuck.

The line that captured it: *"I'd rather adopt it now than build the same thing myself six months from now."* And **26K forks** — that's not window-shopping, that's real integration into team workflows.

> **When to use it**
> When you hop across multiple agents and want to **unify your config into one set.** When you don't want to assemble hooks / MCP / memory / security from scratch and need a well-stocked starting point. Most people **cherry-pick the parts that fit their workflow** rather than installing all of it.

The want ECC answered isn't "make the model stronger" — it's **"configure the agent for production."** People moved from "let's try the AI tool" to **"let's set the AI tool up for daily, production use,"** and ECC is the emblem of that shift.

---

## Want ③ "I want to see and control what goes into the model" — pi

pi was built by **Mario Zechner** (creator of libGDX and Spine), brought along when he joined Earendil in April 2026. It earned trust not by star count but by **philosophy.**

Mario's core argument: mainstream harnesses *"inject stuff behind your back that isn't even surfaced in the UI,"* making real context engineering impossible. pi's answer is **control through subtraction** — four tools (Read, Write, Edit, Bash) and a sub-1,000-token system prompt. The lines people quote back:

> "If I don't need it, it won't be built. And I don't need a lot of things."
> "Exactly controlling what goes into the model's context yields better outputs."

**Why it landed.** The trust signals stacked up. Armin Ronacher (creator of Flask) endorsed it publicly: *"Pi is written like excellent software. It doesn't flicker, doesn't eat memory, doesn't randomly break. It's the coding agent I use almost exclusively."* On HN, Mario's depth ("the first blog in years I spent an hour reading") and pedigree bought instant trust. And the **anti-lock-in stance is explicit** — `pi-ai` wraps Anthropic, OpenAI, Google, Bedrock, Mistral and more behind one interface; deps are exact-pinned, install uses `--ignore-scripts`, with a shrinkwrap. Having lived through RoboVM breaking after an acquisition, his *"pi is MIT. It stays MIT. The fork button always works"* is what won people over.

One striking signal: pi was the **hidden engine** under OpenClaw, which spiked to 100K+ stars in a week. Many people discovered pi *through* it.

> **When to use it**
> When you're **building an agent yourself** — an app that swaps between LLMs, your own coding agent / TUI. Above all, for people who want to **know and control exactly what goes into the model.** If supply-chain security matters to your org, its pinning / shrinkwrap setup doubles as a reference.

---

## The one line running through all three wants

Read all four down to the code, follow the reactions, and the same sentence shows up wearing three faces.

- codegraph & Understand-Anything → "don't make the model smarter, make it **get less lost**." (grounding)
- ECC → "don't rebuild it every time, **set it up once and reuse**." (reuse)
- pi → "I can't see what you're injecting, so **let me look and control**." (trust)

Developers in 2026 weren't asking for a stronger model. The model is already strong enough. What they actually wanted was **how to tame that strong model** — what to feed it (grounding), how to pass the setup along (reuse), how to look inside what it's given (trust). It's the most honest evidence that the frontier has moved **from the model to everything around it.**

---

## So where does this go next?

The wants point fairly clearly.

**① Grounding becomes a "shared asset" — and eventually gets absorbed into the platform.**
The key tell is that codegraph users immediately asked for "docs and specs too" and Understand-Anything users asked for "a team-shared graph." Code maps are moving past one-off tools into a **shared project-knowledge layer for the team.** "Agents grope through the codebase" is so universal a problem that this feature will likely get **built into agents/platforms** or pulled into an MCP standard before long.

**② "Agent config" gets standardized — the .editorconfig moment.**
ECC's 160K stars mean the empty-config problem is that universal. A giant bundle fills the gap today, but just as `.editorconfig` and `.prettierrc` did, **agent config will converge on a light, standardized format.** People didn't want "250 skills" — they wanted "define my config once and carry it across every tool and project."

**③ Control and transparency become the bar for trust.**
The more autonomously an agent runs, and the more code it executes, the more people start asking *"can I see what this is doing inside?"* It's no accident pi won trust by being minimal, transparent, and forkable. The differentiator for the next generation of tools won't be "feature count" — it'll be **"can I understand and control it?"**

---

## Closing

I started out trying to "open the code and see what's flimsy." But following why people actually got excited produced a more interesting picture. **These four aren't a list of flaws — they're a map of demand.**

In [post #14](/en/blog/14-agent-engineering/) I wrote that what agent engineers really design are the layers outside the model. This week's trending proves the same thing from the user side. The model race has leveled off, and now people give their stars to **the tools that tame the model.**

I'll be watching trending again next week. The question I'll bring is this:

**Does this make the model smarter, or does it make us better at handling the model?** — lately, people star the latter.

---

## References

- [codegraph (colbymchenry)](https://github.com/colbymchenry/codegraph) — MCP-native code knowledge graph
- [Understand-Anything (Lum1104)](https://github.com/Lum1104/Understand-Anything) — code → interactive knowledge graph
- [ECC / Everything Claude Code (affaan-m)](https://github.com/affaan-m/ECC) — multi-harness config layer
- [pi (earendil-works)](https://github.com/earendil-works/pi) — agent development toolkit
- [Mario Zechner — Pi Coding Agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) · [Armin Ronacher — pi](https://lucumr.pocoo.org/2026/1/31/pi/)
- Related: [Hermes vs OpenClaw — Same Dream, Different Design](/en/blog/15-hermes-vs-openclaw/) · [What Agent Engineers Actually Design](/en/blog/14-agent-engineering/)
