---
title: "The Reasons to Run a Separate Vector DB Are Disappearing — pgContext Goes After the Last One: Filters"
summary: "The first question you hit when starting with RAG is 'do I need a separate vector database?' By mid-2026 the answer has mostly settled on 'no, just use Postgres' — but that answer still has one hole in it: the moment you add a metadata filter, pgvector's recall quietly collapses. pgContext, a Rust extension that caught my eye on GitHub this week, drills into exactly that weakness. This post covers why people keep wanting 'everything in Postgres' (the burden of running one more database, the barrier for newcomers), what pgvector's post-filtering trap actually is, what pgContext does differently and where it admits it loses, and how to tell whether your own workload is already caught in the trap."
date: "2026-07-27T10:00:00"
tags:
  - postgres
  - pgvector
  - vector-database
  - rag
  - retrieval
draft: false
---

This is another entry in the series where I crack open trending open source. As with [headroom (#18)](/blog/18-headroom/), the starting point isn't "is this code any good" but **"why did people want this."** [pgContext](https://github.com/Evokoa/pgContext), which caught my eye on GitHub this week, is a PostgreSQL 17/18 extension that bills itself as "A full AI search engine, built into Postgres." The star count is still in the low hundreds, but what makes it interesting is where it stands: squarely on top of the hottest question in vector search right now.

---

## Why "everything in Postgres" keeps coming up

Picture a team wiring up RAG or semantic search for the first time. The app database is already Postgres. Now they need somewhere to store embeddings, and the options fork: sign up for a managed service like Pinecone, self-host Qdrant or Weaviate, or just enable the pgvector extension.

The moment you pick a dedicated vector DB, costs that never show up on the invoice come with it. You now have a pipeline that **copies your source data out and keeps it in sync.** When the source changes, embeddings have to be re-pushed; when that lags, search results drift away from the actual data. Backups and disaster recovery have to be handled separately in two systems. Authorization rules like "this user cannot see this document" get implemented twice — once as Postgres RLS, once as payload filters in the vector DB. That's tedious even for someone who knows how to operate all this; for someone building their first RAG side project, the second system *is* the barrier to entry. One more query language to learn, one more container to run, and twice as many places to suspect when something looks off.

So the "just use Postgres" camp won. By mid-2026 production workloads have consolidated around four players — Pinecone, Qdrant, Weaviate, and pgvector — and the industry's conventional wisdom has become "if you already run Postgres and have under a few tens of millions of vectors, pgvector is the default." Timescale's own benchmark showing pgvectorscale beating Qdrant's QPS at 99% recall on 50 million vectors pushed that consensus along. The weight has shifted toward vector search being **a feature of the database you already have,** not a separate product.

That's why things like pgContext keep appearing. The demand isn't for "a faster vector DB" but for "one less system to run" (what [TurboVec (#20)](/blog/20-turbovec/) captured with "ten million vectors on a laptop" was ultimately the same demand) — and that demand is commercially viable. Evokoa, the company behind pgContext, isn't a lone developer; it's an open-core startup that launched with managed hosting (Polygres) attached. Publish an Apache-2.0 extension, sell the hosting — the exact path Supabase paved.

---

## But "just Postgres" has a hole in it

You enable pgvector per the conventional wisdom, everything works — until one day you run into a query like this.

```sql
SELECT * FROM docs
WHERE tenant_id = 'acme'          -- filter
ORDER BY embedding <=> $query     -- vector search
LIMIT 10;
```

In a multi-tenant SaaS, every search query looks like this. pgvector's HNSW index picks nearest neighbors in vector space **without knowing about the filter,** and the WHERE clause prunes the results afterward (post-filtering). If acme's documents are 1% of the table, then of the 40 candidates the index returns (the default `ef_search`), on average 0.4 pass the filter. The query runs without errors. Results come back. They're just **not the right ones.** Closer acme documents definitely exist, but they never made it into the candidate set. Recall quietly collapses — and in a RAG system, it reaches the user as "the model couldn't find the relevant document and gave a weird answer."

This isn't a fringe edge case. It's the first item in every piece about pgvector's weaknesses (Franck Pachot's [analysis of the missing pre-filtering](https://dev.to/franckpachot/no-pre-filtering-in-pgvector-means-reduced-ann-recall-1aa1), [ParadeDB's rundown of the limitations](https://www.paradedb.com/learn/postgresql/pgvector-limitations)), and it's why pgvector 0.8 added iterative index scans — a mitigation that walks more of the graph when candidates run short, paying for it in CPU and tail latency. It's also why dedicated vector DBs make "we do filter-aware search" a headline sales point. In short: **filters are where "just Postgres" finally breaks down, and filters are what has justified the cost of running a separate vector DB.**

---

## What pgContext does differently

I pulled the code and checked. Roughly 110k lines of Rust (pgrx), ten fuzz targets, property tests — hard to call a toy. The design comes down to three things.

**First, it makes the filter part of the search.** It accepts Qdrant-style filter grammar (`must`/`should`/`must_not`, ranges, JSONB paths) and, instead of post-filtering, pushes a filter mask into the HNSW graph traversal itself. Nodes excluded by the filter still serve as connectors in the graph, so recall holds up even under highly selective filters — and below a selectivity crossover it switches to an exact scan outright. No separate filter index to build, either.

**Second, it resolves approximate results back to the source row and re-scores them exactly.** Every HNSW candidate is re-scored against the live row before being returned, passing through MVCC visibility and RLS along the way. The problem of implementing authorization twice disappears structurally — the search result *is* "the rows this user is allowed to see." Data never moves; acceleration state like HNSW is treated strictly as derived, rebuildable indexes. No sync pipeline, no copy that can drift.

**Third, hybrid search ships inside the extension.** Fusing dense vectors with Postgres full-text search via reciprocal-rank fusion is a single SQL function — the part you'd normally hand-roll in application code.

The self-reported benchmark numbers: on the standard GloVe-100-angular dataset (1.18M vectors), pgContext traces the same recall curve as pgvector while answering **3.8–5.3x faster.** And on the filtered search that this whole post is about, across selectivities from 1% to 50%, pgvector stays stuck at 0.34–0.49 recall (the filter starvation described above, exactly) while pgContext's collection API holds 1.000.

More impressive than the numbers is the benchmark document's attitude. It explicitly lists **the lanes pgContext loses.** Index builds are 1.7–3.5x slower than pgvector depending on the lane, and while it wins filtered-search recall, **Qdrant dominates on filtered-search latency** (1–2ms vs 22–71ms at full recall). Self-reported benchmarks from early projects deserve heavy discounting as a rule — but a document that publishes the tables where it loses has earned a smaller discount. The positioning reads as honest for the same reason: not "we beat Qdrant," but **"inside Postgres, we plugged the hole pgvector couldn't."**

---

## In practice: is my workload caught in this trap?

Whether or not you ever touch pgContext, the post-filtering trap itself is worth checking today if you run pgvector.

**1. Start by computing filter selectivity.** For the representative filter on your search queries, one line does it: `SELECT count(*) FILTER (WHERE tenant_id = 'acme') * 1.0 / count(*) FROM docs;`. Below 10%, you're a trap candidate. Remember the arithmetic: at 1% selectivity with `ef_search` 40, the expected number of surviving candidates is less than one.

**2. The symptom is "fewer results than asked for."** If LIMIT 10 returns seven rows, or documents that appear without the filter vanish when you add it, you're already in it. It often surfaces first as degraded RAG quality, which makes it easy to burn time suspecting your prompts instead of your retrieval layer.

**3. Two remedies within pgvector.** `SET hnsw.ef_search = 100;` (the default of 40 is low for production), and on 0.8+, enable iterative scans with `SET hnsw.iterative_scan = relaxed_order;`. Most mid-selectivity workloads survive on these. The price is CPU and tail latency.

**4. Where those stop working is the fork in the road.** If a filter with single-digit selectivity sits on your critical path (multi-tenancy is the classic case), you have three options: schema surgery like per-tenant partitioning, adopting a dedicated engine like Qdrant, or an extension that does filter-aware ANN like pgContext. pgContext is still v0.1.0 and PG 17/18 only, so it's too early to recommend dropping it into production — but "swapping an extension" is clearly an easier decision to reverse than "adding a system."

---

## What to watch

One more thing in the repo caught my eye: **AGENTS.md,** sitting next to the human-facing README. It's written so an AI coding agent can install, verify, and wire up the extension non-interactively — and it shows who this project assumes its consumer is. The 2026 version of "a newcomer adds RAG" isn't a person reading docs; it's an agent assembling the stack, and that agent will pick a one-line `CREATE EXTENSION` over a two-container topology. The demand to collapse down to one database may end up coming harder from agents than from people.

The project itself is early: three-digit stars, 80 commits, unverified self-benchmarks. But this post cares less about whether pgContext succeeds than about the fact that things like it keep appearing. pgvector 0.8's iterative scans, pgvectorscale, ParadeDB, and now pgContext — they're all different answers to the same question: "we're going all-in on Postgres, so who owns recall on filtered search?" The last reason to run a separate vector DB is being erased, and that reason's name is filters.
