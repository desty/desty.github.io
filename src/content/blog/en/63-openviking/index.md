---
title: "OpenViking code analysis: find agent memory by path and read only as deep as needed"
summary: "ByteDance Volcano Engine's OpenViking stores agent memories, documents, and skills as directories under viking://. Instead of stuffing vector hits into the prompt, an agent checks L0/L1 summaries and opens L2 only when needed. This reads the retriever, session extractor, and harness attachment points at the 12 September 2026 commit."
date: "2026-09-13T10:00:00+09:00"
tags:
  - context-engineering
  - agent-memory
  - rag
  - open-source
  - bytedance
draft: false
---

Give an agent last week's conversation and one of two things usually happens. The session log is pasted into the prompt, or chunks go into a vector store and a handful of near neighbours come back. The first fills the window. The second can use namespaces or metadata filters to restrict results by project and user, but it does not by itself give the agent a path-based walk from summaries to source files.

[OpenViking](https://github.com/volcengine/OpenViking) puts that context on a `viking://` virtual filesystem. An agent uses `ls`, `tree`, `read`, and `write`, checks a directory summary for relevance, then opens the original file. It is open source from ByteDance's Volcano Engine Viking team. The main project is AGPLv3.

This article is a reading of the retriever, filesystem service, and session extraction code at commit [`0f77ab5`](https://github.com/volcengine/OpenViking/tree/0f77ab5) on 12 September 2026. It is not a measurement from a running server. LoCoMo and tau2-bench figures are vendor results from the project README and the [benchmark write-up](https://blog.openviking.ai/post/openviking-benchmark-results/).

[Context engineering](/en/blog/30-context-engineering/) argued that a larger window still leaves the problem of what to load. OpenViking is an implementation that moves that choice onto paths and layers. It is a different layer from a company-wide brain ([Cerebras](/en/blog/37-company-brain/)) or vector search beside operational data ([TencentDB](/en/blog/50-tencentdb-agent-memory/), [DynamoDB](/en/blog/55-dynamodb-vector-search/)). The question here is **which directory, at which depth**, the agent reads.

## Context as directories

The root looks roughly like this:

```
viking://
├── resources/     # docs, repos, pages
└── user/{id}/
    ├── memories/  # preferences, entities, events, experience
    ├── resources/
    ├── skills/
    └── peers/
```

`FSService` exposes `ls`, `mkdir`, `rm`, `mv`, `tree`, `stat`, `read`, `grep`, `glob`, plus `abstract` and `overview` for directory summaries. To the agent the tools are file commands. `classify_uri` decides whether a URI is memory, resource, or skill.

The vector index does not hold file bodies. Storage splits content from an index of URIs, vectors, and metadata. Search picks candidate paths; `read` loads content.

## Check a summary, then open the source

Each directory can carry generated sidecars:

- L0 `.abstract.md` — one-line summary, for relevance
- L1 `.overview.md` — structure and use, for deciding what to open
- L2 original — only when needed

Only those two filenames are machine sidecars. Ordinary Markdown frontmatter stays user content. That split is explicit in `abstract_overview.py`.

`HierarchicalRetriever` runs search. Explicit target directories bound the walk; otherwise it starts from tenant defaults (`default_target_directories`). THINKING mode is used when rerank is configured, otherwise QUICK. QUICK takes a wide vector candidate set. THINKING walks children with at most four parallel searches. If a directory's score exceeds the best child by 1.2×, the directory is kept.

The first retrieval question is which directory to search, not how similar a chunk is. That design sits next to the [Directory-Aware Query](https://arxiv.org/abs/2606.16903) paper. This article does not verify that the public tree implements that paper's TrieHI unchanged.

For a team on ordinary RAG, the difference is this. Chunk search stores the source path as metadata. In OpenViking the path is the lookup API.

The walk below is an example constructed for this article, not output from a running server.

```
ov find "upload auth" --uri viking://resources/my_project/
```

If the hit is `viking://resources/my_project/docs/api/.overview.md`, the agent reads L1 first. If that overview describes the auth flow, it `read`s `auth.md` (L2) in the same directory; if not, it stops there. The layers exist so the original file is not opened first.

## When a session ends, memory is written into directories

Growing the prompt during a chat and extracting memory when the session closes are different loops. OpenViking archives a committed session and starts background extraction.

The extractor is the ReAct loop in `extract_loop.py`. One model call with memory tools creates, merges, or skips files. Comments point at the VikingBot agent loop. The default output cap is 32,768 tokens, because extraction may rewrite a whole memory file; a provider default such as 4,096 would truncate it.

Policy chooses create, merge, or skip. A canned refusal in the model output is treated as a refusal even when it is not JSON. Operational-data memory ([TencentDB](/en/blog/50-tencentdb-agent-memory/)) is closer to *what* to store. This loop is *which path and which operation* after the session ends.

Do not assume the loop writes useful memory by default. It needs an embedding model, a VLM, and a policy. `openviking-server init` selects providers. The docs list Volcengine, OpenAI, Codex OAuth, Kimi, GLM, and local Ollama.

## Attaching it to a harness

Claude Code and Codex attach through the repo's memory plugin. `examples/claude-code-memory-plugin/hooks/hooks.json` injects a profile on `SessionStart`, recalls on each `UserPromptSubmit`, and commits on `Stop`, `SessionEnd`, and `PreCompact`. The integration doc matches that: search before every prompt, capture after each reply, inject an index at session start. Claude and Codex share the installer. OpenClaw is described as a context engine, Hermes as built-in, [DeepSeek Harness](/en/blog/64-deepseek-harness/) as plugin plus MCP. Partners include [LoopX](/en/blog/51-loopx-state-kernel/) and [Hermes](/en/blog/15-hermes-vs-openclaw/), both covered here before.

The harness change is not a model swap.

| Where the current setup stalls | Configuration to change | Result to inspect |
|---|---|---|
| Past chats are pasted into the prompt | Commit the session; read memory paths | Input tokens and supporting URIs on the same question |
| Vector top-k with no enforceable source | Pin `find`/`search` to a project or user directory | Whether another project's memory leaks in |
| The agent always reads full files | Restrict tools so L0/L1 is read first | L2 `read` count and missing evidence |
| Extraction runs in the middle of a turn | Have the host wait on or notify commit/extract | Failures, refusals, skipped merges |

Pick one recurring task. Run the current memory (pasted chat, mem0, native agent memory) as a baseline, then the OpenViking setup against the same completion rule. Record hits together with input tokens, L2 reads, and evidence taken from the wrong directory.

## Constraints before adopting it

The open-source server has no activation key. It is AGPLv3. Network use of a modified server can trigger source-disclosure duties. The CLI crate and examples are Apache 2.0. Legal review belongs in front of a proprietary harness. Volcengine hosting and a licensed self-managed edition exist separately.

The LoCoMo and tau2 figures in the README are not reproduction conditions for this article. The vendor evaluation lists OpenClaw native 24.20% versus OpenViking 82.08%, Hermes 33.38% versus 82.86%, Claude Code 57.21% versus 80.32%, with input tokens down 34.3–91.0%. tau2-bench experience memory is +6.87pp retail and +11.87pp airline versus the same LLM without memory. Embeddings and the VLM are Doubao models. That gap is not a result for a Claude or Codex setup, Korean logs, or another embedder.

The server needs an embedding model and a VLM. Summaries, extraction, and search depend on both. In a local-only environment, choose those providers first. Multi-tenant accounts and ACLs are documented; the default is localhost.

The filesystem metaphor does not make the permission model identical to files. `_may_include_memory_content` uses URI classification to decide whether a public subtree read can include memory files. Restrict the `read` root in the host.

## Where this sits on this site

OpenViking is not another vector database. It is a store where an agent **selects context by path, filters with summaries, and writes directories after a session**. Window size is covered in [context engineering](/en/blog/30-context-engineering/) and the [RAG guide](/en/guides/rag/). This article answers the next question: what you can drop from the prompt once the harness can treat memory locations as files.

Use it where Claude or Codex already runs and the same project briefing is pasted every session. Vector search beside operational transactions is a different problem. Keep the two products apart.
