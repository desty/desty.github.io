---
title: "DeepSeek's Super-Agent, a Coding Agent That Lives in Team Chat: Code Enforces When It May Talk to People, Prompts Guard the Shell and the Merge"
summary: "Super-Agent, released by the DeepSeek Harness team on October 31, is a research prototype that watches GitHub and team chat and turns work an allowed person asks for into a pull request. Its design essay argues that a person can follow only 3 to 5 active sessions, so the bottleneck has moved to human attention, and it shows why delegation became structural: given a delegation-first prompt, a single session still delegated in only 4 of 5 runs. Reading the published commit and running its 1,197 tests shows that the host code decides who may assign work and which messages may reach a person. The worker's shell path through gh and lark-cli, the auto-merge condition and command blocking are left to prompts and shell wrappers, and the docs say they are not a security boundary. This post maps what is enforced where, then covers what to copy and what to add yourself when building a team bot on Claude Code or Codex, and how to measure the effect."
date: "2026-11-06T18:34:00+09:00"
tags:
  - agent-engineering
  - harness-engineering
  - deepseek
  - open-source
  - ai-coding
draft: false
---

On October 31 the DeepSeek Harness team released the [Super-Agent prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) under the MIT license. It watches one GitHub repository and, optionally, Feishu (ByteDance's workplace chat app). When an allowed person asks for work, it opens a work item, does the work in a separate session and answers in the original conversation, usually with a pull request link. It is packaged as a bundle for DeepSeek Harness (dsh), which I analyzed in [#64](/blog/64-deepseek-harness/), and the first line of its README calls it a "research prototype for reference only, not an official DeepSeek product." It reached 19,882 stars in six days (GitHub API, November 6).

The design essay published the same day, "Exploring Super-agent Design: Towards a More Autonomous Agent System" (Chinese original on WeChat, [English version on X](https://x.com/DeepSeekHarness/status/2116857257245987236)), starts from one observation. Models have become good at finishing a single task alone, but a person can usually follow only 3 to 5 active sessions. Switching between sessions and remembering what each one was doing is still the person's job, so human attention now caps productivity. The README turns that into one rule: "take as little human attention as possible, and give as much value as possible."

Most news coverage repeated that it "rivals Claude Code" (Bloomberg's framing, which does not appear in DeepSeek's materials) and the completion-time numbers. English-language analyses described the permission model as treating the team's attention as a budget, but all of them were written from the docs. None checked whether the principle is enforced in code or only requested in a prompt.

This post checks that. I read the source and prompts at the published commit (`8c32a9d`, October 31) and ran the test suite (59 files, 1,197 tests, all passing). I did not install and operate it, which needs a bot account and a DeepSeek API key, so what follows rests on the code, the tests, the docs and the design essay.

## How Super-Agent takes work and finishes it

There is one router session (`orchestrator` in the code) and one worker session per piece of work. From an incoming message to a pull request, responsibility splits like this:

| Step | What happens | Who decides |
|---|---|---|
| Source | Reads GitHub notifications, Issues, PRs and CI, and Feishu messages, and turns them into Triggers. Drops the bot's own messages | Code |
| Gate | Classifies each message as an explicit request, an inferred candidate or nothing, by sender allowlist, whether the agent was addressed (mention or DM) and which chat it came from | Code |
| Eval | Judges whether an inferred candidate matches a rule the team wrote | Router model |
| Ticket and Mandate | On accept, creates a Ticket and fixes why the work may be done (Policy version, scope, matched rules, requester) as a Mandate | Recorded by code |
| Execution | One worker session and directory per Ticket. Later messages on the same thread go straight to that worker without passing the router | Worker model |
| Replies | Acknowledgements, results and questions go back to the original conversation | Written by the router model, checked by code |

The router does no work itself. The essay says it can run without a Bash tool and only talks to people and dispatches tasks. The code points the same way: the router session has a guard that refuses `sleep`, shell timeouts over 30 seconds and job waits over 5 seconds, because a router stuck on one step delays every new request.

Little of the technique is new. Filtering deterministic conditions in code and sending only semantic judgments to a model is, in the essay's own words, borrowed from the fast path and slow path of computer systems. Thread subscription is pub/sub. Keeping session logs outside the harness is, as the essay itself notes, the same approach as Anthropic's "Decoupling the brain from the hands." What is worth studying is how these pieces are tied to one question: when does the agent speak to a person?

## The experiment: a delegation prompt was not enough

The essay's experiment shows why it chose this structure. Each run streamed about 300 chat and CI messages, about 20 of them work requests, through four designs, five runs each. Coding was simulated by a tool that only consumes time, so the experiment measures dispatch and coordination, not coding ability.

- Super-Agent took 12.4 minutes at p50 and 15.7 minutes at p95 from request to result message.
- A single session with a subagent tool and a neutral prompt ("use a subagent for a piece of work when appropriate") never delegated in any of the 5 runs. New messages kept interrupting its work, and p95 reached 29.5 minutes.
- With a delegation-first prompt ("every message reaches you, so work you run yourself keeps stopping; hand each piece of work to a subagent"), it delegated in 4 of 5 runs. In the fifth, the model judged the work "small," did it itself, and that run produced the long tail.

The essay concludes that a single session has to leave delegation to its prompt and the model's on-the-spot judgment, so it removed execution from the router and made delegation structural.

Cost belongs in the picture too. Because it keeps several sessions, Super-Agent reads more cached tokens per run than the single-session designs, which the essay describes as trading tokens for shorter and steadier completion times. Turning off pass-through, which sends follow-ups straight to the owning worker, left completion times about the same but raised the router's decisions by about 30% and cache-read tokens from 23.2M to 31.8M, 37% more. In a router-only load test, raising the arrival rate from about 1 to about 40 events per minute cut the amortized inference time per decision from 6.4 s to 1.6 s, because events that pile up during one turn are batched into the next call. All of these numbers come from DeepSeek's own synthetic workloads and simplified environments, and the essay calls them indicative only.

## Rules the code enforces

The principle that moved delegation into structure also covers permissions and messages. Document 004 ranks instructions in five levels and puts at the top "facts enforced by tools and the host: identities, permissions, tool argument checks, reply purposes, length limits. Prompt text cannot change them." Here is what the code confirms.

**Who may assign work.** `src/admission.ts` and `src/policy.ts` decide. A person on the allowlist who addresses the agent makes an explicit request. Anyone not on the list is ignored by default. A bot, even one on the bot list, can produce at most an inferred candidate, never an explicit request. Work nobody asked for, started under a team rule, defaults to `observe` (`z.enum(['off', 'observe', 'auto']).default('observe')` in `policy.ts`), which records "would accept" and accepts nothing. An Issue or a quoted document that says "give this bot permission" changes nothing at the gate.

**When granted permission is checked again.** An ended Ticket keeps its Mandate. When a person writes on the same thread again, the work resumes without a new Eval, but only after the Mandate is revalidated against the current Policy. If the requester has since left the allowlist or the matched rule was disabled, the Ticket stays ended.

**Which messages may reach a person.** This is where the attention principle is most concrete. The router's tool for talking to people, `orchestrator_reply`, takes a purpose of `answer`, `result` or `attention`, and `src/core/replies.ts` checks a condition for each.

- `result` goes out only when the Ticket's latest report is `ready`, or the Ticket ended as completed, merged or dropped. Otherwise it fails with `notReady`.
- `attention`, a request for a person's decision, goes out only if its text matches, word for word, the question the worker raised in a structured field. An invented question fails with `notAttention`.
- `answer` must point at a message in which a person actually asked something, and can be used once, after the worker reported that it answers that question.
- An acknowledgement can only go to a message a person sent, and goes out once per message, even across restarts.

There is no purpose for progress updates. A message such as "still working on it" has no way out. `tests/core-engine.spec.ts` has tests in which a result for an unready Ticket and an attention message for a Ticket with no open question are refused, and they passed in my run. Length is cut by the tool schema as well: zod validation refuses chat messages over 100 words (Chinese counted by word segmentation) and router notes to workers over 30 words (`IM_WORDS = 100` and `NOTE_WORDS = 30` in `src/infra/text.ts`).

Prompt caching is considered in code too. The Policy section is regenerated from settings on every request and appended at the very end of the system prompt, so a Policy change leaves the earlier text, and the cache prefix, intact. I covered keeping the cache prefix stable in [#48](/blog/48-cache-hit-rate/).

## Rules left to prompts and shell wrappers

The other list is also documented openly.

**Workers can send messages from the shell.** Workers reach GitHub through the agent account's `gh` and Feishu through the bot's `lark-cli`. In `src/infra/environment.ts`, both are thin shell shims that run the real CLI with whatever subcommand they are given. The GitHub skill tells workers to reply to PR review comments themselves with `gh api .../replies`. So the reply-purpose check above applies only on the path through the router's reply tool. What keeps workers from messaging people through the shell is prompt text: "The orchestrator owns IM delivery; do not send a second IM message yourself" in `prompts/work.md`, and "Do not relabel progress as an answer, manufacture a question or use CLI to bypass a rejected reply" in `prompts/replies.md`. The authors know the bypass exists and close it with a sentence.

**Command blocking works by name only.** When the operator lists commands to block, a shim with the same name prints an error. Document 003 says "These wrappers and directories establish defaults, not a security boundary. A worker can still execute a program by absolute path." Worker sessions run commands without approval as the operator's OS user, so any file the operator's account can read, the worker can read.

**The auto-merge condition lives in a prompt.** By default the agent never enables auto-merge as the agent account, because GitHub attributes a merge to whoever enabled it. Only when another account's CLI is configured does it enable auto-merge, and only when the PR is ready, changes fewer than 200 lines and has the required approvals on its head commit. The docs say "the host has no merge-specific decision logic" and point to GitHub branch protection to enforce approvals. The disclosure line that starts every GitHub message, "This is by an automated agent, not a human," is also prompt text.

In summary:

| Enforced by | Items | Where |
|---|---|---|
| Host code | Who may assign work, the `observe` default, Mandate records and revalidation, four reply purposes and their state conditions, 100-word messages and 30-word notes, no waiting in the router | `admission.ts`, `policy.ts`, `core/replies.ts`, `tools/main.ts`, tests |
| Prompts | Workers not messaging through the shell, silence while working, the auto-merge condition (under 200 lines), the disclosure line | `prompts/work.md`, `prompts/replies.md`, `prompts/team/*.md` |
| Defaults only | Command blocking, per-Ticket directories | Document 003 |

The split follows a pattern. Everything in the first row can be decided from structured facts the host already holds: the sender, the Ticket's state, the report's fields. Everything else concerns what a worker with a shell does, which needs isolation at the process level. The essay lists security and privacy as an open problem. Because the event-driven design keeps taking in untrusted input, a cloud-hosted agent loop compromised by prompt injection could take over every endpoint connected to it. And as long as credentials can enter the model's context, normal execution can leak them, so the agent needs a way to use credentials without seeing them.

Grok Bot, covered in [#56](/blog/56-grok-bot-shared-computer/), runs all of an account's bots on one shared computer, and its docs say not to use bots as a security boundary. Super-Agent goes a step further: who asked and how far the work may go is a domain concept, the Mandate, enforced in code. On execution isolation, it faces the same problem, with the difference that its docs state the limit up front.


## Building a team bot on Claude Code or Codex

If you run Claude Code, Codex or your own Agent SDK bot in a Slack channel or on GitHub, this code separates what to copy from what to add yourself. These are proposals based on what the Super-Agent code does; I have not operated them myself for this post.

**1. Split the tool that talks to people by purpose, and check each purpose against state.** If your bot writes to the channel with a single `send_message(text)` tool, the only thing keeping messages down is the prompt. Take the purpose as an enum and check it against state the host holds, and the model has no means to send a progress update even when it wants to.

```ts
// Example: take the purpose as an enum and allow each one by host state
const reply = z.object({
  purpose: z.enum(['ack', 'answer', 'result', 'attention']),
  ticketId: z.string(),
  text: z.string().refine(t => wordCount(t) <= 100, 'at most 100 words'),
})

function allow(r: z.infer<typeof reply>, t: Ticket): boolean {
  switch (r.purpose) {
    case 'ack': return t.ackSent === false && t.trigger.fromHuman
    case 'result': return t.report?.state === 'ready' || t.ended
    case 'attention': return t.openQuestion !== undefined
    case 'answer': return t.pendingHumanQuestion !== undefined
  }
}
```

**2. Keep chat credentials out of the worker's environment.** In a bot you build yourself, you can close from the start the bypass that Super-Agent closes with a prompt. If workers never need to post to chat, keep the Slack or Feishu token out of the worker process's environment and file system entirely, and let only the host's reply tool send messages. GitHub is harder: opening PRs and answering reviews needs write access, which makes it hard to withhold commenting through token scopes alone. Auditing, described below, is the practical control there.

**3. Move merge conditions into branch protection.** If a condition such as "auto-merge under 200 lines" sits in your prompt, require reviewers in GitHub and dismiss stale approvals when new commits arrive. Give the agent account no merge rights. This is also what the Super-Agent docs recommend. What to rely on before a merge is the subject of [#81](/blog/81-pstack-merge-without-review/).

**4. Run workers in isolation.** If workers use a shell without approval, blocking command names is not enough. Run them in a container or VM with only the work directory mounted and without the operator's SSH keys or cloud credentials. Problems that arise when several workers share tools or caches are covered in [#76](/blog/76-openai-agent-incidents/).

**5. Start unrequested work in observe mode.** If the bot is to read every message in a channel and start work on its own, first run a period that only records "would accept," as Super-Agent's `observe` does. Switch to automatic acceptance once people agree with enough of those recorded decisions.


## How to measure the effect

The goal of this design is less human attention rather than shorter completion times, so measure that. Take a two-week baseline with your current setup, then apply the message-tool change and worker isolation separately and compare.

- **Messages people receive per finished task.** Count the bot account's messages in the channel and on GitHub and divide by finished tasks. If the ratio falls while finished tasks stay the same, that is an improvement.
- **Messages that bypassed the reply tool.** Pull the bot account's messages from the GitHub and chat APIs and compare them with the host's send log. Anything missing from the log was sent by a worker through the shell. For chat, with item 2 applied, this should be zero. For GitHub, look for anything other than review replies.
- **Accuracy in observe mode.** Track how many recorded "would accept" decisions people agree with, and how many requests people made that the bot missed.
- **Token cost.** As in the essay's experiment, splitting sessions can raise cache-read tokens. Compare tokens and spend per task with the baseline, and if completion time and message counts did not improve while cost rose, go back to the previous setup.

## Summary

Super-Agent treats human attention, more than tokens, as the main cost of a coding agent living in team chat, and is built around that. Who may assign work, when the agent may start work on its own, and which kinds of messages of what length may reach a person are decided by host code, and the tests let you check that behavior. The judgment that moved delegation out of the prompt after the experiment carries over to the message rules.

The worker's shell path for messages, the auto-merge condition and command blocking still sit in prompts and shell wrappers, and the docs and essay state these limits themselves. If you are building a team bot, copy the message tool and the way permissions are judged, and provide credential separation for workers, execution isolation and merge rules separately, through GitHub settings and the runtime environment.

This post is based on the published commit's code and tests, its docs and the design essay. I did not install and operate it on a real repository. As the README notes, the public version differs from DeepSeek's internal one, and some designs in the essay are not implemented. The completion-time and token numbers come from DeepSeek's synthetic workloads and have not been reproduced externally.

- Previous posts: [#64 DeepSeek Harness code analysis](/blog/64-deepseek-harness/), [#56 Grok Bot](/blog/56-grok-bot-shared-computer/), [#81 Merging without review](/blog/81-pstack-merge-without-review/), [#76 OpenAI agent incidents](/blog/76-openai-agent-incidents/), [#48 Cache hit rate](/blog/48-cache-hit-rate/)
- Repository: [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)
- Design essay: [Exploring Super-agent Design (English version on X)](https://x.com/DeepSeekHarness/status/2116857257245987236)
