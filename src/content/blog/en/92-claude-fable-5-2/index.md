---
title: "Which Work Should Go to Claude Fable 5.2? Anthropic Says to Keep Opus 5.5 as the Default"
summary: "When Anthropic released Claude Fable 5.2 on November 9, it led with long, hard work rather than price: an OS prototype built by more than 1,000 subagents over eight days, and Fermat's Last Theorem formalized by 1,000 agents in 30 hours. In the same announcement it told most coding and knowledge work to start on Opus 5.5. This post looks for where that line sits. In Anthropic's own cost measurements, Fable 5.2 paid for itself on work larger than one context window, such as defect search; on SWE-bench Pro and research tasks, Opus 5.5 matched or beat it for less. Artificial Analysis data from short standard tasks gives a different answer: Fable 5.2 at low costs less than Opus 5.5 at high and scores higher. Also covered: where the two sources disagree, what advisor and orchestrator setups cost when the expensive model only directs the work, what to fix when moving from 5.1 or Opus 5.5, and which signals mean it's time to move up and at what effort to start."
date: "2026-11-14T12:00:00+09:00"
tags:
  - claude-fable-5-2
  - claude-opus-5-5
  - model-release
  - multi-agent
  - agent-engineering
draft: false
---

On November 9, Anthropic released **Claude Fable 5.2** and **Claude Mythos 5.2**. The announcement led with long, hard technical work. One engineer coordinated more than 1,000 Fable 5.2 subagents for eight days and got an OS prototype that boots on a laptop. A team of 1,000 Fable 5.2 agents fully formalized Fermat's Last Theorem in Lean in 30 hours; Opus 5.5 with the same setup completed 26% in 18 hours. An internal production service moved from Python to Rust and now starts about 26 times faster. The benchmarks point the same way: 69.9% on the agentic coding evaluation FrontierSWE v2 (Opus 5.5: 62.3%) and 41.3% on the Remote Labor Index (Opus 5.5: 21.3%). The 20% price cut ($8/$40), up to 30% faster output and 55% fewer safeguard blocks come after that.

All of these cases are self-reported, and nobody outside Anthropic can rerun them under the same conditions. For Fermat, the first formalization published in September (an internal model roughly comparable to Fable 5.1, dozens of agents, 11 days) has [public Lean code](https://github.com/anthropics/fermats-last-theorem) that Kevin Buzzard reviewed. The second run, finished by Fable 5.2 in 30 hours, exists only as the announcement's description and chart. The OS prototype has a video and no code.

The same announcement says: "For most coding and knowledge tasks, we recommend that users start with Claude Opus 5.5, our strongest daily driver." Fable is the tier you move up to when Opus 5.5 at higher effort still falls short. So the practical question is: which work should go to Fable 5.2?

This post looks for that line in two sources. One is the set of internal measurements Anthropic published in its cost-optimization docs. The other is per-effort cost per task from Artificial Analysis (AA), measured on short standard tasks. I didn't call the API myself. The scripts that download and process AA's data are in [`experiments/fable-5-2`](https://github.com/desty/desty.github.io/tree/main/experiments/fable-5-2).

---

## What Anthropic's own measurements show

Anthropic's [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence) page reports measured cost per task by model. Here are the results that include Fable 5.2. All are Anthropic-internal, and some are single runs.

| Task | Fable 5.2 | Comparison | Reading |
|---|---|---|---|
| SWE-bench Pro subset (463 problems) | low 94.6%, $0.39 per solved task / high 96.3%, $1.39 | Opus 5.5 high 95.5%, $0.30 / xhigh 96.5%, $0.75 | At similar scores, Opus is cheaper |
| Internal agentic coding (370 tasks) | low 88.9%, $1.05 per attempt / high 93.5%, $5.39 | Opus 5.5 medium 86.6%, $0.84 | Fable low is 2.3 points higher and 25% more expensive |
| DeepResearch Bench II | high 57.7%, $4.82 | 1.9 points below Opus 5.5 at default, for 2.9x the cost | Opus is better for research |
| Internal defect search (work larger than one context window) | low F1 0.866, $357 / high 0.909, $563 | 1.6 to 5.9 points above Opus 5.5 high, for 1.5x to 2.4x the cost | Fable buys more score |

The docs' conclusion is clear. Opus 5.5 and Fable 5.1 both nearly saturate SWE-bench Pro, so a pricier model has little left to gain. On research, Fable 5.2 scored below Opus 5.5, and 4.7 to 7.0 points below Fable 5.1. Where Fable 5.2 added score was defect search, where the whole job doesn't fit in one context. Hence the docs' advice: use Fable 5.2 "for demanding reasoning and long-horizon agentic work, or when your evals on Claude Opus 5.5 at higher effort still fall short."

The same page compares Fable 5.2 with 5.1. On defect search, 5.2 scored 3.6 to 6.1 points higher at each effort level for 21% to 37% less. On SWE-bench Pro, comparing high with high, cost per solved task rose 19%, from $1.17 to $1.39. The same model swap moves cost in different directions depending on the task.

---

## Calculating from AA's short-task data

The AA index mixes knowledge work, coding, science and general knowledge at 25% each, on short standard tasks. It includes agentic tasks, but even long ones take an hour or two; it doesn't measure hundreds of subagents running for days. So the numbers below come from outside the area Fable 5.2 was marketed for. They're still worth looking at, because much real traffic looks more like these short tasks. Figures are AA Intelligence Index v5.0.1 as of 2026-11-14. Cost per task is the tokens each model actually used, at list prices, with AA's measured cache hit rates.

### Against Fable 5.1 at the same effort

The last column backs out the change in token volume by dividing the cost change by the price change (0.8x), which works because input, cache and output prices all fell 20%.

| Effort | Index | Cost per task | Cost change | Output tokens | Input tokens | Token volume (implied) |
|---|---|---|---|---|---|---|
| low | 39 → 54 | $4.47 → $3.10 | -31% | -4% | -33% | -13% |
| medium | 43 → 56 | $5.56 → $3.80 | -32% | -17% | -29% | -15% |
| high | 47 → 62 | $7.54 → $9.08 | +20% | +22% | +54% | +51% |
| xhigh | 50 → 62 | $10.85 → $14.83 | +37% | +25% | +82% | +71% |
| max | 49 → 65 | $12.99 → $26.54 | +104% | +68% | +199% | +155% |

Scores rose 12 to 16 points at every effort level. Cost fell by nearly a third at low and medium and rose from high up. Most of the growth is input. AA's agentic evaluations resend the whole conversation each turn, so input growing faster than output reads as more turns on the same tasks. Of the $9.08 per task at high, output is 43%; the rest is cache reads and writes, the same structure I saw in my own Claude Code logs in [#90](/blog/90-token-saving-tools/). The finding that 5.2 costs more than 5.1 at high matches the direction of the SWE-bench Pro measurement above (+19%).

### Swapping only the model ID

If code doesn't set effort, you compare defaults. On the API, Fable 5.1 and 5.2 default to high and Opus 5.5 to medium. In Claude Code, Fable 5.1 defaults to high, and Fable 5.2 and Opus 5.5 to medium.

| Swap | Index | Cost per task | Change |
|---|---|---|---|
| API: Fable 5.1 (high) → Fable 5.2 (high) | 47 → 62 | $7.54 → $9.08 | +20% |
| API: Opus 5.5 (medium) → Fable 5.2 (high) | 48 → 62 | $2.45 → $9.08 | +270% |
| Claude Code: Fable 5.1 (high) → Fable 5.2 (medium) | 47 → 56 | $7.54 → $3.80 | -50% |
| Claude Code: Opus 5.5 (medium) → Fable 5.2 (medium) | 48 → 56 | $2.45 → $3.80 | +55% |

API code moving up from Opus 5.5 without setting effort moves up one model and one effort level at once, and cost per task becomes 3.7x.

### Cheapest configuration per target score

I put all 25 configurations (Fable 5.2, Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 at five effort levels) in one list and picked the cheapest for each target score.

| Target index | Cheapest configuration | Cost per task |
|---|---|---|
| up to 36 | Haiku 5.5 (by effort) | $0.04 – $0.41 |
| 42 | Sonnet 5.5 high | $1.64 |
| 48 | Opus 5.5 medium | $2.45 |
| 54 | Fable 5.2 low | $3.10 |
| 56 | Fable 5.2 medium | $3.80 |
| 57 | Opus 5.5 xhigh | $6.05 |
| 62 | Fable 5.2 high | $9.08 |
| 65 | Fable 5.2 max | $26.54 |

All five Fable 5.1 settings drop off. So does Opus 5.5 at high (52, $3.46), beaten by Fable 5.2 at low (54, $3.10). Fable 5.2 at high and xhigh score 61.8 and 62.2, nearly the same, but xhigh costs $5.75 (63%) more per task.

### Against Opus 5.5 by area

I paired configurations at similar scores using AA's per-evaluation results.

| Evaluation (area) | Fable 5.2 | Opus 5.5 | Reading |
|---|---|---|---|
| FrontierCode-AA 2.0 (coding) | medium 41.3%, $2.69 | high 35.9%, $2.49 | Fable 5.4 points higher at similar cost |
| | high 49.1%, $9.64 | max 46.4%, $13.46 | Fable higher and 28% cheaper |
| Terminal-Bench 4.0 (terminal tasks) | high 59.6%, $13.47 | xhigh 59.6%, $8.78 | same score, Opus 35% cheaper |
| AA-Briefcase (long knowledge work, Elo) | high 1677, $15.49 | high 1682, $6.27 | same score, Opus 60% cheaper |
| GDP.pdf (document deliverables) | low 26.8%, $1.53 | high 28.8%, $0.83 | Opus higher and cheaper |
| Terminal-Bench-Science (science tasks) | high 70.0%, $24.28 | xhigh 61.9%, $14.12 | Fable 8 points higher |
| HLE-Diamond (hard reasoning questions) | medium 66.3%, $0.18 | max 67.9%, $1.20 | similar score, Fable 85% cheaper |
| AA-Omniscience (knowledge, hallucination) | low 63 | max 48 | Fable 15+ points higher at every effort |

Fable 5.2 leads on scientific reasoning, hard problems, factual knowledge and coding like FrontierCode. On terminal work and document-producing knowledge work, Opus 5.5 reaches the same score 35% to 60% cheaper. Because science and general knowledge make up half the index, the single index number makes Fable's lead look broader than it is.

### Anthropic's numbers versus AA's

The announcement says Fable 5.2 at high scores 45.3% on FrontierCode 2.0, close to Opus 5.5's best (45.5%), "for roughly half the cost per task," and 49.1% at xhigh. On FrontierCode-AA 2.0, which AA runs in its own harness (132 tasks in real open-source repositories, graded on whether a maintainer would merge the change), Fable 5.2 at high scored 49.1% for $9.64 and Opus 5.5 at max 46.4% for $13.46: 28% cheaper, not half. And xhigh (47.6%) scored below high (49.1%). The harnesses differ, so I can't say which is right; Anthropic's docs also say to use xhigh only where you've measured a gain.

---

## Where the two sources disagree

Overlaying the two sources shows where Anthropic's line and AA's arithmetic agree and where they don't.

**Where they agree.** Research, report and document work, and terminal-heavy agent work belong on Opus 5.5. In Anthropic's measurements Fable 5.2 scored lower on DeepResearch Bench II; on AA, Opus 5.5 matched it for less on AA-Briefcase, GDP.pdf and Terminal-Bench 4.0. In the other direction, work that exceeds one context and runs for a long time, and scientific or mathematical reasoning where the base capability gap is large, both point to Fable.

**Where they disagree: coding.** On AA's FrontierCode-AA, Fable 5.2 at low (38.4%, $2.12) scores higher than Opus 5.5 at high (35.9%, $2.49) and costs less, and on the overall AA index Fable 5.2 low is also cheaper than Opus 5.5 high. In Anthropic's SWE-bench Pro measurement, Fable 5.2 at low (94.6%, $0.39 per solved task) scores lower than Opus 5.5 at high (95.5%, $0.30) and costs more. On the internal agentic-coding benchmark, Fable 5.2 low scored 2.3 points above Opus 5.5 medium for 25% more.

The difference seems to come from the tasks. Both models solve around 95% of SWE-bench Pro, so a smarter model has almost no score left to win. FrontierCode-AA is hard: the best score is under 50%. If Opus 5.5 already solves nearly all of a kind of coding work, moving it to Fable only adds cost; if Opus 5.5 fails more than half the time, Fable at low solves more for less. This is my reading of the two sources together, not something verified on the same tasks.

---

## Using the expensive model only to direct the work

Besides running Fable 5.2 alone, the announcement describes two setups: an **advisor**, where a smaller model does the work and consults Fable, and an **orchestrator**, where Fable splits the work and hands pieces to smaller models. Both aim to spend the expensive model's tokens on judgment only, but their costs behave differently.

### Advisor: the smaller model asks when it's stuck

The [advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool) (beta) works like this:

- The request's `model` (the executor) calls the `advisor` tool while it works. The executor decides when.
- The server runs a separate inference on the advisor model. The advisor receives the system prompt, tool definitions, prior turns and tool results, the **full** transcript, as input. It uses no tools and returns only advice.
- Advisor tokens are billed at the advisor model's rates and reported in `usage.iterations` as `advisor_message`.
- Advice is typically 400-700 text tokens, or 1,400-1,800 including thinking. With Fable 5.2 as advisor, the advice comes back encrypted and the client can't read it.
- Fable 5.2 can advise Opus 5.5, Sonnet 5.5 and Haiku 5.5. When Fable 5.2 is the executor, it accepts only Fable 5.2 or Mythos 5.2 as advisor.

Most of the cost is reading the transcript, not writing the advice. A rough calculation from list prices, assuming 1,600 tokens of advice and a transcript of 30K, 60K and 90K tokens at the three calls:

| Advisor | Advisor-side cache | Per call | Total, 3 calls |
|---|---|---|---|
| Fable 5.2 | off | $0.30 / $0.54 / $0.78 | $1.63 |
| Fable 5.2 | on (5 min) | $0.36 / $0.37 / $0.38 | $1.11 |
| Opus 5.5 | off | $0.15 / $0.27 / $0.39 | $0.82 |
| Opus 5.5 | on (5 min) | $0.18 / $0.19 / $0.19 | $0.56 |

The advice itself costs $0.064 per call; the rest is reading or caching the transcript. The docs say advisor-side caching breaks even at about three calls per conversation. So advisor cost depends on how often the executor asks and how long the conversation has grown.

Anthropic's measurements are cautious. On an internal coding benchmark, Opus 5.5 at high with a Fable 5.1 advisor scored 1.7 points higher (at the edge of run-to-run noise) for 2.1x the cost, which the docs describe as about what more effort on Opus 5.5 would buy. On Chartography, where the executor almost never asked, the pairing scored 7 points lower. An advisor helps only when consulted, and its tool definition adds about 1,000 tokens to every request either way.

### Orchestrator: Fable splits the work and smaller models run it

You build an orchestrator with multiagent orchestration in Claude Managed Agents: define a lead agent and the subagents it can call, each with its own model ([docs](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)). The announcement's customer examples look like this. Uber sent out about 170 reviewer agents with Fable 5.2 for a 10-to-12-hour security audit.

Anthropic's defect-search measurement shows what this setup costs.

| Setup | F1 | Cost per run |
|---|---|---|
| Fable 5.2 alone, high | 0.909 | $563 |
| Fable 5.2 alone, low | 0.866 | $357 |
| Fable 5.2 lead + Sonnet 5.5 subagents | 0.833 | $165 |
| Opus 5.5 lead + Sonnet 5.5 subagents | about the same as Fable lead | Fable lead costs 19% more |
| Fable 5.2 lead + Haiku 5.5 subagents | 0.716 | $85 |

Sonnet subagents cut cost 54% compared with Fable alone at low, and lost 3.2 points. Swapping the lead from Fable 5.2 to Opus 5.5 left the score about the same, so on this task Fable as lead bought nothing. The docs list only two situations where an orchestrator came out ahead: routine work with a long cost tail, and work larger than one context window. When the work was one dependent chain, the lead model alone at lower effort came out ahead in every case measured on earlier models.

Both setups have to beat Fable alone at low effort before they're worth it. That's the docs' first recommendation too: tune effort on your current model before adding a second, and if a gap remains, price the stronger model alone at low effort first.

---

## Fable and Mythos: same model, different safeguards

Fable 5.2 and Mythos 5.2 are the same model. Fable carries stronger cybersecurity and biology safeguards and is open to everyone; Mythos goes only to organizations verified through the Cyber Verification Program or the Life Sciences Verification Program. Prices and specs are the same. When Fable 5.2 blocks a request, Opus 4.8 (cyber) or Opus 5 (biology) answers instead, and blocks fell about 55% from 5.1. If security research or life-sciences work keeps getting blocked on Fable, the intended path is a verification program, not another model. Anthropic reports that Mythos 5.2 found 10.2% more vulnerabilities than Opus 5.5 on CVE Rediscovery.

---

## What to fix when moving

### From Fable 5.1

The model docs call the move mostly a model-ID swap, with four changes that can break code:

- **Editing earlier turns returns a 400 on every account.** Fable 5.2's thinking blocks are bound to the `system`, `tools` and history before them. Fable 5.1 enforced this only on accounts created on or after August 31, 2026; 5.2 enforces it regardless of account age. Nothing changes if Claude Code, claude.ai, Managed Agents or the Agent SDK manages the conversation. A harness that builds `messages` itself must keep `system` and `tools` fixed for the session, only append, and send responses back exactly as received. `prefix_mismatch_behavior: "drop_block"` is a stopgap while you fix the edits, and re-doing the dropped reasoning raises output tokens.
- **Earlier models can't read 5.2's thinking blocks**, Fable 5.1 and Opus 5.5 included. If a router moves a conversation to another model, later turns run without 5.2's reasoning. No error; only cost and latency rise on the first turn after the switch.
- **Computer use only through `computer_toolset_20260801`.** The earlier `computer_20251124` returns a 400 everywhere except Amazon Bedrock.
- **The advisor must be Fable 5.2 or Mythos 5.2.** It's an edit to `tools`, so change it in new conversations.

On the prompt side, deletions come first, much as with Opus 5 in [#40](/blog/40-claude-opus-5/):

- 5.2 ignores "answer directly without deliberating" at medium and above. Remove it and lower effort.
- Test without token budgets shown to the model. On coding tasks at high and xhigh, removing a large budget lowered cost at equivalent performance.
- Re-read lines that invite delegation. In harnesses that invite it, 5.2 starts subagents readily, and at xhigh and above it used them to review its own work.
- 5.2 follows accumulated rules like "never retry" from memory and notes closely. Delete rules whose reason is gone, and write exceptions into prohibitions.

Add the rest only when the behavior shows up. If turns end with work left at low and medium, add the docs' finish-the-task text (half as many sessions ended with doable work left; output tokens rose about 30%). To have the model restructure code, add the ownership sentence (merging duplicated code went from under 10% to about 75% of runs; output tokens rose 70-80%). If your client renders only `text` blocks, turn on `thinking.display: "updates"` (beta) so progress shows during long runs.

### From Opus 5.5

- **Set effort explicitly.** The API default goes from medium to high.
- **ZDR organizations can't use it right away.** Fable 5.2 requires 30-day data retention.
- **CMEK organizations lose structured outputs.** Remove `strict: true` and `output_config.format` and validate in code.
- **Check routes back to Opus.** Fable 5.2 reads Opus 5.5's thinking blocks, but not the reverse. Routing hard turns up to Fable and back down to Opus loses the earlier reasoning on the way down, and caches are per model.
- **Check rate limits.** Fable 5.2 has its own.
- **Cache reads cost the same, $0.20.** Only input, output and cache writes double.

---

## What stays on Opus 5.5, and when to move up to Fable 5.2

Combining the two sources and the docs' advice. Treat this as a starting point and check it with the procedure in the next section.

**Keep on Opus 5.5**

- Everyday coding, especially work you can check with tests and that Opus 5.5 already gets right more than 90% of the time. On SWE-bench Pro, Opus 5.5 at high was only 0.8 points below Fable 5.2 at high, for under a quarter of the cost per solved task.
- Research, reports and documents, and terminal-heavy operations work. Neither source shows Fable worth its cost there.
- The lead role over subagents. On defect search, swapping the lead to Fable left the score the same and raised cost 19%.
- High-volume work goes one tier further down, to Haiku 5.5 or Sonnet 5.5. On AA, Haiku is cheapest up to index 36.

**Signals to move up to Fable 5.2**

- Opus 5.5 at xhigh keeps failing the same tasks. On the AA index, against Opus 5.5 xhigh (57, $6.05), Fable 5.2 at medium (56, $3.80) is 37% cheaper and at high (62, $9.08) scores 5 points higher.
- The work doesn't fit in one context or runs for hours. That's where Fable added score in Anthropic's measurements.
- Scientific or mathematical reasoning, or factual accuracy, decides the result. The gaps on AA's HLE, CritPt and Omniscience were large.
- You're on Fable 5.1. 5.2 scores higher at the same effort and costs less at low and medium.

**Where to start effort after moving up**

- For work coming up from Opus 5.5, **start at low**. On the AA index and on Anthropic's defect search, Fable 5.2 at low scored above Opus 5.5 at high, though on SWE-bench Pro it was 0.9 points lower. If low leaves more turns unfinished, add the finish-the-task text or move to medium.
- For work moving from Fable 5.1, start **one or two levels below** what you used. On AA, 5.2 at low (54, $3.10) beats 5.1 at xhigh (50, $10.85).
- Use high only when those levels fall short. The API default is high, so leaving effort unset starts you there.
- Use xhigh only after measuring that it beats high on your tasks. On AA's coding evaluation it scored lower.

---

## How to check on your own work

I didn't run these myself, so this is a proposed procedure.

1. **Pick 20 to 50 representative tasks with completion criteria.** Take them from production logs, and mark the ones Opus 5.5 solves easily and the ones it often fails. The two sources disagree right between those groups.
2. **Measure the current setup as the baseline.** Record success rate, cost per completed task, time, and how often a person stepped in, with cache reads, cache writes and output from `usage` recorded separately.
3. **Pass the prefix check first.** If your harness builds `messages`, fix edits to earlier turns before measuring, or `drop_block` re-reasoning inflates the cost.
4. **Measure Fable 5.2 alone at low and medium.** Look separately at how many more of the failing tasks it solves and how much more the easy tasks cost.
5. **Add an advisor or orchestrator only if it beats step 4.** For an advisor, first record how often the executor actually consults it (the count of `advisor_message` entries in `usage.iterations`).
6. **Decide the rollback condition in advance**, for example: "stay on Opus 5.5 unless success on the failing group rises by 10 points or more."

As an example I made up for this post, take a team running a coding agent on Opus 5.5 at high. Splitting its tasks shows that Opus handles 80% fine and keeps failing the other 20%. The setup that fits is not switching everything to Fable, but rerunning that 20% on Fable 5.2 at low. If success on that group rises enough, the team builds routing that sends work to Fable on failure signals such as repeated test failures or retry counts, starting a new conversation on hand-off to avoid the thinking-block issues.

---

## Summary

Fable 5.2's launch was about long, hard work with hundreds or thousands of subagents running for days. Those cases are self-reported and can't be checked from outside, but Anthropic's published cost measurements point the same way: Fable 5.2 earned its cost on work larger than one context, and only added cost where Opus 5.5 already does well, such as SWE-bench Pro and research. That's why Anthropic says to keep Opus 5.5 as the default.

AA's short-task arithmetic shifts that line on coding. On hard coding tasks where Opus 5.5 fails more than half the time, Fable 5.2 at low solved more for less than Opus 5.5 at high. So the test for moving work up is less about the area and more about whether Opus 5.5 actually fails at it. After moving up, start at low, and add advisor or orchestrator setups only when they beat Fable alone at low effort.

For more on cost per task by effort see [#75](/blog/75-opus-5-5-gpt-6-sol/), and for how caching shapes the bill see [#48](/blog/48-cache-hit-rate/).

---

*Sources: [Introducing Claude Fable 5.2 and Claude Mythos 5.2 (Anthropic, 2026-11-09)](https://www.anthropic.com/claude-fable-and-mythos-5-2), [Formalizing Fermat's Last Theorem (Anthropic, 2026-09-04)](https://www.anthropic.com/news/formalizing-fermats-last-theorem), [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence), [Advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool), [What's new in Claude Fable 5.2](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2), [Claude Fable 5.2 migration guide](https://platform.claude.com/docs/en/models/fable-5-2/migration-guide), [Prompting Claude Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Claude Code model configuration](https://code.claude.com/docs/en/model-config), Artificial Analysis release pages for [Claude Fable 5.2](https://artificialanalysis.ai/models/releases/claude-fable-5-2), [Claude Fable 5.1](https://artificialanalysis.ai/models/releases/claude-fable-5-1), [Claude Opus 5.5](https://artificialanalysis.ai/models/releases/claude-opus-5-5), [Claude Sonnet 5.5](https://artificialanalysis.ai/models/releases/claude-sonnet-5-5) and [Claude Haiku 5.5](https://artificialanalysis.ai/models/releases/claude-haiku-5-5) and their per-effort model pages, [FrontierCode-AA 2.0](https://artificialanalysis.ai/evaluations/frontiercode-2-0), [AA index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking). AA figures collected 2026-11-14 (index v5.0.1). AA's configuration names include "Default Fallback." AA doesn't define it, but it appears to mean the default refusal fallback was on, in which case Opus 4.8 or Opus 5 may have answered some tasks. Token-volume changes are estimates backed out from cost and price changes. Advisor call costs are an example calculated from list prices with assumed transcript and advice lengths. The measurements from Anthropic's cost docs are Anthropic-internal, and some are single runs. All comparisons are calculated from public data, not measured by calling the API.*
