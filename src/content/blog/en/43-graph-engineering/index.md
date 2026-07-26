---
title: "The Loop Isn't Dead, It Got Demoted — Graph Engineering and the Two Things It Actually Names"
summary: "In July, 'graph engineering' started making the rounds in the agent world — the fourth label after prompt, context, and loop engineering. As with every new coinage, half of it is marketing. But this one has a twist: the same name is being used for two different things — orchestration graphs that shape the work, and knowledge/memory graphs that hold what the system knows. Both are worth digging into. The former is converging on a principle — models judge, code routes — and the latter's indexing cost dropped a thousandfold in eighteen months, changing the adoption math. This post covers the term's lineage, sorts out the two branches, and gives the criteria for deciding whether your system actually needs a graph."
date: "2026-07-31T10:00:00"
tags:
  - graph-engineering
  - agent-engineering
  - ai-agent
  - knowledge-graph
  - agent-memory
draft: false
---

When I covered loop engineering in [#25](/blog/25-loop-engineering/), I summed it up like this: "At first it sounds like another agent-marketing coinage. Half of it is. But crack it open and the other half is genuinely new." A month later, the next name has arrived. **Graph engineering.** It's the fourth label after prompt engineering, context engineering, and loop engineering, and it had its viral moment on X in mid-July.

Let's start with the same question. Strip away the name — what's left? The answer, up front: something is left, and it isn't one thing but **two.** The same name is being used for two different substances, and if you don't separate them, half the writing around this term reads as noise.

---

## The lineage — from loop to graph

Two weeks before the term went viral, [Josh Simmons wrote the essay](https://www.drjoshcsimmons.com/writing/we-are-entering-the-graph-engineering-phase) that started it. The argument goes like this. The default shape of agent development so far has been "a model in a loop" — one while loop, some tools, run until done. But the loop has a structural limit: **it's a scheduler that executes exactly one thing at a time, so it serializes even work that is inherently parallel.** If reviewing five files doesn't require them to read each other, that's five independent tasks — and the loop puts them in a single-file line anyway.

His proposal is to move to explicit directed graphs. Nodes are units of work (model calls, functions, retrieval — and **humans are nodes too**); edges are dependencies where one node's output flows into another's input. One sentence worth quoting: **"The loop is not dead. It got demoted. Inside a node, a model still runs the same loop it always ran. Graph engineering is the craft of what happens between them."**

Three weeks later [LangChain answered with "3 Years of Graph Engineering"](https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph) — we've been doing this with LangGraph for three years. Easy to dismiss as claiming the buzzword, except the three years of lessons are substantive. First, **production agent graphs are not DAGs — they're cyclic.** Retries, human input, and correction loops make cycles mandatory. Second, "a loop is just a directed, cyclic graph" — loops and graphs aren't rivals; a loop is a special case of a graph. A different road to exactly the same spot as Simmons's "demoted."

One entertaining fact. Anthropic's official materials — the orchestrator-workers pattern in [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents), the [multi-agent research system retrospective](https://www.anthropic.com/engineering/built-multi-agent-research-system), the Claude Code workflows docs — implement all of it: fan-out, dependencies, parallel execution, verification nodes. And **the word "graph" appears zero times.** The name came from the community, not the builders. Same pattern as harness engineering ([#35](/blog/35-harness-engineering/)): the practice spreads first, the name arrives later.

---

## Same name, two branches

Everything above is about graphs of **control flow.** But search the term and half the results are talking about something else entirely: knowledge graphs — graphs of **data**, storing entities as nodes and relationships as edges for agents to traverse. [TrueFoundry's enterprise guide](https://www.truefoundry.com/blog/graph-engineering-enterprise-guide) draws the line most cleanly: **"Knowledge graphs structure what a system knows; graph engineering structures who the system is."**

| | Orchestration graph | Knowledge/memory graph |
|---|---|---|
| Nodes | Work (agents, functions, humans) | Entities (people, orgs, events) |
| Edges | Execution dependencies — output flows to input | Typed relations — `depends_on`, `caused`, `supersedes` |
| Question answered | Who runs first, what's parallel, who verifies | How this fact connects to that one |
| Representative tools | LangGraph, Claude Code workflows, Temporal | Neo4j, Graphiti/Zep, pgvector+AGE |

The two branches differ in tooling and in skill set. Let's take them one at a time.

---

## Branch 1 — the graph that shapes the work

On the orchestration side, the serious writing converges on one principle: **models judge, code routes.** Classifying a ticket is the model's job; deciding which path the classification triggers should be an if-statement in code. Hand flow control to the model and you get emergent incidents like "the agent decided to skip the verification step." Put it in code and the same input takes the same path every time.

What a graph actually buys you is **breadth.** Anthropic's multi-agent retrospective published the numbers: a parallel-subagent architecture outperformed a single agent by 90.2% — while spending 15x the tokens. Breadth is bought with money, and if that money hurts, the first question is whether the work splits at all. If every stage needs to read the previous stage's entire output, spreading it across a graph gets you the same answer, later and more expensively. So the first skill of this branch isn't adopting a tool — it's **deleting fake edges.** Take any pipeline written as "A, then B" and check whether B actually reads A's output. If it doesn't, that ordering is just the order you happened to type things in, and it can run in parallel.

The warnings about verification nodes are also consistent. The sharpest line comes from [Louis Bouchard's write-up](https://www.louisbouchard.ai/graph-engineering-explained/): **"A graph of agents checking agents can produce extremely organized nonsense."** Separating the verifier from the maker is table stakes; beyond that, some of the evidence has to come from outside the system — a test that actually ran, a response that actually arrived. A graph of models grading each other produces consensus, not facts.

The tools are already in hand. LangGraph is at 65 million monthly downloads; Claude Code ships this pattern (fan-out, pipelines, schema-validated node outputs) as built-in workflow primitives. The barrier to entry isn't tooling — it's whether you've ever drawn your own system as boxes and arrows.

---

## Branch 2 — the graph that holds what you know

The second branch's problem statement already half-appeared in [#25](/blog/25-loop-engineering/) when we covered shared memory. What an agent learns inside a session dies with the context window. Store it behind vector search and you can re-find "similar text" — but **questions whose answers require chaining facts scattered across three documents** are exactly what similarity search can't chain. Knowing separately that A is B's subsidiary and B signed with C is not the same as answering "what's the relationship between A and C?" — that requires a structure you can traverse.

The best on-ramp in this branch is [Anthropic's official cookbook guide to knowledge graph construction](https://platform.claude.com/cookbook/capabilities-knowledge-graph-guide). The pipeline has five stages — extract, resolve, assemble, summarize, query — and there are two design lessons in it. One is **cost tiering.** Extraction, the high-volume per-document work, goes to Haiku; the judgment calls — entity resolution, summarization, reasoning — go to Sonnet. Resolution is the pipeline's pressure point: it merges "Edwin Aldrin" and "Buzz Aldrin" — two names with zero character overlap — not by string similarity but by the one-line descriptions attached to each entity. The other lesson is **honest evaluation.** The guide doesn't hide its own score: precision 1.00, recall 0.55. Nothing is made up, but nearly half is missed — and it says explicitly that the loop of adjusting prompts and re-running the scorer is what turns a demo into production. A vendor tutorial printing its own 55% recall is not a common sight.

To use a graph as memory, you need one more axis: time. Facts change — addresses move, contracts renew, owners leave. The project that designed for this head-on is [Zep's Graphiti](https://github.com/getzep/graphiti) (29k GitHub stars), with a bi-temporal model that stamps every fact with a validity window — **separating when a fact was true in the world from when the system learned it** — and, on contradiction, invalidates the old fact instead of overwriting it, preserving history. A memory that can answer "what did we believe as of last week" gives audit-heavy domains something a vector store can't.

Cost has to be addressed, because cost is why this field stayed niche. Early GraphRAG pushed the entire corpus through an LLM at indexing time; in early 2024 there were reports of five-figure bills for indexing a 5GB document set. Over the following eighteen months, [Microsoft's LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/) and a wave of follow-up work inverted the design: **make indexing cheap, and defer the expensive thinking to query time, when a question has actually arrived.** Indexing cost fell to roughly 0.1% of the original — a structural shift that changed the adoption math. "Graph RAG is too expensive" is a 2024 answer.

That doesn't make it necessary for everyone. [A systematic comparison](https://arxiv.org/abs/2506.05690) reaches a restrained conclusion: for single-hop factual retrieval, **vector search often matches or beats graphs.** The conditions under which a graph earns its keep come down to four: your queries genuinely contain multi-hop chains; you must explain the retrieval path (regulation, audit); your data is inherently relational (org charts, supply chains, financial networks); you get corpus-wide synthesis questions. If none of the four apply, vectors plus a reranker is the right answer. If [#41](/blog/41-pgcontext/) was about "where do the vectors go" converging on Postgres, this is the next question up: **does my workload actually contain questions vectors can't answer?**

---

## In practice: where to start

**On the orchestration side**, there's nothing to install. The agent tools you already use have the primitives (Claude Code workflows, LangGraph). The starting move is drawing: sketch your pipeline as boxes and arrows, ask of every arrow "does the later stage actually read the earlier stage's output," and delete the arrows where it doesn't. Most serial pipelines carry two or three of these fake arrows, and deleting them exposes the parallelism for free. Then come verification nodes: separate the maker from the checker, and make sure at least one piece of the verdict comes from outside the system — a test run, a real API response.

**On the knowledge/memory side**, there's a ladder. The cheapest way to touch the concept is the [official MCP memory server](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) — a few hundred lines storing entities, relations, and observations in a local JSONL file; it reads like a textbook minimal implementation of knowledge-graph memory. To get serious, the next rung is running the official cookbook pipeline over your own documents. Extraction costs drop below half with the Batch API (50% discount) plus prompt caching, and storage needs no graph database at first — three Postgres tables (entities, relations, aliases) carry you to hundreds of thousands of edges. Reach for Graphiti when the time-dimension of facts starts to matter, or for the single-engine setup — pgvector plus Apache AGE on one Postgres — when you don't want more infrastructure.

Just keep the order straight. You don't build the graph because you want a graph; you build it after questions that vectors can't chain have actually piled up. The serious practitioners in this branch attach the same caveat everywhere: most of the time, plain retrieval — and a plain loop — is enough.

---

## What to watch

Whether the term survives, I don't know. Another label will come along either way. What lasts isn't the name — it's the same structure as the harness argument in [#35](/blog/35-harness-engineering/): you can swap models, but **the graph that shapes your work and the knowledge graph you've accumulated are assets that stay.**

The spot to watch is where the two branches meet: workers in an orchestration graph writing what they learn into a memory graph, and tomorrow's loop picking up from there. With both branches maturing separately, the joint between them is the likely next battleground. Two things remain immature in front of it, though. Agent-memory benchmarks are shaky enough that vendors have had public disputes over measurement methodology, and — as a recent survey points out — research on **discarding** stale facts is nearly blank compared to research on accumulating them. A graph that only ever grows is a liability, not an asset.

There's one thing you can do today: draw your system as boxes and arrows. Count the arrows where no data flows — that's usually where the waiting time is, and you can delete it without changing a single tool.
