---
title: "Not a Docker Wrapper but an Execution Protocol for Agents — Dissecting OpenSandbox"
summary: "I cloned OpenSandbox, a 14.5k-star repository created eight months ago, and traced its four API specifications, FastAPI control plane, Go execution daemon, Docker and Kubernetes runtimes, egress layer, and Credential Vault. It looks like an SDK for creating sandboxes and running commands, but the real product is a protocol boundary that keeps agent code stable while execution environments change. This analysis covers runtime injection, credentials that stay outside workloads, pools and snapshots, and the caveats to check before adoption: default runc, backend capability gaps, and independently versioned components."
date: "2026-08-22T11:00:00"
tags:
  - agent-engineering
  - ai-infrastructure
  - sandbox
  - kubernetes
  - open-source
draft: false
---

How much software should it take to give an AI agent a shell? It is tempting to say: start a Docker container and call `exec`. The first [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) example looks almost that simple. `Sandbox.create()` starts an image, `sandbox.commands.run()` executes a command, and `sandbox.files.write_files()` puts a file inside.

Clone the repository, however, and a different product appears beneath that shell: a Python FastAPI server; `execd`, ingress, and egress components written in Go; a Kubernetes operator and three CRDs; five language SDKs; a CLI and MCP server; and four public OpenAPI specifications. A simple count of source and specification files exceeds 330,000 lines, with 460 test-named files. Created on December 17, 2025, the repository reached 14,547 stars and 1,285 forks in eight months.

Reading that size as merely “many sandbox features” misses the center. Following the August 21 commit `6b2023e`, I found that OpenSandbox's real product is not a container. It is an **execution protocol for agents**: a boundary intended to preserve agent-side code as execution moves from Docker to Kubernetes, or from one local coding agent to thousands of evaluation workers.

---

## One Sandbox, Split into Three Layers

OpenSandbox's architecture can be compressed into three layers.

```text
Agent / SDK / CLI / MCP
          │
          ▼
Lifecycle API ── FastAPI control plane ── Docker or Kubernetes
          │                                      │
          └── endpoint resolution ───────────────┘
                                                 ▼
                                  execd + workload + egress
                                           data plane
```

The first is the **client layer**. Python, JavaScript/TypeScript, Java/Kotlin, C#/.NET, and Go SDKs wrap the same sandbox lifecycle and execution APIs. The `osb` CLI and MCP server use the same surface. Examples for Claude Code, Codex CLI, Gemini CLI, Playwright, VNC desktops, and more demonstrate that the product is not coupled to one agent framework.

The second is the **lifecycle control plane**. A FastAPI server accepts creation, inspection, deletion, pause, resume, TTL renewal, and endpoint requests, then delegates to either `DockerSandboxService` or `KubernetesSandboxService` according to `runtime.type`. The implementation registry in the factory is almost deliberately boring. Routers know the `SandboxService` contract, not the backend's mechanics.

The third is the **sandbox data plane**. A Go daemon called `execd` is injected into the user's container. It handles commands, background logs, SSE streaming, PTY WebSockets, file operations, metrics, and Jupyter-backed code execution. When network policy is requested, an egress sidecar joins the same network namespace; on Kubernetes, ingress routes external requests to sandbox ports.

This makes an image such as `python:3.12`, which knows nothing about OpenSandbox, controllable as a sandbox. Under Docker, the server stages the `execd` binary and bootstrap script into the container. Under Kubernetes, an init container copies them into an `emptyDir` mounted by the user container. **The agent API is attached at runtime instead of being baked into every image.** That is the first meaningful distinction between OpenSandbox and a container-execution SDK.

## The API Comes Before the Implementation

The repository's root instructions call `specs/` the “public contract source of truth.” Four specifications draw the layer boundaries.

| Contract | Responsibility |
|---|---|
| `sandbox-lifecycle.yml` | Create, inspect, delete, pause/resume, TTL, endpoints, snapshots |
| `execd-api.yaml` | Commands, sessions, code, files, directories, metrics, isolated execution |
| `egress-api.yaml` | Outbound policy and Credential Vault |
| `diagnostic-api.yml` | Sandbox log and event diagnostics |

Generated OpenAPI clients sit beside handwritten adapters in the SDKs. Generated code handles ordinary request-response paths; adapters handle streaming, retries, error mapping, and higher-level models. It is a fairly literal application of the contract-first idea: stabilize the boundary before the implementation behind it.

The payoff appears when the runtime changes. Concepts such as `resourceLimits`, `volumes`, `networkPolicy`, and `endpoints` remain common while their materialization differs. A `pvc` becomes a Docker named volume locally and a PersistentVolumeClaim on Kubernetes. An endpoint may be a Docker host port, a Kubernetes ingress address, or a server `/proxy/` URL, but the SDK receives the address and required headers as one object.

OpenSandbox is not trying to answer “which isolation technology is best?” It offers runc, gVisor, Kata, and Firecracker as options and places a shared lifecycle and execution contract above them. In other words, it **demotes isolation technology from product identity to replaceable backend.** The ambition resembles a POSIX layer for agents. Whether it wins that role is unknowable; the direction is not.

## Credential Vault Is the Most Interesting Security Feature

The difficult part of an agent sandbox is not only putting untrusted code in a container. That code still needs GitHub, package registries, and model APIs, which makes credential delivery harder than isolation itself. Put an API key in an environment variable and the agent can retrieve the plaintext with one `env` call, then copy it into logs or generated files.

OpenSandbox's [Credential Vault](https://open-sandbox.ai/guides/credential-vault) keeps real values in the egress sidecar and gives the workload decoys. Only when an outbound request matches a configured host, path, and method does the proxy replace a header or query parameter with the real value. Reflected secrets can be redacted from responses, while policies and credential bindings are exposed through the runtime API. The agent can make an authenticated request without owning the credential plaintext.

FQDN allow/deny rules and nftables can be layered on top, allowing destinations such as PyPI and a model API while denying everything else. On Kubernetes, `NET_ADMIN` is removed from the user container and granted only to the egress sidecar. On ingress, endpoint resolution returns access headers with the address so SDK users do not have to construct routing tokens.

This is the opposite of the shared-computer agent design discussed in [#56](/blog/56-grok-bot-shared-computer/). Instead of accumulating state and credentials inside the computer where agents live, OpenSandbox keeps work environments disposable and authority at the boundary proxy. **A sandbox boundary must include credentials and network paths, not just a filesystem.**

## At Scale, Lifecycle Becomes the Product

A creation API looks excessive when starting one local container. It looks different when running thousands of evaluations. Every trial needs a clean environment, and the system must manage startup latency, idle cost, failure recovery, TTLs, logs, and retained state.

The Kubernetes `BatchSandbox`, `Pool`, and `SandboxSnapshot` CRDs address that problem. A Pool keeps pre-warmed sandboxes for lower allocation latency. BatchSandbox manages multiple replicas and evaluation- or RL-shaped task orchestration. Pause does not merely freeze a Pod: for a supported single-replica sandbox, the controller commits the root filesystem to an OCI image, releases compute, then recreates it under the same sandbox ID on resume. It does not preserve memory or sockets, but it is a practical midpoint for retaining filesystem state while turning off CPU or GPU cost.

There are client-side pools as well. Recent SDK releases maintain rolling warmup under bounded concurrency and preserve ownership fencing and cleanup across process restarts. At this point a sandbox is no longer an alias for `docker run`; it is **a control system for dispensing and reclaiming short-lived compute.**

## This Is Not a Single “Secure” Button

A long security feature list does not mean the default installation is automatically a strong security boundary. The limits stated by the code and documentation matter.

**Default runc is not VM isolation.** gVisor, Kata, and Firecracker are supported, but operators must configure them at the server level. The sample config drops several dangerous Linux capabilities and uses Docker's default seccomp profile, but untrusted multi-tenant workloads still require an explicit secure-runtime and cluster-boundary design.

**DNS mode alone cannot enforce outbound isolation.** The documentation explicitly calls out direct-IP and DoH/DoT bypasses. `dns+nft` adds a network-layer barrier, but it is incompatible with gVisor's netstack and may conflict with service meshes rewriting traffic in the same namespace. Extra-port handling for transparent HTTPS MITM is still experimental, and Credential Vault depends on that MITM path. The useful question is not whether “egress” is checked on a feature list, but which mode fails closed on which runtime.

**Docker and Kubernetes do not have identical semantics.** The public snapshot API currently has a Docker-centered implementation, while Kubernetes pause/resume uses a separate internal rootfs snapshot flow. A pre-created Pool Pod cannot receive a new per-request egress sidecar, so `poolRef` and per-request `networkPolicy` cannot be combined. Applications must detect backend capabilities beneath the common API.

**It is not yet one versioned v1 product.** The August 21 release page shows egress 1.1.7, execd 1.0.22, Helm chart 0.2.2, and Python SDK 0.1.15 moving independently. Unified release governance is still a draft in OSEP-0016, and the roadmap explicitly declines to declare a stable v1 before lifecycle semantics and SDK compatibility mature. The project is improving quickly, but deployers must own a tested compatibility matrix and pin image digests.

Finally, an integrated audit trail remains a planned roadmap item. Logs, OpenTelemetry, and request IDs exist, but a durable record answering “which agent, under which identity, performed which command, file, and network action?” is not yet a complete product surface.

## Who Should Use It

If one process needs to execute a few lines of trusted code, Docker's API or a subprocess is simpler. There is no reason to operate the OpenSandbox server, `execd`, and sidecars. Its value emerges when several of these conditions overlap:

- Multiple agent frameworks need one execution infrastructure.
- SDK calls should survive a move from developer Docker to production Kubernetes.
- Files, PTYs, browsers, desktops, and exposed ports must share one lifecycle with code execution.
- Large evaluation or RL workloads need pre-warm, TTL, pause/resume, and recovery.
- API keys must be injected per destination without exposing plaintext to workloads.
- An Apache-2.0 self-hosted control plane is preferable to a managed sandbox vendor.

The first adoption question should not be “is the SDK convenient?” It should be: **which runtime fits the threat model, which egress mode will be mandatory, whether Pool latency or per-request network policy wins, and how component versions will be tested together.** OpenSandbox does not remove these decisions. It gathers the control points needed to make them within one architecture.

## What Remains

Calling OpenSandbox “an open-source E2B” is only half right. The experience is a remote-sandbox SDK, but the codebase's center of gravity is not cloning one provider. It combines public specifications, runtime adapters, an injected execution daemon, and network and credential sidecars to **standardize the boundary between agents and compute.**

In [#35](/blog/35-harness-engineering/) I used the equation Agent = Model + Harness. Sandbox sounded like one feature in the harness. Once agents work for hours, multiply in parallel, and log into external services, however, the sandbox becomes a small operating-system platform. It must manage lifecycle, state, files, ports, authority, secrets, networking, and observability alongside process execution.

The 14,547 stars do not prove that OpenSandbox is already a standard. They prove demand for **a common execution contract separated from models and agent frameworks.** Even if this project is not the eventual winner, its question remains: why do we swap models freely while rebuilding execution infrastructure for every agent? The most important OpenSandbox code is not the code that starts Docker. It is the four API boundaries drawn around that question.

---

*Sources: [OpenSandbox repository](https://github.com/opensandbox-group/OpenSandbox) (stars, forks, and creation date retrieved through the GitHub API on August 22, 2026; code analysis at the August 21 `6b2023e` commit), [architecture](https://open-sandbox.ai/architecture/), [Sandbox Lifecycle specification](https://github.com/opensandbox-group/OpenSandbox/blob/main/specs/sandbox-lifecycle.yml), [execd specification](https://github.com/opensandbox-group/OpenSandbox/blob/main/specs/execd-api.yaml), [network isolation](https://open-sandbox.ai/architecture/network-isolation), [Credential Vault](https://open-sandbox.ai/guides/credential-vault), [secure container runtimes](https://open-sandbox.ai/guides/secure-container), [OSEPs](https://github.com/opensandbox-group/OpenSandbox/tree/main/oseps), [roadmap](https://github.com/opensandbox-group/OpenSandbox/blob/main/ROADMAP.md), and [releases](https://github.com/opensandbox-group/OpenSandbox/releases). The line count is a simple directory-level sum of Python, Go, TypeScript, Java, C#, and YAML files and includes generated code; it indicates repository scale, not an estimate of handwritten code.*
