---
title: "Google's Agent Orchestrator AX: One Agent, One Sandbox, Managed Like kubectl"
summary: "Around September 20, Google published AX, an agent orchestrator written in Go. The README promises 'billions of autonomous agent workloads in a cluster', and a 661-point Hacker News thread split over that number and the prerequisites. Reading the design doc and the code shows AX is not an agent framework. It treats one agent as one sandbox, declares it with four manifests (Task, Workspace, Gateway, Model), and applies, suspends and resumes it the way kubectl does. Execution belongs to a separate project, Agent Substrate. This post checks how far the code goes on what people wanted from AX (idle-agent cost, isolation, repeated environment setup, an auditable stack), what is still on the roadmap (idle detection, exit status, workload identity), and which teams can try it today."
date: "2026-09-24T23:00:00+09:00"
tags:
  - ai-agent
  - agent-engineering
  - kubernetes
  - open-source
draft: false
---

Around September 20, Google pushed a repository called AX to its `google` GitHub organization. It is an agent orchestrator written in Go, Apache 2.0 licensed, and it passed 9,500 stars within days. The first sentence of the README reads: "a high-throughput, declarative orchestrator to run billions of autonomous agent workloads in a cluster." The Hacker News thread reached 661 points, and the reactions split in two. One side was glad someone finally addressed the cost of agents sitting idle while they wait for a model response or a human approval. The other side pointed out that the marketing says "easy" while the quickstart asks for a Kubernetes cluster, a container registry, and another beta project.

A word on the term first. An orchestrator is not a tool for building programs. It takes programs that already exist and decides which machine runs them, when, and how many, restarts them when they die, hands out CPU and memory, and reclaims them when they are no longer needed. Kubernetes does that for containers. AX does the same for agents. An agent framework such as LangGraph or CrewAI decides how the model, tools, and memory are wired together inside an agent; an orchestrator treats the finished agent as a unit of execution from the outside. It checks out the repository, decides where the agent may connect, takes it off the machine when it is idle, and brings it back when something calls it. When this post says "not a framework," that is the distinction it means.

Plenty of secondary coverage appeared, and some of it needs a warning. Introductions on dev.to and a few blogs describe AX as a "DAG graph engine" where nodes talk over "protobuf channels", "27 percent faster than LangChain", with support for "LLaMA-3.2 and Claude-3". None of that exists in the repository. There is no graph engine and no LangChain benchmark. This post is based on the design document, the seven files under `docs/`, the Go code, and the replies a co-creator left on Hacker News. I did not deploy it to a cluster. AX needs Agent Substrate, and that project labels itself "not ready for production use", so I kept to reading code and docs.

Unifying sandbox runtimes behind one API was the topic of [#58 OpenSandbox](/blog/58-opensandbox-agent-runtime/), and the paths agents take out of their sandboxes was [#76](/blog/76-openai-agent-incidents/). This post looks one layer up: who starts and stops thousands of sandboxes, and when.

---

## What people wanted from AX

The Hacker News thread and the replies from co-creator rakyll point to four demands.

**The cost of idle time.** An agent spends long stretches waiting for a model API, waiting for a human to approve something, or doing nothing until the next turn. Holding a container for all of that burns CPU and memory for no work. This is exactly where the infrastructure people on Hacker News praised AX. One commenter named the realistic use case as "big, bursty fleets for evals, reinforcement learning, and training data collection" rather than everyday product work.

**Isolation.** A user named kstenerud described forensic work where agents may only run inside sandboxes with restricted I/O. The demand is to put an agent that executes untrusted code inside gVisor or a microVM and open outbound traffic only to an allowlist.

**Repeated environment setup.** The Workspace section of `docs/concepts.md` states this demand directly. Before an agent's first useful action it needs repositories at the right revision, the tools it may call, and the skills it should carry, and "every task that needs the same environment repeats that setup, and every agent framework reinvents it."

**An auditable stack.** rakyll summarized AX's purpose in three items: delivering agentic apps to a customer's compute without violating data residency, eliminating tedious infrastructure setup, and providing a transparent, auditable stack for compliance. Then the clarification: "AX is NOT an agentic framework." It is a job orchestration layer.

Checking the code against these four demands makes AX's position clear.

## What is actually in the repository

There are 32 Go files and about 14,000 lines, and that count includes generated protobuf code, so the handwritten part is much smaller. There are four binaries.

| Binary | Role |
|---|---|
| `ax` | Developer CLI. `apply`, `get`, `describe`, `watch`, `delete`, plus `suspend`, `resume`, and `ssh`. |
| `ax-server` | Stateless gRPC API. Validates manifests, persists them to Redis, publishes events. |
| `ax-controller` | Consumes Redis Streams, creates actors on Agent Substrate, applies egress policy, drives tasks toward the desired state. Scales by adding replicas. |
| `ax-task-runner` | PID 1 inside every task container. Prepares the workspace, serves metadata, runs the agent command. |

`DESIGN.md` explains why a Kubernetes-shaped tool does not use CRDs. Storing millions of short-lived tasks as CRDs pushes etcd past its limits: single-digit gigabytes of storage and a write-rate bottleneck. So state lives in Redis and the work queue between the API server and the controllers is Redis Streams. The "billions" figure appears as the justification for this choice. There is no material in the repository showing that scale was actually run.

There are four resource kinds, and one example file holds all of them.

```yaml
apiVersion: ax.io/v1alpha1
kind: Task
metadata:
  name: task123
spec:
  image: "gcr.io/ax-substrate/ate-images/ax-task-runner@sha256:..."
  resources:
    requests: { cpu: "500m", memory: "1Gi" }
    limits:   { cpu: "2",    memory: "4Gi" }
  workspaces:
    - name: default-workspace
      goal: "Install dependencies and run the test suite"
  gateway:
    name: default-gateway
  debug: true
---
kind: Workspace
spec:
  git:
    - repo: "https://github.com/chalk/chalk.git"
      branch: "main"
  mcp:
    servers:
      - name: git-tools
        endpoint: "http://git-mcp.default.svc.cluster.local:8080"
  skills:
    path: "/.agents/skills"
---
kind: Gateway
spec:
  egress:
    allowlist:
      hosts:
        - host: "*"
          port: 443
---
kind: Model
spec:
  provider: google
  model: gemini-3.8-flash
  secretKey:
    name: gemini-api-secret
    key: GEMINI_API_KEY
```

A Task carries a container image, a command, resource limits, environment variables, a Gateway reference, and Workspace references. The design intent is worth reading. The docs say AX deliberately does not model an agent's whole lifetime. An agent plans, delegates, retries, and fans work out; instead of following that shape, AX gives "one primitive that is cheap to create, isolate, suspend, and throw away" and lets the agent compose as many as it needs. A single task may be the whole job or the root of a large tree of tasks the agent spawns as it breaks the problem down.

A Workspace declares Git repositories, MCP servers, and a skills path. Declare it once, bind it from any number of Tasks, and the runner materializes it inside each sandbox. If a binding carries a `goal`, the runner hands that goal to an agent on first boot to finish setup, such as installing a toolchain.

A Gateway lists the listeners a task exposes and an egress allowlist. The controller turns the allowlist into an Agent Substrate egress policy on the actor. The example allows `*` on port 443, which is effectively everything, with a comment telling you to tighten it in production.

Model is a confusing name, and the docs say so first: "A `Model` is not a model." It is a configuration resource bundling the provider, the model identifier, generation parameters, and a reference to the Kubernetes secret holding the API key. The README table describes it as "which LLM the platform itself uses." It is separate from whatever model the user's agent inside the task calls. AX uses it when planning a workspace from a goal. The user's agent gets its own keys through `spec.env` and calls whatever it wants.

## Suspend and resume are the center of the project

To see how AX addresses the idle-cost demand, look at the relationship between the controller and Substrate. AX does not create sandboxes. The controller asks Agent Substrate over gRPC to create an actor, apply an egress policy, suspend the actor, or resume it.

Agent Substrate is a separate project introduced on the Google Cloud blog on May 21 alongside Agent Sandbox. Agent Sandbox is a CRD under kubernetes-sigs that provides gVisor isolation and default-deny network policy, and it is generally available on GKE. Agent Substrate is a thin control plane on top of it that maps a large number of actors (agents) onto a smaller number of ready workers (pods). It relies on agents being idle most of the time: it multiplexes several actors onto one worker, checkpoints idle actors off the worker, and brings them back in under 500 milliseconds when a request arrives, according to its README. The figures of over 500 suspend/resume operations per second and 300 sandbox allocations per second per cluster are Google's own. The same README says "This is not an officially supported Google product" and "not ready for production use."

On the AX side, suspend and resume show up in three places.

First, `ax suspend task` sets `spec.suspend` on the Task and the controller calls `SuspendActor`. The workspace is checkpointed and the sandbox goes away. `ax resume` reverses it. This manual path is the only one visible in the controller code.

Second, the network path resumes automatically. Tasks do not get a Service or Ingress of their own. Every request goes through Substrate's `atenet-router`, which reads a single header, `ate-target-actor`, resolves the actor to its worker, resumes it first if it was suspended, and proxies the request. Send a request to a sleeping agent and it wakes up.

Third, the runner is built to survive a resume. A resume restarts the container, and re-cloning the Git repositories at that point would overwrite whatever state the agent accumulated. So the runner writes a marker file under `/ax` on the durable volume when workspace setup finishes and skips setup on later boots. On a stop or suspend it sends SIGTERM to the command's process group, waits ten seconds, and kills what is left.

One thing is missing here: idle detection. Roadmap item 2 says the plan is to "continuously monitor actor activity (process execution, I/O, network traffic, and active gRPC/SSH sessions) to detect idle tasks and automatically trigger `SuspendActor` checkpointing." So the idle-cost saving that Hacker News praised only happens today when someone calls `ax suspend`. The picture where an agent drops off the worker for the thirty seconds it waits on a model response, and comes back on its own, is still on the roadmap.

## The runner contract, or how AX avoids picking a framework

The claim that AX does not choose an agent framework is concrete in the runner docs. The controller never runs `spec.command` as the container entrypoint. It always starts the container with `/usr/local/bin/ax-task-runner` and passes the full Task and Workspaces as the `AX_TASK_YAML` and `AX_WORKSPACES_YAML` environment variables. The runner parses them, prepares the workspaces, serves `/healthz` and `/readyz` on port 80, starts the command as a child process, and must stay alive as PID 1 after the command exits.

Anything that honors this contract can be a runner, in any language. The docs offer three levels: add tools on top of the default image, import the `runner` Go package to hook the command's exit, or write one from scratch. The controller provisions a separate actor template for each distinct image and environment, so tasks with different runners run side by side in the same atespace.

The default runner image is Python 3.12 with git, curl, openssh-client, and the Antigravity agent. Antigravity is what handles a Workspace `goal`. In `internal/workspace/setup.go` it runs `/usr/local/bin/antigravity_bootstrap.py`, refuses to run without `GEMINI_API_KEY`, and has a default timeout of ten minutes. Roadmap item 3 plans to "decouple the built-in workspace bootstrap and coding agent harness so users can configure custom agent runtimes." Today, goal-based setup requires a Gemini key.

The Model resource is in the same state. `docs/manifests.md` includes a `provider: anthropic` example with `claude-opus-5`, but `Generate` in `internal/model/client.go` only calls the Gemini API when the provider is empty or `google`, and returns an `unsupported provider` error otherwise. The docs are ahead of the code. Since this Model is the one AX uses for itself, it does not stop an agent inside a task from calling Claude.

## It does not know when a task finishes

Judged as a job orchestrator, the most visible gap is completion. `status.phase` takes the values `Running`, `Suspended`, `Failed`, and `Terminating`. There is no `Succeeded` or `Completed`. The runner docs explain why. The runner stays up as PID 1 after the command exits so the metadata server keeps answering, the exit code goes only to the log, and "the control plane does not currently read the command's exit status back from the container."

So you can `ax apply` a thousand tasks, but `ax get tasks` will not tell you how many are done. Whether the agent finished is something you report out yourself, for example from the `OnCommandExit` hook in the runner package by posting a webhook or uploading results. Roadmap item 1 lists "token/timeout budgets, and approval policies" for Task, and those do not exist yet either. The README warns that agents "can burn money in a loop if nobody is watching," and the budget that would stop that is still at the spec stage.

## Identity and the gateway

The most technical objection on Hacker News came from a user named hhh. Multiplexing several tasks onto one worker means "you can no longer trust the k8s pod identity as being from a singular workload." In the common setup where pod identity maps to cloud IAM, another agent on the same pod shares those permissions, and the audit log records the pod, not the task.

ahmedtd, a Googler, replied that Agent Substrate will support SPIFFE and OIDC identity injection through egress gateways, "landing within a few weeks." AX's roadmap item 4 also lists issuing SPIFFE IDs and X.509-SVIDs to every Task actor and Gateway. Per-task identity is on the roadmap of both projects.

The Gateway is half there too. The code that converts the allowlist into a Substrate egress policy exists, but continuous reconciliation, so that editing a Gateway propagates to tasks already running, is the first item of roadmap 4. It is safer to assume the policy is applied once when the task is created. As [#76](/blog/76-openai-agent-incidents/) showed, an agent's path out can run through an internal service that is on the allowlist, so what you put on the list decides how strong the isolation is. The example's `*:443` is a starting point only.

`ax ssh` is convenient with a condition. The Task needs `debug: true` for the runner to serve the guest services (arbitrary process execution and file read/write) over gRPC, and `ax ssh` refuses to connect otherwise. The default is off, and the docs warn that turning it on allows arbitrary execution inside the sandbox. Every example file has `debug: true`.

## Which teams can try it now

Put together, AX fits teams that meet two conditions: they already run Kubernetes, and they have work that launches hundreds of agents at once. carlm42's comment on Hacker News was exact: it is easy "if you have infrastructure already." Evaluation pipelines, reinforcement learning rollouts, and bulk code migrations that fan hundreds of tasks across one repository are the first candidates. In those cases, one Workspace declaration standardizes cloning and MCP setup, and a Gateway limiting egress to the model API and the Git host is already a gain.

Getting started takes some preparation.

- A Kubernetes cluster and a container registry the cluster can pull from
- `ko`, a tool that builds and pushes Go images without a Dockerfile
- Agent Substrate deployed in the `ate-system` namespace. Substrate runs on Kubernetes outside GKE too, and its quickstart includes a kind cluster.
- A Gemini API key if you use goal-based workspace setup
- A way to learn that a task finished. You add code in the runner hook to post a webhook or upload results to a bucket.

For an individual or a small team that wants to isolate a few coding agents, there are lighter options than AX. Scion, which Google itself published in April, runs Claude Code, Gemini CLI, Codex, and OpenCode each in its own container on Docker, Podman, Apple Container, Kubernetes, or Cloud Run. It uses existing harnesses as they are and needs no cluster. That is why jauntywundrkind on Hacker News preferred Scion over AX. The two projects do not mention each other. If all you need is a sandbox API, OpenSandbox from [#58](/blog/58-opensandbox-agent-runtime/) or the Agent Sandbox CRD on its own is one layer fewer.

If you hold off and watch, three signals matter.

1. Whether SPIFFE/OIDC identity injection actually lands in Agent Substrate. Without it, cloud permissions cannot be split per task on a multiplexed worker.
2. Whether idle detection and automatic suspension land in the AX controller. Without it, the cost story stays manual.
3. Whether task completion status and budget policies enter the spec. With those, it can be called a job orchestrator.

## Summary

AX is a thin control plane written in Go. It stores four kinds of manifests in Redis, the controller turns them into Agent Substrate actors, and the runner inside the task container prepares the workspace and starts the agent command. It takes no part in how the agent thinks or calls tools. Of the four things people wanted, isolation and environment setup are in the code today, idle-cost saving goes as far as manual suspend and resume, and auditable identity is on the roadmap. "Billions" is the number that explains choosing Redis over etcd, not a measurement.

The second takeaway is how Google is stacking its agent infrastructure. Agent Sandbox (an isolation CRD) sits at the bottom, Agent Substrate (actor multiplexing with suspend and resume) on top of it, AX (declarative tasks and workspaces) above that, and Scion (running existing harnesses in containers) off to the side. All of it is open source and all of it is labeled "not an official product" or "pre-stable." Which layer to use depends on the infrastructure you already have and how many agents you launch at once.
