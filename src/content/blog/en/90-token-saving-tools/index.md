---
title: "Most of a Coding Agent's Bill Is Context It Reads Again, and Token-Saving Tools Should Cut That"
summary: "RTK says it cuts command output by 60-90% and has 85,000 stars. When UC Berkeley and Microsoft Research measured it under controlled conditions on SWE-Bench, an agent with RTK cost 9% less or 4.5% more depending on the setting, and in 12 of 30 repository × setting cells it cost more. TokenEconomizer, released by the same team, compresses no output. It cuts the costs that repeat on every turn (unused tool definitions, repository facts each session rediscovers, failure loops) and lowered cost by 18.4-30.9%. In 30 days of my own Claude Code logs, 97.9% of tokens were context read back from the cache. This post explains how an agent's bill accumulates, which line RTK, Serena, Aider's RepoMap and TokenEconomizer each reduce, how the paper's setup differs from the released plugin, and what to change first in your own setup and how to measure it."
date: "2026-10-30T17:37:00+09:00"
tags:
  - agent-engineering
  - context-engineering
  - claude-code
  - open-source
  - ai-coding
draft: false
---

Open-source tools that promise to save coding-agent tokens keep multiplying. [RTK](https://github.com/rtk-ai/rtk), which compresses shell command output, says it "reduces LLM token consumption by 60-90% on common dev commands" and has 85,000 stars. [headroom](https://github.com/headroomlabs-ai/headroom), which compresses tool output and logs, has 78,000, and [Serena](https://github.com/oraios/serena), an MCP server for code navigation backed by language servers, has 31,000 (GitHub API, October 30). For people who run agents all day, usage limits and bills are now numbers they check daily, and those star counts reflect how heavy that load has become.

The catch is that the savings each tool advertises mostly describe how much smaller the output it touched became. Output that shrinks by 90% does not make the bill shrink by 90%. How much does the bill change, then? The [TokenEconomizer paper](https://arxiv.org/abs/2610.22732) posted to arXiv on October 15 (UC Berkeley, Microsoft Research, Microsoft Security) answers with controlled measurements. The team attached RTK, Serena and Aider's RepoMap to Claude Code, Codex and the Copilot CLI, ran SWE-Bench tasks, and released its own tool, [TokenEconomizer](https://github.com/microsoft/TokenEconomizer), as a plugin.

This post looks at three questions. What lines make up a coding agent's bill? Which line does each tool reduce, and how much did the actual bill change? What should you change first in your own setup? I read the paper and its appendices, the code and docs of the TokenEconomizer repository (HEAD `1deb887`, October 29), and aggregated 30 days of my own Claude Code session logs. I did not install and measure RTK or headroom myself, so their effects come only from the paper's measurements and their repositories' descriptions.

## How the bill accumulates

On every turn, the whole request goes back to the model. At the front are the system prompt, tool definitions and project instructions such as CLAUDE.md; behind them, the entire conversation and tool output so far. Prompt caching makes rereading that repeated front part cheap, but it does not remove the rereading. The longer a session runs, the more each turn rereads, so later turns in a session cost more than earlier ones. When the cache hits and when it breaks is covered in [#48](/blog/48-cache-hit-rate/).

I checked how this shows up on a real bill using my own logs. I took the `usage` field of 1,337 billed responses from 15 Claude Code sessions in the last 30 days (as of October 30), across several projects including this blog, and priced them at Anthropic's official rates. The models were a mix of Opus 5.5 and Fable 5.1.

| Token class | Share of tokens | Share of cost |
|---|---|---|
| Cache read (rereading stored context) | 97.9% | 47.0% |
| Cache write (storing new context the first time) | 1.8% | 37.2% |
| Output | 0.3% | 15.8% |
| Uncached input | 0.0% | 0.0% |

By token count, almost everything was reread context. Cache reads are cheap, 0.05x base input on Opus 5.5 and 0.025x on Fable 5.1, so in cost they drop to about half. Cache writes were only 1.8% of tokens but 37% of cost: every cache write in my sessions used the 1-hour TTL, which is priced at 2x base input. The first request of each session carried 42,000 to 52,000 tokens of context. That is how much every turn rereads before the user has asked for anything.

The conclusion from this table is simple. Removing one turn removes the entire context that turn would have reread. Shrinking one tool output removes only the cost of storing that output and part of the cost of rereading it in later turns. That does not make output compression useless. But its compression ratio applies to one line of the bill, and if compression makes the agent spend extra turns finding information again, those turns offset the gain.

## Three fixed strategies measured under the same conditions

The paper first ran 60 SWE-Bench tasks, 10 from each of 6 repositories, with Claude Code and Opus 4.8 at high effort, comparing default execution with each of three tools on the same tasks. The team calls them fixed strategies because they apply the same configuration in every repository.

- **RTK** (v0.45.0) is registered as a pre-execution hook on the shell tool. It rewrites commands to run through RTK and returns condensed test logs, listings and diffs to the agent.
- **Serena** adds symbol-level navigation tools such as finding definitions and references, and the agent is told to prefer them over its native read and search.
- **RepoMap** is Aider's repository map. It ranks the repository's symbols by cross-references and fits the top signatures into 2,048 tokens, supplied as project instructions.

| Repository | RTK | Serena | RepoMap |
|---|---|---|---|
| scikit-learn | −6.9% | +28.6% | +30.5% |
| SymPy | +7.3% | +30.8% | +9.8% |
| Django | −19.9% | −15.4% | −16.2% |
| Sphinx | +0.6% | +2.1% | −7.5% |
| Matplotlib | −4.9% | −4.8% | +5.0% |
| xarray | −16.8% | +4.7% | −20.2% |

*Cost change versus default execution (negative is cheaper). Paper, Appendix Table 3.*

All three cut cost by 15-20% on Django but raised it on SymPy. Only RTK helped on scikit-learn; only RepoMap helped on Sphinx. No tool saved money in every repository.

The main experiments widened this to 277 tasks, five agent–model settings and three seeds. With RTK, the bill changed by −1.1% for Claude Code + Sonnet 5, −3.6% with Opus 4.8, −4.7% for Codex + GPT-5.6 Terra, +4.5% with GPT-5.6 Sol, and −8.9% for Copilot CLI + Sonnet 5. RepoMap ranged from −6.1% to +6.5%. Split into 30 repository × setting cells, RTK raised cost in 12 and RepoMap in 15. Serena was left out of the main experiments: it was the only tool that raised pooled cost in profiling, and TokenEconomizer's tool pruning could remove the Serena server and confound the comparison.

Which line of the bill each tool touches suggests why the results diverge. RepoMap puts a 2,048-token map into project instructions, so the map joins the front part reread on every turn. In a repository where the map saves exploration turns that pays off; elsewhere it only adds a per-turn cost. Serena also adds tool definitions to the front part, and if symbol navigation takes more calls than plain read and search, cost rises. RTK only shrinks new shell output. The paper does not analyze why RTK's results diverge. One possibility is that compressed output drops information and the agent reruns commands, but that is an unverified hypothesis.

## Three costs that repeat

From the default-execution traces of the same 60 tasks, the team found three costs that repeat within a repository.

**Each session rediscovers the same facts.** Actions repeated in at least half of a repository's tasks accounted for 12-28% of tool-call bytes. The share of calls matching an action from an earlier task was 14% on the second and third tasks and rose to 30% once five or more tasks preceded. Against another repository's history only 7% matched. Agents keep rediscovering facts that hold only in that repository, such as which command runs the tests or whether a build must run first.

**Most loaded tools go unused.** The agent received 23 tool definitions on every turn, yet no repository used more than 7. Sixteen were never called, and three accounted for 98% of calls. In my own logs, 21 tools were called over 30 days and the top three (Bash, Playwright's page-script evaluation and page navigation) made up 78% of calls.

**Failed tasks spend a lot.** The 10 failed tasks were 17% of the total but 32% of the cost. Repetition alone could not identify failure: 36 of the 50 successful runs also repeated an error, and more than half the spend after a repetition came from runs that went on to succeed. A uniform turn limit did not fit either. Failed Matplotlib tasks ran much longer than successful ones (45 turns versus 20), while in Sphinx they barely differed (36 versus 31).

All three connect to turn count or to the front part reread on every turn. Rediscovering a fact takes turns, unused tool definitions are reread every turn, and failure loops keep adding turns.

## How TokenEconomizer cuts cost

TokenEconomizer is an external controller that leaves the agent's model and code alone. It reads finished sessions in the same repository and answers each of the three costs above.

| Mechanism | What it does | Conditions |
|---|---|---|
| micro-skills | Extracts repository facts from repeated failures and periodic reviews of recent sessions, and adds them one line each at session start | A fact must be confirmed in three sessions, and is dropped when later sessions contradict it |
| tool pruning | Adds long-unused tools to the deny list in the agent's own settings | Unused over 10 prompts spanning at least 2 sessions, or over 5 sessions |
| loop guard | A judge model reviews turns with repeating failures and, if it finds the turn stuck, adds a note to try another approach | Acts only after 5 turns in that repository ended well, and only at judge confidence of 0.7 or more |

The bill's structure shows up in the details. Cost is computed at cache prices, and the controller's own model calls, such as the judge and the fact proposer, are charged to the task. When retiring facts, micro-skills weighs one contradiction more than one confirmation; the paper explains that "a skill that should have been retired is re-billed on every later prefix." Tool pruning writes the deny list only after the repository's sessions have been idle for 60 minutes. Changing tool definitions breaks the cache of a resumed conversation and forces the whole history to be stored again, so it waits until the cache has expired anyway.

Here are the SWE-Bench results, next to lowering effort to medium.

| Setting | TokenEconomizer cost | Pass@1 change | Medium effort cost | Pass@1 change |
|---|---|---|---|---|
| Claude Code + Sonnet 5 | −23.6% | +1.3 | −26.6% | −4.7 |
| Claude Code + Opus 4.8 | −30.9% | −1.0 | −16.8% | −1.8 |
| Codex + GPT-5.6 Terra | −24.7% | +0.9 | −25.7% | −4.2 |
| Codex + GPT-5.6 Sol | −26.1% | +1.6 | −28.9% | −3.4 |
| Copilot CLI + Sonnet 5 | −18.4% | +2.6 | −25.4% | −2.4 |

*Baseline is default execution at high effort. Pass@1 change in percentage points. Paper, Table 1.*

Lowering effort to medium cut cost by 17-29% but lowered success in every setting. TokenEconomizer raised success in four of five settings and cut cost in all 30 cells (−5.2% to −40.1%). With one mechanism at a time, in the two Claude Code settings, tool pruning saved 13.2% and 17.7%, micro-skills 11.8% and 14.3%, and the loop guard 7.1% and 5.4%. The paper attributes tool pruning's larger share to the fact that "it acts on every turn of every task." The mechanism that shrinks the per-turn front part saved the most.

The effect takes experience to appear. Each repository starts with no history, so averaged over the two Claude Code settings, the first few tasks cost more than default in every repository except xarray. From around the sixth task, cumulative cost fell below default. On security-auditing benchmarks where every task is a new repository, micro-skills was turned off and savings narrowed to 6.4-19.6%.

There are results for combining with fixed strategies too. On Claude Code + Opus 4.8, adding RTK raised the saving from 30.9% to 33.2% with success above default. In other settings, adding RTK lowered the saving by up to 5.2 points. Adding RepoMap saved less than TokenEconomizer alone in four of five settings. The paper notes that RepoMap supplies a different kind of information, where a fix belongs, which can raise success, but the map is billed on every turn.

## How the released plugin differs from the paper

The TokenEconomizer repository lays out how the paper's experimental setup differs from the released plugin in a table in [`docs/PLUGIN.md`](https://github.com/microsoft/TokenEconomizer/blob/main/docs/PLUGIN.md). Three differences matter before installing it.

First, micro-skills is off by default, even though it had the second-largest effect in the ablation. The docs give two reasons: the fact proposer calls a model on the user's plan, and what gets injected comes from command output that the repository controls. If a repository produces malicious output, it could become an instruction in every session, so turning it on is left to the user. A default install runs only tool pruning and the loop guard, so the paper's 18.4-30.9% should not be expected as is.

Second, the loop guard never stops a turn. In the paper's experiments, a turn still stuck after the redirect was terminated. The plugin only tells the user, in one line, how to stop it, because Codex and Copilot hooks ignore the stop signal and because the decision belongs to a person. In a headless run that nobody watches, a stuck turn keeps going until the agent's own limits.

Third, Claude Code may have fewer tools to prune than in the paper. In my setup, Claude Code handles most MCP tools as deferred, loading them only when needed. TokenEconomizer's own log parser (`trace/claude.py`) notes that deferred tools "cost one listing line each, not a schema, so they matter little to the bill." In that case tool pruning is left with the built-in tools whose full definitions are always sent. Do not assume your tool setup matches the paper's 23 tools per turn.

The supported versions are narrow as well: Claude Code 2.1.300-2.1.310 and Codex 0.153.1-0.164.0. The Claude Code 2.1.314 I use is outside that range.

## What to change first in your setup

Read together, the paper and my logs set an order. First reduce turn count and the front part reread every turn; add output compression only after measuring it on your own repository; lower effort last, since it costs success.

**1. Measure the makeup of your bill.** You need to know how much your sessions spend on cache reads, cache writes and output before deciding what to cut. Claude Code keeps session logs as JSONL under `~/.claude/projects/`, so collecting each response's `usage` is enough. One response is logged across several lines, so keep only the last value per message id.

```python
import json, glob, os, collections
last = {}
for f in glob.glob(os.path.expanduser("~/.claude/projects/*/*.jsonl")):
    for line in open(f, errors="ignore"):
        d = json.loads(line)
        m = d.get("message") or {}
        if d.get("type") == "assistant" and isinstance(m, dict) and m.get("usage"):
            last[m["id"]] = m["usage"]
t = collections.Counter()
for u in last.values():
    t["cache_read"] += u.get("cache_read_input_tokens", 0)
    t["cache_write"] += u.get("cache_creation_input_tokens", 0)
    t["output"] += u.get("output_tokens", 0)
print(t)  # multiply by per-model prices to get cost shares
```

Check the context size of the first request as well. It tells you the fixed cost every turn rereads.

**2. Write down facts that every session rediscovers.** You can do by hand what micro-skills does. If the agent finds the same command by trial and error in every session, put that command on one line in CLAUDE.md or AGENTS.md. Instructions also sit in the front part reread every turn, though, so long instructions bring RepoMap's problem. Borrow TokenEconomizer's rule: write only facts confirmed across several sessions, and delete them as soon as they turn out wrong. How to write instructions an agent actually follows is tested in [#66](/blog/66-agents-md-claude-code/).

**3. Remove tools you don't use.** Turn off MCP servers that are connected but unused, and deny unused built-in tools in per-repository settings. Changing tool settings breaks the cache of a resumed conversation, so change them during a break, as TokenEconomizer does.

**4. Break off when the same failure repeats.** When the same error appears three times, stopping the turn and asking for a different approach is cheaper than letting it keep trying. As the paper's data shows, repetition alone does not identify failure, so use how long a successful task usually takes in that repository as the reference. Give headless runs a separate cap on turns or cost.

**5. Add output compression only after measuring.** In repositories with long test logs and build output, a tool like RTK may pay off. But as the paper shows, cost can rise depending on the repository, so judge by the bill and success on the same tasks, not by compression ratio.

The change in cache pricing matters too. The paper measured with Opus 4.8 and Sonnet 5, whose cache reads cost 0.1x base input. Opus 5.5 and Sonnet 5.5 are down to 0.05x. When rereading gets cheaper, cache writes, that is, new context coming in, take a larger share of the bill; in my logs cache writes were 37% of cost. On the latest models, then, cutting tool output may matter relatively more than the paper measured. This is a hypothesis from my logs and the price table, and confirming it needs the same comparison rerun on the latest models.

To measure the effect, follow the paper's design. Run at least 10 real tasks from the same repository in order, once with the tool on and once with it off. Compute cost at cache prices, including the tool's own model calls. Record success alongside, and compare cumulative cost rather than the first few tasks. If cost does not fall or success drops, remove the tool.

TokenEconomizer itself fits work that repeatedly runs tests in the same repository. If you use it, starting with `toolprune=propose` to see what it would remove, then checking real cost with `status` before turning it on, is the safe order. Check the supported version range first.

## Summary

Context reread on every turn makes up most of a coding agent's bill. In 30 days of my sessions, 97.9% of tokens were cache reads, and each session reread 40,000 to 50,000 tokens on every turn from the start. Removing a turn or shrinking the front part sent on every turn therefore moves the bill more than shrinking one output by 90%.

Controlled measurements point the same way. RTK, Serena and RepoMap cut or raised cost depending on the repository, and RTK raised it in 12 of 30 cells. TokenEconomizer, which cuts unused tool definitions, rediscovered facts and failure loops, lowered cost in all 30, and among its mechanisms tool pruning, which acts on every turn, saved the most.

The released plugin is more conservative than the paper's setup, though: micro-skills is off, the loop guard never stops a turn, and Claude Code already handles MCP tools as deferred. Whatever tool you pick, the starting point is measuring the bill and success rate together on your own repository.

## References

- Aaron J. Li et al., [TokenEconomizer: Experience-Driven Black-Box Cost Control for Coding Agents](https://arxiv.org/abs/2610.22732), arXiv 2610.22732, 2026-10-15
- [microsoft/TokenEconomizer](https://github.com/microsoft/TokenEconomizer) repository, [`docs/PLUGIN.md`](https://github.com/microsoft/TokenEconomizer/blob/main/docs/PLUGIN.md)
- [rtk-ai/rtk](https://github.com/rtk-ai/rtk), [headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom), [oraios/serena](https://github.com/oraios/serena), [Aider-AI/aider](https://github.com/Aider-AI/aider)
- Anthropic, [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) (cache write and read multipliers)
- Earlier posts: [#18 Headroom code analysis](/blog/18-headroom/), [#48 Cache hit rate](/blog/48-cache-hit-rate/), [#66 AGENTS.md experiments](/blog/66-agents-md-claude-code/)
