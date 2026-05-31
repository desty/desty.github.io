---
title: "Code Maps and Skill Piles — Reading the Coding Agent's Next Battleground Through 4 Trending Repos"
summary: "This month's GitHub trending threw codegraph, Understand-Anything, ECC, and pi up at once. I cloned all four and read the code — and 'why now' became clear. The center of gravity in coding agents has shifted from models and CLIs to context and skills. And the next battleground is trust."
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

I was scanning GitHub trending this month and noticed a pattern. Similar things kept showing up at once.

**codegraph** (#2 on trending May 23, +2,400 stars in 24 hours), **Understand-Anything**, **ECC** (160K+ stars), **pi**. On the surface they're all over the place, but they sort cleanly into two kinds. One is **"a tool that hands the AI a map of your codebase,"** the other is **"a toolkit that swaps skills and tools into the AI."**

Like I did [last time](/en/blog/15-hermes-vs-openclaw/), instead of comparing READMEs I **cloned all four and read the source.** This time I go one step further. Not just "what's different," but **"why is this hot right now,"** and — by watching where Claude Code, Codex, Gemini CLI, and MCP are moving — **"where does this go next?"**

Bottom line first: the center of gravity in coding agents has shifted **from models and CLIs to context and skills.** These four are the signal. And the next battleground — I'll get to it at the end — is **trust.**

---

## Why now ① : agents burn tokens *finding* code

Anyone who's used a coding agent knows this. You ask one question and the agent spends ages `grep`ping, reading files, following imports, tracing call chains. **The stage before it can produce an actual answer — "figuring out what this codebase even is"** — is the discovery phase. A big chunk of the token budget evaporates right there.

Through the first half of 2026 this got more painful. Three things converged.

- **Token efficiency became a competitive axis.** OpenAI claims Codex CLI is roughly 4x more token-efficient than Claude Code. Who does the same job cheaper is now a marketing point.
- **Context windows grew to 1M — but that isn't free.** Gemini and Opus both take a million tokens. Stuffing the whole codebase in every turn is slow and expensive anyway.
- **MCP converged into a standard.** With Anthropic, Microsoft, and OpenAI all adopting the Model Context Protocol as a common interface, "build a tool once, plug it into every agent" became possible.

So the answer that emerged is **"build the map ahead of time."** Don't grope around each turn — query a structure you've already indexed. codegraph and Understand-Anything aim at exactly this spot. But **the way they build the "map" is opposite.**

---

## Two code maps : codegraph vs Understand-Anything

### codegraph — a machine-verified map

**What it is.** It parses code with tree-sitter, extracts functions, classes, imports, and call relationships, and puts them into a local **SQLite graph**. The AI agent queries that graph through an **MCP server** — 10 tools like `codegraph_search` / `callers` / `callees` / `trace` / `impact`.

**Core tech.**
- Parsing uses tree-sitter WASM grammars (those `.wasm` files in the repo). Storage is Node's built-in `node:sqlite` + an FTS5 full-text index.
- **No LLM anywhere.** No embeddings, no model calls. Pure static analysis. So the graph's contents are facts mechanically derived from code — no room for hallucination.
- I checked the code directly, and **"100% local, no external transmission" holds.** There's no outbound HTTP or telemetry; the only network usage is Unix-socket IPC to a local daemon.

**Take the numbers with salt.** The repo touts "57% fewer tokens, 62% fewer tool calls" (third-party writeups say 59% tokens / 70% calls; package.json even says 94%). A benchmark harness does ship in the repo, but it's **author-run with a small sample (median of n=4, some n=1).** The figures swing from 30% to 94% across documents. **Trust the direction (it goes down); treat any specific percentage as marketing.**

> **When to use it**
> When you can see the agent thrashing and burning tokens in a large codebase. When you want to plug it into Claude Code, Codex, or Cursor via MCP. When not a single line of code may leave the building (internal / security-sensitive). It's a map used as **fuel for the agent.**

### Understand-Anything — a map humans read

**What it is.** Same "code → knowledge graph," but the output and purpose differ. An **LLM multi-agent pipeline** scans the project, summarizes it, groups it into architectural layers, and writes a single `.understand-anything/knowledge-graph.json`. Then it visualizes that as an **interactive React Flow dashboard** — color-coded by layer, click a node for its code, relationships, and plain-English explanation, and the detail level even adapts to who's looking (junior dev / PM / power user).

**Core tech.**
- tree-sitter scrapes the skeleton (files, imports) mechanically, but **the summaries, layers, relationships, and tours are written by an LLM.** The 7-phase build is defined as prompts in `SKILL.md`, and the host agent runs subagents to fill it in.
- In other words, this graph is **"JSON written by an LLM."** Not facts the code verified, but a model's reading of the code. Quality depends on the driving model.
- To be honest: the source has a semantic-search engine (`embedding-search.ts`), but **nothing in the pipeline ever generates embeddings.** Actual "ask a question" amounts to grepping the JSON. "Semantic search" is somewhat overstated.
- Support for Claude Code / Codex / Cursor / Copilot / Gemini CLI is real, but it's done via **config files + symlinked markdown skills, not MCP.** No telemetry.

> **When to use it**
> When you just joined an unfamiliar codebase and **a human needs to understand the structure fast.** Team onboarding, mapping legacy, wanting to *see* "how does this domain logic flow?" as a picture. It graphs not only code but also docs and wikis (e.g. the Karpathy LLM wiki). It's a map **for people.**

### The one line where they split

| | codegraph | Understand-Anything |
|---|---|---|
| Graph creation | tree-sitter static analysis (0% LLM) | LLM multi-agent pipeline |
| Output | SQLite + FTS5 (for querying) | JSON + visual dashboard (for viewing) |
| Trust model | machine-verified facts | model's interpretation |
| Consumer | **the agent** (10 MCP tools) | **humans** (browser dashboard) |
| Integration | MCP-native | config files + symlinked skills |
| Core value | token / tool-call savings | structural understanding, onboarding |

They aren't competitors. **codegraph is fuel the agent eats; Understand-Anything is a map people look at.** The similar names lump them into one category, but once "who reads the map" differs, the whole design diverges. That's a difference you can't see until you open the code.

---

## Why now ② : skills became a cross-agent standard

On to the second cluster. Its backdrop is simpler.

`SKILL.md` — a plain format where you write "name + when to use it" in YAML frontmatter and the procedure in the body — **became the de facto standard.** A skill built in Claude Code runs as-is in Codex CLI, Cursor, OpenCode, and other SKILL.md-compatible agents. Anthropic laid the templates with its official `skills` repo and role-specific `knowledge-work-plugins`, and the marketplaces exploded. Some directories now boast 6,700+ skills and 2,500+ marketplaces.

When a standard appears and the barrier drops, a **gold rush** follows. People pile in on both ends: "bundles that hoard as many skills as possible" and "infrastructure that runs skills and agents." ECC and pi are precisely those two extremes.

---

## Two skill/toolkits : ECC vs pi

### ECC (Everything Claude Code) — a config layer that covers by volume

**What it is.** A **giant config + skill bundle** you plug into many harnesses at once — Claude Code, Cursor, Codex, OpenCode, Gemini, Zed, Copilot. It grew out of an Anthropic hackathon win in September 2025 and has passed **160K stars** by third-party counts. It version-controls ~60 agents, ~250 skills, 76 commands, hooks, and a security scanner (AgentShield).

**Core tech — and an honest note.**
- The multi-harness integration is real. It ships per-harness directories and adapters (`.claude/`, `.cursor/`, `.codex/`, `.gemini/`), 6 MCP servers in `.mcp.json`, and working hook dispatchers. Memory is file-based but has a real implementation (session hooks, an 1,800-line `instinct-cli.py`).
- **But you have to question the code density.** Counting directly, **of ~250 skills only 12 contain actual code; the rest are markdown prompts.** There's a lot of coding-irrelevant verticals mixed in — customs, visas, healthcare. Much of "security" is a prompt-defense boilerplate pasted into 75 files, and the headline security monitor is a wrapper around someone else's pip package (off by default).
- The star count is overwhelming, but the code shows **count ≠ value.** This isn't a knock on ECC specifically — it's a general principle for evaluating trending bundles.

> **When to use it**
> When you hop across multiple agents and want to **unify your config into one set.** When you don't want to write hooks / MCP / harness adapters from scratch and need a well-stocked starting point. Just drop the fantasy of using all 250 skills and go in with the mindset of **picking the 12 you need.**

### pi — an infra layer that goes by depth

**What it is.** A **TypeScript monorepo toolkit** built by **Mario Zechner** (creator of libGDX), brought along when he joined Earendil in April 2026. Not a pile of skills — it builds the **foundation that runs agents.** Four packages.

| Package | Role |
|---|---|
| `pi-coding-agent` | coding agent CLI |
| `pi-ai` | unified API across multiple LLMs |
| `pi-agent-core` | agent execution runtime (tool calling, state mgmt) |
| `pi-tui` | terminal UI library |

**Core tech.**
- **Unified LLM API.** Abstracts 9 providers behind one interface — Anthropic, OpenAI (+Codex/Azure), Google (Gemini/Vertex), Mistral, AWS Bedrock. Avoiding vendor lock-in is a design goal.
- **The supply-chain hardening is real.** I verified it in code: all external deps pinned to exact versions (`save-exact`), a shrinkwrap with 134 integrity hashes in the published package, `--ignore-scripts` on install, even a CI script that checks the pinning. "Supply-chain safety" isn't a slogan here, it's in the code.
- High engineering maturity. Biome, strict TS, 252 tests. (Note: the Slack bot / vLLM bits are in the toolkit's broader scope but live in a separate repo, `pi-chat`, not the main monorepo.)

> **When to use it**
> When you're **building an agent yourself.** Writing an app that swaps between several LLMs, or standing up your own coding agent / TUI. Especially if **supply-chain security matters to your org**, its pinning / shrinkwrap / ignore-scripts double as a reference. It's a **foundation for builders,** not an end-user bundle.

### The one line where they split

| | ECC | pi |
|---|---|---|
| What it is | multi-harness config/skill bundle | agent-dev infrastructure monorepo |
| Center of gravity | **volume** (count of agents/skills) | **depth** (runtime, integration, supply chain) |
| Audience | people who **use** agents | people who **build** agents |
| Basis of trust | star count, hackathon pedigree | code, supply-chain hardening, author track record |
| The trap | count inflation (12/250 skills have code) | over-abstraction for end users |

---

## So, where does this go next?

Read all four down to the code and overlay them on recent platform moves, and three directions emerge.

**① Code indexing gets absorbed into the agent, or converges onto the MCP standard.**
Right now standalone tools like codegraph ride the trending wave, but "the agent burns tokens groping through the codebase" is too universal a problem — it'll most likely end up **built into the agent itself, or pulled into a standard MCP tool.** Today's standalone indexers are a transitional bet, filling a gap before the standard settles.

**② Skills commoditize, and the moat moves from "count" to "curation and verification."**
In an era of 6,700 skills, "we have 250" is no longer a brag. As ECC's code density shows, **volume no longer differentiates.** The next step is "does this skill actually work, is it verified?" Approaches like [academic-research-skills](https://github.com/Imbad0202/academic-research-skills) — which verifies citations through integrity gates you can't skip and runs 1,500 tests — are, unglamorous as they are, closer to the future.

**③ The next battleground is trust.**
The more autonomously an agent runs, and the more code it executes, **the more trust matters over cost.** It comes in three strands.
- **Supply chain** — the exact problem pi pre-answered with pinning / shrinkwrap / ignore-scripts. In a world where agents install npm packages and run code, this isn't optional.
- **Verification** — is the graph, the skill, the answer *real*? codegraph dropping the LLM for pure static analysis is also a trust design: give hallucination-free facts.
- **Provenance** — trending is full of impressive-sounding names (among the repos I looked at this round, one prepends "Anthropic" but is an unofficial repo made by an individual). Judge by code and author, not name.

---

## Closing

All four I looked at cloned as a **single squashed commit** — meaning, being trending newcomers, their development history is invisible. Star counts, skill counts, names — every surface signal wobbles. So [last time](/en/blog/15-hermes-vs-openclaw/) and again now, I land on the same conclusion. **You have to open the code to see what's real.**

In [post #14](/en/blog/14-agent-engineering/) I wrote that what agent engineers really design are the layers outside the model. This week's trending shows exactly that. The model is already powerful. What people are building now is **how to feed it code (context), what to make it do (skills), and how to trust it (trust).**

I'll be watching trending again next week. The question I'll bring is one.

**Is this a new capability, or just more of the same capability piled higher?**

---

## References

- [codegraph (colbymchenry)](https://github.com/colbymchenry/codegraph) — MIT, MCP-native code knowledge graph
- [Understand-Anything (Lum1104)](https://github.com/Lum1104/Understand-Anything) — code → interactive knowledge graph
- [ECC / Everything Claude Code (affaan-m)](https://github.com/affaan-m/ECC) — multi-harness config bundle
- [pi (earendil-works)](https://github.com/earendil-works/pi) — agent development toolkit
- [The 2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — MCP standard convergence
- [Agentic Coding in 2026: Claude Code vs Codex vs Gemini vs Cursor](https://ofox.ai/blog/agentic-coding-claude-codex-gemini-cursor-2026/) — coding agent comparison
- Related: [Hermes vs OpenClaw — Same Dream, Different Design](/en/blog/15-hermes-vs-openclaw/) · [What Agent Engineers Actually Design](/en/blog/14-agent-engineering/)
