---
title: "How a Chunking Library Made It to YC — What Sold Wasn't Smarts, It Was Lightness"
summary: "In RAG tutorials, chunking is the one-line preprocessing chore. A library that does only that step now pulls 1.19 million monthly downloads, and its two creators went through Y Combinator. The interesting part comes after: the '33x faster' claim was against the slowest competitor (1.06x against the leader), '100GB/s' is what you get when you stop counting tokens entirely, and the founder himself admitted on HN that 'perfect splits don't move the needle much' for retrieval quality. Downloads kept climbing anyway. Against a research landscape that keeps confirming semantic chunking can't beat plain recursive splitting, this post dissects what people were actually buying, why long context didn't kill chunking, which of the 11 chunkers to pick, and how the company pivoted away while the library stayed."
date: "2026-08-13T10:00:00"
tags:
  - rag
  - retrieval
  - chunking
  - open-source
  - context-engineering
draft: false
---

In RAG tutorials, chunking is a one-line step. Split the document into 512-token pieces, done. It's the least glamorous chore in the pipeline diagram — and yet a library that does only that chore pulls **1.19 million monthly downloads** on PyPI, and the two people who built it went through Y Combinator and started a company. This is about [Chonkie](https://github.com/feyninc/chonkie), the one with the hippo mascot.

This post is not a code review. It's an autopsy of the demand that turned a chore into a company. Fair warning: the conclusion is twisted — **the tool got famous on speed and smarts, but what actually sold was neither.** And nobody knows that better than the founders.

---

## 1,700 stars in three weeks — the demand was already there

It started in November 2024, when Bhavnick Minhas, then an early-career ML engineer, posted [a personal project to Show HN](https://news.ycombinator.com/item?id=42100819). The motivation is in the first line: he was tired of rewriting chunking code for every RAG application, because existing libraries were "either too bloated (80MB+) or too basic, with no middle ground." The repo crossed 1,700 stars in three weeks.

What followed is the standard course for open source becoming a company. Shreyash Nigam — a childhood friend and former Google engineer — joined, they [returned to HN as a YC X25 launch](https://news.ycombinator.com/item?id=44225930) in June 2025, and raised a $500K seed. As of July 2026 the repo sits at 4,600 stars (a figure that restarted from zero after a repo migration in early 2025), and [monthly PyPI downloads tripled in half a year](https://pypistats.org/packages/chonkie), from 384K in February 2026 to 1.19M in July.

The competitors corroborate the demand. LangChain long ago split its text splitters into a standalone `langchain-text-splitters` package, and while the 1.0-era restructuring pushed legacy code out into `langchain-classic`, that one package survived. The framework camp itself conceded that chunking is a part you can detach from the chassis. Chonkie took that part and sold it à la carte: a 15MiB base install — [a fifth of LangChain's 80MiB and a tenth of LlamaIndex's 171MiB](https://github.com/feyninc/chonkie/blob/main/BENCHMARKS.md) — with zero external dependencies for the basics. Not wanting to drag in an 80MB framework: that was the first demand.

## The speed numbers, dissected — 33x, 100GB/s, 1TB/s

The README's boast is speed. Token chunking is **"33x faster than the slowest alternative,"** and that sentence deserves to be read with its conditions attached. In [their own benchmarks](https://github.com/feyninc/chonkie/blob/main/BENCHMARKS.md), on the Paul Graham essays dataset, LlamaIndex takes 272ms and Chonkie 8.18ms — that's your 33x. But in the same table, LangChain takes 8.68ms. Against the leader, that's **1.06x** — effectively a tie. During the first viral wave, HN commenters pointed out exactly this ("the speedup compared to the 2nd is only 1.06x") along with a methodological gripe that only Chonkie got a warm-up run. The README's honest phrasing — "slowest alternative" — is what defense it has.

The flashier numbers arrived in 2026. FastChunker, added in January's v1.5.2, advertises **"100+ GB/s"** via SIMD acceleration, and [chunk](https://github.com/feyninc/chunk), the Rust library underneath it, claims "the entire English Wikipedia in 120ms" and up to **1TB/s of "semantic" chunking.** Note the scare quotes around semantic — this isn't embedding-based semantic splitting; it's wordplay for "splits at meaningful boundaries," i.e., punctuation. Read [the FastChunker docs](https://docs.chonkie.ai/oss/chunkers/fast-chunker) and the mechanism is plain: it never counts tokens at all, scanning for delimiters by byte offsets, and the returned chunks report `token_count` of 0, always. The secret of the speed isn't a faster algorithm — **it's deleting the token-counting work entirely.**

When Bhavnick's write-up of the optimization work, ["So, you want to chunk really fast?"](https://minha.sh/posts/so,-you-want-to-chunk-really-fast), hit the HN front page in January 2026, the argument landed precisely there. One commenter ended it with Amdahl's law: a really fast embedder processes about 1.6GB/s, **two orders of magnitude** below the chunker — "Chunking is not the bottleneck." Others added that chunking is usually a one-time job where nobody is latency-sensitive anyway. Shreyash's reply is the interesting part: not a rebuttal but a half-concession. Chunking speed does become a bottleneck "as the number of files to ingest grows" — meaning even the makers agree the speed only matters for bulk ingestion of large corpora or periodic reindexing, not for building an ordinary RAG system.

## The founder's confession and the research consensus — smart chunking doesn't earn its keep

In the same thread, Shreyash left a more important sentence: **"In our experience, retrieval accuracy is mostly driven by embedding quality, so perfect splits don't move the needle much."** The founder of a chunking company conceding the limits of chunking's usefulness — and the sentence lines up exactly with what the empirical research keeps finding.

Start with the field's standard citation, [Chroma's evaluation of chunking strategies](https://www.trychroma.com/research/evaluating-chunking) (July 2024): the recall gap between strategies is **up to 9 percentage points.** Not nothing — notably, the default from OpenAI's example code (800 tokens, 400 overlap) measurably underperforms, so "don't copy defaults blindly" is a real lesson. But the direction matters: the expensive option wasn't the one winning. The paper asking ["is semantic chunking worth the computational cost?"](https://arxiv.org/abs/2410.13070) (NAACL 2025 Findings) answered no across three tasks — the cost isn't justified by consistent gains, and fixed-size chunkers frequently win. [A February 2026 benchmark](https://www.firecrawl.dev/blog/best-chunking-strategies-rag) across 50 academic papers put recursive 512-token chunking first at 69% accuracy while semantic chunking, shredding documents into fragments averaging 43 tokens, managed 54%. Follow-up studies in [May](https://arxiv.org/abs/2606.00881) and [July 2026](https://arxiv.org/abs/2607.01852) reconfirmed the direction. The 2026 practitioner consensus is accordingly anticlimactic: **recursive, 400–512 tokens, 10–20% overlap.** That's the default.

So where did the "smarts" go? Into the embedding models. The lineage that fixes chunks losing document context at the encoding stage rather than in the chunker — Jina's [late chunking](https://arxiv.org/abs/2409.04701), Anthropic's [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval), which prepends LLM-generated document context to each chunk and cut retrieval failure rates by 49%, and Voyage's [voyage-context-3](https://blog.voyageai.com/2025/07/23/voyage-context-3/), which claims to absorb that correction into the model itself. Research moved from agonizing over where to cut toward making the cut pieces remember their context.

Put Chonkie's product lineup against this landscape and it all makes sense. Six of the eleven chunkers (Token, Fast, Sentence, Recursive, Code, Table) run on local computation alone, and even SemanticChunker's default embedding is a local static model that never calls an API. There is an LLM-powered agentic chunker (Slumber), but it isn't the default. **The thing that sells isn't "smarter chunking" — it's "well-tuned simple chunking, light and fast,"** and the lineup shows the makers built it knowing that.

## Long context didn't kill chunking

One objection remains: in the era of million-token context windows, doesn't cutting become pointless? Half true. Anthropic's contextual retrieval post recommends that **knowledge bases under 200K tokens (roughly 500 pages) skip RAG entirely** and go into the prompt whole — for small corpora this is already standard practice.

Cross that line, though, and chunking comes back under a different name. A study in early 2026 reported a **context cliff** — quality drops sharply once retrieval units grow past roughly 2,500 tokens. Being able to fit something and the model digesting it are different things. That's precisely the number from [#46](/blog/46-is-graphrag-needed/): retrieval can bring in 83.5% of the ground-truth evidence while the model uses only 47.9%, and evidence placed deep in the context dies. If the design of your retrieval unit is the design of your context layout, chunking isn't a preprocessing chore — it's the front door of context engineering.

The agentic-retrieval reshuffle demotes chunking rather than deleting it. The death declared in LlamaIndex's May 2025 post ["RAG is dead, long live agentic retrieval"](https://www.llamaindex.ai/blog/rag-is-dead-long-live-agentic-retrieval) is single-shot top-k chunk retrieval, not chunking — in an architecture where an agent routes between chunk search, metadata search, and whole-file reads, the chunk steps down to one retrieval unit among several, yet remains the default one. [RAGFlow's 2025 year-in-review](https://ragflow.io/blog/rag-review-2025-from-rag-to-context) goes a step further, naming the industry direction as a dual-granularity split: Search (locate precisely with small chunks) versus Retrieve (assemble context with large ones). Either way, "what should the retrieval unit be" survives as a design question — promoted, if anything.

## In practice: which of the 11 chunkers to pick

Chonkie's practical value is that all eleven are swappable behind one interface. Group them by cost structure and the choice gets clear.

| Cost tier | Chunkers | Notes |
|---|---|---|
| Local computation only | Token, Sentence, Recursive, Table | Default candidates. Recursive is the de facto standard |
| Local computation (special) | Fast, Code | Fast never computes `token_count` (always 0); Code is AST-based, 100+ languages |
| Local model inference | Semantic, Late, Neural | Embedding/BERT inference cost. Semantic's default model is a static embedding, no API calls |
| API calls | Slumber (LLM), TeraflopAI (external API) | Billed in proportion to document volume. Only after evals prove it |

The recommended order simply follows the research consensus.

**1. Default to recursive 512 with 10–20% overlap.** There is no empirical reason to start anywhere else. In Chonkie, start from a language recipe:

```python
from chonkie import RecursiveChunker

chunker = RecursiveChunker.from_recipe("markdown", lang="en")
chunks = chunker("...document...")
```

This recipe system is what the README's "56 languages" actually means — the algorithm doesn't understand languages; per-language delimiter and split-rule sets are maintained as a Hugging Face dataset. For languages where sentence boundaries don't reduce to periods (Korean sentence-final endings, for instance), eyeball the recipe's output before trusting it. And for non-English retrieval quality, the bigger lever is usually the embedding side, as covered in [#42](/blog/42-korean-embeddings/).

**2. Codebases get CodeChunker.** Cutting at function and class boundaries via AST is one of the rare cases that's unambiguously better than fixed sizes.

**3. FastChunker for bulk ingestion only.** It earns its keep exactly under the condition the founder conceded: initial loads of corpora in the hundreds of gigabytes, or periodic reindexing. It returns no token counts, so it can't be mixed with token-budget logic.

**4. Semantic-family chunkers only after they win an eval.** Measure retrieval failure and generation failure separately, as laid out in [#34](/blog/34-sufficient-context/), and only when the evidence says chunking is your bottleneck, A/B the expensive chunker against recursive. Invert the order — turn on the pricey chunker first — and you get the spend the studies keep describing: certain cost, uncertain benefit.

**5. If you want ingestion in one chain, use Pipeline.** It plugs straight into ten vector databases (Chroma, Qdrant, Weaviate, Milvus, pgvector, Pinecone, Elasticsearch, MongoDB, Turbopuffer, LanceDB) via handshakes.

```python
from chonkie import Pipeline

docs = (Pipeline()
    .fetch_from("file", dir="./knowledge_base", ext=[".txt", ".md"])
    .chunk_with("recursive", chunk_size=512)
    .refine_with("overlap", context_size=100)
    .store_in("qdrant", collection_name="knowledge", url="http://localhost:6333")
    .run())
```

Outside Python, or as a shared team service, a single `docker compose up` brings up a self-hosted REST API — no auth, no billing, no data leaving your infrastructure.

## The company pivoted; the library stayed

The last piece is the company. As of July 2026, chonkie.ai redirects to usefeyn.com, and the [YC profile now reads Feyn](https://www.ycombinator.com/companies/feyn) — a company that "trains custom models on your data." The legal entity is still Chonkie, Inc.; the signboard and the main business changed. A public price list for the chunking cloud never appeared.

When Launch HN asked "how do you make money off open source," the founders answered managed ETL — but the market's answer turned out different. **Chunking opens downloads, not wallets.** Being a single-purpose utility with 1.19 million monthly downloads was both the reason for the love and the ceiling on monetization, and the money was one floor up (custom models). Reading v1.7.0's integration of LiteParse — a lightweight parser from the LlamaIndex camp, the perennial loser in Chonkie's benchmark tables — as a preprocessing Chef fits the same story: the à-la-carte-versus-framework fight is marketing, and the actual ecosystem is parts suppliers to each other.

From a user's chair, the ledger reads like this. The library itself is MIT, actively maintained (eleven releases in 2026 alone), and runs local-only, so lock-in risk is small. But it's worth writing down that this is the open source of a company whose main business has moved on — nothing guarantees today's release cadence holds.

## What to ask before you cut

Before spending anything on chunking — compute or API calls — there are three questions. Does the corpus exceed 200K tokens? If not, don't cut; feed it whole. If it does: when you measure retrieval failure and generation failure separately, is there evidence chunking is the bottleneck? If there is: did the expensive chunker actually beat recursive 512 on your eval?

Few cases pass all three, which is why most answers converge on "recursive 512, 15% overlap." Chonkie's honest usefulness lives there, not in the flashy numbers — **it lets you do that inherently simple job without an 80MB framework, from a 505KB wheel, with per-language recipes.** If [#46](/blog/46-is-graphrag-needed/)'s question was "are you even using the evidence you fetched," this one comes a step earlier: is the money you spend on cutting earning its keep? Both point the same way — before buying a more sophisticated tool, measure the one you have.
