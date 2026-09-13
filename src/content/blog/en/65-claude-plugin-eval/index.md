---
title: "Claude Code plugin eval: compare the same task with and without a plugin"
summary: "Claude Code 2.1.269 added plugin eval. It repeats the same prompts with and without a plugin and reports WITH, W/OUT, and delta scores. This article explains how to design cases and graders and use the results for regression testing."
date: "2026-09-13T15:00:00+09:00"
tags:
  - claude-code
  - plugin
  - ai-eval
  - agent-engineering
draft: false
---

A Claude Code plugin packages skills, hooks, agents, and MCP servers. `claude plugin validate` can tell you whether that package is well formed. It cannot tell you whether the plugin improves the outcome of the same task. A polished description and one good demo are not enough when the model may skip a skill or a hook may intervene at the wrong time.

Anthropic added `claude plugin eval` in the [Claude Code 2.1.269 release](https://github.com/anthropics/claude-code/releases/tag/v2.1.269) published on 11 September 2026. It runs a plugin's eval suite through Claude Code and produces JSON and HTML reports. The broader evaluation framework belongs in the [AI evaluation guide](/en/guides/ai-eval/); this article checks the CLI help in 2.1.270 to explain what this command compares and how to interpret it. It does not present measurements from a plugin run.

## Remove only the plugin from the same task

The default comparison holds the case prompt and graders fixed and changes whether the plugin is loaded.

```text
same case
├── WITH    Claude Code run with the plugin loaded
└── W/OUT   baseline run without the plugin
       ↓
     Δ = WITH - W/OUT
```

Read the report columns this way:

| Field | Meaning | What to inspect |
|---|---|---|
| WITH | Aggregate score with the plugin | Whether the intended skill or tool ran and the result met the contract |
| W/OUT | Baseline score on the same prompt without the plugin | Whether the model already solved the task unaided |
| Δ | WITH minus W/OUT | Direction and size of the plugin's added effect |
| RUNS | Repeated runs in each condition | How much evidence exists beyond one lucky completion |

A positive delta does not establish that a plugin is good. Model runs vary, and a grader can reward the wrong proxy. A high WITH score adds little when W/OUT is equally high. A good mean delta should not hide a run that damaged a repository or used a forbidden tool.

## Create cases and graders

From the plugin root:

```bash
claude plugin eval init
claude plugin eval .
```

By default, `init` starts an interview. Claude reads the plugin, asks which behavior to protect, and creates cases and graders under `evals/`. Use `claude plugin eval init --bare <name>` for a blank template. A case can be a single `case.yaml`, or a `prompt.md` accompanied by `graders/*.md`.

A useful case does not tell Claude to use the plugin. It uses a realistic request and tests whether the plugin activates when needed. A code-review plugin, for example, needs three kinds of cases:

1. **Should activate** — find a real defect in changed files and rank the fix.
2. **Should stay out** — a small typo where the plugin's full procedure only adds cost.
3. **Known failure** — a large change or a repository without tests that previously caused omissions.

Attach graders to the work contract rather than the prose style of the final answer. Check required defects, allowed tools, exact file effects, and test results separately. Splitting deterministic file and tool checks from subjective model judging makes a score easier to diagnose.

## More runs add evidence and cost

The CLI defaults to three runs per case; `--runs <n>` overrides it. A with/without comparison therefore needs three WITH and three W/OUT agent sessions for one case, plus any paid grader calls. More runs expose variance, while also increasing usage and elapsed time.

Three runs are useful while fixing obvious failures. Increase the count only for release candidates. Keep per-run scores and failure reasons, not just the mean. A plugin that succeeds three times out of five remains hard to trust even if its average looks good.

Fix the model, permissions, tools, and fixture as well. Changing the model and plugin together makes the source of the delta unknowable. Record `--model`, allowed tools, case files, and grader versions with the result. MCP servers use recorded mocks by default; real servers start only when explicitly allowed.

```bash
claude plugin eval . \
  --runs 5 \
  --model sonnet \
  --max-cost-usd 20 \
  --no-publish \
  --report evals/results/plugin-report.html
```

`--threshold` exits with code 1 when any case falls below the chosen score, which makes it usable as a CI regression gate. `--max-cost-usd` checks the ceiling before starting each run. In-flight parallel runs can still carry the total over the ceiling, so pair it with `--concurrency 1` for a strict budget.

## Change plugins from observed failures

The larger change is the order of plugin development. Instead of polishing a skill description and replaying a successful demo, capture a past failure as a case, measure WITH against W/OUT, and then edit the plugin.

- If both arms score well and delta is small, the problem may not need a plugin.
- If both arms score poorly, inspect the task, tools, and graders before the plugin.
- If WITH is unstable, trace the plugin path: skill selection, hook timing, and MCP responses.
- If delta improves while time and cost jump, limit the plugin to work where that quality gain pays for itself.

Adoption criteria should therefore include success rate, elapsed time, usage cost, human intervention, and forbidden actions alongside score. Keeping representative tasks fixed also exposes regressions after model updates or plugin edits.

## Check before running

Eval runs launch Claude Code child processes locally with the signed-in user's permissions and usage. Review an unfamiliar plugin's eval suite as code. Scaffold scripts and real MCP servers run as the user when their explicit options are enabled. Passing cases do not constitute a security review.

The HTML report may be published to claude.ai when account and policy gates allow it. Use `--no-publish` when repository material must stay local. Check `claude plugin eval --help` for the options and availability in the installed build.

Plugin eval changes the question from whether a plugin looks useful to how much it changes the outcome of the same task. Three real failures that you do not want to repeat are a better starting suite than a large set of synthetic prompts. Once those failures become cases and graders, delta becomes evidence for improving the plugin rather than a line in its description.
