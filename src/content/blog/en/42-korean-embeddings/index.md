---
title: "Still Using bge-m3 for Korean Embeddings? — ko-embedding-leaderboard and a Changing of the Guard"
summary: "When building Korean RAG, the question that comes up as often as 'which vector DB' is 'which embedding model.' Opening the MTEB leaderboard doesn't answer it — a multilingual average score says nothing about Korean retrieval quality. Korean-only leaderboards like ko-embedding-leaderboard exist to fill exactly that gap. Reading the rankings breaks a few pieces of conventional wisdom: bge-m3, the long-standing default, has slipped to 8th, and first place is a 0.65-point contest between a 568M Korean fine-tune and a 4B frontier model. This post covers why Korean needs its own leaderboard, the three things to actually read in the rankings, and how to choose a Korean embedding model today."
date: "2026-07-28T10:00:00"
tags:
  - embedding
  - retrieval
  - rag
  - korean-nlp
  - benchmark
draft: false
---

This is another entry in the series where I crack open trending open source. As always, the starting point isn't "is this code any good" but **"why did people want this."** [ko-embedding-leaderboard](https://github.com/OnAnd0n/ko-embedding-leaderboard) is a Korean embedding model leaderboard maintained by an individual. It customizes MTEB with Korean datasets, measures the retrieval performance of open-source embedding models, and publishes the rankings in a README. The star count is still in the double digits, but it answers a question every builder of Korean RAG runs into, which makes it worth a look.

---

## Why Korean needs its own leaderboard

The first thing anyone choosing an embedding model opens is Hugging Face's [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). And that's usually where they get stuck. The top ranks are occupied by multi-billion-parameter multilingual models, and those scores are averages across dozens of languages. **A high multilingual average and good Korean retrieval are two different claims.** It has been repeatedly observed that multilingual models score well on translated benchmarks and then degrade badly on native Korean data. Translated benchmarks carry English sentence structure into Korean text, so their distribution is nothing like the queries actual Korean users type.

So the same question keeps reappearing in Korean dev communities: "Looking for an embedding model that's actually good at Korean." MTEB can't answer it, vendors' own benchmarks aren't trustworthy, and so a third-party ranking measured under identical conditions becomes necessary. The proof that the demand is real is that supply showed up more than once: besides this leaderboard, there's [su-park/mteb_ko_leaderboard](https://github.com/su-park/mteb_ko_leaderboard), plus MTEB-ko-retrieval, which a Korea University lab released alongside their KURE model. Several people independently started scratching the same itch.

The methodological decision worth noticing in ko-embedding-leaderboard is the one made in version 2: **it dropped clustering and NLI evaluation and kept only retrieval (IR).** Models are ranked by the mean of NDCG@5 and NDCG@10 across seven Korean retrieval datasets (multi-hop QA via Ko-StrategyQA, AutoRAGRetrieval spanning finance/public-sector/medical/legal documents, public health QA, legal retrieval, web FAQs, Korean SQuAD, and MIRACL with hard negatives). The maintainer doesn't explain the cut at length, but the market explains it for them: in 2026, people choosing an embedding model have effectively one goal — RAG retrieval quality. The reason embeddings exist is no longer a sentence-similarity score but "does it rank the right document at the top for my query," and the leaderboard trimmed itself down to match.

---

## Three things to read in the rankings

As of July 2026, the dense embedding top ranks look like this:

| Rank | Model | Avg NDCG |
|---|---|---|
| 1 | perplexity-ai/pplx-embed-v1-4b | 82.79 |
| 2 | dragonkue/snowflake-arctic-embed-l-v2.0-ko | 82.14 |
| 3 | telepix/PIXIE-Rune-v1.0 | 81.57 |
| 4 | Qwen/Qwen3-Embedding-4B | 81.37 |
| 5 | nlpai-lab/KURE-v1 | 80.76 |
| 8 | BAAI/bge-m3 | 79.30 |

**First, Korean fine-tuning is beating model size.** The #1 model, pplx-embed-v1-4b, is the 4B-parameter frontier embedding Perplexity open-sourced this February. But #2, snowflake-arctic-embed-l-v2.0-ko, is 568M — seven times smaller — and trails by 0.65 points. It's Snowflake's multilingual embedding fine-tuned on Korean data by an individual Hugging Face account (dragonkue), and the picture sharpens when you notice that the original arctic-embed-l-v2.0 sits at 7th with 80.00 on the same benchmark. **Adding Korean fine-tuning to the same model gained two points and leapfrogged the 4B models.** KURE-v1 follows the same pattern: Korea University's NLP&AI lab fine-tuned bge-m3 (79.30) on two million Korean query-document pairs and got 80.76. On the LLM side, the skeptics' view — "language-specific fine-tuning gets erased by one frontier generation" — has mostly won; in embeddings, at least, there's still a regime where specialization beats scale.

**Second, the default's shelf life has expired.** Since early 2024, bge-m3 has been "the Korean embedding you pick without thinking." Multilingual support, an 8192-token context, respectable Korean performance — it was the safe default for a long time, and most Korean RAG tutorials still use it in their examples. That bge-m3 is now 8th — a point and a half below KURE-v1, which was fine-tuned *from* it. The point isn't that it became a wrong choice; it's that between 2024, when the "just use bge-m3" heuristic formed, and now, the option set has been completely replaced. If your RAG stack started life as a copy-pasted tutorial, there's a good chance a two-year-old answer is fossilized in the embedding slot.

**Third, a 30-point variance hides behind the average.** Take the same #1 model and look per-dataset: 93.91 on Korean SQuAD, 65.60 on MIRACL with hard negatives. On the dataset seeded with difficult near-miss candidates, every model slumps into the 60s, and legal retrieval tops out in the mid-70s. While the top five are separated by single points, the spread across domains is measured in tens of points — and for practitioners that's more important information than the ranking. **If your corpus is dominated by domain terminology — legal, medical — a one-point gap in the leaderboard average can easily invert on your data.**

One more thing: the mere existence of a separate sparse table next to the dense one is itself information. Korean SPLADE-family models score 77–78, overlapping the dense mid-tier, but their output is per-token weights — you can drop them straight onto an inverted index like Elasticsearch and inspect exactly which tokens matched. For an organization that already runs keyword search infrastructure, that's a path to better retrieval without adopting a vector DB, and it's also the raw material for hybrid search alongside dense vectors. In [pgContext (#41)](/blog/41-pgcontext/) we watched hybrid search move inside the database extension; the candidates lining up to replace BM25 on the sparse side of that hybrid are sitting right here.

---

## Who's building these

Just skimming the organization names in the rankings paints an interesting picture. The top ranks are filled by big tech's multilingual models (Perplexity, Qwen, Snowflake, Google), one university lab (KURE), and — **individual accounts and small Korean startups.** The #2 model is an individual's fine-tune. TelePIX, the company behind #3 PIXIE-Rune and the sparse-table leader PIXIE-Splade, is a satellite imagery analytics company by trade. And the author behind KURE has also personally published a Korean SPLADE model (splade-ko-v1).

The structure tells you something. Big tech doesn't build embeddings for Korean specifically; Korean is always one of 74 languages a multilingual model covers, and the gap between that coverage and real-world quality is being filled by one lab, a few individuals, and a few startups doing fine-tuning. Counting the leaderboard maintainer, Korean retrieval quality is a public good that effectively runs on a handful of volunteers. The flip side: the barrier to entry is low. Rank #2 is living proof that with a good base model and well-built Korean training data, an individual can put their name next to a 4B frontier model.

---

## In practice: choosing a Korean embedding today

Having read the rankings, here's how to turn them into a decision.

**1. The default is one of the two 568M Korean fine-tunes.** snowflake-arctic-embed-l-v2.0-ko or KURE-v1. Both are 1024-dimensional with 8192-token contexts, serve directly via sentence-transformers, and fit comfortably on a single GPU. The former scores 1.4 points higher, but that's within the range that flips by domain — split the tie on license and your own evaluation data. For the 4B class (pplx-embed, Qwen3-Embedding-4B), start by calculating whether one or two points is worth multiplying your serving cost and latency. One variable: pplx-embed ships with native INT8 quantization, so its memory footprint is light for a 4B.

**2. Don't forget the options that aren't on this leaderboard.** Only open source is evaluated here. API embeddings from OpenAI, Voyage, or Upstage are out of scope — so #1 means "best among open source," not "best, period." That said, API embeddings bill you every time your corpus grows, and switching embeddings means re-indexing everything — vendor lock-in accumulates one vector at a time. Put that on the scale too.

**3. Build a 100-query evaluation set from your own data.** In a world of 30-point domain variance, deciding by someone else's one-point average gets the order of operations wrong. Take 100 real user queries (or projected ones if you have none), label the correct documents, and measure NDCG@10 with two or three candidate models — it takes a day. Swapping an embedding model means re-indexing your entire corpus, so the decision gets more expensive the later you unwind it. Spending a day up front is the cheap path.

**4. Read benchmark scores as reference points, not upper bounds.** Public evaluation datasets can leak into training data, and the fiercer the leaderboard competition gets, the stronger the incentive to overfit the benchmark. Use the rankings to narrow the field to three candidates; make the final call with the evaluation from step 3.

---

## What to watch

If [#41](/blog/41-pgcontext/) was about "where do the vectors go" converging on Postgres, this one showed that "what makes the vectors" has not converged for Korean. Multilingual frontier embeddings refresh every six months, and each time, Korean fine-tuners layer a specialized version on top within weeks. As long as that rhythm holds, the default answer stays "the Korean fine-tune of the latest multilingual model," not "the latest multilingual model."

Two variables to watch. One: does a frontier multilingual embedding eventually absorb the Korean fine-tuning advantage outright (pplx-embed taking #1 with no Korean fine-tuning may be an early sign)? Two: the sustainability of this volunteer infrastructure. The leaderboard and much of the top of the table run on individuals' spare time, and if those people burn out, the map of Korean embeddings goes back into the fog. It's a rare corner of the ecosystem where a GitHub star or an evaluation-request issue is a genuinely meaningful contribution.
