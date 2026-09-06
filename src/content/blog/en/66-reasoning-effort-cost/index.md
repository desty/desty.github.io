---
title: "GPT‑6 Astra and Sol: how should we divide the work?"
summary: "Should Astra replace Sol everywhere? Public comparisons show how to preserve reliable workflows while testing whether a new model reduces intervention, rework, and total task cost."
date: "2026-09-06T17:00:00+09:00"
tags:
  - openai
  - gpt-6
  - llm
  - agent-engineering
  - evaluation
draft: true
---

A new model raises a familiar decision: should it replace the one you already use? Better performance is appealing, but spending may increase and established workflows may behave differently. Comparing GPT‑6 Astra at Low with GPT‑5.6 Sol at High makes the choice more complicated still.

Public Astra and Sol comparisons do not point to one setting for everything. Broad evaluations differ from repository work, and more reasoning can sometimes cost less. A practical starting point is to preserve work Sol already handles reliably and test Astra first on tasks that require repeated intervention or fail to finish.

The [GPT‑6 practical guide](/en/blog/62-gpt-6-astra/) covers access and configuration. This article considers how to divide work between Astra and Sol, starting with cost evidence and including output quality and human repair time. Sources were checked on September 6, 2026. The figures come from external evaluators and a developer's published experiment, not runs performed for this article or an academic paper.

## Start by separating the work

There is no need to move repeatable work that Sol already completes quickly and reliably. Astra is more useful to test first where the older model required repeated implementation guidance or lost the thread while crossing files and tools.

| Current state | First comparison | Result to inspect |
|---|---|---|
| Sol produces consistent results | Keep the current Sol setting | Whether Astra materially reduces review time or improves quality |
| Sol High still needs repeated clarification | Astra Low or Medium | Whether it meets the same acceptance criteria with less intervention |
| Related states and edge cases are often missed | Astra Medium or higher | Whether it connects retries, state, and verification |
| Requirements or logs are missing | Supply evidence before changing models | Whether the same information gap still blocks progress |

This is a starting order for testing, not an automatic routing formula. The public comparisons below show that quality and cost change with the task.

## Sol costs less when token use is equal

Standard API rates for Astra are $10 per million input tokens, $1 for cached input, and $50 for output. Sol costs $4, $0.40, and $20 respectively. With equal token use, Sol costs 60% less. Low and High do not change the per-token rate; they influence how much reasoning the model performs. [Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra), [Sol model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

Real agent tasks can reverse that relationship by using different numbers of tokens and calls. The next three comparisons cover a broad benchmark, repository work, and unfamiliar game environments.

## Sol High was slightly cheaper on a broad benchmark

Artificial Analysis Intelligence Index v4.2 combines several evaluations. At the time of checking:

| Setting | Index score | Weighted average cost per evaluation task |
|---|---:|---:|
| Astra Low | 49 | $0.63 |
| Sol High | 48 | $0.61 |

Sol High costs about 3% less; Astra Low scores one point higher. Costs account for input, caching, reasoning, and answer tokens. They are neither Codex subscription deductions nor a coding-only average. [Astra Low](https://artificialanalysis.ai/models/gpt-6-astra-low), [Sol High](https://artificialanalysis.ai/models/gpt-5-6-sol-high)

The small difference does not establish a universal winner. It does justify considering Astra Low as an alternative to Sol High: higher token rates need not produce proportionally higher task costs. A one-point index difference also should not become a claim about a 1% difference in general intelligence.

## Astra Low was cheaper in a repository experiment

Shinsuke Kagawa ran repository analysis, implementation, and review once per condition on Galley. Implementation used a common plan; review used the same Sol implementation. These are the sums of three separate tasks.

| Setting | API-equivalent cost | Adjusted elapsed time |
|---|---:|---:|
| Astra Low | $26.97 | About 49 minutes |
| Astra Medium | $25.67 | About 51 minutes |
| Astra High | $37.23 | About 77 minutes |
| Sol High | $31.79 | About 75 minutes |

Low cost about 15% less than Sol High; Medium was cheaper still. This was one repository, with one run per condition and non-blind final assessment. Estimates exclude subsequent repairs and evaluator work; they are not subscription charges. [Methods and detailed results](https://www.norsica.jp/resources/astra-effort-evaluation)

The author retained High's implementation for handling interactions between retries and persisted state more completely. Yet Medium's review found a startup failure High missed. The most expensive setting did not catch everything, and the cheapest output was not the implementation selected. [Author's interpretation](https://dev.to/shinpr/switching-from-gpt-56-sol-to-gpt-6-astra-start-with-medium-effort-25ao)

The totals are not the complete cost of producing one accepted deliverable. If the cheaper result requires substantial repair, that subsequent cost belongs in the decision. If a more expensive result avoids repairs, the premium may be justified. This experiment did not measure that subsequent cost.

## Max cost less than Low in another evaluation

ARC Prize compared Astra reasoning settings on ARC-AGI-3, which involves exploring and solving unfamiliar game environments. All results below use the same Provider Adapter harness.

| Setting | Score | Evaluation cost |
|---|---:|---:|
| Low | 98.0% | $21,298 |
| Medium | 98.4% | $19,285 |
| Max | 98.6% | $17,332 |

Max cost about 19% less than Low. The evaluator attributes this to solving games with fewer actions, reducing calls and tokens. These amounts cover the evaluation, not a typical user assignment. [ARC Prize results](https://arcprize.org/blog/astra)

This illustrates why more reasoning need not increase total spending. Investing in one decision can avoid unnecessary exploration and repeated calls. The saving measured in these games cannot simply be transferred to repository refactoring or document creation.

## A request and a finished task have different costs

An agent usually reads files, runs tools, and reads their results. Failed changes lead to further attempts. Repeated wrong decisions accumulate input and output.

Call count alone is insufficient too. Calls vary in input length, caching, reasoning, and tool costs. Whether the output meets the user's requirements matters. Keep two records:

- Service consumption: actual charges or subscription usage, including failed attempts and retries.
- Human time: clarifying instructions, reviewing results, and making corrections.

There is no need to force both into one currency figure. A modest token premium may be worthwhile if it saves an hour of human work. A cheap first run is less useful if its errors take longer to diagnose.

## Dividing one assignment between models

Another option is to divide one assignment: use the new model for difficult diagnosis and the familiar model for repetitive changes once the approach is settled. Handoffs require transferring decisions and constraints, however, and can add cost or lose information. This is worth considering when tasks separate cleanly, not a required procedure for every assignment.

## Reducing the need to choose each time

Asking users to classify difficulty and optimize model selection every time creates another job. Published comparisons should narrow the starting choices. The following is an operating proposal, not a validated automatic selection formula.

If Sol High already works well, retain it as your baseline. Consider Astra Low as a similarly priced benchmark alternative and Astra Medium for multi-step coding. Check a few recurring tasks, choose one everyday default, and reserve further attention for categories that repeatedly cause trouble.

Suppose you fix repository bugs each week. Give each configuration the same starting code, reproduction material, and required checks. Record whether it finished with fewer clarifications, passed without manual repair, and used less of the service. If the new model consistently reduces explanation and rework, save it as the default for that category. If there is no benefit, keeping the familiar setup is reasonable.

Before increasing effort, distinguish why progress stalled. Missing logs or conflicting instructions require better inputs. Repeatedly missing related behavior despite having the evidence gives you a reason to test more reasoning. Switching settings after edits have begun differs from a fresh comparison; record that condition as well.

## What if the host reported repetition and usage?

A custom harness need not begin by asking a model how difficult every task will be. Start by recording consumption and verification results in the execution host. This is a design example:

```text
Start: record default model, effort, and acceptance criteria
After tools: accumulate usage, failures, and relevant check results
Repeated failure: summarize new evidence and attempted changes
Usage threshold reached: stop before the next call and notify
User decision: add evidence / raise effort / narrow scope / end
```

Enforce usage limits with values the host can actually observe. A prompt asking the agent to stay within budget does not impose a billing cap. Checking before the next call still allows an in-flight call to incur further costs. Where exact subscription usage is unavailable, do not present token estimates as actual allowance consumption.

Stopping after any two errors could interrupt useful exploration. Consider whether new evidence appeared or the approach changed, not merely the error count. Use the model's report alongside actual diffs and test logs. If another model evaluates every step, include its expense too.

Users can then delegate with a saved default and inspect work when repetition or consumption exceeds expectations. They need not predict every task's difficulty in advance.

## There is no need to retire the familiar model immediately

Sol High was slightly cheaper on the broad evaluation. Astra Low and Medium were cheaper in one repository experiment. Max reduced actions and cost on ARC-AGI-3. These results show how the choice can depend on the task and execution setup.

Keep Sol for established work and try Astra where progress often stalls. If Astra at low effort maintains quality with less intervention, move everyday tasks later. Expand its role where explanation and repair actually decrease instead of migrating everything at once.
