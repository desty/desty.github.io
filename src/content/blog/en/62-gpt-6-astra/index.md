---
title: "GPT‑6 Astra practical guide: coding, usage, settings, and migration"
summary: "Compare coding results with earlier models, distinguish Chat, Work, and Codex access and usage, choose reasoning effort, enable experimental context management, and update instructions and workflows. Includes practical prompts, interruption handling, and a staged migration plan."
date: "2026-09-05T09:00:00"
tags:
  - openai
  - gpt-6
  - llm
  - model-release
  - agent-engineering
draft: false
---

OpenAI introduced GPT‑6 Astra on September 3, 2026. Existing users need to know which parts of their work improve and what they must change to obtain those improvements. This article connects coding evidence with Chat, Work, and Codex access, long-running tasks, and instruction configuration.

**The reference date is September 6, 2026.** This review cross-checks official announcements, developer documentation, help articles, and public production examples. It is not a hands-on model benchmark. Prompts and migration procedures are proposed applications of that evidence. Check your own model picker and usage screen for rollout and account conditions.

Start with a reproducible bug or a change spanning several files. Give the model goals, constraints, and verification criteria; try Medium and adjust using quality and retry costs. Changing every task to Max and rewriting every skill simultaneously makes the source of any improvement difficult to identify.

## How much has coding improved?

These are OpenAI's published results against GPT‑5.6 Sol. Terminal-Bench improves by 20.6 percentage points; DeepSWE improves by 1.4. The size of the gain depends on the task.

| Evaluation | GPT‑5.6 Sol | GPT‑6 Astra | Difference |
|---|---:|---:|---:|
| Terminal-Bench 4.0 | 37.3% | 57.9% | +20.6 pp |
| DeepSWE v1.1 | 72.7% | 74.1% | +1.4 pp |
| FrontierCode 1.1 Extended | 60.6% | 64.5% | +3.9 pp |
| Internal database migration | 42.7% | 63.9% | +21.2 pp |
| OSWorld 2.0 | 65.7% | 72.6% | +6.9 pp |

The announcement uses the best results across reasoning efforts; evaluation tools and environments may differ from production. Astra does not lead every comparison: Terminal-Bench 4.0 puts Astra at 57.9% and Claude Fable 5.1 at 55.8%, while Artificial Analysis Coding Agent Index v1.4 reports Astra at 67.0 and Claude Opus 5 at 68.1. [Announcement and evaluation conditions](https://openai.com/index/gpt-6-astra/)

These differences help prioritize trials. Work involving terminal investigation, linked actions, or database dependencies is worth testing first. They do not establish equally large gains on single edits an existing model already handles well. Claude and Gemini users should compare with their own repositories, tools, and acceptance criteria.

## Selecting Astra in Chat, Work, and Codex

Astra appears as **GPT‑6 Pro** in ordinary Chat and **GPT‑6 Astra** in Work and Codex. Chat's Instant, Medium, High, Extra High, and automatic reasoning use Sol. Selecting Medium in ordinary Chat therefore differs from selecting Astra Medium in Codex. [Chat model guidance](https://help.openai.com/en/articles/20001354)

| Environment | Selection | Access considerations |
|---|---|---|
| Ordinary Chat | GPT‑6 Pro within Pro | Pro $100/$200, Business, Enterprise; unavailable on Plus |
| Work | GPT‑6 Astra | Plus, Pro, Business, Enterprise rollout and workspace access |
| Codex desktop, CLI, IDE | GPT‑6 Astra | Account access and client version |
| Codex cloud tasks | Default model cannot be changed | ChatGPT-plan cloud tasks use Sol |
| Own API integration | `gpt-6-astra` | API access and separate usage billing |

Plus access in Work or Codex does not grant GPT‑6 Pro in ordinary Chat. Buying credits does not accelerate rollout. [Work and Codex](https://help.openai.com/en/articles/20001275), [Cloud tasks and pricing](https://learn.chatgpt.com/docs/pricing)

Codex CLI requires at least 0.153.0. Version 0.153.4 fixes Astra missing from the bundled picker and changes the default when no model is explicitly configured. Update the app and use CLI 0.153.4 or newer. An existing explicit model setting should not be assumed to change with the update. [Changelog](https://learn.chatgpt.com/docs/changelog)

```bash
codex --version
npm install -g @openai/codex@latest
codex --model gpt-6-astra
```

Use `/model` during a session. To save a default, edit the corresponding entries in `~/.codex/config.toml`; do not duplicate existing keys.

```toml
model = "gpt-6-astra"
model_reasoning_effort = "medium"
```

See the [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) for these keys.

## Separate message limits from token costs

Chat's GPT‑6 Pro message limits are separate from Work and Codex usage. [Chat limits](https://help.openai.com/en/articles/20001354)

| Plan | GPT‑6 Pro allowance | Relationship to Sol Pro |
|---|---|---|
| Pro $200 | 200/week | Separate Sol Pro 170/day; combined 200/day |
| Pro $100 | 50/week | Shared between Pro models |
| Business Standard | 15/month | Shared between Pro models |
| Business Premium | 50/week | Shared between Pro models |

After exhausting Astra's weekly allowance on Pro $200, check the automatic fallback; selecting remaining Sol Pro usage may require a manual change. Switching models does not increase a shared allowance.

Work and Codex share usage. Pro $100/$200 and Business Premium can use their full existing allowance for Astra; Plus and Business Standard include limited Astra usage. Additional use depends on credits and account or workspace spending controls. [Included access](https://help.openai.com/en/articles/20001275)

| Model | Plus / Business Standard | Pro 5x ($100) | Pro 20x ($200) |
|---|---:|---:|---:|
| Astra | 5–45 | 25–225 | 100–900 |
| Sol | 10–100 | 50–500 | 200–2,000 |
| Terra | 25–200 | 125–1,000 | 500–4,000 |
| Luna | 250–2,000 | 1,250–10,000 | 5,000–40,000 |

These are **local-message estimates per five hours**, not guaranteed counts. Task size, context, reasoning, and speed settings affect consumption. Enterprise/Edu flexible pricing uses credits under separate conditions. [Usage estimates](https://learn.chatgpt.com/docs/pricing)

The Business and Enterprise/Edu rate card charges Astra 250 input, 25 cached-input, and 1,250 output credits per million tokens, versus Sol's 100, 10, and 500: 2.5× each. Credits are distinct from API dollars and subscription message counts. Astra Fast in Work and Codex costs 2.5× standard credit rates; it is not a lower reasoning effort. [Credit rate card](https://help.openai.com/en/articles/11481834)

Check the [usage dashboard](https://chatgpt.com/codex/settings/usage) or CLI `/status`. An offered one-time or banked reset can be used, but is not guaranteed to every account. That differs from asking support to manually reset a limit; support does not provide manual resets. [Usage and resets](https://help.openai.com/en/articles/11369540)

## Start with Medium and increase when needed

Astra Light need not be treated as a separate small model. App Light and CLI Low indicate lighter reasoning; Medium is a starting point for work requiring planning. Compare High or Extra High for difficult multi-step judgments and Max for a particularly hard problem. Ultra also involves subagent execution and is not identical to Max. Available controls vary by account and client. [Reasoning guidance](https://learn.chatgpt.com/docs/models)

The tip that Medium offers “1% less intelligence for 25% cost savings” could not be tied to an original evaluation and calculation in this review. **This article does not adopt a fixed saving.** A one-point benchmark difference is not automatically a 1% difference in general intelligence; evaluation API costs do not directly translate into subscription savings.

Try Light/Low for bounded changes and Medium for investigation and planning. If failure comes from missing information or conflicting instructions, fix those first. Increase effort when sufficient evidence is available but difficult reasoning or verification still fails. Record which tasks benefit instead of enabling Max everywhere.

For a small trial, give Medium and Max the same five bugs and compare fixes, reproduction, and regression checks. Include retries and human correction time. A cheaper first run can become more expensive through repeated work. Start with five, then expand the comparison to the tasks you regularly delegate.

## Assess Coding Through Design, Changes, and Verification

OpenAI describes improved software engineering and coherence on long tasks. For existing developers, the useful question is whether work that required repeated intervention now finishes with fewer corrections. Generating one function and making a change that respects repository-wide constraints need separate evaluation. [Official model guidance](https://developers.openai.com/api/docs/guides/latest-model)

In a published game-development example, Astra preserved the simulation while moving its renderer from WebGL2 to Three.js WebGPU. State inspection and Playwright tests supported investigation and before-and-after comparisons. Terrain transfers fell from roughly 35MB to 15MB with the same triangle count; discarded terrain jobs fell from 6,074 to 13 in a simulation with fixed latency. [Official game-development example](https://developers.openai.com/blog/how-to-build-games-with-astra)

Those figures compare changes within that project. They are neither coding scores against GPT‑5.6 nor hardware GPU frame-rate improvements. The user also directed and reviewed the work. Within those limits, the interesting behavior is investigating a system, making it observable, isolating a bottleneck, and implementing a fix.

The following tasks translate that experience into experiments for an existing project. They are proposals, not established model rankings.

| Task to delegate | Evidence and completion criteria | Environment to prepare |
|---|---|---|
| A feature spanning modules | API contracts, callers, existing behavior, invariants | Access to related code and integration regression tests |
| A difficult-to-reproduce bug | Trigger conditions, failure logs, normal and faulty state | Repeatable reproduction and state inspection |
| Performance optimization | Slow operation, representative inputs, quality constraints | A consistent measurement setup and baseline results |
| Library or subsystem replacement | Interfaces, data, and compatibility to preserve | A local copy supporting small, verifiable changes |

### Delegate the Investigation and Verification Method

For a slow list view, “add memoization” already chooses a solution. To test design and debugging judgment, provide the problem and constraints and delegate investigation too. This is an original request example:

```text
Scrolling stutters when the search results contain many items.
Investigate using the attached reproduction steps and test data.
Distinguish rendering, computation, and network bottlenecks with evidence.
Implement a minimal change preserving sorting, filtering, and accessibility.
Measure before and after in the same environment and report regression checks.
Separate unmeasured estimates from observations.
```

The agent needs access to execution results as well as code. Supply test commands, reproduction data, and the browser or logs it needs. A setup that requires a person to describe every screen limits how much debugging can be delegated. Better evidence and observability can help other models too.

If existing prompts prescribe every implementation step, retain the goal and mandatory constraints while allowing method selection. Make acceptance tests, scope, and compatibility explicit. Compare the previous model and Astra on completion, corrective iterations, regressions, and total cost to establish whether the improvement holds in your work.

Design judgment is a capability to evaluate. Async calling, discussed later, is an execution feature that permits independent work during a wait. Running tests concurrently does not itself establish more accurate code.

## Context management changes long tasks

Repeated summaries can lose failed approaches or earlier test conditions during long debugging sessions. Codex's Astra experiment keeps notes across windows and searches earlier messages and tool results within the same task. It can retrieve evidence without reinserting the entire history each time. [Experimental context management](https://learn.chatgpt.com/docs/models)

At launch, this opt-in experiment is available on supported Codex clients with ChatGPT Plus or Pro sign-in. It is off by default and unavailable with Business, Enterprise, or API-key sign-in. Add the following at the top level of `config.toml`, then **start a new task**. Check existing structure and duplicate keys; do not paste it accidentally inside another TOML `[section]`.

```toml
features.context_management.experimental_mode = true
```

This is not infinite context or infallible memory. Results still depend on what is recorded and when history is searched. Test whether late stages recover pre-compaction failures, constraints, and verification results accurately. Keep important decisions and reproduction procedures in repository documents or tests. Plans to enable it by default are distinct from the current setting.

## Connect browser and document work to acceptance checks

A successful click is not necessarily a completed business task. Put sources, templates, constraints, and checks into the request so the model can inspect its result. The following are original example prompts.

```text
Register the attached CSV contacts in the test CRM.
Skip existing email addresses and record why each was skipped.
Only this test workspace is authorized.
Compare the number of new eligible CSV rows with actual CRM additions.
Report discrepancies and failures. Do not send email.
```

The setup needs more than a prompt: email values for duplicate checks, permission to read the resulting records, and a procedure that avoids duplicates on retry. Improved clicking leaves a human verification burden if the agent cannot inspect the result.

For documents, provide sources, a template, the audience, and review criteria. Open generated files and inspect their tables, charts, and slides.

```text
Use the attached interviews and survey to create eight product-meeting slides.
Follow the fonts and layout of the existing presentation.
Select three customer problems and attach evidence and sample scope to each.
Separate observations from proposals and identify weak evidence.
Render every slide and check clipping, overlap, and missing attribution.
Leave a reviewable file; do not share or send it.
```

In OpenAI's [architectural visualization example](https://developers.openai.com/blog/architectural-visualization-with-astra), the user described a space and steered the result while Astra worked through Blender, previews, and Unreal Engine. It is a public production process, not proof that everyone gets the same result from one request. Connect previews and state inspection to your own workflow to make comparable iteration possible.

## What to Change in AGENTS.md and Skills

OpenAI describes tendencies toward additional clarification, extensive testing, and sensitivity to instructions in skills and `AGENTS.md`. [Prompting guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)

Better compliance can amplify a poorly scoped instruction. A skill that requires approval before every change may stop even a small local documentation task the user already assigned. Increasing reasoning effort does not resolve that conflict. Inspect the files actually used and the reason for the pause.

These are suggested revisions to existing configurations, not a reason to remove required approvals or checks.

| Area | Existing instruction or setup | Revision to try |
|---|---|---|
| Approval | Ask before every change | Proceed with assigned reversible local work; specify actions such as external publication that need separate approval |
| Verification | Run the full suite for every edit | Match checks to impact while retaining mandatory team checks |
| Skill selection | Run a lengthy procedure whenever a keyword matches | Check that the task purpose and deliverable match the skill's applicability |
| Completion | Write and report a plan | Specify whether implementation, verification, and reporting are also assigned |
| Duplicate rules | Repeat the same rule across AGENTS.md and skills | Maintain a common source and keep task-specific differences in each skill |

Applicability and content matter more than the number of skills. A writing skill with an unrelated deployment approval procedure, or one that requires an obsolete test command, can make a capable model waste effort. Record which skills ran and where needless questions or checks occurred.

For example, a team could use the following original instruction:

```text
For a simple documentation typo, check the edited passage and document build.
For a behavior change, verify the affected functionality.
Ask when missing requirements could materially change the result.
Continue research and preparation that do not depend on that answer.
```

My conclusion is to **evaluate model choice and instruction configuration together**. This does not establish that instructions always matter more than model capability. It means that improved compliance is useful only when the instructions support the actual task.

### Specify how to handle stops, verification, and delegation

State authorized work instead of merely adding “finish autonomously.” This example does not replace organizational policy or actual permissions.

```text
Carry assigned local changes through investigation, implementation,
relevant checks, and reporting.
Ask about decisions requiring an answer; continue independent preparation.
Prepare a reviewable result before requesting approval for external publishing.
If a skill causes a stop, identify its exact path and relevant instruction.
Distinguish an explicit requirement from your interpretation.
```

If small changes trigger repeated full test runs, define required checks and escalation conditions. Request subagents explicitly when independent review topics justify them; splitting every task also adds context-transfer and integration costs. For writing, specify audience, style, and length, using lists and tables where comparison helps. [Model behavior and instructions](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)

## Distinguish reasons for interruption

An instruction-file approval requirement, execution permissions, and safety monitoring are different causes of a stop. Astra is the first model classified at OpenAI's Preparedness Framework Critical cybersecurity level, and deployment includes stronger monitoring. Evaluated capability does not mean unrestricted user access to it. [Safety overview](https://openai.com/index/safety-overview-gpt-6-astra/)

Work and Codex monitoring is asynchronous, so an alert can arrive after the triggering action. Read the notice and available findings instead of attributing the stop only to the latest message. [Paused-task guidance](https://learn.chatgpt.com/docs/agent-approvals-security)

| Environment | Findings and resumption |
|---|---|
| Codex/Work clients offering findings and resume | Review findings and determine whether continuation is appropriate |
| Codex CLI/mobile | Full findings and resume unavailable; task ends |
| ZDR, Modified Abuse Monitoring, non-US storage residency | Full findings and resume unavailable; task ends |

An individual action passing automatic approval review can still belong to a task monitoring later pauses. Before continuing an ended task elsewhere, inspect actual file changes and external actions and describe only the remaining work. This avoids blindly repeating completed registrations or sends.

Daybreak approval and Astra access also differ. At launch, most Daybreak customers cannot use reduced refusals on Astra. Use Astra with standard safeguards or switch to a Blue-supported model such as Sol. The Daybreak toggle in ChatGPT-authenticated Codex applies to supported models; API-key sign-in does not use that toggle. [Daybreak guidance](https://help.openai.com/en/articles/20001258)

## Same Capacity, Higher Base Rates

For Astra requests exceeding 272K input tokens, the full request incurs 2× input/cache rates and 1.5× output rates. Cache writes cost $12.50 per million tokens. Account for these conditions when estimating long-session costs. [Astra pricing conditions](https://developers.openai.com/api/docs/models/gpt-6-astra)

Standard API text prices below are per million tokens.

| Item | GPT‑5.6 Sol | GPT‑6 Astra |
|---|---|---|
| Model ID | `gpt-5.6-sol` | `gpt-6-astra` |
| Context window | 1,050,000 | 1,050,000 |
| Maximum output | 128,000 | 128,000 |
| Input | $4 | $10 |
| Cached input | $0.40 | $1 |
| Output | $20 | $50 |
| Reasoning effort | none through max | low through max |

Sources: [Sol documentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol) and [Astra documentation](https://developers.openai.com/api/docs/models/gpt-6-astra). Sol's current promotional pricing is offered at least through November 21, 2026.

The generation change does not expand the input space. A useful evaluation would ask what harder work Astra can do with material that already fits.

OpenAI reports lower estimated task costs in some evaluations through reduced output-token usage. That is a provider finding, not a guarantee for every workload. [Official model guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)

For a simplified calculation excluding caching and tool charges, 100,000 input tokens and 10,000 billable output tokens cost $0.60 with Sol and $1.50 with Astra. If input and output usage shrink proportionally, Astra must use 40% as many tokens to break even. **The resulting 60% reduction is a mathematical assumption, not a measured improvement.**

An agent's actual bill includes retries, caching, reasoning tokens, and tools. Measure the total cost of an accepted result rather than the length of one answer.

## For custom harnesses and API integrations

Apply Codex settings and API request changes separately. Astra tool calling requires the Responses API. Replace old `none` or `minimal` reasoning with `low`; inspect unsupported `temperature`, `top_p`, `top_logprobs`, and log-probability requests. Check actual request compatibility before simply replacing the model name. [API migration guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)

## Keep Working While a Tool Runs

[Async tool calling](https://developers.openai.com/api/docs/guides/async-tool-calling) lets a model continue before a function or custom tool returns. Set `async: true`; the application still executes and tracks the job, then returns its result against the original `call_id`.

Consider an agent starting a test suite. It could prepare change notes or inspect independent documentation while the tests run. Diagnosing a failure or reporting that tests passed must wait for actual results.

```text
Request test execution ─────────────→ Receive results
                       Draft notes → Final report using results
```

The design task is identifying independence. A pending test and a deployment contingent on its success cannot be treated alike. Async execution creates opportunities to reduce waiting; it does not remove dependencies.

## Accept Changes During an Assignment

[Mid-turn steering](https://developers.openai.com/api/docs/guides/steering) accepts additional user instructions over a WebSocket connection while a response is running. Completed work is preserved for continuation. Applications must distinguish acknowledgement of an update from the tool results or approvals needed to apply it.

A user might request a report, then narrow the scope from the full year to the second quarter. The agent should reuse relevant research while changing subsequent analysis and output. This makes it easier to refine an assignment after seeing progress.

The interface should indicate whether a correction was received and where it takes effect. A scope change does not imply that an already sent email or external operation is reversed. Steering and undo require separate handling.

Taken together, these features suggest a more conversational way to supervise ongoing work. That is an interpretation of the documented design; time savings depend on the application's task structure.

## A Migration Sequence for Existing Setups

1. **Record the baseline:** Save the model, version, reasoning effort, skills, tools, and completion criteria for representative work. Preserve the actual settings if your current model is Claude or Gemini.
2. **Replace the model and check compatibility:** Confirm access and request and tool formats. Apply necessary fixes without simultaneously rewriting the whole prompt.
3. **Refine instructions:** Address the rules responsible for unnecessary pauses or excessive verification, then repeat the task.
4. **Compare reasoning levels:** Find a lower setting that preserves quality, including failures and retries in usage measurements.
5. **Add host features:** Implement pending-job state and result matching where async execution helps. Adopt steering separately through a supported app or WebSocket integration.

Separate model, instruction, and runtime effects to decide which changes to keep. Preserve completion quality and prohibited-action controls while comparing human corrections, time, and total cost. Keep the previous model or configuration where review burden or cost increases. The [AI Eval guide](/en/guides/ai-eval/) covers evaluation design in more detail.

## Where I Would Start

My first candidates would involve multiple files or sources, execution feedback, and requirements that evolve during the assignment. Short classification and structured conversion tasks already handled adequately by cheaper models need a separate cost case.

Record completion, human interventions, elapsed time, and total cost. If async execution saves time but increases review effort, include that tradeoff.

Astra adoption includes reviewing instructions, reasoning effort, and host configuration alongside the model. Checking whether old compensating procedures still help can reveal improvements at the task level despite higher token rates.
