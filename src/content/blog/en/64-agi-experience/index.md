---
title: "The GPT‑6 experiences that bring AGI to mind"
summary: "Turning an incomplete brief into a design and carrying work across tools can change what people delegate to AI. This article separates generality, proficiency, and autonomy, examines a public GPT‑6 example and a hypothetical harness redesign, and explains what existing users can change in their instructions and execution systems—and how to evaluate the result."
date: "2026-09-06T16:00:00+09:00"
tags:
  - agi
  - gpt-6
  - llm
  - agent-engineering
draft: true
---

GPT‑6 Astra could bring more developers into the AGI discussion. The experience I find relevant is giving a model a problem without prescribing an implementation, then receiving a suitable design and a working result. That changes how much judgment a person can delegate.

The [GPT‑6 release analysis](/en/blog/62-gpt-6-astra/) covered features and costs. This article starts with a way to think about AGI, examines experiences that might make it feel closer, and connects them to changes existing model users can try.

Sources were checked on **September 6, 2026**. This is an analysis of public research and OpenAI documentation and demonstrations, not a controlled model comparison. The harness redesign below is a hypothetical example. This article neither measures a rise in public interest nor declares that AGI has arrived.

## Separate the questions behind AGI

AGI stands for Artificial General Intelligence. Here, the focus is on applying knowledge and methods across unfamiliar intellectual tasks. Accuracy on one kind of problem cannot establish that range.

Google DeepMind's *Levels of AGI* distinguishes capability depth and breadth and separately considers deployment autonomy. The following questions adapt that framework for practical work; they are not its formal classification table or a universal standard. [Research overview](https://deepmind.google/research/publications/66938/)

| Dimension | Question to ask at work |
|---|---|
| Generality | Can it find and apply useful knowledge and methods beyond familiar examples? |
| Proficiency | Does the result pass a practitioner's review? |
| Autonomy | Can it progress and recover without a person prescribing each next step? |

Writing good code, working across domains, and completing a task independently require different evidence. Giving a system more permissions does not establish greater capability. Waiting for approval does not necessarily show a lack of capability either: it may be following the user's operating conditions.

## What does the ARC-AGI-3 score establish?

OpenAI reports 99.9% for Astra and 7.8% for Sol on ARC-AGI-3. Such a large difference on an evaluation of adaptation to unfamiliar tasks is relevant to AGI discussions. However, the announcement describes two general harness-setting changes and reports best results across reasoning efforts. It does not establish the same difference for every production task after a model swap. [Announcement and evaluation conditions](https://openai.com/index/gpt-6-astra/)

Extending this result to broad professional proficiency and autonomy requires evidence across other tasks and recovery from failure. Saturating one evaluation and satisfying every AGI criterion are claims with different evidentiary requirements. The design judgments and cross-tool workflows below provide practical directions for investigating that broader range.

## Finding a design without being given the solution

Consider this hypothetical request:

```text
Every rule we add makes our agent prompt longer and adds confirmation turns.
Keep the existing task runner, but reliably block prohibited actions.
Read the current code and execution records, then improve the architecture.
```

The request does not specify an implementation language or component layout. A model might shorten the rules or remove duplicate checks. A more substantial proposal could move mechanically decidable rules into the host program while leaving contextual judgments to the model.

If that proposal fits the actual code and constraints, the user has received a solution path they did not supply. The capability to assess is **interpreting requirements, investigating an existing system, and selecting an appropriate implementation**. Guessing every missing detail is not good design. Ambiguities that materially affect the outcome need a question or further evidence.

This architectural principle predates GPT‑6, and other models can propose it. The useful comparison is how much additional explanation each model needs to find a suitable design and carry it through implementation and verification.

### A larger harness can place less burden on the model

A harness connects the model to tools, state, execution procedures, and controls. In this example, the existing Agent Loop continues to drive the work while a host component checks execution requests.

| Responsibility | A prompt-heavy arrangement | An arrangement with host checks |
|---|---|---|
| Choose tasks and methods | Model and existing Agent Loop | Model and existing Agent Loop |
| Restrict writes | Explain allowed paths to the model | Enforce write permissions and check tool execution paths |
| Check approval | Have the model interpret the conversation | Validate approval tied to the action and target immediately before execution |
| Handle failures | Have the model read lengthy logs | Record state in the host and return relevant errors with a way to inspect details |

Policy storage, execution checks, and audit records can make the overall program larger. Moving repeated checks into code can nevertheless reduce the context and confirmation exchanges the model processes. **Program size and model context size can be designed separately.**

Some rules still require interpretation. Paths, permissions, and approval validity lend themselves to explicit checks; whether a change satisfies the user's intent requires context. The model also needs enough information to understand its allowed actions and any rejection.

A native binary or Bash script does not create enforcement merely by existing. If another shell or tool can bypass it, prohibited actions remain possible. The agent must not be able to rewrite protected policy or approval records, and a failed check must stop execution. These conditions follow directly from this example's goal of controlling prohibited actions.

First test that allowed work still succeeds and prohibited work is blocked. Then compare tokens and human intervention. Returning enormous logs or rejecting too many valid actions can erase the benefit. More features do not establish success, and fewer turns alone do not establish efficiency.

## Completing a result across tools

A public example provides a different view. On OpenAI's developer blog, Thomas Ricouard describes using Astra in Codex to turn a short house brief into an editable Blender scene. The model inspected renders and corrected some details; subsequent user requests developed the floor plan and spaces further. [Architectural visualization example](https://developers.openai.com/blog/architectural-visualization-with-astra)

The experience of interest connects a desired atmosphere to software operations and visual review. Generating code, inspecting its output, and revising toward the goal can reduce the user's work of bridging those stages.

This is a vendor-published example with human follow-up instructions. It does not document a complete house delivered in a single attempt, establish comparative model performance, or validate a buildable architectural design. A convincing scene and a professionally approved building are different deliverables.

Together with the harness example, it suggests why AGI might become more personally relevant. Someone can request a result that requires implementation methods they do not know. When the system bridges that gap, they may try delegating a larger task next. My interpretation is that repeated experiences of this kind could increase interest in AGI.

## What could change for existing users

OpenAI reports improved coherence on long tasks and instruction following relative to GPT‑5.6 Sol. It also notes possible excess clarification or verification and increased sensitivity to skills and `AGENTS.md`. These are vendor descriptions. [Official model guidance](https://developers.openai.com/api/docs/guides/latest-model)

The useful experiment depends on where your existing workflow breaks down.

| Existing problem | Experiment to try | Configuration and outcome to inspect |
|---|---|---|
| A person repeatedly specifies implementation details | Supply goals and constraints; request alternatives and a justified choice | Review rigid procedural instructions; compare design suitability and follow-up explanations |
| Work stops between investigation, edits, and verification | Delegate the sequence under one completion criterion | Connect information and tools; record missed steps and human interventions |
| Work halts during tests or lookups | Do independent work while results are pending | Support async tools and result matching; compare elapsed time |
| Requirement changes wait for the next turn | Send corrections while work proceeds | Use an app or API connection that supports steering; check the final scope |

The first two rows propose capability experiments. The last two also require execution support. For async tools, the API uses `async: true`; the host runs the job and associates its result with the original `call_id`. A model-name change does not implement that host behavior. [Async tool documentation](https://developers.openai.com/api/docs/guides/async-tool-calling)

Mid-turn steering uses Astra over a Responses API WebSocket connection. It does not cancel tools already running or undo completed external actions. App users need to check their app's support; integration developers need to handle update acceptance and continuation. [Steering documentation](https://developers.openai.com/api/docs/guides/steering)

Claude and Gemini users can use these questions to compare their own workflows. This article has no matched results establishing Astra's superiority over those models. Users migrating from an earlier OpenAI model also need evidence from their own tasks.

## Change the existing setup in stages

Choose a recurring task and define completion. Record the existing model, version, reasoning settings, tools, and permissions, then run the current setup as a baseline. Check access and API and tool-schema compatibility before switching to Astra. An existing `none` reasoning setting needs changing because Astra does not support it. [Model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra)

Next, distinguish the goal from the prescribed procedure in your instructions. Here is an example for testing delegated design judgment:

```text
Goal: Keep the task runner while reducing repeated context and needless confirmations.
Evidence: Read the code, rule files, and successful and failed execution records.
Design: Compare alternatives and explain which responsibilities belong to the model or host.
Change: Implement in an isolated local copy. Do not weaken policy or permissions.
Verify: Preserve allowed and prohibited behavior; compare usage and interventions on the same task.
Questions: Ask when missing information would materially change the design.
Completion: Deliver the changes, verification results, and remaining limitations.
```

Scope old instructions such as “confirm every step” or “always run every test” to the situations that need them. Distinguish reversible local work from external publication and match verification to the impact of the change. Retain mandatory team checks and actual permission restrictions. Testing whether a model needs less explanation is no reason to omit goals, evidence, or prohibitions.

Change execution architecture afterward. Start with a small set of mechanically decidable rules and improve the results returned to the model. Token efficiency does not require rewriting the harness as a binary first. Check whether the existing host can support the same responsibility split. Keeping a working Agent Loop also helps isolate the source of improvement.

Compare three configurations: the existing setup, a model-only replacement, and a replacement with prompt and host changes. Repeat the same inputs and completion criteria, recording tokens, total cost, elapsed time, and human corrections—including failed attempts. Record setting differences. Adopt changes that improve the relevant outcomes while preserving quality and prohibited-action controls. This is a proposed experiment, not a measured result from this article. The [AI Eval guide](/en/guides/ai-eval/) covers evaluation design in more detail.

## Look beyond the impressive first success

After a strong result, try related tasks with changed conditions. Does the system adapt to different dependencies or missing information, recover from tool failures, and revise a design when an assumption is challenged? This tests whether the initial surprise reflects repeatable capability.

METR's time horizon expresses task difficulty through human expert completion time at a specified success probability. It does not mean an AI operated autonomously for that duration. Its tasks mainly cover software, machine learning, and cybersecurity, limiting generalization to other work. This article borrows the evaluation perspective, not a GPT‑6 measurement. [Methodology and limitations](https://metr.org/time-horizons/)

A successful design is evidence about design ability; completing a long task is evidence about sustained execution. Broader conclusions require reliable repetition across domains and unfamiliar conditions.

The change I am watching around GPT‑6 is the scope of delegated judgment. Users may move from prescribing each implementation step to providing goals, constraints, and completion criteria while delegating design and execution together. Existing users can test that possibility on their own work and revise procedures that unnecessarily obstruct it. Expectations about AGI are better grounded in the interventions that actually disappear and the results that hold up across repeated attempts.
