---
title: "Karpathy's One-Screen Idea Became a Google Standard in Days — The Format Is Free; the Contest Is Won in the Data Warehouse"
summary: "Google released OKF (Open Knowledge Format), a vendor-neutral format for representing knowledge as markdown + YAML. What matters is that it didn't come out of Google's strategy room. In April, Karpathy dropped a one-screen 'LLM Wiki' gist that crossed 5,000 stars in two weeks, and Google shipped a vendor-neutral version days later. The crowd proved the demand first — it's the same pattern already converging bottom-up through llms.txt, AGENTS.md, and CLAUDE.md. So the question isn't 'is OKF a good format' but why Google carved out a separate standard for a demand the crowd already validated. The answer is in the data gravity sitting underneath the format."
date: "2026-07-02T10:00:00"
tags:
  - open-knowledge-format
  - llm-wiki
  - agents
  - context-engineering
  - moat
draft: false
---

Google released [OKF (Open Knowledge Format)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing). In one line: "a vendor-neutral format for representing an organization's knowledge as markdown + YAML files, easy for AI agents to consume." Slapping a YAML header on markdown hardly sounds like an invention, and technically there's almost nothing new here.

But reading it as a format novelty misses the real story. OKF didn't spring from Google's strategy room. Trace it back and the starting point is elsewhere — **this is Google capturing, late, a demand the crowd had already proven.**

## The crowd proved the demand first

In April 2026, Andrej Karpathy posted a [one-screen gist called "LLM Wiki"](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). Not a product, not a paper — just an "idea file." Within two weeks it crossed 5,000 stars and 4,000 forks, spawned dozens of re-implementations and a VentureBeat write-up. And [Google shipped its vendor-neutral version, OKF, days after that gist went viral](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing).

It wasn't just Karpathy, either. [llms.txt](https://llmstxt.org) was proposed in September 2024 and adopted by 844,000 sites; AGENTS.md, CLAUDE.md, and `.cursorrules` became the de facto memory files for coding agents. All of them were converging on one pattern from the ground up — **plain markdown files, no required fields, used as an agent's context and knowledge.** Long before any vendor blessed it, people were already writing the answer themselves. The demand was unmistakable, and OKF is the latest stop at the tail end of that wave.

## What Karpathy actually proposed — what OKF kept, and what it dropped

Worth pausing here. Karpathy's core wasn't "markdown files." The nail he hammered was **"beyond RAG — a knowledge artifact the LLM maintains itself and that compounds over time."**

Classic RAG re-scrapes the source documents from scratch on every query. Synthesize five documents and it re-finds all five every time. Nothing accumulates. Karpathy's wiki inverts that with three layers — raw sources (frozen), the wiki (markdown pages, indexes, and cross-references the LLM fully manages), and a schema (a CLAUDE.md-like config telling it how to maintain all this). The human curates sources and asks good questions; the LLM does everything else — updating cross-references, keeping things consistent. The point is one word — **compounding.**

So what did OKF take? The **artifact (the file format).** What it dropped is the **loop (the maintenance process that makes the artifact compound).** It standardized the noun but not the verb. The real magic of Karpathy's idea — the self-accumulating process — is left as an exercise in OKF. Open the actual sample bundles and they're indistinguishable from well-made data-catalog wiki pages. A static snapshot, not a living wiki.

## So why did Google carve out a separate standard?

This is the most interesting question. A neutral markdown standard already exists — [AGENTS.md](https://agents.md). OpenAI, Google, Cursor, and Sourcegraph built it together, a Linux Foundation body governs it, and Google is a co-author. Google is already co-building the neutral standard coding agents read, so why peel off the knowledge/data slice and ship OKF solo?

Because that slice is exactly where Google's moat sits. AGENTS.md covers code context — "how do you build and test this project." There's no seat there for a cloud vendor's data warehouse. OKF's "organizational knowledge," by contrast, ultimately comes out of the data warehouse — what each table means, how a metric is aggregated, what the data lineage is. And the tool Google shipped alongside the spec is exactly that conversion: an enrichment agent that auto-generates OKF from BigQuery.

So the picture lines up. Give the format away free, and park the moat one layer down in **data gravity.** OKF itself is open for anyone to produce or consume, but if your data already pools in BigQuery, the smoothest OKF producer on earth is Google. The format is vendor-neutral; the easiest path to filling it is not. This is the same picture I drew in ["Agree on the Contract First"](/blog/24-contract-first) — a format is just the contract joining two sides, and value accrues to whoever fulfills it best. And what that value actually is, is the data itself, the subject of ["Data for AI"](/blog/13-ai-ready-data).

## The future — can a vendor hold a pattern the crowd already owns?

The lineage makes one thing clear: this pattern wins from the ground up. llms.txt, AGENTS.md, the LLM Wiki — none were handed down by a vendor; they hardened as people used them. OKF's fate comes down to two things — whether it can capture the compounding loop, and whether it can converge an ecosystem onto one place.

Fail at both and OKF stays Google's data-catalog export format while the truly neutral seat goes to the AGENTS.md lineage. The crowd proved the demand and put it in Google's hands — but whether a vendor-anchored format can re-capture a pattern the crowd already owns is still unknown. An open format that enforces almost nothing is easy to adopt and just as easy to fragment. Once everyone uses it their own way, the word "standard" rings hollow.

## The pattern is clear

So what's worth watching in OKF isn't the elegance of the format. **The value didn't come from a vendor inventing a format; it came from a one-screen idea compounding out in the open.** Google's bet is to harden that current into something anchored to where the data lives.

So OKF's win or loss won't turn on "is this a good format." It turns on whether Google becomes "the default path by which an organization's knowledge reaches its agents." And the fact that the path started from one gist by the crowd is the part worth remembering here. Demand is always proven from the bottom first, and the contest over who captures it is won where the data piles up — in the warehouse.
