---
title: "Agent Memory Isn't a Chat Log — Where TencentDB Agent Memory Pins Team Memory"
summary: "Tencent's open-source TencentDB Agent Memory is not a conversation dump. It governs four assets — Chat Memory, Skill, Wiki, and CodeGraph — at team scope. The design bets are layered L0–L3 distillation, memory as agent loadout rather than a global prompt, and a transparent MemoryProxy that injects context into coding agents without code changes. The PersonaMem jump from 48% to 76% matters less than the shift from RAG's 'what can be found' to 'who may use it, which version is live, and which agent is equipped.' Architecture, DX, and the rough edges as of the v2.0 release and ~17k stars."
date: "2026-08-19T10:00:00"
tags:
  - agent-memory
  - multi-agent
  - context-engineering
  - harness-engineering
  - open-source
  - tencent
draft: false
---

Leave a coding agent running all day and a quiet tax appears. Yesterday's constraint on the auth module has to be re-explained in today's session. Last week's design doc is re-read from page one by a different agent. A release checklist that already worked is rebuilt from scratch by the next person. Models are rented and tools are copy-pasted, but **experience that survives a closed session** keeps evaporating.

[TencentDB Agent Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) is Tencent's open-source answer: a team-level hub for that evaporation. Public since April 2026, it leaned hard into "Team Memory" with the early-August v2.0.0 release. As of this writing it sits around 17k GitHub stars and 1.5k+ forks, under MIT. The slogan is the product definition:

> Agents remember. Humans innovate.

The thesis of this post is simple. **Agent memory is not a chat-log warehouse; it is a set of governable memory assets.** The coordinate Tencent is pinning is not "longer context" but "who may use which version on which agent." If [#37 company brain](/en/blog/37-company-brain/) treated company knowledge as a maintenance problem, this project treats that knowledge as **equipment for an agent squad**.

---

## One-line definition

The README defines the system as converting conversations, documents, and code into **four reusable assets**, then sharing, reviewing, and equipping them inside a team.

| Asset | Becomes | Used for |
|---|---|---|
| **Chat Memory** | Preferences, facts, decisions, interaction history | So the next session does not start with re-introductions |
| **Skill** | Versioned SOP with triggers, steps, validation | So a workflow that worked once can be re-run by another agent |
| **Wiki** | Docs → structured pages + link graph | So agents stop re-reading the file tree from scratch |
| **CodeGraph** | Symbols, files, calls, impact paths | So changes start with "what else breaks if I touch this" |

Their comparison table is honest. Chat history and standard RAG mostly answer "can it be found?" This stack also tracks **ownership, version, status, team sharing, agent loadout, and ACL**. Memory is treated less as "stuff more into the prompt" and more as **infrastructure assets**.

The inspirations are cited openly. Wiki draws on [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The CodeGraph module **uses code from** [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph). Skill management builds on pieces of [Hermes Agent](https://github.com/nousresearch/hermes-agent). Pieces we looked at separately in [#15](/en/blog/15-hermes-vs-openclaw/) and [#17](/en/blog/17-maps-and-skills/) reappear under one team hub.

---

## Architecture: four modules, one pipeline

The repo layout mirrors product boundaries. TypeScript dominates (Node ≥ 22.16). The default runtime leans local — SQLite plus files.

```text
Coding agent (Claude Code / CodeBuddy / OpenClaw / Hermes / custom)
        │  OpenAI / Anthropic protocols unchanged
        ▼
   MemoryProxy :8096
        │  session init · context injection · write-back · auth
        ├──────────► Upstream LLM
        │
        └─ HTTP ──► MemoryCore Gateway :8420
                      ├ Memory L0/L1/L2/L3
                      ├ Skill / Meta (Team·Agent·Task·ACL)
                      └ Knowledge metadata
                            │
                            └─► MemoryKnowledge :8424  (Wiki / CodeGraph bodies)
                                      │
Panel UI :8125  ◄── human control plane for teams, assets, equipping
```

The split of responsibilities is clean.

- **MemoryCore** — data plane for memory, metadata, and asset management. It does not host or schedule agents. An agent is a caller and a managed entity.
- **MemoryKnowledge** — Wiki parsing, CodeGraph indexing, content retrieval. Core holds knowledge **metadata**; content work lives here.
- **MemoryPanel (Hub)** — create teams and agents; review, share, and equip assets; switch visibility.
- **MemoryProxy** — sits on the path a coding agent already uses to reach an LLM, and injects / writes back memory **without changing the protocol**.

The recommended install is that trio: under `deploy/global-images`, fill memory-group and proxy-upstream LLM settings in `.env`, run `./start-all.sh`, and take the printed admin `sk-mem-...` key plus the one-liner for Claude Code. Panel: `http://localhost:8125`.

This separation also reads cleanly through [#35 harness engineering](/en/blog/35-harness-engineering/). Keep the model; grow **context delivery, verification, memory, sandbox** as separate layers. Memory baked into the agent process has to be re-implanted every time you switch frameworks. Memory outside the process only needs re-equipping.

---

## Memory is not flat — distill L0 through L3

Chat Memory's layering is the technical core. Conversations are not dumped wholesale into a vector store; an async pipeline **changes granularity**.

| Layer | Stores | Primary use |
|---|---|---|
| **L0 Conversation** | Raw dialogue | Exact wording, timestamps, provenance |
| **L1 Atom** | Facts, preferences, constraints, events | Precise recall of actionable info |
| **L2 Scenario** | Blocks organized around projects/scenarios | Fast restore of a working context |
| **L3 Core / Persona** | Long-term profiles, stable patterns | Enter user/team context immediately |

Both generation and retrieval are layered. Normally L2/L3 bootstrap context; when specific facts are needed, BM25 + vectors + RRF fall back to L1/L0. Caps on item count, character budget, and timeout keep **memory from eating the window**. MemoryCore defaults also leave remote embeddings off and keep BM25, so the system is not "dead without an embedding provider."

That is the same axis as [#30 context engineering](/en/blog/30-context-engineering/): not "put more in," but **leave only the grain the next turn needs**. One L1 line — "mobile still depends on the old auth module" — means the next agent does not rediscover that constraint before a refactor.

The published benchmark is a single row: PersonaMem, testing whether an agent correctly understands and applies user information after long interaction — **48% → 76% (+59% relative)**. Treat the number as a direction signal. The eval suite is narrow; operational metrics like token savings are not in the main README. Read this stage as **problem definition ahead of product maturity**.

---

## Loadout: memory is not a global prompt

The second design sentence is almost verbatim from the README:

> Memory isn't a global prompt — it's the Agent's loadout.

All four asset types register uniformly. The Hub uses **fixed binding + ACL** to decide what a given agent may use: first narrow by Team / User / Agent / visibility, then retrieve for the current query.

Visibility defaults toward safety.

| Visibility | Meaning |
|---|---|
| `private` | Owner only — not even team admins |
| `team` | Team can read; Owner/Admin manage |
| `restricted` | User / Role / Agent ACL |
| `agent` | Targeted equipping of agents in the same team |

New Chat Memory and Skills start **private**. Sharing is an explicit act. The product default is meant to kill the fear that "turning on team memory" equals "everything leaks."

The play style sits on that model. Even a one-person company can split Scout / Builder / Reviewer and equip them differently: market Wiki and competitive-analysis Skill for Scout; product Wiki and CodeGraph for Builder; incident memory and a release checklist Skill for Reviewer. **Different roles mean different definitions of context noise.** Opening one RAG index to everyone is not the same memory problem as writing role loadouts.

That is an axis multi-agent talk often skips. If [#49](/en/blog/49-cross-agent-review/) argued for different failure modes inspecting each other, this project argues for **different memory equipment on different roles**. Spawning more agents does not make a team. A team needs asset-level boundaries for what is shared and what stays private.

---

## MemoryProxy is the real DX

The most practical module is the proxy. Point a coding agent (Claude Code, CodeBuddy, …) at Proxy (`:8096`) instead of the upstream LLM, and you get team memory, Skills, and Knowledge **without changing a line of agent code**. It forwards Anthropic `/v1/messages` and OpenAI `/v1/chat/completions` as-is.

Rough request pipeline:

1. Authenticate via `x-tdai-user-key` → resolve `user_id`  
2. First turn: pick team / agent / task (session binding)  
3. Inject that agent's loadout — Skills, Knowledge, Memory L2/L3 — into the system prompt  
4. Forward to the upstream LLM  
5. After the turn, async write-back of the conversation slice to Core (L0, Skill extraction trigger)  
6. Usage / observability reporting  

One detail is especially good. **L0/L1 are not dumped into the system prompt; they are exposed as read-only tools the model can call when needed.** The Proxy README says this explicitly: avoid invalidating the upstream **KV cache**. That is the same rule we tracked in [#48](/en/blog/48-cache-hit-rate/) — put volatile content up front and hit rate dies. The memory layer already knows that "stuff more memory in" fights "cacheable prompt structure."

SDKs ship too: TypeScript `@tencentdb-agent-memory/memory-sdk-ts-v2` and Python `tencentdb-agent-memory-sdk-python`. v3 isolation requires `teamId` / `agentId` / `userId`. Framework adapters include an OpenClaw plugin and a Hermes Memory Provider in-tree. "Decouple memory from agent frameworks" is not a slogan; it is three entry points — Proxy, SDK, plugins.

---

## Cold start: turn paid learning into a save file

The product's recurring metaphor is "load the save file." Most agents' first job is re-learning your project. The Hub imports three paid learning costs:

- **Codebases** → CodeGraph (symbols, calls, impact)  
- **Documents** → Wiki (pages + link graph)  
- **Past sessions** → Chat Memory + Skill extraction  

When [#17](/en/blog/17-maps-and-skills/) covered codegraph cutting discovery-phase token tax, people immediately asked for docs and specs on the same map. This repo productizes the next sentence. A code-graph tool alone and a hub that binds **code + docs + conversation experience + permissions** into one asset model are different categories.

The README is also candid about limits. Wiki/CodeGraph build asynchronously and need time to reach `ready`. CodeGraph prioritizes public HTTPS repos; private/SSH support is still being refined. Hub asset binding is still largely manual; **fully automatic memory routing is under iteration**. The save-file metaphor is strong; the loader that auto-picks the right slot still has a human hand on it.

---

## Where it sits on the map

Coordinates against lookalikes:

| Family | Examples | Problem | Distance from TencentDB Agent Memory |
|---|---|---|---|
| Personal / app long-term memory | Mem0, Zep/Graphiti, … | Hold and recall user/session facts | Overlap at L1–L3; here the center is **team assets, ACL, agent equipping** |
| Company knowledge search | Glean, Cerebras Knowledge ([#37](/en/blog/37-company-brain/)) | Search scattered internal knowledge for humans and agents | Here the center is **agent loadout + coding-agent Proxy**, not a search product |
| Code maps | codegraph ([#17](/en/blog/17-maps-and-skills/)) | Symbol graph and impact | Absorbed as a CodeGraph asset inside the Hub |
| Agent runtimes | OpenClaw, Hermes ([#15](/en/blog/15-hermes-vs-openclaw/)) | Loop, tools, gateway | Memory pulled *out* of the runtime and attached via adapters |

In one line: **a memory control plane for agent teams plus a transparent proxy.** Not "a better vector DB," not "a longer context window." As [#43 graph engineering](/en/blog/43-graph-engineering/) separated knowledge/memory graphs from orchestration graphs, here graphs (CodeGraph, Wiki links) are means; the product abstractions are **Asset + Loadout + ACL**.

---

## Rough edges that still matter

An analysis that only translates the README is useless. The limits:

**1) Thin benchmarks.** PersonaMem shows direction, not a production scorecard. Multi-agent collaboration, Skill reuse rates, CodeGraph impact accuracy, cache hit rate after proxy injection — none of that is a public suite. Star count is not readiness.

**2) Heavy issue traffic.** Open issues sit above 500 at writing time. Right after the v2.0 Team Memory turn, docs, migration, and integration questions dominate. A default branch that still looks like `feat/server_team` is another signal this is not a frozen product line.

**3) Automation and security boundaries are unfinished.** Automatic asset routing, private-repo CodeGraph, and hard Skill quality gates still read like roadmap language. The ACL model points the right way; operating Role/Agent ACL in a real org still needs thicker Hub UX and audit trails.

**4) "Local" is not free to run.** Extraction, Wiki, and Skill generation burn LLM tokens. You can split memory-group and proxy-upstream models. SQLite storage is cheap; **the distillation pipeline is not**. There is no guarantee that adding a memory layer always reduces tokens. Done well, it cuts rediscovery; done poorly, you only pay extraction.

**5) Framework coverage is selective.** Official mentions: OpenClaw, Hermes, Claude Code, CodeBuddy, SDK. Treat it as a hub **widening its surface**, not as an industry standard.

---

## Five sentences worth taking even if you never run it

**1) Define memory as an asset schema, not a log.** Without grains like raw (L0), atoms (L1), scenarios (L2), persona (L3), retrieval collapses to "similar conversation chunks."

**2) Default share off; equip on.** Team memory dies on the first leak. Private by default + explicit share + agent loadout is one package.

**3) Put the injection path outside agent code.** A protocol-level proxy drops framework-switch cost. Do not bury memory logic in the agent body.

**4) Separate always-on layers from dig-when-needed layers.** L2/L3 bootstrap; L0/L1 via tool calls. That is how you keep both cache-friendly prompts and precise recall.

**5) Register code, docs, and conversations in one asset registry.** Three side-by-side search engines and one metamodel for owner/version/visibility/agent binding are different operational problems.

---

## The coordinate that remains

Agent memory has no settled standard. Some stacks bury preferences in vectors, some stamp graphs with time, some write everything into a single `MEMORY.md`. TencentDB Agent Memory is interesting because it moves clearly toward the **team operating system** end of that spectrum.

- Unit of storage: not turns, but **assets**  
- Unit of consumption: not global RAG, but **agent loadouts**  
- Unit of integration: not only framework plugins, but a **transparent LLM proxy**  
- Unit of control: not only embedding scores, but **Owner / version / ACL**

In [#25](/en/blog/25-loop-engineering/) we wrote that a loop which leaves no experience only repeats the same failure faster. This repo's sentence is the next one: **make what the loop left behind the next agent's starting line.** The implementation still has beta edges, and the benches need to thicken. The problem definition, though, already points at where mid-2026 agent infrastructure actually sticks — session tax, experience broken across roles, memory trapped inside frameworks.

Agents already run fast enough. The bottleneck is less speed than **a structure that stops the next agent from re-learning what the team already paid for.** That structure, shown end-to-end in open source, is why this repo is worth reading.
