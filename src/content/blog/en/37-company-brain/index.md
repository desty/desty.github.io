---
title: "You Can Rent a Model, but Not Your Company's Memory — Inside Cerebras's Brain That Answers 15,000 Questions a Day"
summary: "Cerebras published the blueprint of its internal knowledge base. Three months after launch it fields over 15,000 questions a day and ranks among the most widely adopted internal tools at the company — and the askers aren't just humans. Automation scripts and agents query the same place. The design starts by giving up on the single source of truth: knowledge stays scattered but searchable, retrieval stacks four techniques (full-text, embeddings, term rarity, age decay), normalized summaries get embedded instead of raw transcripts, and code re-embeds only the chunks each commit changed. It all converges on one thesis — a brain is a maintenance system, not a storage system, and it's [#30](/blog/30-context-engineering/)'s context engineering scaled to a whole company. Glean's $300M ARR (+89%) shows the market already prices this thing."
date: "2026-07-20T10:00:00"
tags:
  - knowledge-base
  - rag
  - hybrid-search
  - context-engineering
  - ai-agent
  - mcp
draft: false
---

Every organization that has built an internal wiki knows the pattern: it's cleanest on launch day, and it decays from there. That's why [the write-up Cerebras published this week on its internal knowledge base, "Cerebras Knowledge,"](https://www.cerebras.ai/blog/how-we-built-our-knowledge-base) isn't another "we built a RAG" post. It's the maintenance methodology behind a system that, three months after launch, fields **more than 15,000 employee questions a day** and ranks among the most widely adopted internal tools at the company.

More telling than the number is who's asking. The knowledge base serves **humans, automation scripts, and agents.** Cerebras spans data center operations, chip design, hardware, training, inference, and cloud platform teams, with hundreds of new employees joining every year — so channels kept filling with the same questions: "Where can I find X?", "Who is the expert in Y?", "What is Z?" They put a search box where those questions land, and the systems became regulars before the people did.

---

## The starting point: giving up on the single source of truth

The first design principle Cerebras committed to is a refreshing one: **scattered knowledge is the normal state.** Every quarter or so, someone proposes the same brilliant fix — record everything in one platform — and the dream of a single source of truth, they flatly state, rarely works in practice.

The reason is simple. Information gets created wherever it's convenient: suggested edits in documents, threads in Slack, code review in GitHub, status metadata in Jira. Each platform has been tuned for its domain through years of product engineering; in the post's words, "discussing a pull request in Google Docs would be a terrible experience."

So they inverted the direction. Instead of moving people onto a platform, **they extract data from each platform directly and leave existing habits alone.** The structure is surprisingly modest: a single Postgres table holds embeddings, summaries, and metadata from every source, and connectors define what to fetch, how, and how often per source. A team that wants its own database included opens a PR with one small Python script that writes rows in the shared schema. It reads like a company-scale field version of [#13's AI-Ready Data](/blog/13-ai-ready-data/).

---

## Vector search alone doesn't cut it — a four-way hybrid

The source they invested in most is Slack, because that's where the company's freshest engineering discussion happens — and that's exactly where pure vector search hit its limits first. Slack messages vary wildly in information density. "hey yeah sure mike" and a detailed kernel explanation are both one message each, and **short messages frequently beat longer, more detailed ones on cosine similarity.**

So they layer four techniques, each covering the others' weaknesses:

- **Full-text search** catches the exact tokens embeddings blur together: error strings, flag names, host names. When an engineer pastes a literal error message, no amount of semantic similarity should outrank an exact match.
- **Embedding search** connects the same idea written in different words. The person asking "restore hangs after manifest load" and the person who answered "checkpoint stalls on the NFS mount" may share no vocabulary at all.
- **Inverse document frequency** separates signal from filler. "sounds good, thanks!" sits close to many queries in embedding space but scores near zero once term rarity is counted.
- **Age decay** encodes the fact that Slack answers expire. A six-month-old thread may describe infrastructure that no longer exists. When relevance is otherwise equal, the newer thread wins.

No single scorer is trusted alone. The four ranked views are fused at query time with reciprocal rank fusion — each document accumulates `weight / (60 + rank)` per list, so consensus across retrievers beats a single first-place vote. A small reranker then scores candidates zero to ten and keeps the top ten, and finally the neighboring sections that chunking cut away are stitched back so no result arrives as a context-free orphan paragraph.

The direction itself is well trodden. [Anthropic's Contextual Retrieval experiments](https://www.anthropic.com/news/contextual-retrieval) showed contextualized embeddings plus BM25 cutting retrieval failure rates by 49%, and 67% with reranking added. That post appears in Cerebras's own references.

---

## The hard part isn't storage — it's upkeep

The most valuable material in the post isn't the search algorithm; it's **the set of tactics for fighting data rot.** A wiki preserves the truth of the day it was written. A brain has to serve the truth of today.

**They don't embed raw text.** Before storage, an LLM normalizes each Slack thread into four things: a one-line question an engineer would actually search for, a short summary, the resolution, and the systems and code references mentioned. Those get embedded; the original transcript does not. In their experiments, accuracy rose significantly once threads were normalized into a consistent format. Answers buried in long threads get rescued separately through "bursting" — runs of consecutive messages from one author, embedded with the thread topic prepended — gated by thresholds so low-signal chatter stays out: a rare token (IDF ≥ 4.0), at least 200 characters, and a boost if messages drew reactions.

**Code lives commit by commit.** Some internal repositories exceed 40 GB, so instead of recomputing everything, they use the open-source framework CocoIndex to **re-embed only the chunks each commit changed.** Code splits along language-specific boundaries from coarse to fine — classes first, then methods, then smaller blocks — and because sync state and embeddings live in the same Postgres, the bookkeeping stays simple. Repository onboarding is self-service via config files teams submit themselves.

**Freshness is tuned per channel.** Every Slack channel is its own data source, so a busy incident channel can be ingested more frequently than a quiet one. Ingestion itself is real-time over a Socket Mode WebSocket, and a single new reply triggers a re-fetch of the entire thread, which is written back as one row — so the stored conversation always reflects its complete, current state.

---

## grep or embeddings — the answer is both

Cerebras admits it debated for a long time whether embedding code was worth it at all. With tools like Claude Code everywhere, **"grep is all you need"** felt persuasive. After talking with others in the industry and reading Cursor's findings on semantic search over large codebases, the conclusion wasn't either/or: embedding search shipped, and **a ripgrep-based `search_code` tool stayed right next to it.**

That's not an idiosyncratic call. [LlamaIndex's Jerry Liu has been arguing the scaffolding era is over and context is the new moat](https://venturebeat.com/infrastructure/the-ai-scaffolding-layer-is-collapsing-llamaindexs-ceo-explains-what-survives), and [the retrieval harness he published hands agents semantic search, keyword search, grep, and file reading all at once](https://x.com/jerryjliu0/status/2073407100642852871). It's exactly the direction we saw in [#19](/blog/19-search-for-agents/) — once the user of search is an agent rather than a person, search stops being a service that returns an answer and becomes a toolbox the agent picks from.

---

## Not a search box for people — parts for agents

That toolbox philosophy is baked into the interface design. In its MCP integration, Cerebras exposes **retrieval primitives as individual tools** rather than hiding everything behind one "answer this question" endpoint: `search`, `search_slack`, `search_code`, `who_knows` (who has demonstrated expertise on a topic), `recent_prs`. Each tool is deliberately simple and as LLM-free as possible, so it's cheap and fast to call. Orchestration lives outside the tools: **Claude Code, or any MCP-compatible agent, does the assembling.** It's [#29's thesis — tool design is agent quality —](/blog/29-mcp-tool-design/) replaying at the internal-infrastructure layer.

The human-facing web UI is the same parts with a planner → executor → synthesizer pipeline on top. A lightweight LLM pass inspects the query and picks tools, the executor fans the calls out in parallel and normalizes results into a shared evidence schema, and a final LLM pass synthesizes the answer with citations and caveats.

The last piece is scope. As the corpus grew, **"search everything everywhere" rapidly stopped being useful.** Compiler engineers don't want infrastructure runbooks in their results. So they built "projects" — named bundles of Slack channels, repositories, and document spaces per team — and onboarding asks each user to pick a default project, stored on their profile, which scopes queries automatically. A new engineer gets high-signal answers before learning which channels matter. [#30 argued the heart of context engineering](/blog/30-context-engineering/) is deciding what to leave out, not what to put in — the same principle, applied to company-wide search.

---

## The market is already pricing this

Price tags are appearing on this category. Glean, the flagship commercial company brain, [was valued at $7.2B last June and crossed $300M in annual recurring revenue this May](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/) — tripling in 15 months, up 89% year over year. The growth story is the interesting part: in a period of AI budget cuts, Glean sells consolidation of scattered tools into one context layer as a cost reduction.

The Cerebras case and Glean's numbers point at the same demand. Any company can now rent a frontier model through an API, and agent loops have converged upward. What's left to differentiate is **what you can give your agents to read.** A company's memory can't be rented and can't be bolted on. It can only be accumulated and maintained.

Why this becomes a cost line in the agent era is equally clear. When retrieval misses, an agent burns another reasoning loop hunting for the same thing a different way — tokens and wall-clock, gone. The worse failure mode is the one from [#34](/blog/34-sufficient-context/): answering confidently off insufficient context instead of saying "I don't know." Retrieval quality is no longer a UX metric; it's the cost basis of agent operations and trustworthiness.

---

## In practice: six principles worth stealing

Distilling the Cerebras design down to portable principles gives you six.

**1) Connect, don't consolidate.** When someone proposes "this time we really record everything in one place," show them this post. Designs that require changing human habits lose. Put connectors where the data is born.

**2) Don't start with vector search alone.** Full-text + embeddings + term rarity + freshness, fused with RRF, is the unit of adoption. On Postgres, a GIN index plus pgvector covers all of it in one database — that's literally what Cerebras did.

**3) Normalize before you embed.** One-line question, summary, resolution, related systems. Store knowledge in the shape it will be searched in, or it won't be found.

**4) Treat freshness as a first-class signal.** Put age decay in the score, and keep code alive with per-commit incremental re-embedding. A knowledge base with no update plan is debt from day one.

**5) Make scoping the default, not a feature.** Company-wide search collapses as the corpus grows. Have teams pick their project scope at onboarding.

**6) Design agent primitives before the human UI.** Expose simple, LLM-free retrieval tools over MCP, and the human search box becomes just a planner and synthesizer on top. Do it in the other order and you end up with a search box agents can't use.

One thing the post doesn't disclose: how retrieval quality is evaluated, or what the error rate is. Fifteen thousand questions a day is an adoption metric standing in as indirect evidence of quality. So even if you follow this blueprint, [#32's eval pipeline](/blog/32-ai-eval/) is still yours to build.

The question it leaves you with: is your company's knowledge scattered but searchable, or is it going stale while being consolidated into one place? Building a brain isn't the hard part. Keeping it alive is — and everything of substance in the Cerebras post was about the latter.
