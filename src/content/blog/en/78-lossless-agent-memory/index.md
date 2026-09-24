---
title: "Agent Memory That Never Summarizes Still Cuts What Goes Into the Context"
summary: "As complaints pile up about coding agents forgetting their own work after context compaction, more 'lossless' memory projects are appearing. Reading the code of lossless-memory (Show HN, September 21) and the OpenClaw plugin lossless-claw shows both store every original message but cut or summarize what goes into the context. They differ in where the loss happens and on what basis. And Claude Code already saves every message and tool result locally, deleting them after 30 days. Loading 2,000 lines of synthetic log into lossless-memory and searching by date returned 650,000 characters at once. When you keep everything, the real decisions are retention period, what to keep, how things enter the context, output limits, and cache placement."
date: "2026-09-24T21:00:00+09:00"
tags:
  - agent-memory
  - context-engineering
  - claude-code
  - open-source
draft: false
---

On September 21, a Show HN titled "Lossless-memory – a personal AI memory that never summarizes" appeared on Hacker News. It was a small thread with 67 points, but several projects with similar names have appeared this year. lossless-claw, a plugin for OpenClaw, has about 4,900 stars, and open-mem/omp, pitched at coding agents, also advertises itself as lossless.

Behind them is frustration with context compaction. When a conversation gets long, Claude Code and OpenClaw replace older turns with a summary. Issues keep coming in saying the model then forgets edits it made or repeats work it already did. What people want is "don't summarize, remember everything."

This post reads the code and docs of lossless-memory and lossless-claw to see what memory that keeps every original actually solves, and what new decisions it forces. I ran one experiment on lossless-memory with synthetic data. [#71](/blog/71-jev-coding-cost/) covered removing tool-call results from the window; this time the question is what to keep outside the window and how to bring it back.

---

## What disappears after compaction

The Claude Code repo has a number of compaction issues. #63601, filed in May, reports a three-day session with 441 tool calls in which, after compaction, the model twice attributed its own edits to the user. The reporter put it this way: "The session jsonl preserves ground truth. The model's visible context window does not." #75759 in July reports the model denying actions taken in the same session, and #91351 in September reports task state and recent work details lost after compaction. Several issues ask how to turn auto-compaction off.

Server-side compaction in Anthropic's API has the same structure. It replaces older turns with a summary Claude writes, and in threshold mode the API drops what came before the summary block. Keeping the originals is the application's job.

Claude Code, however, already keeps them. According to the official docs, `~/.claude/projects/<project>/<session>.jsonl` holds every message, tool call, and tool result, and large tool outputs go into a separate `tool-results/` folder. These files are deleted once they're older than `cleanupPeriodDays` (default 30 days).

So for Claude Code users, "memory that never summarizes" addresses two narrower problems: originals are deleted after 30 days, and after compaction the model has no way to see them again. The first is a retention setting. The second is about what gets pulled back into the context, and how.

---

## lossless-memory: keep everything, cut on the way in

lossless-memory is a memory layer an individual developer built for a companion AI, "for one person, one AI, one machine." It was created on September 4, has 108 stars and about 3,900 lines of Python. The author's replies in the Show HN thread were quickly hidden, so they moved their answers into an FAQ in the repo. They've said development is paused for personal reasons.

**Storage.** Conversation lines are written to per-day JSONL files. For search it builds a SQLite full-text index (splitting text into two-character chunks) and a vector index with a local embedding model (multilingual-e5-small). There's no code anywhere that calls an LLM to summarize. The README's "nothing is summarized" is true.

**Retrieval.** It first looks for time expressions like "yesterday" or "September 23" in the query. If there is one, it searches for keywords only within that range. If not, it merges keyword and vector results (RRF) and weights recent records (30-day half-life). Results are chosen by relevance and printed in time order. When retrieval falls back (returning the whole range because no keyword matched, or switching to vector search), the output header says so. That's the best-designed part of the project.

**Loss on the way into the context.** Storage is lossless; what the model sees isn't.

- Search results are cut at 300 characters per line unless you pass `--full`.
- The per-turn "what are we talking about" index covers user messages only, uses the first 25 characters of each line, folds anything older than an hour into one line per 30 minutes, and caps at 40 lines.
- When importing Claude Code conversations, it drops tool results and thinking blocks and keeps only "tool name: first 200 characters of input" for tool calls.

There's no generative summarization, but there is extractive compression. Because of the third point in particular, tool results, the bulk of a coding-agent session, never enter this "lossless log." It keeps all the conversation text but not all the agent's work record.

**No output limit on one path.** The search code doesn't cap the number of results for time-range queries. There's also a fallback: if fewer than two lines in the range match the keywords, it returns the whole range. To check, I loaded one day of synthetic log, 2,000 lines of about 60 words each, and ran some queries.

| Query | Lines returned | Output size |
|---|---|---|
| `2026-09-23` (date only) | 2,000 | 654,187 characters |
| `2026-09-23 zebra` (word not present) | 2,000 | 654,260 characters |
| `budget` (no date) | 8 | 2,976 characters |

The README presents date queries as the strongest kind. On a busy day, one such query returns hundreds of thousands of characters, and adding a word that isn't there still returns the whole day. The synthetic data is unrealistically dense in keywords, but the whole-range fallback when keywords miss doesn't depend on the data. The author's published production scale (about 124,000 vector-index rows over roughly 90 days) works out to about 1,400 lines a day. The author's private hook may trim the output, but using only the repo's code, the caller has to impose the limit.

**Index hygiene.** The author's operations notes describe the vector index swelling from 440,000 to 860,000 rows. The incremental indexer failed to detect rewritten files, so about 750,000 lines of library dictionaries and license files got mixed in, discovered when vector search started returning foreign-language dictionary entries. The raw log is small and simple; the problems came from the indexes built on top of it.

---

## lossless-claw: summarize, but leave a way back to the originals

lossless-claw is a context-management plugin for OpenClaw that implements the LCM (Lossless Context Management) paper published in February. It's a large project, about 56,000 lines of TypeScript with 129 test files, and still actively developed.

Despite the name, it summarizes. It keeps every message in SQLite, uses an LLM to summarize older chunks into summary nodes, and rolls accumulated summaries up into higher-level ones. Each turn, the model sees those summaries plus the 64 most recent original messages. The official docs say it plainly: "Summaries are lossy by design."

What it adds is a way back. The summarization prompt requires every summary to end with "Expand for details about:" followed by what was left out. The model can see what was omitted while reading a summary and can retrieve originals with `lcm_grep` (search), `lcm_describe`, and `lcm_expand_query` (a sub-agent expands the summaries to answer).

The docs also show the conflict with caching. `promptAwareEviction`, which picks what to keep based on relevance to the current prompt when the budget is tight, is off by default, and the docs warn it "can reduce prompt-cache hit rates because the preserved prefix changes." An option that delayed compaction while the cache was warm has been deprecated, and the latest commits include cache-stability fixes. The smarter you are about choosing what stays in context, the more the prefix changes each turn and the more cache you lose. That tension hasn't been resolved.

Its handling of secrets is worth noting too. A feature that finds uppercase identifiers from the current prompt in past messages and attaches them as hints excludes strings that look like API keys or tokens. Keeping everything means keeping every secret, and search can bring them back; this design takes that into account. lossless-memory has no such filter.

The LCM paper reports a higher average score than Claude Code on a long-context benchmark (OOLONG), 74.8 versus 70.3. But the paper itself credits much of the gain to task splitting, processing items outside the context in parallel. It isn't a measure of the effect of preserving originals alone. The paper is from February.

---

## What's new and what isn't

Memory that never deletes originals isn't a new idea. Letta (formerly MemGPT) persists all state in a database so nothing is lost when it's evicted from context, and retrieves it with a conversation-search tool when needed. obra/episodic-memory, which the Hacker News thread brought up for comparison, also archives Claude Code and other transcripts verbatim and builds summaries and embeddings for search.

So these projects don't differ in whether they preserve originals. They differ in **what they use to choose what goes back into the context.**

| Project | What's preserved | What enters the context | Selection basis |
|---|---|---|---|
| lossless-memory | All conversation text (no tool results) | 25-character index each turn, search results on demand | Time first, then keywords and meaning |
| lossless-claw | Every message | Summary tree plus 64 recent originals, original search on demand | Chronological summaries, expanded on demand |
| episodic-memory | Copies of transcripts | Search results | Semantic search and summaries |
| Claude Code default | Every message and tool result (30 days) | Compaction summary plus recent turns | A summary the model writes |

TencentDB Agent Memory, covered in [#50](/blog/50-tencentdb-agent-memory/), stacks summary layers on top of the raw layer and caps result counts, characters, and time. lossless-memory keeps only the raw layer, with no summaries, and one retrieval path has no cap. Keeping everything shifts the bottleneck from storage to retrieval, which is the same direction as the point in [#46](/blog/46-is-graphrag-needed/) that context, not search, is the bottleneck.

---

## What to decide when designing memory that keeps originals

These are the decisions I pulled together from where the two projects' code and docs ran into problems.

**1. How long to keep things.** For Claude Code users, the simplest step is raising `cleanupPeriodDays` or copying transcripts elsewhere before they're deleted. Decide this before adding a separate memory tool.

**2. What to keep.** Tool results are the largest part and can often be regenerated by running the tool again. lossless-memory drops them; Claude Code keeps them for 30 days. Secrets can get mixed in, so filter before storage or in search results.

**3. How things enter the context.** There are three ways: inject automatically every turn, let the model retrieve with a tool, or have a person pull things in explicitly. Automatic injection is reliable but costs tokens every turn and can break the cache. The tool approach does nothing if the model doesn't search; one Hacker News commenter said LLMs "get lazy and won't actually look things up." lossless-claw's "Expand for details about:" list is a way to show the model what's missing so it calls the tool.

**4. Who enforces an output limit.** If the search tool doesn't limit result size, one call can fill the context; the experiment above returned 650,000 characters. Enforce a character or token cap on the calling side, such as an MCP server or hook.

**5. Where the per-turn block goes.** Putting an auto-injected memory block near the system prompt changes the prefix each turn and breaks the cache. The Hacker News suggestion was to put the changing block inside the last user message, right before the new question; the lossless-memory author accepted this in the FAQ but hasn't implemented it yet. This is the same prefix-stability issue as in [#48](/blog/48-cache-hit-rate/).

**6. How to check the indexes.** Periodically compare the raw line count with the index row count. lossless-memory's index contamination was only found after search results went strange.

---

## How to check

Here's what you can check in your own setup before adding a raw-transcript memory. The commands are for Claude Code.

1. **See how much you already have.** Check size with `du -sh ~/.claude/projects`, and count compacted sessions with `grep -rl "This session is being continued" ~/.claude/projects | wc -l`. When I wrote this, mine was 94MB with 5 compacted sessions.
2. **Measure what compaction lost.** From a compacted session, pull about 10 decisions, edited file paths, and error messages from before the compaction. Ask the model about them after compaction and count correct answers, then compare with giving it search results from the originals.
3. **Measure retrieval quality.** Write 20 "when did we decide what" questions from your own history and compare hit rates for keywords only, vectors only, both combined, and time-first. Count separately the cases where the question uses different words from the original.
4. **Measure worst-case output size.** Send a broad query, like a date alone, and see how big the result is. If there's no cap, add one on the calling side.
5. **Measure the cache impact.** Over 10 turns, compare the share of cache-read tokens with the memory block after the system prompt versus inside the last user message.

---

## Summary

Both projects that advertise "memory that never summarizes" store every original but cut or summarize what goes into the context. lossless-memory trims with 300-character cutoffs and a 25-character index; lossless-claw condenses with an LLM summary tree. They differ in how the loss happens and how well they build a path back to what was lost. lossless-memory honestly labels retrieval fallbacks in its output, and lossless-claw attaches a list of omissions to every summary. On the other hand, lossless-memory's time-range search has no cap and returned 650,000 characters in one go on synthetic data, and lossless-claw ships its smarter selection option turned off because it conflicts with caching.

If you use Claude Code, the originals are already on disk. To address the compaction complaint, first decide how long to keep them. Then decide what basis to use for pulling them back in, who limits the size of what comes back, and where the changing block sits. Adding a new memory tool hands those decisions to the tool, so it's worth checking how the tool makes them first.

---

*Sources: [Show HN: Lossless-memory (2026-09-21)](https://news.ycombinator.com/item?id=49786419), [aru-labs/lossless-memory](https://github.com/aru-labs/lossless-memory), [Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw), [LCM: Lossless Context Management (Voltropy, 2026-02)](https://papers.voltropy.com/LCM), [obra/episodic-memory](https://github.com/obra/episodic-memory), [open-mem/omp](https://github.com/open-mem/omp), [Claude Code .claude directory docs](https://code.claude.com/docs/en/claude-directory), [Claude Code issue #63601](https://github.com/anthropics/claude-code/issues/63601), [#75759](https://github.com/anthropics/claude-code/issues/75759), [#91351](https://github.com/anthropics/claude-code/issues/91351), [Letta memory docs](https://docs.letta.com/guides/agents/memory). The lossless-memory analysis reflects the repo's code as of 2026-09-24; the experiment loaded one day of synthetic log (2,000 lines) into that code. For lossless-claw, I checked the official docs and part of the code. LCM paper figures are the paper authors' reports. The design decisions and checks are this post's proposals; apart from the storage figure in check 1, I did not measure them directly.*
