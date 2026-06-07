---
title: "It Wasn't Google That Shrank 31GB to 4GB — Cracking Open TurboVec"
summary: "The headlines said 'Google shrinks AI memory from 31GB to 4GB and beats FAISS on speed with TurboVec.' But Google didn't build TurboVec — it's a solo developer's open-source project with 5.8k stars. What Google shipped wasn't a product; it was math (the TurboQuant paper). Reading the repo and the paper together, the real story isn't 'faster than FAISS' — it's 'no training step.' And a paper originally written for LLM KV-cache compression had quietly switched lanes into RAG search."
date: "2026-06-12T10:00:00"
tags:
  - rag
  - vector-search
  - quantization
  - open-source
  - ai
  - agent-engineering
draft: false
---

A tech-press headline caught my eye this month: **"Google shrinks AI memory from 31GB to 4GB — TurboVec beats FAISS on speed, too."** Ten million vectors crammed into one-eighth the memory, 12–20% faster than Meta's FAISS. If you've ever run a RAG pipeline, those numbers are hard to ignore.

But [as usual](/blog/18-headroom/), I went down to the primary source — and the very first word of the headline was wrong. **Google didn't build TurboVec.**

---

## The Headline Is Wrong From the Start — TurboVec Is Not a Google Product

Open the [GitHub repo](https://github.com/RyanCodrai/turbovec) and it's immediately clear. The author is `RyanCodrai`, an individual developer. 5.8k stars, 144 commits, MIT license. No Google org account, no official sponsorship badge, no "Google" branding. The only relationship the README claims to Google is a single line — it's **"built on" Google Research's TurboQuant algorithm.**

In other words, what Google supplied was **math, not a product.** TurboQuant is a paper Google Research [presented at ICLR 2026](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/); TurboVec is a **community implementation** that wraps that paper in Rust with Python bindings. Yet several outlets called it "Google's TurboVec," collapsing the paper (Google) and the implementation (an individual) into one thing.

This might look like nitpicking. But getting that distance right is the whole starting point of this post. Blur **who did what**, and you miss the genuinely interesting signal.

---

## What Demand Does It Answer — Not "Faster Than FAISS" but "No Training"

The headline framed it as a speed race. But read the repo, and the real selling point is somewhere else.

Anyone who has operated a FAISS PQ (Product Quantization) index knows the drill. To get compression you first have to **train a codebook**: run k-means against the data distribution, tune parameters, rebuild when the corpus grows. The pain isn't the search — it's that **operational cycle**. Every 10,000 new documents, you're asking yourself "do I need to rebuild this?"

TurboVec's answer (really, TurboQuant's) is to **delete that cycle entirely.**

- **No training step.** The codebook is not learned from the data.
- **Online ingest.** Just add vectors and they're indexed immediately — no parameter tuning, no rebuilds.
- **Stays local.** No managed service, no data leaving your machine or VPC.

5.8k stars didn't pile up because it's 15% faster than FAISS. They piled up because **you never have to look at the train step again.** What people actually wanted wasn't faster search — it was **one step disappearing from operations.** Speed is the bonus; the removed pain is the substance.

---

## Why the Math Works — "Data-Oblivious" Quantization

This is the heart of the TurboQuant paper, and the answer to why no training is needed.

Ordinary quantization looks at the data to build a codebook (like k-means). TurboQuant goes the opposite way — it **doesn't look at the data at all.** The procedure:

1. Normalize each vector to a direction on the unit sphere.
2. Apply a **random rotation.** The coordinates then follow a **predictable Beta distribution**, independent of the data.
3. Quantize against that *known* distribution using **precomputed Lloyd-Max optimal boundaries** (4 buckets for 2-bit, 16 for 4-bit).
4. Store a length-correction term separately to recover the inner product without bias.

Step 3 is the key. The codebook comes from **math (the Beta distribution), not the data.** So no training is needed, and the paper claims it stays within roughly 2.7× of Shannon's distortion-rate limit. A 1536-dim vector goes from 6,144 bytes (FP32) to 384 bytes (2-bit) — that's the **16× compression**.

"Doesn't look at the data" sounds abstract, but the practical implication is powerful. **Because the codebook isn't tied to a dataset, it transfers when the domain changes — even when the use case changes.** That property is the key to the next part of the story.

---

## This Time, the README Was More Honest Than the Code

In the [Headroom post](/blog/18-headroom/), the README's confident architecture diagram (CacheAligner, CCR) turned out to be a no-op or a 5-minute cache in the actual code. There was distance between the diagram and the behavior. So I came in skeptical here too and opened the benchmark tables.

It was the opposite. **TurboVec's README documents the cases where it loses.**

- On OpenAI embeddings (d=1536/3072) it beats FAISS `IndexPQ` by 0.4–3.4 points at R@1. But it **explicitly states it trails FAISS by 1.2 points at 2-bit on GloVe (d=200)** — with the explanation that the Beta assumption loosens at low dimensions.
- On x86, 2-bit / high-dim / multi-threaded configs are noted as **2–4% slower than FAISS** — even giving the reason ("the inner accumulate loop is too short").
- It states that the comparison is against "a strong FAISS baseline (float32 LUT, k-means++ codebook)," a setup **less favorable to itself** than the weaker baseline in the original paper.

It's not that there's no hype — the hype is **outside the repo.** The flat assertion "Google beats FAISS" wasn't the author's; it was layered on top by the press. The author honestly wrote "12–20% faster on ARM, on par or slightly ahead on x86, and it loses in some configs."

> **When to use it**
> Running local RAG on Apple Silicon (ARM) with a corpus that keeps growing, where rebuilds are a burden. It's a one-liner — `pip install turbovec` — and for high-dim OpenAI embeddings it's comparable to or better than FAISS at 2–4 bits. But **avoid the low-dim (d≈200) + 2-bit combination** — that's the regime the repo itself says it loses.

The fundamentals of evaluating OSS in the AI era are the same as #18: **read the primary source, not the README.** But there's one more layer to this lesson — the primary source (the repo) was honest, and the **secondary coverage on top of it lied.** The thing you need to crack open isn't only the code.

---

## The Genuinely Interesting Signal — A Paper Switched Lanes

Here's what I actually wanted to talk about.

The TurboQuant paper was **not originally about RAG vector search.** Read the [Google Research blog](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) and the paper, and the primary target is **KV-cache compression for LLM inference** — shrinking the key-value cache that attention accumulates to 3 bits, saving 6× memory and making attention up to 8× faster on H100s. Tellingly, the first community implementations ([OnlyTerp/turboquant](https://github.com/OnlyTerp/turboquant), [hackimov/turboquant-kv](https://github.com/hackimov/turboquant-kv)) are all **KV-cache** implementations.

But RyanCodrai bolted the same quantization onto a **RAG vector index.** A completely different use case. KV cache is inference acceleration *inside* the LLM; vector search is retrieval infrastructure *outside* it.

Why was this possible? **Because it's data-oblivious quantization.** Had the codebook been tied to KV-cache data, you couldn't move it to vector search. Since the math comes from a distribution (Beta), it works just as well on 1536-dim embeddings. The problem the paper set out to solve and the problem the solo developer solved are different — and yet, **because the math doesn't depend on the data, it could switch lanes.**

There's a lineage here.

> QJL (AAAI 2025) → PolarQuant (AISTATS 2026) → **TurboQuant (ICLR 2026, for KV cache)** → **TurboVec (community OSS, repurposed for RAG search)**

A paper Google Research published to speed up LLM inference became RAG infrastructure in an individual's hands within months. And then it morphed, in the press, back into "Google's RAG tool." The distance from paper to product has never been shorter — or blurrier.

---

## So What Do We See

**① Be suspicious of "Google did X" — research and product are not the same.**
What Google did was **publish the math** of data-oblivious quantization. The thing that turned it into a RAG tool is a 5.8k-star solo repo. A paper drops, community implementations attach within days, and those get reported under the original author's name — that flow is now the default. Always double-check the subject of the headline.

**② The demand was a removed operational step, not speed.**
What gathered the stars wasn't the 12–20% number — it was the sentence "you don't have to look at train." Compression ratio and speed are figures in a comparison table, but what people actually bought is **one step gone from operations entirely.** Read a tool's value through benchmark numbers alone and you'll miss why the stars showed up.

**③ Data-oblivious math switches lanes — a new path from paper to product.**
TurboQuant crossing from KV cache to vector search wasn't an accident; it's the inevitability of being data-oblivious. An algorithm not bound to data crosses domains *and* use cases. From now on, "what problem was this paper written to solve" and "where else could this math leak into" are two different questions — and the latter is often the bigger market.

---

## Closing

I set out to check just one thing: is 31GB→4GB real? The compression was real (with the repo honestly documenting its own limits). But after cracking it open, the image that stays with me is a different one.

**Google shipped math, a solo developer built a tool, and the press collapsed the two into "Google did it."** And in between, the real signal is this — a paper written for LLM inference switched lanes into RAG search because of a single property: it doesn't depend on the data. Compression for the inside of the model (KV cache) and compression for the outside (vector search) have started to share the same math.

In [#18](/blog/18-headroom/) I wrote "read the code, not the README." This time I'll add one line — **the code can be honest while the coverage on top of it lies.** The habit of going down to the primary source is becoming an increasingly expensive skill in an era where AI turns a paper into a product in days.

---

## References

- [TurboVec (RyanCodrai/turbovec)](https://github.com/RyanCodrai/turbovec) — TurboQuant-based Rust vector index (Python bindings, MIT)
- [TurboQuant — Google Research blog](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) · [Paper (ICLR 2026, OpenReview)](https://openreview.net/pdf/6593f484501e295cdbe7efcbc46d7f20fc7e741f.pdf)
- [OnlyTerp/turboquant](https://github.com/OnlyTerp/turboquant) · [hackimov/turboquant-kv](https://github.com/hackimov/turboquant-kv) — community KV-cache implementations
- Related: [Cracking open Headroom from a Netflix engineer](/blog/18-headroom/) · [Real developer demand, read through 4 trending repos](/blog/17-maps-and-skills/) · [Search Is No Longer for Humans](/blog/19-search-for-agents/)
