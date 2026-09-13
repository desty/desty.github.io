---
title: "DeepSeek Harness code analysis: making the agent loop a plugin boundary"
summary: "DeepSeek Harness treats the model, tools, and session — and the loop that drives a turn — as plugins. Cordis mounts services on ctx keys; the default driver is ctx.agentLoop. This splits what is kernel from what you change in config, at the 10 September 2026 commit."
date: "2026-09-13T10:20:00+09:00"
tags:
  - harness-engineering
  - agent-engineering
  - open-source
  - deepseek
  - plugin
draft: false
---

A small change to a coding agent often turns into a fork of the whole harness. You wanted a different sandbox, but the loop and tool dispatch live in one file. You wanted a new session format, and the model caller had to move with it.

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) is an open-source harness that splits those parts into plugins. The slogan is “Everything is a Plugin.” Model adapters, tools, sessions, sandboxes, scheduling, and the UI are plugins — and so is the **default agent loop**, the `dsh-agent-loop` package. The license is MIT. The docs call it a developer preview and warn that compatibility will break.

This article reads [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/c291e79/docs/architecture.md) and `packages/core` at commit [`c291e79`](https://github.com/deepseek-ai/deepseek-harness/tree/c291e79) (0.1.5 sync) on 10 September 2026. It is not a log from `npx @deepseek-ai/dsh web`. It takes the claim from [harness engineering](/en/blog/35-harness-engineering/) — you design the outside of the model — and checks it in a tree that makes the loop itself a replaceable unit. The same-day [OpenViking](/en/blog/63-openviking/) piece is about treating memory locations as paths.

## Separate the slogan from the kernel

Cordis is the framework that mounts plugins, waits on dependencies, and unwinds effects. A plugin is a `Service` that mounts in `apply(ctx)`. Other code looks up `ctx.tools`, `ctx.llm`, and `ctx.sessions` by key instead of importing a class. `inject` waits for those services, so boot order is not hand-sequenced. Communication uses typed events such as `emit` and `waterfall`. Registrations attached with `ctx.effect()` / `ctx.on()` unwind when the plugin unloads.

“There is no privileged core to patch” means **do not edit harness features in the source tree; mount a plugin beside the others**. The Cordis loader and context still sit underneath. Reading the slogan literally makes it look as if there is no kernel. The actual swap units are service keys and profile patches above Cordis.

`packages/core` draws that line. `ctx.agents` is the agent handle and registry. `ctx.agentLoop` is the default driver. Extension plugins depend on `agent`; the driver stays swappable.

## What the loop does, and when not to replace it

The default implementation is `ReactLoopAgent`. The README says to write a custom `Agent` only when the standard lifecycle — call the model, run tools, repeat — is not enough.

A **step** is one model request plus the tools it calls. A **turn** is zero or more steps. The flow is roughly:

```
turn/start
  → agent/pre-step (accept or reject input)
  → step/start
  → assemble prompt and tool schemas
  → model stream
  → tools/pre-execute → execute → post-execute
  → step/end
turn/end
```

`agent/pre-step` and `tools/*` are waterfalls. A listener must call `next()` to continue, or omit it to stop. A policy plugin can block a tool without editing loop source.

The session log is the source of the history the model sees. Architecture text is blunt: anything model-visible must be reconstructable from the log. New model-visible input needs a new session event type and a renderer from that log. A hint that lives only in process memory disappears on resume, fork, and telemetry.

That is why replacing the loop is a weak way to save tokens. Token work belongs in prompt assembly (`ctx.systemPrompt`), tool-result shaping, and session projections. Replace the loop when the lifecycle itself differs — a driver that handles human commands without a model call, or one that delegates a turn to another product. `create()` / `resume()` and the session-log contract have to remain, or UI and SDK code against `ctx.agents` will not attach.

If [Tofu](/en/blog/38-tofu-white-box-harness/) is the story of changing the harness around a fixed model, this is the structure that makes the **loop module one config row**. It is not [Prime Agent](/en/blog/54-prime-agent-self-improving-harness/). dsh ships a swappable driver; it does not search for a better loop on its own.

## Move the execution world together

Capabilities are **seams** (capability boundaries): a service definition, a provider, and the tools that consume it. Filesystem and subprocess providers share one execution world. Pointing both at a remote sandbox is supposed to move Bash, PTY, and LSP with them. That is the opposite of forking the sandbox and adding a special case in the loop.

[OpenSandbox](/en/blog/58-opensandbox-agent-runtime/) is the layer that unifies execution-environment APIs. dsh is the layer that hangs those APIs behind `ctx.fs`, `ctx.subprocess`, and `ctx.sandbox`. Whether local tool schemas survive a change of execution location is something to test, not assume.

Subagents likewise sit behind one interface with several providers — a fresh child agent, or a delegated turn in another product. Agent Teams is opt-in.

## Compose with configuration

A running `dsh` is a plugin tree stacked from the bundles a profile lists.

- **Profile** — names such as `web`, `headless`, `sdk`, `sdk-minimal`, `acp`. Holds the bundle list and `cordis.patch.yml`.
- **Bundle** — plugin rows and code. `dsh-base` is the shared first layer for web/headless/sdk/acp: models, tools, persistence, sandbox, approval, credentials.
- **Patch** — replaces a row by id. Order is bundles → profile patch → home patch → `--patch`.

`dsh --profile web --dump-config` prints the tree. Any printed row can be patched. Headless test patches in the tree overlay `id: agent-loop` and replace that row's config.

```yaml
# example: $DSH_HOME/profiles/web/cordis.patch.yml
# naming the id from dump-config replaces that row's config
- id: agent-loop
  config:
    agents:
      - id: main
        provider: deepseek
        model: deepseek-chat
```

To swap the loop implementation, put a different `name` on the same id. Architecture says any printed row can be replaced. The overlay below follows that rule. It was not run for this article.

```yaml
- id: agent-loop
  name: './plugins/my-agent-loop'
```

Custom profiles reload patches live; `headless`, `sdk`, and `acp` apply layers once at startup, because swapping dependencies after a process owns work would break that lifecycle.

`sdk-minimal` is the exception that does not use `dsh-base`. It owns a small explicit tree so an SDK embed does not pull the whole harness.

A new model provider registers on `ctx.llm`. A new tool registers on `ctx.tools`. The default extension path does not touch the loop.

## Order of changes on an existing harness

For a team already on Claude Code, Codex, or an in-house loop, this is a proposed experiment, not a validated migration.

1. **Baseline.** Record the current loop, tools, sandbox, and session store. Fix completion criteria on one representative task.
2. **Keep the loop; swap a capability boundary.** Change only file or shell execution. Keep tool names and completion rules.
3. **Model adapter.** Same loop, different provider. Check that prompt assembly still reconstructs from the log.
4. **Loop replacement.** Only if the lifecycle still does not fit after 1–3. Keep `create`/`resume` and session events.

Inspect different outcomes. A sandbox swap is about blocked paths and allowed commands. A loop swap is about resume, cancel, and the next step matching the log after a tool failure. Tokens and latency come after that.

This is a preview: profile fields and session format versions will move. Sessions keep `session.vN.jsonl` generations and write migrations beside them. If you persist long-term in this format, read the generation policy with the docs. The repository asks you to read [SAFETY.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md) before running it.

## Where this sits on this site

dsh is not a DeepSeek-only product. The default example uses DeepSeek models; the design centre is splitting loop, tools, and session into **keys and patches**. To keep it distinct from the [OpenClaw / Hermes comparison](/en/blog/15-hermes-vs-openclaw/), this article stays on replaceable units inside the harness.

The fit is a team that wants to change sandbox or model and is currently editing the loop file. If the goal is a smarter loop, evaluation and self-improving harnesses are closer. Splitting parts and letting parts rewrite themselves are different jobs.
