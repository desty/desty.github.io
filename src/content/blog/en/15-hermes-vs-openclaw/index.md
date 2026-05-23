---
title: "Hermes Agent vs OpenClaw — Same Dream, Different Design"
summary: "Both offer persistent memory, tool integration, and self-hosting. Two open-source AI agents that look similar on the surface — until you open the source code and find completely different architectural philosophies. A code-level dissection from someone who switched from OpenClaw to Hermes."
date: "2026-05-23T18:00:00"
tags:
  - ai-agent
  - open-source
  - self-hosted
  - agent-engineering
  - hermes-agent
  - openclaw
---

"Just pick an open-source AI agent and self-host it."

That's what I thought. Installed OpenClaw, spun it up with Docker, connected a Telegram channel. It worked. For a while.

But as I kept using it, my question changed. From "how do I connect this?" to **"how do I make it smarter?"** OpenClaw was optimized for running a stable gateway. What I wanted was an agent that grows on its own. So I switched to [Hermes Agent](https://github.com/NousResearch/hermes-agent).

I cloned both projects and read the source code. This isn't a README comparison — it's about **the design philosophy differences that emerge from actual code.** The short version: both dream the same dream of "persistent memory + tool integration + self-hosting," but **the way they realize that dream is fundamentally different.**

---

## The Core Split: Agent-first vs Gateway-first

Compress the difference between these two projects into one line:

| | Hermes Agent | OpenClaw |
|---|---|---|
| **One-liner** | The self-improving agent | The always-on gateway assistant |
| **Core design** | Agent-first | Gateway-first |
| **Key question** | "How does the agent get better?" | "How does the agent stay connected?" |

This might seem like a small distinction. But open the code, and **this single choice determines memory structure, tool registration, execution model, and extension direction — all of it.**

---

## Architecture: Who Owns What

### Hermes — The Agent Is the Owner

Hermes's entry point is `run_agent.py` — a 4,300-line `AIAgent` class. The conversation loop (`conversation_loop.py`, 3,900 lines) is the heart, where model calls, tool execution, memory updates, and context compression all happen.

```
AIAgent (run_agent.py)
  └── conversation_loop.py  ← the heart
        ├── Tool Registry (95 modules, AST auto-discovery)
        ├── Memory Manager (frozen snapshot)
        ├── Skill System (autonomous creation + Curator)
        ├── MCP Client (stdio/HTTP/SSE)
        └── Subagent Delegate (parallel execution)
```

The gateway (Telegram, Discord, etc.) lives in `gateway/` but its job is simply **delivering messages to the agent.** The agent is the owner; channels are I/O surfaces.

### OpenClaw — The Gateway Is the Owner

OpenClaw's core is a single **Gateway process** on port 18789 that serves as the reference point for sessions, routing, channel connections, and tool execution.

```
Gateway Process (port 18789)
  └── WebSocket Protocol (typed, version-negotiated)
        ├── Channel Plugins (40+ messaging platforms)
        ├── Session Manager (per-session serialization + file locks)
        ├── Agent Runtime (pi-agent-core)
        ├── Plugin SDK (498 files, manifest-based)
        └── Context Engine (assembly + compaction, plugin-swappable)
```

Agent execution happens when the Gateway routes a received message to `agentCommand`. The gateway is the owner; the agent is the execution engine.

This isn't just a structural difference. **Where the center sits determines the direction of extension.** Hermes evolves toward making the agent smarter (skills, Curator, MoA). OpenClaw evolves toward making connectivity and operations more reliable (channel plugins, session management, sandbox policies). Even when adding the same feature, the center of gravity differs.

---

## Memory: Performance vs Transparency

The memory system is where the two projects' design philosophies diverge most clearly. It's also the decisive reason I switched from OpenClaw to Hermes.

### Hermes — Frozen Snapshot

```
~/.hermes/memories/
  ├── MEMORY.md  (2,200 char limit — agent's observations)
  └── USER.md    (1,375 char limit — user profile)
```

- Takes a **snapshot at session start** and injects it into the system prompt.
- When the `memory` tool writes mid-session, it persists to disk immediately but **doesn't update the in-flight prompt.**
- Why? **To preserve the LLM prefix cache.** Changing the system prompt invalidates the cache, increasing cost and latency. This isn't a minor optimization — for long-running agents, the cost difference is significant.
- File locking prevents concurrent session corruption; `.bak` snapshots detect external drift.
- Security scanning blocks prompt injection, credential exfiltration, and invisible Unicode.

Historical conversation search uses `session_search` with SQLite FTS5 indexes. Additionally, 8 external memory plugins (Honcho, Mem0, RetainDB, etc.) add semantic search or knowledge graphs.

### OpenClaw — Plain Markdown

```
~/.openclaw/workspace/
  ├── MEMORY.md             (long-term memory — loaded every session)
  ├── SOUL.md               (personality)
  ├── AGENTS.md             (agent configuration)
  ├── DREAMS.md             (optional — dream diary)
  └── memory/
      ├── 2026-05-22.md     (yesterday's log)
      └── 2026-05-23.md     (today's log — auto-loaded)
```

OpenClaw's principle is simple: **"Memory is just Markdown."** No hidden state. Open the file and you see exactly what the agent remembers. Only today and yesterday's daily logs auto-load; the rest is indexed for search.

Hybrid search (SQLite + `sqlite-vec` vector similarity + FTS5 keyword) is built-in, and an optional **dreaming** pass auto-promotes high-signal items from short-term notes to MEMORY.md.

### What's Different

| Aspect | Hermes | OpenClaw |
|--------|--------|----------|
| Storage format | Markdown (§ delimiters) | Markdown (separate files) |
| Load strategy | Frozen snapshot at session start | Direct load (MEMORY + today/yesterday) |
| Capacity limits | Explicit (2,200 / 1,375 chars) | Implicit (within token budget) |
| Cache optimization | Prefix cache preservation is core | Context engine manages token budget |
| Historical search | SQLite FTS5 + 8 plugins | Hybrid (vector + BM25) built-in |
| Auto-maintenance | Curator manages skills (memory is manual) | Dreaming pass auto-promotes |

In short: Hermes says **"performance first — don't break the cache."** OpenClaw says **"transparency first — humans should be able to read it."** Neither is wrong. If long-running costs matter, Hermes's frozen snapshot is practical. If you want to directly inspect what your agent remembers, OpenClaw's plain markdown is convenient.

---

## Tool System: One File vs Package Structure

### Hermes — 95 Modules, AST Auto-Discovery

Hermes tool registration is elegantly simple. `discover_builtin_tools()` in `tools/registry.py` **scans `tools/*.py` files via AST** to automatically find `registry.register()` calls. Want to add a tool? Create one Python file, call register. Done.

95+ built-in tool modules span files, terminal, web, browser, vision, code execution, music, images, and home automation. Toolset grouping enables/disables entire categories, with per-tool result size limits.

### OpenClaw — Manifest-Based Plugins

OpenClaw implements tools as **plugin extensions.** `src/plugin-sdk/` (498 files) defines the public contract, and each tool declares capabilities via manifest metadata.

The slot system (one active implementation per slot, swappable via config), tool lifecycle events (`start → update → end`), and `before_tool_call` / `after_tool_call` hooks provide fine-grained control. `boundary.ts` manages tool availability and permission boundaries.

### What's Different

| Aspect | Hermes | OpenClaw |
|--------|--------|----------|
| Registration | AST auto-discovery | Manifest declaration + SDK |
| Language | Python | TypeScript |
| Tool count | 95+ built-in | Core tools + extension plugins |
| Extensibility | Add one file | Plugin package structure |
| Policy management | Toolset grouping | Slot + Boundary system |

Hermes is optimized for **"add tools fast and iterate."** OpenClaw is optimized for **"control tool permissions and lifecycle."** Hermes is faster for prototyping; OpenClaw's Slot + Boundary system is more robust for production policy management.

---

## Skill System: Why Hermes Calls Itself "The Growing Agent"

This is the decisive difference. OpenClaw has **nothing equivalent.**

```
~/.hermes/skills/
  ├── coding/
  │   └── debug-python/
  │       └── SKILL.md   ← YAML frontmatter + markdown body
  ├── research/
  └── ...
```

After completing a complex task, Hermes's agent **autonomously generates a skill document.** Including trigger conditions, step-by-step instructions, pitfalls, and verification methods. 91 built-in skills plus 520+ community skills via [agentskills.io](https://agentskills.io).

Then there's the **Curator** — a background agent triggered during inactivity that grades, consolidates, and archives skills. It manages 7-day lifecycle transitions based on usage frequency, never auto-deletes (archives only, recoverable), and runs on an auxiliary model to preserve the main session cache.

This is the biggest difference you feel when actually using Hermes. **Work experience crystallizes into reusable procedural knowledge.** The more you repeat similar tasks, the faster the agent genuinely becomes. "AI that learns" isn't marketing — skill documents give it concrete form.

---

## Multi-Agent: Orchestrator vs Solo Player

### Hermes — Parallel Delegation + Mixture of Agents

Two patterns:

1. **Delegate**: Spawns isolated subagents for parallel workstreams. RPC-based tool access, inherits credentials/toolsets from parent.

2. **Mixture of Agents (MoA)**: Multiple reference models (claude-opus-4.6, gemini-2.5-pro, gpt-5.4-pro, deepseek-v3.2) generate answers in parallel; an aggregator model (claude-opus-4.6) synthesizes.

Strong fit for directed graph workflows where an orchestrator calls specialist agents.

### OpenClaw — Serialized Execution, One at a Time

OpenClaw agent execution is **per-session serialized.** Only one agent runs per session at a time. `sessions_spawn` can create new sessions, but the fundamental pattern is a **plan-execute-reflect single agent loop.** Session write locks prevent contention.

| Aspect | Hermes | OpenClaw |
|--------|--------|----------|
| Parallel execution | MoA + Delegate subagents | Per-session serial (session spawn possible) |
| Cross-model synthesis | MoA synthesizes multiple model outputs | Single model |
| Best fit | Orchestrator → specialist agents | Single agent decomposes and executes |

If you want to distribute complex automation across specialist agents, Hermes. If one agent methodically pushing through is the right fit, OpenClaw.

---

## Channels & Gateway

Both support messaging platform integration. But the approach differs.

| Aspect | Hermes | OpenClaw |
|--------|--------|----------|
| Platform count | 35+ | 40+ |
| Architecture | Per-platform adapters | WebSocket protocol + channel plugins |
| Protocol | Direct platform connections | Typed WebSocket (version negotiation, nonce auth) |
| Role separation | None (agent-centric) | Operator vs node (scope-based permissions) |
| DM security | Per-platform | Pairing code-based (default) |

As you'd expect from a project where channel connectivity is the core value, OpenClaw's WebSocket protocol is notably sophisticated. A structured flow of `connect` → handshake → nonce signature → `hello-ok` + feature list, with scopes (`read`, `write`, `admin`, `approvals`) for fine-grained access control. OpenClaw is clearly ahead here.

---

## MCP: Client vs Bidirectional

Hermes is a **powerful MCP client.** Three transport modes (stdio, HTTP/StreamableHTTP, SSE), dedicated async event loop, per-server parallel tool calls, sampling support, auto-reconnection.

OpenClaw goes one step further. **It can act as an MCP server itself.** Run `openclaw mcp serve` and channel conversations are exposed over stdio MCP. Other agents (e.g., Claude Code) can read and write OpenClaw conversations through MCP.

This is OpenClaw's unique position. It's an agent that can simultaneously be **a tool for other agents.**

---

## Deployment & Operations

| Aspect | Hermes | OpenClaw |
|--------|--------|----------|
| Language | Python 3.11+ | TypeScript (Node 24) |
| Installation | `curl` one-liner (Windows: bundled installer) | `npm install -g openclaw` + `openclaw onboard` |
| Docker | Supported | Recommended (multi-stage build, Tini init) |
| Execution backends | 7 (local, Docker, SSH, Singularity, Modal, Daytona, Vercel) | 3 (Docker, SSH, OpenShell) |
| Security | Memory injection scanning, MCP package malware scanning | cap_drop, no-new-privileges, sandbox policies |
| Observability | Built-in tracing | OpenTelemetry + Prometheus built-in |
| Migration | `hermes claw migrate` (OpenClaw → Hermes) | — |

Notable: Hermes provides `hermes claw migrate` for migrating from OpenClaw. It transfers SOUL.md, MEMORY.md, skills, API keys, and platform configurations. I actually used this tool when I switched. Smoother than expected.

---

## Comprehensive Comparison

| Category | Hermes Agent | OpenClaw |
|----------|-------------|----------|
| Created by | Nous Research | OpenClaw community |
| License | MIT | MIT |
| Language | Python 3.11+ | TypeScript (Node 24) |
| Core design | Agent-first (self-improvement loop) | Gateway-first (channel operations) |
| Memory | Frozen snapshot + 8 plugins | Plain markdown + hybrid search |
| Skill system | Autonomous creation + Curator | None |
| Tool registration | AST auto-discovery (95+ modules) | Manifest-based plugin SDK |
| Multi-agent | MoA + Delegate subagents | Per-session serialized execution |
| Channels | 35+ platform adapters | 40+ channel plugins |
| Protocol | Direct platform connections | Typed WebSocket + scopes |
| MCP | Client (3 transports) | Server + Client |
| Execution backends | 7 | 3 (Docker/SSH/OpenShell) |
| Observability | Built-in tracing | OpenTelemetry + Prometheus |
| Migration | OpenClaw→Hermes supported | — |

---

## Conclusion: What Do You Expect From Your Agent?

Mapping the [9 agent components from blog #14](/en/blog/agent-engineering/) onto these two projects reveals a pattern.

Hermes **digs deep into the Agent Layer** — skill accumulation, MoA, subagent delegation, prefix cache optimization. The direction: an agent that gets smarter every day.

OpenClaw **spreads wide across the Control and Distribution Layers** — session isolation, sandbox policies, WebSocket protocol, 40 channel plugins, MCP server mode. The direction: an agent that operates reliably everywhere.

I started with OpenClaw and switched to Hermes. I'm satisfied. But not because Hermes is "better" — because **what I expected from an agent shifted from "a reliable assistant" to "a growing collaborator."**

Before choosing an agent, there's one question you need to ask yourself first:

**Do you expect stability from your agent, or growth?**

---

## References

- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent) — Nous Research, MIT license
- [Hermes Agent Documentation](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Agent 5-Pillar Architecture](https://www.mindstudio.ai/blog/hermes-agent-5-pillar-architecture-memory-skills-soul-crons)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw) — MIT license
- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Memory Concepts](https://docs.openclaw.ai/concepts/memory)
- [Awesome Hermes Agent](https://github.com/0xNyk/awesome-hermes-agent) — Community resources
