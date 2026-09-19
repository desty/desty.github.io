---
title: "How much can Jev cut the cost of a coding agent?"
summary: "fast-jev-compaction does not summarize a Claude Code conversation. It selects stale tool calls and results to delete. I traced the implementation to see how Jev could reduce not only the cost of compaction but the input tokens and latency of later model calls, what it can delete by mistake, and how to measure the real effect. Part 5 of the Jev series."
date: "2026-09-19T21:00:00+09:00"
tags:
  - agent-engineering
  - harness-engineering
  - jev
  - claude-code
  - context-engineering
draft: false
---

[Part 4](/en/blog/70-jev-four-builds/) scored every line of an 87-line changelog and kept only the lines needed for a question. The right line ranked first for all fourteen questions, and one call containing 87 questions took 0.27 seconds. That established that a context compressor could be built with Jev. It did not put one in the path of a real coding agent.

Now that pattern is inside Claude Code's compaction path. Tamara Tran's [fast-jev-compaction](https://github.com/tamaratran/fast-jev-compaction) intercepts compaction and removes tool calls and results Jev says are no longer needed. If it fails or cannot remove enough, it delegates to Claude Code's built-in summary.

The interesting part is larger than shaving a few seconds off a summary. A coding agent does not incur cost only when it writes code. Every file read, test run, and log inspection extends the transcript, and subsequent calls to the generative model receive that history again. Remove stale history cheaply near the front and the saving can repeat across many later calls.

This is not a long-running, side-by-side test of the plugin. I inspected its public implementation, built a compressor with the same structure, and replayed both a controlled Astro trace and one completed Claude Code session. The controlled result was strong; the real session did not yield a threshold that was both safe and useful.

## Coding agents keep making decisions outside the code

During one medium-sized refactor, an agent makes many decisions that require no generated prose.

- Is this file content still needed?
- Should this test be run again?
- Is the failure transient, or should the approach change?
- Is this command safe to run without asking?
- Which of these twenty search results belongs in the next model call?

Most answers are a yes or no, one member of a fixed list, or a probability. A typical agent still sends the entire conversation to the same large model it uses to write code. The hidden cost is not just the decision. Old logs and file contents ride along in the input required to make it.

Jev belongs around the code generator, not in its place.

```text
Tool calls and results accumulate
        ↓
Jev decides keep, delete, or truncate
        ↓
Smaller conversation history
        ↓
Claude analyzes the problem and writes code
        ↓
The next tool call
```

Claude keeps the jobs that require creating an answer. Jev gets judgments whose candidates already exist. The distinction is what makes a fast decision model useful here.

## fast-jev-compaction does not write a summary

Ordinary compaction reads old conversation and writes a shorter account of what is needed to continue. A summary turns many details into new sentences. A path, exact error, or user constraint can disappear even when it matters later.

fast-jev-compaction makes a different trade. Anything it keeps stays verbatim. For every old tool call it asks two questions:

1. Does knowing that this call happened, including its input, still matter?
2. Does its result still need to remain verbatim, and would re-running the tool fail to recover it?

If the second probability clears the threshold, the call and result remain. If the call matters but the full result does not, the output becomes its first 300 characters plus an omission note. If neither clears the threshold, both disappear. The default threshold is 0.5.

Structural rules provide another layer of protection. The first message and newest six messages are pinned. Ordinary user and assistant text is never shortened or deleted in the output. Calls and results are paired by `tool_use_id`, so a result cannot survive after the call that produced it has vanished.

The unit of compression is therefore not a sentence or a token. It is a **tool-call pair**. That directly targets file contents, terminal output, and test logs—the bulky material in a coding session.

## Jev does not read the full terminal output

The implementation has an important constraint: Jev never sees the actual tool-result body. In the `state` sent for judgment, a result becomes a line such as `ok, 4213 chars (omitted)`. Jev estimates its future value from the tool name and input, the user and assistant conversation, and the result's status and size.

Suppose the agent ran `Read src/auth.ts` and then edited that file. The call and later discussion can be enough to infer that the original file body need not stay in context. But the same mechanism can see only metadata for a one-off external response or a hard-to-reproduce failure log. If the surrounding conversation does not reveal its importance, the result can be deleted by mistake.

That is a deliberate speed and cost tradeoff. Sending thousands of lines of raw output to Jev would make the compressor consume the very input it is trying to remove. This design instead relies on recoverability: discard a tool result that can be obtained again and re-run the tool if it turns out to matter.

It is therefore inaccurate to say that all core code and state is guaranteed to survive. A closer description is:

> Pin recent conversation and ordinary text, estimate the value of old tool records from the task and call metadata, and recover an incorrectly dropped result by re-running the tool when possible.

## Long histories are fitted into 25,000 tokens first

A conversation larger than Jev's request limit cannot be sent as-is. Before asking any question, the library fits its state under an estimated 25,000 tokens by default. It estimates tokens from character classes and lengths rather than using a tokenizer.

Fitting happens in stages. Long tool inputs shrink to 1,000, then 200, then 60 characters. If that is not enough, old long text is reduced to its head and tail, old messages collapse into omission notes, and old calls become one-line records. At the final stages old messages without calls are left out of the judgment state. If the history still does not fit, compaction aborts.

State plus questions is kept below an estimated 30,000 tokens per request. A large set of questions is split into batches; every batch receives the same state and the requests run concurrently. Concurrency restrains latency, but repeating the state increases input cost with every batch.

That also qualifies the claim that thousands of lines are scored in tens of milliseconds. In [my direct measurement in part 3](/en/blog/69-jev-measured/), `jev-1.13.0` spent about 90ms on the server and the median including a Korea–US West Coast round trip was about 250ms. One and ten questions took roughly the same time, but this plugin uses multiple requests when the record has many calls. End-to-end time depends on state size, question count, and network location.

It is still a different job from asking a large generative model to finish a summary. Jev returns probabilities for the items; host code rebuilds the message array.

## The saving compounds after compaction

Comparing only the price of one compaction understates the possible effect. The useful comparison is:

```text
Total cost with built-in compaction
= summary cost + N later calls with the large history

Total cost with Jev
= Jev judgment + N later calls with the smaller history + recovery work
```

If removing old tool records eliminates 50,000 input tokens and ten Claude calls remain after compaction, as many as 500,000 input tokens leave the call path. That is an illustrative calculation, not a measured result from this plugin. Prompt caching may make the billing difference smaller, and re-reading deleted files gives part of the saving back.

Latency must be treated the same way. There may be a shorter pause at compaction and less input for the model to process on every following turn. Against that, the design adds API round trips and possibly several batches. If it drops a needed result, re-running the tool adds another turn. Token reduction alone does not prove the task became faster.

Nor does the plugin "bypass the KV cache." It changes the messages the application sends in later requests. It does not replace a provider's internal KV cache or prompt cache. Changing the message list may also change which prefix remains reusable; that depends on the provider's cache policy.

## Safe deletions and expensive deletions need different policies

Losing every kind of tool result does not carry the same cost.

| Record | Cost of a mistaken deletion | Sensible policy |
|---|---|---|
| Repository file read | Re-readable if the version is unchanged | Eligible for deletion |
| Reproducible test log | Requires another test run | Consider runtime and price |
| Build artifact listing | Cheap to regenerate or query | Early deletion candidate |
| External API response | May change or be unavailable later | Preserve or store separately |
| User approval and constraints | Losing it can cause the wrong action | Never put it up for judgment |
| Intermittent failure output | The diagnostic clue may vanish | Preserve verbatim |

The implementation pins ordinary text and recent messages and falls back on errors, but it does not enforce a policy for each tool class. A production harness should add one instead of relying on a single probability threshold. `Read` results might be disposable, while deployment, database, and external API responses are first written to an artifact and represented in the conversation by a durable pointer.

A Jev probability is not a proof that deletion is safe. In [the compression experiment in part 4](/en/blog/70-jev-four-builds/), the correct line ranked first for all six paraphrased questions, yet a 0.7 cutoff lost two of them. In this plugin a result survives only if its keep probability clears the threshold, so raising the threshold deletes more. Start conservatively and tune against the observed rate of re-reading and task failure.

## Five measurements from a real development task

Before attempting a long-running agent comparison, I built a prototype with the same structure and constructed a trace that read 240 real source and type files from the installed Astro package. The task was to trace routing and route-manifest construction. I treated the 60 calls whose paths contained `route`, `routing`, or `manifest` as the calls that had to survive. Jev received the conversation and file paths but not the tool-result bodies. The 240 calls became six concurrent requests of 40 calls each.

| Setting | Relevant calls retained | Irrelevant calls retained | Character reduction |
|---|---:|---:|---:|
| Path oracle | 60/60 | 0/180 | 73.3% |
| Jev, 0.5 threshold | 52/60 | 1/180 | 94.2% |
| Jev, 0.3 threshold | 60/60 | 6/180 | 79.4% |

![Chart comparing relevant-call recall and irrelevant-call removal from Jev thresholds 0.2 through 0.5. At 0.3 the two metrics are 100% and 96.7%.](/images/jev-threshold-tradeoff.svg)

*Relevant-call recall and irrelevant-call removal share a percentage axis. On this fixture, 0.3 is the knee before either objective degrades materially.*

Jev handled 480 Noul questions about the 240 calls in about 1.01 seconds. The default 0.5 threshold removed more but lost eight required calls. Applying 0.3 to the same answers retained all 60 relevant calls while still removing 79.4% of the record. In a separate run, 0.3 again retained all 60 and kept only five irrelevant calls.

This is not a development-cost reduction figure. Ground truth came from paths in a controlled task, and marking a file as relevant does not mean its full body would be needed later. What the run does establish is narrower: from roughly 566,000 characters accumulated while exploring a large framework, Jev separated relevant from irrelevant calls, and threshold choice materially changed both retention and reduction.

### It failed to separate calls in a completed Claude Code session

To test whether the path-labeled fixture inflated the result, I replayed one completed Claude Code session from this repository. The source transcript was 5.15MB and normalized to 477 messages and 188 tool calls. Its recorded cumulative cost was $44.78 across several models; I did not reinterpret that number as addressable savings from compaction.

I treated the 50%, 70%, and 85% points in the tool-call sequence as compaction checkpoints. A prior call was labeled `future-reused` when the same file path or URL appeared later in the observed transcript. Mutating and human-interaction tools were pinned and excluded from accuracy scoring. This oracle cannot capture every semantic dependency, but it was fixed before seeing the scores rather than assembled from favorable examples afterward.

| Keep threshold | Future-reused calls retained | Irrelevant calls removed |
|---:|---:|---:|
| 0.05–0.1 | 100.0% | 0.0% |
| 0.2 | 100.0% | 0.5% |
| 0.3 | 76.9% | 20.4% |
| 0.4 | 40.8% | 70.0% |
| 0.5 | 23.5% | 93.6% |

![Chart comparing future-reference recall and irrelevant-call removal across Jev thresholds on a completed Claude Code session. No threshold combines high recall with useful removal.](/images/jev-real-session-threshold.svg)

At 0.3, character reduction ranged from 16.6% to 27.1% across the checkpoints and judgment took 0.55–1.10 seconds. It also lost more than 20% of the targets that appeared later. Lowering the threshold to 0.2 restored 100% recall but removed only 0.5% of irrelevant calls on average. This session had no operating point worth adopting.

The first request also failed with Jev's maximum-token error because the prototype constructed judgment state from the full old conversation. Capping state at 12,000 characters, biased toward recent evidence, made the replay run. That fix exposes another production requirement: the host must enforce a state budget on long sessions.

The 79.4% Astro reduction therefore cannot stand as a general savings claim. The narrower direct observation is that Jev separated a controlled trace whose goal was legible from file names, but the same threshold did not generalize to a mixed real session. There is still no evidence here that long-running coding tasks become cheaper or more successful.

Reconsidering adoption would require running the same development task under three configurations.

| Configuration | Description |
|---|---|
| No compaction | A baseline while the task fits in context |
| Claude Code compaction | A generative model writes the summary |
| Jev compaction | Tool records are selected for deletion, with built-in fallback |

A useful task is a medium refactor that accumulates file reads and failed tests and still has several steps left after compaction. Record these together:

1. Total input and output tokens and billed cost through completion
2. Time spent compacting and total wall-clock time
3. Re-reads and re-runs caused by a missing result
4. Wrong-file edits, missed requirements, and human interventions
5. Whether the same tests and review criteria pass

The default `minReductionRatio` is 0.25. If Jev cannot reduce the record by at least 25%, the hook returns to built-in compaction. That avoids paying for a judgment that saves little in short sessions. An evaluation should follow the same principle: use total cost including recovery and final task success, not reduction ratio alone, as the adoption criterion.

## Coding agents gain a separate control path

fast-jev-compaction will not make development bills disappear. Claude Code function hooks are still early access and can change across releases. The Jev API can fail, its judgment can be wrong, and a long history can require the same state to be sent several times.

The architectural direction is still useful. One large model currently writes code, chooses files, filters logs, reviews risk, and decides how to recover from failure. With a fast judgment model, host code can construct the candidates and enforce preservation rules, Jev can handle frequent bounded decisions, and Claude can spend its calls on work that actually requires creating a new answer.

Compaction is a good first place to test the arrangement because one smaller history affects many later calls. The best compressor is not the one that deletes the most. Jev has reduced the cost of development only when **total cost, completion time, re-read rate, and outcome quality** improve together on the full task.
