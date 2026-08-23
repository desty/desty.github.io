---
title: "Inside Vercel fx: Shipping a Coding Agent as One Executable"
summary: "Vercel Labs built fx in Zig and ships it without a Node.js or Python runtime. The current macOS arm64 executable is 6.43 MB, but size alone misses the design. fx can run as an interactive shell, a one-shot JSON command, an ACP server, or an experimental WebAssembly core. This article examines what the size and startup claims measure, which responsibilities move to the model and host, where the sandbox boundary sits, and when a disposable native agent is useful."
date: "2026-08-23T09:00:00"
tags:
  - harness-engineering
  - agent-engineering
  - ai-infrastructure
  - agentic-coding
  - open-source
draft: false
---

Yesterday's [OpenSandbox analysis](/en/blog/58-opensandbox-agent-runtime/) examined the environment beneath an agent: one API for creating, assigning, and retiring Docker or Kubernetes sandboxes. That infrastructure exposes a second cost. If every short-lived sandbox must install a language runtime and a dependency tree before its agent can begin, fast environment allocation only moves the wait somewhere else.

[fx](https://github.com/vercel-labs/fx), released by Vercel Labs, approaches the agent side of that boundary. It is a coding-agent harness written in Zig and distributed as native macOS and Linux executables. It does not need Node.js or Python on the target machine. It has an interactive terminal, but it can also answer one request through `fx ask --json`, run as an ACP server through `fx acp`, or compile its agent loop to WebAssembly.

The launch numbers were 6.3 MB and a 10-microsecond cold start. Neither number says much about a developer's experience on its own. Model calls still take seconds or minutes, and saving a few megabytes rarely matters on one laptop. **The size and startup time matter when a system repeatedly creates and discards agents, not when one person launches one long session.**

## What One Executable Removes from Deployment

I downloaded all four native archives for the current stable release, `v0.0.5`, on August 23, 2026. The unpacked executable sizes vary substantially by target.

| Target | Executable size |
|---|---:|
| macOS arm64 | 6,431,792 bytes (6.43 MB) |
| Linux arm64 | 10,133,856 bytes (10.13 MB) |
| Linux x86-64 | 11,870,712 bytes (11.87 MB) |
| macOS x86-64 | 12,307,081 bytes (12.31 MB) |

The 6.3 MB headline is therefore closer to a representative Apple Silicon build than a universal artifact size. The deployment difference remains real. Native fx needs no `node_modules`, virtual environment, language package manager, or separately provisioned runtime. Download the appropriate file, verify it, make it executable, and the harness is present.

That saves little when a developer installs one tool once. It accumulates across CI images, disposable VMs, and evaluation containers. Base images no longer need a language runtime solely for the agent. There is no transitive package graph to reproduce on every target. An upgrade or rollback can replace one executable and its checksum.

The relevant property is not disk conservation. **One executable shortens the procedure for placing an agent inside a work environment.**

## What the Startup Number Measures

The 10-microsecond launch claim does not measure a model response or the complete interactive terminal. The repository's benchmark code gives the claim a narrower and more useful boundary. With `FX_BENCH=1`, fx parses arguments, dispatches the CLI path, and exits before TTY initialization.

The current Linux CI contract runs six paths 100 times each.

| Command | Path measured | Mean budget |
|---|---|---:|
| `fx` | minimal CLI dispatch | 2 ms |
| `fx help` | text help | 2 ms |
| `fx status --json` | config read and JSON serialization | 2 ms |
| `fx background --json` | background-record read | 2 ms |
| `fx doctor --json` | system checks | 2 ms |
| `fx sessions --json` | session-directory read | 2 ms |

The checks use raw wall-clock time and do not subtract the operating system's process baseline. A pull request fails the benchmark if a path exceeds its budget. This 2 ms contract is more informative than the launch headline because it defines the work included and covers paths that read real configuration and state.

None of this makes inference faster. It makes process-per-task architecture practical. A runner can start an isolated agent for each evaluation case, create a clean session for each request, and retire the whole process after failure without turning harness initialization into the dominant cost.

## One Core Behind Three Interfaces

fx exposes the same agent loop through three native entry points.

```text
Human ─────────────── fx                 interactive terminal
Script or CI ──────── fx ask --json      one request, then exit
Editor or host ────── fx acp             ACP server
                              │
                              ▼
                        same agent loop
                  model ↔ tools ↔ policy ↔ session
```

The interactive interface deliberately resembles a Unix shell more than a terminal IDE. It preserves normal scrollback and uses complex selection or permission screens only when necessary.

For infrastructure, `fx ask` is the more consequential interface. It accepts one prompt, emits a result, and exits. JSON output makes the process composable from a job runner or service. The agent becomes closer to a command invocation than a long-lived application.

`fx acp` runs the same core as an [Agent Client Protocol](https://fx.sh/docs/using-fx/acp) server over standard input and output. An editor or another agent host owns the interface while fx owns sessions, prompts, tool calls, and permission requests.

In [#35 I used Agent = Model + Harness](/en/blog/35-harness-engineering/) to define harness engineering. fx cuts that “everything except the model” into a separate process. The model and user interface can change while tool dispatch, context assembly, policy, session storage, and recovery remain in the runner.

## Small Does Not Mean Featureless

The binary is not small because it only wraps a chat endpoint. Native fx includes file listing, search, reading, editing, moves and deletion; shell commands; web search and fetch; images; memory; skills; MCP; and subagents. It resolves scoped `AGENTS.md` instructions, compacts conversations, persists and resumes sessions, and can record terminal activity for deterministic replay.

Inference is separated from the runner. Alongside Vercel AI Gateway, `v0.0.5` supports authenticated Codex and Grok subscriptions and compatible local loopback endpoints. Model weights and an inference engine are not inside fx. It sends a common message and tool representation to the selected model, then executes returned tool calls locally.

This gives the 6.43 MB figure a second interpretation. It is not only the product of dense implementation. Expensive computation lives on a model server, repository data lives in the workspace, and isolation belongs to an outer execution environment. fx owns the repeatable loop and state between them. The binary is small partly because its responsibility is narrow.

## WebAssembly Delegates Operating-System Work to the Host

The Zig build produces `fx-core.wasm` and `fx-term.wasm`. The first is a headless agent core for applications with their own interface. The second attaches the interactive shell to a browser terminal such as xterm.js. On August 23, the [`fx.sh/try`](https://fx.sh/try) terminal artifact was 5,209,918 bytes, about 1.22 MB smaller than the macOS arm64 native executable I measured.

The WASM build becomes smaller by moving work out. Network requests use the JavaScript host's `fetch()`. Configuration and session persistence arrive through host adapters. If the terminal needs a command tool, the browser application must implement a constrained `workspace.exec()` contract.

The documented omissions are substantial: native processes, an OS sandbox, arbitrary WASI filesystem access, native MCP, skills, subagents, web search, clipboard integration, and automatic updates. The SDK also requires JavaScript Promise Integration, available in Chrome and Edge 137 and Safari 27; Node.js 24 needs an experimental flag.

WASM is therefore not a feature-identical copy of native fx. It keeps the agent loop while letting the host decide storage, authentication, networking, and command authority. Avoiding another implementation of every browser-specific capability is what makes the smaller artifact possible.

## Permission Checks Are Not a Sandbox

fx has a permission layer for file changes and command execution. Persistent rules can allow or deny actions, while unresolved requests go to a human or an automatic review path. `yolo` mode bypasses those checks.

The current `v0.0.5` release contains an important breaking change: its notes say approved commands now run as ordinary host subprocesses, and the previous sandbox configuration and commands have been retired. Permission answers whether an action should run. It does not constrain what the resulting process can access through the operating system.

That distinction clarifies the intended deployment. Untrusted work should run with fx inside Docker, a VM, OpenSandbox, or another isolation system. fx is less an agent that supplies a sandbox than **an agent designed to fit easily inside one**. OpenSandbox can create and control the environment; fx can connect the model and tools within it.

## Where the Design Makes a Difference

For one developer keeping an interactive agent open against one project, binary size and a 2 ms launch are not decisive. Model accuracy, time to first token, context management, and review quality dominate the experience. fx waits on the same network and inference once real work begins.

The design becomes relevant when:

- every evaluation case starts a clean agent process;
- a CI job or server invokes `fx ask --json`;
- a container or VM image should carry an agent without a language runtime;
- editors and products need to share an ACP runner;
- a browser host must own storage, authentication, and command authority; or
- multiple models must be compared under the same tool and session conditions.

In these settings, the agent behaves less like an application a developer keeps open and more like a work process a system invokes. Predictable initialization, a short installation path, and text and JSON interfaces can matter more than making the harness itself visually rich.

## Assessment

Read in isolation, 6.3 MB and 10 microseconds describe an unusually small CLI. Read alongside the deployment and invocation model, they show what fx is trying to change: a coding agent installed and maintained per user becomes a process copied into a work environment and launched when needed.

Native fx keeps the agent loop, tools, policy, and sessions in one executable. ACP separates the interface. WASM delegates networking, persistence, and command execution to the host. Inference and security isolation remain outside the project. The small artifact is evidence of how tightly fx has drawn the boundary around what it owns.

The project is still at `v0.0.5`, and its README explicitly labels it experimental. Provider authentication, permission behavior, and command execution changed substantially within days of the public release. It is better evaluated today as an open implementation of a disposable, embeddable agent runner than as a stable replacement for an established coding assistant.

---

*Sources: [vercel-labs/fx](https://github.com/vercel-labs/fx), [v0.0.5 release](https://github.com/vercel-labs/fx/releases/tag/v0.0.5), [tools](https://fx.sh/docs/capabilities/tools), [project instructions](https://fx.sh/docs/configure-fx/project-instructions), [ACP](https://fx.sh/docs/using-fx/acp), [WebAssembly SDK](https://fx.sh/docs/lib/webassembly), [browser host integration](https://fx.sh/docs/lib/host-integration), [data and local inference](https://fx.sh/docs/using-fx/data-and-privacy), and [benchmark definition](https://github.com/vercel-labs/fx/blob/main/CONTRIBUTING.md#benchmarks). Code and documentation were retrieved on August 23, 2026. Native sizes are the executable byte counts after unpacking all four GitHub `v0.0.5` release archives. The WASM size is the Content-Length of the `fx-term.wasm` served by `fx.sh/try` that day. Launch figures are vendor claims; I did not independently reproduce the 10-microsecond result.*
