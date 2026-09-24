---
title: "Unreal Agent, an Async Harness: Removing the Turns Where the Model Waits for Tools Made It 39% Cheaper Than Codex"
summary: "Unreal Agent, released by Unreal Labs on September 22, runs every tool call in the background and has the harness wake the model when a result lands. The model never spends a turn checking whether a tool has finished. On Terminal-Bench 4.0 with the same GPT-6 Astra xhigh, it matched Codex's 57.9% pass rate at $1,428 versus $2,350. The demand was already sitting in the Codex repository: a March issue traced a loop that re-sends the whole conversation every five seconds to poll a background process, and a July report measured wait-only turns at 19.8% of token volume. Reading the code shows placeholder swapping, a one-second result window, a ten-minute heartbeat, and a cache-preserving choice to leave two results for one call, which some providers reject with a 400. The benchmarks are self-run and the headline chart compared mismatched effort levels. The last section covers how to count waiting turns in your own harness and what to check if you build one."
date: "2026-09-24T18:04:00+09:00"
tags:
  - agent-harness
  - llm-cost
  - codex
  - open-source
draft: false
---

Unreal Labs is a startup backed by Sequoia and First Round, founded by engineers it describes as coming from CERN, Meta, Snap, Bloomberg and DeepMind. On September 22 it published [Unreal Agent](https://unreallabs.ai/blog/unreal-agent/), an agent harness with a single claim: same model, same pass rate, up to 40% cheaper than Codex and up to 20% cheaper than Pi. The repository is written in Go under the MIT license and picked up 1,800 stars in three days. The Hacker News thread reached 240 points and 121 comments.

This post checks three things. Where the cost it claims to cut actually comes from. How the code implements the saving and what it gives up to do so. How far the benchmark table can be trusted. It closes with a way to find the same waste in your own harness and a checklist for building one. Code was read at the September 23 commit. I did not rerun the benchmarks.

Earlier harness posts on this blog covered where the name came from ([#35](/blog/35-harness-engineering/)), a harness that edits itself ([#54](/blog/54-prime-agent-self-improving-harness/)), and a loop split into plugin boundaries ([#64](/blog/64-deepseek-harness/)). This one looks at cost only.

## Why a waiting turn costs money

The waste Unreal Labs is going after was not a new discovery. It was already filed twice in the Codex repository.

[Issue 13733](https://github.com/openai/codex/issues/13733), opened March 6, traced the loop from source. When the model launches something like `cargo build` in the background, Codex sets a follow-up flag and calls the model again. The model sees the process still running and polls with empty input. The harness waits five seconds, returns "no new output," and calls the model again. The loop runs until the build finishes. Every pass puts the whole conversation in front of the model, and the model reasons about whether to keep waiting. The thread collected 42 comments, including someone with a 150K-token context being resubmitted on every poll and a proposal for a minimal watcher thread whose only job is to wake the main one.

[Issue 35259](https://github.com/openai/codex/issues/35259), opened July 24, put a number on it. Reconstructing one usage cycle of multi-agent work in Codex Desktop from logs, the reporter found that model turns whose only tool action was waiting or status polling accounted for 19.8% of raw token volume. That is the cost of the model coming back every 30 or 60 seconds to ask whether it is done yet.

One counterpoint belongs here. In May an OpenAI contributor replied in the same thread that since the switch to a websocket transport only the new message is sent to the server, that most of the history was server-cached even before, and that cached tokens do not count against usage. So the token impact of polling, they said, is smaller than the comments suggest. That is true for Codex on a ChatGPT subscription. API billing is different. As covered in [#62](/blog/62-gpt-6-astra/), GPT-6 Astra charges $1 per million cached input tokens. A poll that is a full cache hit still costs the length of the context. The post Unreal Labs cites, [(KV) Cache Rules Everything Around Me](https://www.completeskeptic.com/p/kv-cache-rules-everything-around), makes the same argument: an agent re-reads its whole context on every tool call, so cache reads dominate the bill, and on replayed SWE traces output was only 9 to 18% of it. That narrows the cost to two variables: the number of turns and the length of context read per turn. Unreal Agent works on the first.

## How Unreal Agent handles waiting

The README opens with a component table. A coordinator persists inputs, runs LLM turns, and turns tool calls into operations. An operation manager is an actor runtime that executes those operations in the background. A context builder assembles model input from the session record. The session store is an append-only log. There are three tools, Bash, ViewImage, and skill loading, and no subagents or workflows.

What the model is told is short. The preamble is 11 lines. The gist: every turn re-sends the whole conversation, so go wide with tool calls in one turn instead of chaining them across turns. Tool calls are asynchronous, start the moment they are issued, and many run at once. When a result lands it wakes a new turn, and results that land together arrive in the same turn. A call still running shows a placeholder. You never have to babysit a call; if nothing happens for ten minutes a heartbeat wakes you so you can check. Ending a turn with no tool calls while calls are running means you sleep until one finishes. The Bash tool description is one sentence: execute a shell command in the background, and issue independent commands as parallel calls in one turn.

The flow in the code:

1. The model issues several Bash calls. The coordinator translates each into an operation, hands it to the manager, and records the call in the session log as running.
2. The coordinator waits one second. The constant is named `toolCallRunGracePeriod`. Calls that finish inside that second get their result in the same turn; only the slow ones are left as placeholders. The placeholder text reads: the tool call is still running, its result arrives in a later turn, continue with independent work or end your turn to wait for it.
3. When an operation finishes, the manager signals on an updates channel. The coordinator appends the result to the session log and calls the model. This is the first time the model sees the result.
4. If only running calls remain and nothing happens, a heartbeat arrives as a control message after ten minutes and wakes the model once. The default is a runner flag, and zero disables it.
5. User messages enter through an inbox at any time. If the model is mid-response, that call is cancelled and reissued with the new input included.

The only thing that changed is who decides about waiting. In Codex the model asked "is it done yet" and the harness answered "no" five seconds later. In Unreal Agent the harness already knows when a call completes, so there is nothing to ask the model. The model is called only when a tool has finished.

## The price of leaving two results to protect the cache

Footnote 2 of the announcement says making this work without breaking the cache was an interesting engineering problem in itself. The code shows what was done.

The context builder holds model input in two pieces: a committed prefix and a staged suffix. When a new turn starts, the suffix is appended to the prefix and committed. Placeholders go into the suffix, and when the real result arrives it is deleted from the suffix and replaced. But if the placeholder was already committed by the time the result arrives, the prefix is left alone, because editing the committed prefix invalidates the cache from that point on. The result is simply appended. In that case the same call ID ends up with two result items, one saying running and one with the final output.

The Responses API documentation does not define this shape. Unreal Labs writes that it passed on OpenAI, was rejected by some models on some non-OpenAI providers, and that the models themselves understood the progression from running to final. Two days after release, [issue 11](https://github.com/unreallabsai/unreal-agent/issues/11) arrived: parallel Bash calls overlapping across turns produced two results for one call ID, the provider returned a 400, and reopening the session replayed the same request and failed the same way, leaving the session permanently unusable. The developer pointed at footnote 2 and called it a known limitation. The reporter's workaround was to keep heavy Bash calls to two or fewer in parallel and start a fresh session after a 400.

This price comes from the design. Having chosen to append the result rather than edit it into the prefix, whether the API accepts that shape is the compatibility question. If you are not calling OpenAI directly, it is the first thing to test.

## What to read in the benchmark table and what to discount

All four benchmarks ran on GPT-6 Astra xhigh. Three are reproducible on Harbor and one is not.

| Benchmark | Harness | Pass | Total $ | Input/trial | Turns |
|---|---|---|---|---|---|
| Terminal-Bench 4.0 | Unreal Agent | 57.9% | $1,428 | 1.73M | 28 |
| | Codex (leaderboard) | 57.9% | $2,350 | – | – |
| | Pi | 55.0% | $1,827 | 2.83M | 44 |
| SWE-Atlas Codebase QnA | Unreal Agent | 65.8% | $936 | 898k | 16 |
| | Codex | 63.3% | $1,303 | 1.69M | 22 |
| | Pi | 64.0% | $1,033 | 1.29M | 24 |
| DeepSWE 1.1 | Unreal Agent | 72.4% | $1,367 | 1.60M | 26 |
| | Codex | 69.0% | $1,633 | 2.19M | 30 |
| | Pi | 69.6% | $1,584 | 2.21M | 40 |
| ALE-CLI | Unreal Agent | 30.0% | $217 | 0.76M | 18 |
| | Codex | 29.0% | $292 | 1.59M | – |
| | Pi | 29.0% | $262 | 1.19M | 27 |

The columns to read are turns and input per trial. Against Pi on Terminal-Bench, turns went from 44 to 28 and input from 2.83M to 1.73M. On DeepSWE, 40 turns became 26. Pass rates are similar and turns dropped, so cost dropped. That is the first of the two variables from earlier, and it shows up directly in the table. Unreal Labs itself attributes the pass-rate differences to benchmark variance, so they should not be read as a performance win.

Some of it should be discounted. Every run is self-run. On Hacker News someone pointed out that the headline chart compared Unreal Agent at xhigh against Codex at max, and the Unreal Labs reply was that the chart was lazy on their part and would be fixed. The individual benchmarks compared all three harnesses at xhigh and the headline improvement was computed at xhigh, but the index's Pareto chart included Codex max by default, which caused the confusion. The Terminal-Bench Codex row is a leaderboard baseline rather than their own run, which is why turns and input are blank. Harbor run IDs are attached, so reproduction is possible.

## What already existed

Asynchronous tool calls themselves are not new. Several Hacker News commenters said so, and checking bears it out.

- Claude Code's Bash tool has a background option, and the harness calls the model again when the job finishes. The tool description tells the model not to poll.
- tekacs added a [patch that wakes the model when a background command completes](https://github.com/tekacs/codex/commit/9ffcf8db9078eae43d4111ff94259795c1e962c9) to a Codex fork in January or February and keeps rebasing it. The tool descriptions were changed to say wait for the completion notification instead of empty-polling. On Hacker News they wrote that the savings were similar to what Unreal showed.
- In the Codex issue 13733 thread, discussion converged in May on the runtime owning the wait and re-entering the model only on a real state change, and in September a user posted a callback skill as a workaround.
- A Pi user had Claude write the [pi-notify](https://github.com/Pyrolistical/pi-notify) extension so the agent is woken when a background job ends.

What Unreal Agent adds is three things. It makes this structure the harness's only behavior rather than an option, it shows the effect as cost on four benchmarks with the same model, and it ships it as a Go library. The [HarnessTax](https://harnesstax.github.io/) paper from the same period showed with 21 model-harness pairs that the same model can cost up to 5x depending on the harness. Unreal Agent reads as a case that isolates one of the factors behind that gap.

## What to check in your own setup

To carry these numbers into your own situation, look at three things in order.

**First, count the waiting turns.** From the session log, pick the turns whose only tool action is waiting or status checking and sum their input tokens. The method the issue 35259 reporter used works as is. If the share is in the single digits, changing harnesses will not buy much. Near 20%, the savings above could show up in your workload too. Check the billing model alongside it: on API pricing cache hits cost money; on a subscription, per OpenAI's explanation, cached tokens do not count against usage.

**If you are on Codex, there is a limit to what settings can do.** According to the September reproduction in issue 13733, on 0.153.4 the wait requested by `exec_command` is clamped to 30 seconds, and asking for longer did not reduce the polling rate. Until completion notifications land, the tekacs fork or a callback skill are the remaining routes. A Hacker News comment said v0.148's async work made tool calls asynchronous too; what I could confirm in the release notes is asynchronous hook execution, not tool-call completion notifications.

**If you are building or modifying a harness, there are five items to check.**

1. Put in a tool-result placeholder, and when the real result arrives, replace it before commit and append it after. For the append case, test in advance whether your provider accepts two results for one call ID. If it does not, you need an alternative such as wrapping the result in a new user message, and you need to measure what that alternative does to the cache.
2. Add a result-batching window. Unreal Agent uses one second. If every fast tool wakes a new turn, turn count goes up instead of down.
3. Add a heartbeat interval. It is insurance against a lost completion signal leaving the model asleep forever. Ten minutes is the default, and the shorter it is, the closer you drift back to polling.
4. Put both instructions in the prompt: go wide in one turn, and do not babysit. As the Crush and Claude Code anecdotes on Hacker News describe, if the model calls wait with a long timeout right after an async call, you are back to the same problem. Whether the instruction holds is visible in the waiting-turn share in your logs.
5. Cap tool output. Unreal Agent's Bash defaults to 40,000 characters, keeps head and tail, and gives a file path for the full stream. Among the open issues is a background Bash that read its own output file and grew to 61 GB. Fewer turns do not help if each turn's context grows, which is the second variable from earlier coming back.

The adoption test is to lay pass rate, turns, input tokens, and dollars side by side on the same tasks with the same completion criteria. If turns dropped but pass rate fell, the model stopped early instead of waiting for results, and you roll back.

## Summary

The cost Unreal Agent cut is the turns a model spends confirming that a tool has finished. That waste has been an open Codex issue since March, and a July measurement put it at 19.8% of tokens. Unreal Agent moves the completion decision into the harness and, with a placeholder, a one-second batching window, and a ten-minute heartbeat, leaves the model nothing to ask. The price is a message shape with two results for one call, and on providers that reject it the session breaks. The benchmarks are self-run and the headline chart compared mismatched effort levels and is slated for correction, but the direction, fewer turns and fewer input tokens and therefore lower cost, is readable in the individual rows. The same structure already exists in Claude Code and is available as a Codex fork and a Pi extension. With code three days old, the better first use is counting waiting turns in your own logs rather than adopting it.

## References

- [Unreal Agent announcement (Unreal Labs, 2026-09-22)](https://unreallabs.ai/blog/unreal-agent/)
- [unreallabsai/unreal-agent (GitHub)](https://github.com/unreallabsai/unreal-agent) · [Issue 11: duplicate results for one call_id return 400](https://github.com/unreallabsai/unreal-agent/issues/11) · [Issue 3: output file grows to 61 GB](https://github.com/unreallabsai/unreal-agent/issues/3)
- [Hacker News thread](https://news.ycombinator.com/item?id=49805748)
- [openai/codex issue 13733: background polling sends full history every time](https://github.com/openai/codex/issues/13733) · [issue 35259: wait and status turns are 19.8% of tokens](https://github.com/openai/codex/issues/35259)
- [tekacs/codex: wake model when background exec commands complete](https://github.com/tekacs/codex/commit/9ffcf8db9078eae43d4111ff94259795c1e962c9)
- [HarnessTax: How Much Does the Harness Matter for Coding Agents? (Pan, Yang, Arabzadeh, Chiang, Stoica, Zaharia, 2026)](https://harnesstax.github.io/)
- [(KV) Cache Rules Everything Around Me (Complete Skeptic, 2026-09-09)](https://www.completeskeptic.com/p/kv-cache-rules-everything-around)
- [Terminal-Bench 4.0 leaderboard (Harbor Hub)](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

*Benchmark figures are Unreal Labs' own runs and were not reproduced here. Code descriptions are as of the 2026-09-23 commit. The Codex polling cost figures are user reports; the OpenAI contributor's counterpoint is in the same issue thread.*
