---
title: "The War Beyond Models — What Agent Engineers Actually Build"
summary: "Agent = LLM + API is already broken. Google, Anthropic, Cursor, OpenAI, Microsoft, ServiceNow, Salesforce — dissecting 7 companies' agent strategies through the lens of 'central objects' and mapping out what agent engineers really need to design."
date: "2026-05-23T14:00:00"
tags:
  - ai-agent
  - agent-engineering
  - llm
  - multi-agent
  - agentic-coding
  - ai-coding
---

"Hook up an LLM API, write a good prompt, and you've got an agent."

That formula worked six months ago. Not anymore.

In December 2025, the [Agentic AI Foundation (AAIF) launched under the Linux Foundation](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/). Founding members: AWS, Anthropic, Google, Microsoft, OpenAI, Block, Cloudflare, Bloomberg — companies that compete fiercely, sitting at the same table. Anthropic donated MCP, OpenAI contributed AGENTS.md, Block gave goose. **The entire industry agreed that agent systems need shared infrastructure.**

This signals that agents have moved beyond "prompt + API call" territory. Agent engineering is becoming its own discipline.

---

## One Big Direction: From Conversation to Execution

If you boil the current agent wave down to a single statement, it's this:

**LLM applications are shifting from "conversational answer tools" to "stateful execution systems."**

Agent engineers can no longer focus on prompts and models alone. An agent is now a software system comprising these components:

| Component | Role |
|-----------|------|
| Model | Reasoning, planning, generation |
| Tools | APIs, DB, browser, code execution, SaaS connectors |
| Context | Files, conversations, user state, organizational data |
| Memory | Short/long-term memory, preferences, task history |
| State | In-progress tasks, failure/retry state |
| Policy | Permissions, prohibited actions, approval conditions |
| Evaluation | Result verification, quality measurement |
| Observability | Logs, traces, cost, latency |
| Human-in-the-loop | Approval, correction, abort, rollback |

Notice: LLM is just one of nine components. An agent engineer isn't "someone who calls LLMs well" — they're closer to **someone who safely embeds an uncertain reasoning engine inside an execution system.**

Matt Webb's concept of ["context plumbing"](https://simonwillison.net/2025/Nov/29/context-plumbing/) captures this well — the engineering infrastructure to move context from diverse sources to where agents need it. The job of making an agent work well isn't about using smarter models. It's about **designing better information flow infrastructure.**

---

## 7 Companies, 7 Central Objects

The essence of each company's agent strategy comes down to one question:

**What object does the agent revolve around?**

This single lens cleanly separates seven different approaches.

### Google: Context Broker Across the User Surface

Central object: **user, calendar, documents, search results.**

Gmail, Calendar, Docs, Sheets, Android — Google's user surface area is overwhelming. [ADK 2.0](https://developers.googleblog.com/en/agent-development-kit-adk/) introduced a graph-based workflow runtime combining deterministic flows with adaptive AI reasoning, and the [A2A Protocol v1.0.0](https://github.com/google/A2A) became an agent communication standard with 50+ partners.

The key engineering challenge is **multi-app context integration and permission boundary design.** Stitching together email, documents, calendar, and search results into a single task context — while limiting what data can be read and written across apps.

Google shows us that agents are evolving into **context brokers spanning the entire user surface.**

### Anthropic / Claude: Verifiable Professional Workflows

Central object: **specialized work documents, analysis tasks.**

Claude's direction isn't a general-purpose assistant — it's **vertical agents for high-trust work.** They [donated MCP to AAIF](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/) to standardize tool integration and published the Agent Skills Standard for declaring agent capabilities. Claude Code reached [$2.5B annualized revenue](https://simonwillison.net/2026/Feb/21/anthropic-revenue/), becoming the reference implementation for coding agents.

The key challenge is **domain-specific task decomposition and verifiable execution.** Breaking complex work into review, extraction, judgment, and writing steps — connecting every judgment to source documents — ensuring humans can review intermediate results.

The lesson: not "delegate everything to the agent," but **separate what LLMs do well from what deterministic logic should handle.**

### Cursor: The Coding Agent Where Diff Is the Output

Central object: **codebase, diff, branch, PR.**

Named [Leader in Gartner's 2026 Magic Quadrant for Enterprise AI Coding Agents](https://cursor.com/blog). Cursor 3 unified the workspace, Composer 2.5 significantly improved long-horizon agentic task performance, and Cloud Agents handle extended autonomous development work.

The key challenge is **task isolation, code change verification, and parallel agent execution.** Finding the right files and dependencies, executing in sandboxed environments, isolating multiple tasks to prevent conflicts.

The crucial insight: agent output isn't "text answers" — it's **diffs.** Agent quality is measured by **change accuracy, test passage, and reviewability** — not conversation quality. The [supervision paradox from blog #11](/en/blog/cognitive-debt-and-agentic-coding/) is sharpest here.

### OpenAI / Codex: General-purpose Agent Runtime

Central object: **tool, runtime, agent step.**

The [Agents SDK](https://github.com/openai/openai-agents-python) evolved into a lightweight framework supporting 100+ LLMs, offering Sandbox Agents (containerized long-running tasks), Sessions (automatic history management), and Tracing (built-in observability). Codex expanded to a macOS app with 1M+ monthly developers.

The key challenge is **designing an agent framework where model, tools, state, and evaluation are decoupled.** Tool interfaces persist even when models change, different models are selected per task, and quality loops automatically evaluate results.

The takeaway from OpenAI's approach: **agent substrate** — treating the model as a swappable component and designing the layers above it.

### Microsoft: Control Plane for Agent Management

Central object: **agent identity, policy, tenant.**

[Microsoft Foundry Agent Service](https://learn.microsoft.com) offers three agent types: Prompt Agents (no-code), Workflow Agents (visual/YAML orchestration), and Hosted Agents (container-based custom code). [Microsoft Entra Agent ID](https://learn.microsoft.com) applies Zero Trust security to agents with RBAC, content filters, and VNet isolation.

The key challenge is **agent registry, identity, permission, and audit.** When many agents exist, the question isn't just "do they work?" but **"who controls them?"** Agents need accounts, permissions, logs, and accountability.

Microsoft's core message: **an agent is software and an "actor" simultaneously.** Agent engineering will tightly couple with DevOps, SecOps, and IAM going forward.

### ServiceNow: Stateful Process Orchestrator

Central object: **ticket, workflow, incident, approval.**

These agents operate around business objects, not chat windows. State transitions (received → analyzing → processing → approved → completed), role handoffs between humans, systems, and agents, SLA awareness, and event-driven execution are the core.

ServiceNow-style agents are closer to **process agents** than task agents. The focus isn't "one intelligent response" but **maintaining state over long periods and driving processes to completion.**

### Salesforce: Customer Agent on Domain Objects

Central object: **customer, account, case, opportunity.**

Reasoning is grounded on CRM objects like Account, Lead, and Case, performing business actions like follow-ups, quotes, and case updates.

The lesson: agent memory shouldn't be simple conversation history — it should be **business objects and relationship graphs.** The [AI-Ready Data conditions from blog #13](/en/blog/ai-ready-data/) apply directly here — agents need structured domain objects to function well.

### Developer Insight

> **The central object is the starting point for all design.** Seven companies each placed different objects at the center, and from that, context, actions, state, permissions, and evaluation all follow. When designing a new agent system, the first question isn't "which model should we use?" — it's **"what is our agent's central object?"**

---

## The "Central Object" Determines Everything

Here's the seven-company summary in one table:

| Company | Central Object | Engineering Edge |
|---------|---------------|-----------------|
| Google | User, calendar, docs, search results | Multi-app context and personalization |
| Anthropic/Claude | Specialized work docs, analysis tasks | High-trust vertical workflow |
| Cursor | Codebase, diff, branch, PR | Code change execution and verification loop |
| OpenAI | Tool, runtime, agent step | General-purpose agent runtime and tool abstraction |
| Microsoft | Agent identity, policy, tenant | Agent governance and control plane |
| ServiceNow | Ticket, workflow, incident | Stateful business process orchestration |
| Salesforce | Customer, account, case | Domain object-grounded CRM agent |

Once the central object is defined, everything else follows:

| Design Question | Answers Depend on Central Object |
|----------------|--------------------------------|
| Where does context come from? | Repo, CRM, docs, email, tickets |
| What are the actions? | Create PR, send email, update case, call API |
| How does state change? | pending → running → blocked → approved → done |
| Where do permissions attach? | User, agent, tool, object |
| How is evaluation done? | Tests, grounding accuracy, SLA, revenue, CSAT |
| Where is human review needed? | Before sending, before deploying, before customer impact |

---

## 6 Essential Design Patterns

As [Anthropic's "Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents) emphasizes, successful agent implementations come from **simple, composable patterns** — not complex frameworks. Here are the six patterns every agent engineer needs.

### Pattern 1. Plan → Act → Observe → Verify

The most fundamental agent loop:

```
Goal → Plan → Tool Call → Observation → Verification → Next Step or Done
```

The key: **Verify must always follow Act.** Don't trust tool call results blindly. As [Armin Ronacher pointed out](https://simonwillison.net/2025/Nov/23/agent-design-is-still-hard/), testing and evaluation are the hardest problems in agent design — requiring integrated observability, not isolated unit tests.

### Pattern 2. Human-gated Action

High-risk actions must pass through human approval. This isn't theoretical — in December 2025, [an autonomous agent sent spam to Rob Pike](https://simonwillison.net/2025/Dec/). In May 2026, [an agent ordered 120 eggs for a cafe with no kitchen](https://simonwillison.net/2026/May/).

```
Draft Action → Explain reason → Show evidence → Ask approval → Execute → Log result
```

Actions requiring approval: email sends (external communication), payments (financial impact), DB updates (data mutation), code merge/deploy (service impact), permission changes (security impact).

### Pattern 3. Tool Permission Matrix

Separate what the model **can do** from what the agent **is allowed to do.**

| Agent Type | Read | Write | External Risk |
|-----------|------|-------|--------------|
| Research Agent | Docs, web | None | Low |
| Coding Agent | Repo read | Branch write | Medium |
| Support Agent | Customer/policy read | Ticket draft | High |
| Admin Agent | Config read | Permission changes | Very high |

### Pattern 4. Agent State Machine

Agent work must be managed as a state machine — enabling retry, abort, resume, and audit.

```
CREATED → PLANNING → WAITING_FOR_TOOL → RUNNING → WAITING_FOR_APPROVAL → COMPLETED

On failure: RUNNING → FAILED → RETRYING → ESCALATED
```

Without state, nobody knows "how far it got and why it stopped." [LangChain's ADLC (Agent Development Lifecycle)](https://langchain.com/blog) framework also puts state tracking at the core of its Build→Test→Deploy→Monitor structure.

### Pattern 5. Evidence-first Response

For high-trust agents, the "generate answer first, attach evidence later" approach is dangerous.

```
Retrieve evidence → Rank evidence → Extract facts → Generate answer → Check answer against evidence
```

Without this structure, hallucination is uncontrollable. As covered in [blog #13](/en/blog/ai-ready-data/), evidence quality ultimately depends on how AI-Ready your data is.

### Pattern 6. Evaluator as First-class Component

Agents **must** have evaluators:

| Evaluator | What It Measures |
|-----------|-----------------|
| Grounding evaluator | Evidence-answer alignment |
| Tool result evaluator | Tool call result interpretation accuracy |
| Safety evaluator | Prohibited actions, sensitive data exposure |
| Task completion evaluator | Goal achievement |
| Cost evaluator | Tokens, API calls, execution time |
| Regression evaluator | Whether new versions break existing performance |

Going forward, agent system quality will be determined by **evaluation harnesses**, not prompts.

### Developer Insight

> **Understanding *why* a pattern is needed matters more than memorizing it.** The common thread across all six patterns: LLMs are uncertain engines, so you need structures that **isolate, verify, and control** that uncertainty. For deeper pattern analysis, see the [Agentic AI Patterns Guide](/en/guides/agentic-patterns/).

---

## The Agent Engineer's Tech Stack

Building an agent system requires seven layers:

```
┌─────────────────────────────────────────────┐
│  Application Layer                          │
│  Chat UI · IDE UI · Workflow UI · Admin     │
├─────────────────────────────────────────────┤
│  Agent Layer                                │
│  Planner · Router · Executor · Verifier     │
│  Memory Manager                             │
├─────────────────────────────────────────────┤
│  Tool Layer                                 │
│  APIs · DB · Browser · Code Runner          │
│  File System · SaaS Connectors · MCP        │
├─────────────────────────────────────────────┤
│  Context Layer                              │
│  RAG · Search · Vector DB · Metadata Store  │
│  Knowledge Graph                            │
├─────────────────────────────────────────────┤
│  Control Layer                              │
│  Policy · Permission · Approval             │
│  Audit Log · Rate Limit                     │
├─────────────────────────────────────────────┤
│  Evaluation Layer                           │
│  Test Sets · Simulations · LLM Judge        │
│  Rule-based Checks · Replay                 │
├─────────────────────────────────────────────┤
│  Observability Layer                        │
│  Trace · Token Cost · Latency               │
│  Tool Error · User Feedback                 │
└─────────────────────────────────────────────┘
```

You need to see this entire picture to call yourself an "agent engineer." Most people stop at the Agent and Tool layers, but production agents **cannot operate without Control, Evaluation, and Observability.**

---

## The Coming Axes of Differentiation

Competition among agent companies won't be decided by model performance alone. The real differentiation happens on these axes:

| Axis | Core Question |
|------|--------------|
| Context depth | How deep and accurate is the context retrieved? |
| Tool reach | How many systems can be safely operated? |
| Statefulness | How reliably can long-running tasks execute? |
| Trust | Are there evidence, verification, approval, and logs? |
| UX | Does the user feel in control? |
| Governance | Can the organization manage its agents? |
| Evaluation | Can quality be continuously measured? |
| Distribution | Is the agent already embedded where users are? |

A "good agent" isn't just a smart model:

**Good agent = Good model x Good context x Safe tool execution x Verifiable state management x User-trusted UX**

---

## Learning Priorities — Where Most People Stop

For growing as an agent engineer, this order is effective:

1. Tool calling / function calling structure
2. RAG and context engineering
3. **Agent state machine** ★
4. Workflow orchestration
5. Sandboxed execution
6. Human approval UX
7. **Permission / policy / audit** ★
8. **Evaluation harness** ★
9. Observability / tracing
10. Multi-agent coordination

**Items 3, 7, and 8 are critical.** Most people stop at 1 and 2. But production-grade agents cannot operate without state management, permission management, and evaluation systems.

Connecting this to the [developer competencies for the AX era from blog #12](/en/blog/dx-for-ax/): tool calling and RAG are "fundamentals" — state machines and evaluation are "differentiators." An agent engineer's real value comes from **the ability to design execution systems, not call models well.**

For foundations, see the [AI Agent Guide](/en/guides/agent/). For pattern deep-dives, see the [Agentic AI Patterns Guide](/en/guides/agentic-patterns/).

---

## Conclusion: It's Execution System Engineering, Not LLM App Development

The direction of agent engineering is clear:

**LLM app development → Execution system engineering that includes LLMs**

Future competitiveness will come from **how well you design state, tools, permissions, verification, and observability** — not from how well you call models. The AAIF launch, A2A and MCP standardization, every company's investment in agent governance — it all points the same way.

One question for agent engineers:

**Are you still picking models, or are you designing systems?**

---

## References

- [Agentic AI Foundation (AAIF) Launch](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/) — Under Linux Foundation, 8 founding members
- [Google A2A Protocol v1.0.0](https://github.com/google/A2A) — 50+ partners, agent communication standard
- [Google Agent Development Kit (ADK) 2.0](https://developers.googleblog.com/en/agent-development-kit-adk/) — Graph-based workflow runtime
- [Anthropic, "Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents) — Simple, composable patterns
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — Lightweight multi-LLM framework
- [Microsoft Foundry Agent Service](https://learn.microsoft.com) — 3 agent types, Entra Agent ID
- [Matt Webb, "Context Plumbing"](https://simonwillison.net/2025/Nov/29/context-plumbing/) — Agent essence is information flow infrastructure
- [Armin Ronacher, "Agent Design is Still Hard"](https://simonwillison.net/2025/Nov/23/agent-design-is-still-hard/) — Testing/evaluation is the hardest problem
- [LangChain, Agent Development Lifecycle (ADLC)](https://langchain.com/blog) — Build→Test→Deploy→Monitor
- [Cursor 3 / Composer 2.5](https://cursor.com/blog) — 2026 Gartner Leader

---

## Checklist: Agent Engineering Maturity Self-Assessment

- [ ] Is your agent's "central object" defined?
- [ ] Is the agent's output a verifiable artifact (diff, ticket, report) rather than a text answer?
- [ ] Is a Plan → Act → Observe → **Verify** loop implemented?
- [ ] Do high-risk actions have human-in-the-loop approval?
- [ ] Is there a Tool Permission Matrix separating agent capabilities?
- [ ] Is agent work managed as a state machine? (retry, abort, resume possible)
- [ ] Is there an evaluation harness? (grounding, safety, regression)
- [ ] Can you observe agent traces, costs, and latency?
- [ ] Does the system work if you swap the model? (model-agnostic design)
- [ ] When an agent fails, can you explain *why* it failed?
