---
title: "One More Reason to Run a Separate Vector DB Just Disappeared — What DynamoDB's Native Vector Search Deleted Is the Pipeline"
summary: "On August 5, AWS shipped native vector search in DynamoDB — no preview, straight to GA. You store embeddings next to your operational data and run similarity search in place through a single SearchVectors API. The previous official answer, the zero-ETL OpenSearch chain, spanned five services, and ScyllaDB spent three months mocking exactly that before AWS erased the attack surface. The GA makes the real demand legible: not better ANN, but one less system to operate. This post covers the fine print behind 'any scale' (the SearchSchema partition key is your cost design), the traps in the agent-memory use case (eventual consistency, no FGAC), the constraints the announcement doesn't mention — on-demand only, equality-only filters, no pagination — and how to choose between DynamoDB, S3 Vectors, OpenSearch, and Postgres."
date: "2026-08-09T18:00:00"
tags:
  - vector-database
  - rag
  - retrieval
  - agent-memory
  - aws
  - serverless
draft: false
---

When I wrote in [#41](/blog/41-pgcontext/) that the reasons to run a separate vector database are disappearing, the subject of that sentence was Postgres. On August 5, AWS finished the sentence from the serverless NoSQL side: [DynamoDB announced native vector search at GA](https://aws.amazon.com/blogs/aws/amazon-dynamodb-now-supports-real-time-vector-search-at-any-scale/) — no preview stage, live in every commercial region and GovCloud (US) simultaneously. You store embeddings in the same table as your operational data and run similarity search in place, with no replication to an external vector store. AWS's headline numbers: single-digit millisecond latency at 99%+ recall, scaling to trillions of vectors.

Launch numbers live on the border between marketing and fact, as always. This post tries to do two things. First, read what demand this release actually answers — spoiler: what people wanted was not a search feature but the deletion of a pipeline. Second, scrape together the conditions and traps the announcement doesn't mention. "Any scale" comes with fine print, and that fine print is your cost design.

---

## What Shipped — No New Type, No New Service

The first thing that stands out is how conservative the design is. There is no new data type for vectors. Embeddings are stored as the existing **List of Numbers** via plain `PutItem`, held at f32 precision inside the index. Index definition isn't a new API either — it's a `VectorIndexes` parameter added to the existing `CreateTable`/`UpdateTable`. Add an index to an existing table and the backfill runs free of charge.

What's new is the read path. Vector indexes accept neither `Query` nor `Scan` nor PartiQL; you read them exclusively through the new **`SearchVectors` API**. Give it a query vector, a TopK (up to 100), and optional filter conditions, and it returns results ranked by similarity score. The spec ceiling: 4,096 dimensions, five vector indexes per table. Three distance functions — COSINE, DOT_PRODUCT, EUCLIDEAN — and **you cannot change the function after creation.** AWS has not disclosed the underlying algorithm; the docs say only "approximate nearest neighbor."

```python
# Index definition — one parameter on the existing CreateTable
dynamodb.create_table(
    ...,
    VectorIndexes=[{
        "IndexName": "MemoryIndex",
        "VectorAttribute": {"AttributeName": "embedding"},
        "Dimensions": 1024,
        "DistanceFunction": "COSINE",
        "Projection": {"ProjectionType": "ALL"},
    }],
)

# Search — the dedicated API
response = dynamodb.search_vectors(
    TableName="AgentMemories",
    IndexName="MemoryIndex",
    SearchVector=query_embedding,
    TopK=5,
)
```

Embedding generation is your problem. Whether you use Bedrock's Titan or Cohere or an external model, producing the vectors is on you; DynamoDB only stores and searches. That division of labor is the same as pgvector's.

## What People Wanted Wasn't Search — It Was Deletion

To see what demand this answers, recall the previous official answer. In 2024, AWS's story was the [zero-ETL OpenSearch integration](https://aws.amazon.com/blogs/database/vector-search-for-amazon-dynamodb-with-zero-etl-for-amazon-opensearch-service/): capture DynamoDB changes with Streams, take an initial snapshot via S3 export, flow it through an OpenSearch Ingestion pipeline, and search in OpenSearch. Despite the "zero-ETL" name, that's five services to manage. Five billing surfaces, five failure points, and a permanent replication lag between your operational data and your vector index.

ScyllaDB attacked that chain head-on. [On May 5 it shipped native vector search in Alternator, its DynamoDB-compatible API](https://www.scylladb.com/2026/05/05/native-vector-search-dynamodb/), and made a marketing point of the fact that vector search on AWS required stitching together multiple services with fragmented APIs. Three months later, AWS erased exactly that attack surface. A compatible-API vendor struck first and the original caught up — which is itself evidence that the DynamoDB API now behaves like a standard.

There's demand-side data too. In a survey Futurum cites, **33.4% of data professionals** named an in-database engine — not a separate vector DB — as their long-term strategy for managing embeddings for RAG and agents. It's the same picture I drew from the Postgres side in [#41](/blog/41-pgcontext/). The burden of operating one more database, the synchronization between two stores, the debugging when they drift — that is what people wanted deleted, not the last few percent of ANN recall. As basic vector storage and search commoditize into built-in features of operational databases, the dedicated vector DBs — Pinecone and company — get pushed up the stack toward advanced search features, multi-modal, and compliance.

## The Fine Print on "Any Scale" — Partition Key Design Is Cost Design

The real story the announcement doesn't tell is in the **SearchSchema**. A vector index can optionally define a vector index partition key — a low-to-medium cardinality attribute like `Category`, `Country`, or, for agent memory, `AgentId`. Define one and vectors with the same key value are stored together; each search runs only within that partition. In exchange, every `SearchVectors` call must supply that key value.

Don't define one? Every search runs against the entire index. And here it meets the pricing model. Vector search is billed not per request but by **bytes processed by the search**. As the index grows, each search examines more data, and latency and cost rise together. Conversely, with a well-chosen partition key, each search's scope stays constant as data grows. "Any scale" is the story when you've done this design. The discipline you learned avoiding hot partitions in GSIs comes back here as the thing that sets the slope of your cost curve.

Filtering arrived at half strength. Project INLINE_FILTER attributes into the SearchSchema and DynamoDB filters at the storage layer during the search — but the only supported operator is **equality (=)**. No ranges, no inequality, no IN. In [#41](/blog/41-pgcontext/) I wrote that filtering is vector search's last unsolved problem; DynamoDB is on step one of that same road.

Consistency deserves a flag too. The vector index trails base-table writes asynchronously — it is **eventually consistent**, and on global tables the vector replication and indexing stay asynchronous even on multi-Region strong consistency (MRSC) tables. Never assume an item you just wrote will appear in the next search.

## Agent Memory — AWS Named It Out Loud

In the use-case list, watch the ordering: the announcement leads with semantic retrieval on **agentic memory**. Storing conversation embeddings so agents keep context across sessions — exactly the layer covered in [#50](/blog/50-tencentdb-agent-memory/). An agent's operational state (what it's doing) and its memory (what it has experienced) now live in the same table, within the same millisecond reach. That is a real architectural shift. Futurum names it the move from passive storage to **active storage** — the frame being that keeping the reference data an agent reasons over and the action data it reads and writes in separate systems is itself a risk.

But mounting this GA under that use case means starting with two known holes. The first is the consistency point above — the pattern where an agent writes a memory and retrieves it by search within the same turn is not guaranteed. The second hurts more: `SearchVectors` **does not support fine-grained access control (FGAC).** The familiar DynamoDB pattern — many agents' memories in one table, isolated per-partition with IAM conditions — does not work for vector search. It lands exactly on the analysts' point that access control for non-human identities writing to operational databases is the next problem. The conclusion of [#50](/blog/50-tencentdb-agent-memory/) — as retrieval commoditizes, what remains is governance — got sharper with this GA, not softer. The storage and search layers are now managed infrastructure; who writes, which version is valid, and which agent gets it mounted are still upstairs problems.

## In Practice — Should You Use It, and What to Watch

Pricing has three axes, all metered separately from the base table.

| Item | Rate | Notes |
|---|---|---|
| Vector writes | $0.52 per GB | 1 KB minimum per operation, includes projected attributes |
| Vector search | $0.002 per GB processed | 1 KB minimum, billed on data examined |
| Index storage | $0.25 per GB-month | Same level as the base table |

Some arithmetic for intuition. One 1,024-dimension f32 vector is about 4 KB, so a million vectors make roughly a 4 GB index. Storage: $1 a month. Initial load: about $2 in writes. At this scale it is effectively free. The pricing page's own example: 10 writes per second (99 GB/month) costs $51.42 a month in write charges. The variable is the search side — with bytes-processed billing, hammering a large unpartitioned index makes search your dominant cost, and the slope of that curve is set by the partition key design above.

The constraints the announcement doesn't mention, collected:

- **On-demand only.** You can't create a vector index on a provisioned-mode table — switch to on-demand first.
- **No pagination.** `SearchVectors` responses cap at 16 MB with no way to continue. ALL projection plus large items plus high TopK will hit the ceiling; narrow the projection or lower TopK.
- **Much is immutable after creation.** Distance function, dimensions, the INCLUDE projection list — none can change without recreating the index. If you switch embedding models, plan on rebuilding the index.
- **No DAX, no PartiQL, no FGAC.** `SearchVectors` must bypass DAX and hit DynamoDB directly.
- **Projection bounds the response.** Attributes not projected into the index can't come back in search results. Either follow up with `GetItem` or project them from the start.

The right way to choose is by where your workload already lives. **If your operational data is already in DynamoDB,** this GA is the default candidate — an entire pipeline disappears. **If you need cold, huge, and cheap,** that seat belongs to S3 Vectors. **If you need search features themselves — BM25, hybrid search, aggregations —** it's still OpenSearch. **If you're in the Postgres camp,** this whole post read as déjà vu of [#41](/blog/41-pgcontext/) — the same convergence is simply happening once per camp. Conversely, if your workload needs to squeeze out the last few percent of recall with tuning knobs, or range filters are mandatory, a product with equality-only filters and no algorithm knobs is not yet your answer.

## What Remains

- The vector-DB consolidation story is repeating camp by camp. What pgvector did for Postgres, DynamoDB just did for serverless NoSQL. The demand is the same every time — not better search, but one less system to operate.
- "Any scale" is conditional. Search is billed on bytes processed, so the vector index partition key is your cost design, and an unpartitioned index gets more expensive to search as it grows. DynamoDB's oldest discipline applies to vectors unchanged.
- Filtering is still the last problem. An inline filter that starts with a single equality operator is the first square of the road pgvector walked; until ranges and IN arrive, filter-heavy workloads live outside this product.
- The agent-memory use case got a name but has two holes: a memory just written isn't immediately searchable (eventual consistency), and per-agent isolation can't be cut with IAM (no FGAC). Search became a commodity; governance is still yours.
- A compatible-API vendor's first strike moved the original. ScyllaDB poked the spot in May; AWS erased it in August — readable as a signal that the DynamoDB API has started to behave like a vendor-neutral standard.

No preview, straight to GA, launched in every region at once — that unusual speed is itself AWS's answer about how big it thinks this demand is. Vector search is no longer a feature race but a defaults race: wherever your operational data lives, a vector index now comes attached to the seat next to it. The territory where a separately deployed vector DB justifies itself just got narrower, and it will keep narrowing.

---

*References: [Amazon DynamoDB now supports real-time vector search at any scale](https://aws.amazon.com/blogs/aws/amazon-dynamodb-now-supports-real-time-vector-search-at-any-scale/) (AWS News Blog, 2026-08-05), [Build semantic search with native vector support in Amazon DynamoDB](https://aws.amazon.com/blogs/database/build-semantic-search-with-native-vector-support-in-amazon-dynamodb/) (AWS Database Blog), [Using vector indexes in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/VectorSearch.html) and [Requirements and limitations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/VectorSearch.Requirements.html) (developer guide — constraints, consistency, and SearchSchema are per the docs), [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/), [Native Vector Search for the DynamoDB API](https://www.scylladb.com/2026/05/05/native-vector-search-dynamodb/) (ScyllaDB, 2026-05-05), [Active Storage Takes Over](https://futurumgroup.com/insights/active-storage-takes-over-aws-dynamodb-adds-native-vector-search-for-agentic-ai/) (Futurum). The performance figures (single-digit ms, 99%+ recall) are AWS's own claims; no independent benchmarks exist yet. For the same story on the Postgres side see [#41](/blog/41-pgcontext/); for agent-memory governance see [#50](/blog/50-tencentdb-agent-memory/).*
