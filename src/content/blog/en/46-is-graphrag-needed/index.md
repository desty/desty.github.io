---
title: "Four Flavors of RAG on One Scale — The Bottleneck Wasn't Retrieval"
summary: "In late June, engineers from AWS and Cisco published a paper with a provocative title: Is GraphRAG Needed? It puts nine scenarios — from regular RAG through GraphRAG to Agentic RAG — on the same knowledge base and the same model, implemented side by side. The scorecard holds three upsets: graph-only retrieval collapsed, a plain RAG that flattens relations into documents beat hybrid GraphRAG, and handing an agent an extra graph tool made it 12% worse. The more painful number comes after: even when retrieval brings in 83.5% of the ground-truth evidence, the model only uses 47.9% of it. This post covers the fix that cut tokens nearly in half by changing only how retrieval results are written down, and the order of operations to run through before you reach for a graph."
date: "2026-08-10T10:00:00"
tags:
  - rag
  - graphrag
  - knowledge-graph
  - agentic-rag
  - context-engineering
draft: false
---

In [#43](/blog/43-graph-engineering/), while sorting graph engineering into its two branches, I left the knowledge-graph branch with one qualifying question: "does your workload actually contain questions that vectors can't answer?" In late June, a paper arrived that throws data at that question. Written by engineers at AWS and Cisco, [Is GraphRAG Needed? From Basic RAG to Graph-/Agentic Solutions with Context Optimization](https://arxiv.org/abs/2606.25656) is a weighing scale, starting with its title.

What makes this scale valuable is its construction. Most numbers in the GraphRAG debate so far have come from different datasets and different baselines — a comparison where each side only tunes its own implementation is not a comparison. This paper implements **all nine scenarios directly** — regular RAG, GraphRAG, Modular RAG, Agentic RAG — on the same knowledge base with the same generation model, and weighs them side by side. And the thesis of this post sits behind the scorecard rather than in it: **the bottleneck the scale actually pointed to wasn't retrieval, but what happens after retrieval — how the evidence you fetched gets handled.**

---

## The Scale — Nine Scenarios, One Knowledge Base

The test bed is [STaRK-Prime](https://arxiv.org/abs/2404.13207), a semi-structured knowledge base from the precision-medicine domain: 129K entities (diseases, drugs, proteins, genes) with 8.1M knowledge-graph relations among them. Worth noting up front — at that relation density, this is **home turf for graphs.** That the results below came out here makes the upsets sting more.

On top of it sit nine scenarios: basic RAG retrieving entity-description documents only (1); RAG with relation information merged into the documents (2); GraphRAG using only a predefined knowledge graph (3); GraphRAG computing a graph from the documents (4); a text-graph hybrid (5); Modular RAG with a fixed workflow (6); an agent holding the modules as tools (7); an autonomous agent holding a single document-retrieval tool (8); and that same agent with a graph-retrieval tool added (9). The generation model is pinned to Claude 3.7 Sonnet throughout, and evaluation is end-to-end: not retrieval rankings, but **the entities the model finally selects while writing its answer,** checked against ground truth.

## Three Upsets on the Scorecard

First, **graph-only retrieval collapses.** Scenario 3, using only the predefined knowledge graph, scores Hit@1 **0.14** — less than a quarter of basic RAG (0.61). Graph traversal only works once you've landed on a good starting node, and landing on a starting node from a natural-language question is, in the end, a text-retrieval job.

Second, **the side that never built a graph beat the graph.** Scenario 2 is a plain vector-search RAG whose only trick is appending each entity's 1-hop neighbors, grouped by relation type, to its document before indexing. It scores Hit@1 **0.70,** ahead of the full text-plus-graph hybrid GraphRAG (Scenario 5, 0.64). It also lifts basic RAG from 0.61 to 0.70 — which means most of the value graphs provide in this arena was **the relation information itself, not the graph data structure.** Flatten relations into sentences inside documents and the embeddings pick them up just fine.

Third, **the agent with more tools lost to the agent with fewer.** The overall winner is the autonomous agent holding a single document-retrieval tool (Scenario 8) — in the paper's words, autonomous Agentic RAG with minimal specialized tools "achieves superior results across the board." But hand that same agent one extra graph-retrieval tool (Scenario 9) and Hit@1 drops from 0.69 to **0.61** while latency goes from 27 seconds to 72 — 2.6×. Give the model more options and it spends time on the options while the results get worse. The lesson from [#40](/blog/40-claude-opus-5/) — "migration starts with deletion" — repeats itself with retrieval tools.

One honest footnote: on Hit@1 alone, Scenario 2 (0.70) edges out even the overall winner, Scenario 8 (0.69). A single-pass RAG with no agent loop went toe-to-toe with an autonomous agent burning hundreds of thousands of tokens per query. The performance crown went to the agent; the cost-performance crown clearly belongs to relation-flattened RAG.

## Half the Evidence You Fetched Gets Thrown Away

The paper's real contribution is the dissection, not the leaderboard. In the hybrid scenario, with retrieval widened to 500 paths, ground-truth entities made it into the context **83.5%** of the time. The share the model actually picked up while writing its answer: **47.9%.** Retrieval delivered the evidence; generation discarded half of it. The authors' conclusion: "retrieval-oriented metrics (Hit@k, MRR) may overstate the benefit of expanded retrieval," and RAG evaluation should measure retrieval coverage and generation utilization separately.

They also measured where the evidence dies. Entities the model picked up sat, on average, at the 10.5% position of the context; entities it missed sat at 36.8%. Evidence placed in the first 10% of the context survives 85.5% of the time; evidence placed at the 70–80% mark survives **0% of the time.** This is a field measurement of what we've been calling "lost in the middle" — except it's not the middle, it's the entire back half that dies. What [#30](/blog/30-context-engineering/) argued — that context is a placement problem, not a volume problem — shows up here as numbers.

This shares a root with what we saw in [#34](/blog/34-sufficient-context/). There, the problem was models that can't say "I don't know" even when handed sufficient context — overconfidence. Here, what's measured is models failing to consume the evidence at all. Put the two together and the picture completes: **between raising recall and getting better answers sits a separate stage — the model's digestion — and that stage does not improve by fixing retrieval.**

## The Fix Wasn't Retrieval — It Was Notation

So what do you fix? What makes the paper's second half interesting is that it touches neither the retrieval algorithm nor the model. What it changes is **how retrieval results are written into the context.**

Graph retrieval results normally arrive as a list of triplets: (aspirin, treats, headache), (aspirin, has-side-effect, gastric bleeding)… — n relations between the same entity pair means n lines. The paper collapses these into `entity1 - (relation1||relation2||relation3) - entity2`, one line per entity pair. On top of that, the agent loop maintains a single unified subgraph across the session instead of piling up a new one per turn, and document retrievals are deduplicated by content hash. These three changes cut token usage by **19–53%** across scenarios; hybrid GraphRAG went from 49.1K tokens per query to 23K.

Read it in reverse: existing implementations were spending nearly half their context on different notations of the same information. And read it against the dissection above and the saving is more than a cost saving — in a world where evidence parked in the back 70% of the context dies, stripping duplicates and pulling evidence forward is an accuracy intervention.

## This Isn't the Only Scale

If this were a single paper's result, you could file it under domain quirks — but there are scales pointing the same way on either side of it. [Do We Still Need GraphRAG?](https://arxiv.org/abs/2604.09666), published in April, reported that merely attaching an agentic search loop closes most of dense RAG's gap to GraphRAG. That paper is also explicit about where graphs keep their seat — complex multi-hop reasoning still favors them, and the math works out for workloads with enough query volume to amortize the offline indexing cost. Earlier still, the team behind [GraphRAG-Bench](https://arxiv.org/abs/2506.05690) wrote their motivation into the paper itself: "recent studies report that GraphRAG frequently underperforms vanilla RAG on many real-world tasks."

Three scales, one direction: **the graph is not a default but a conditional option, and the default's seat has been taken by the agentic search loop.** This doubles as a midterm report card for the "graph for finding" branch of [#43](/blog/43-graph-engineering/). To be fair, the graph camp hasn't been idle either — the lineage that drove indexing cost down to 0.1% of what it was is covered in #43.

## In Practice: Graph Effects Before Graphs

Here's the order of operations this scale suggests.

**1. Flatten relations first.** Scenario 2 lifted Hit@1 by 8 points with no graph DB, no traversal engine, no ontology — just a change to the indexing pipeline. If your corpus has entity-centric documents, appending each one's 1-hop relations grouped by type was the single best cost-performance move in the entire arena. Evaluate graph adoption after you've tried this.

**2. Measure coverage and utilization separately.** Instrument whether the ground-truth evidence entered the context (retrieval) and whether the answer used it (generation) as two different numbers. Fold that split into the evaluation axes from [#32](/blog/32-ai-eval/), and you can stop funding improvements that only move retrieval metrics.

**3. Put the context notation on a diet.** Dedup, grouped relation notation, cross-turn accumulation cleanup. This intervention recovered 19–53% of tokens without touching retrieval or the model — and to the extent it pulls evidence forward, it intervenes on accuracy too.

**4. Add tools only after they prove out.** Handing an agent one more retrieval tool isn't free either. Scenario 9 added a tool and got slower and less accurate. New tools go in after they win on your eval.

**5. Then, and only then, the graph.** If you've done all of the above and multi-hop relational reasoning genuinely exists in your workload, with query volume that amortizes the indexing cost, that's when you move on to the qualifying question in [#43](/blog/43-graph-engineering/) and the ladder in [#45](/blog/45-ontology-comeback/).

## Limits, and What to Watch

The scale's limits, stated plainly: single domain (precision medicine), single model (Claude 3.7 Sonnet), and the authors themselves note that "evaluation is limited to retrieval-oriented metrics" and does not assess factual faithfulness or hallucination rates. They also flag that agentic scenarios wobbled across runs even at temperature 0. So the right reading of these numbers is not "GraphRAG is dead" but "the burden of proof now sits with the graph." Even on home turf with 8.1M relations, it didn't win automatically — that's the extent of what this paper proves.

Two things to watch. One: whether controlled comparisons like this replicate across other domains and model tiers — especially if digestion is a function of model class, whether the gap shrinks or grows as models get stronger will rewrite the economics of graph investment. Two: the winner's price tag. Scenario 8 still burns 192K tokens per query after optimization. If this arena's verdict is "the agentic loop is the default," the next bottleneck is that loop's economics.

In [#45](/blog/45-ontology-comeback/), the qualifying question for ontologies was "do questions that schemas can't answer actually arrive?" This paper hands you the question to put in front of it: **are you even using the evidence you fetched?** Until you can answer that with numbers, more sophisticated retrieval doesn't belong on the list of candidate solutions.
