---
title: "DX for the AX Era — You Need Dev Skills to Use AI Well"
summary: "People jumping into AX (Agent Experience) without DX (Developer Experience) foundations keep hitting the same walls. Here are the problems, and the 10 DX skills redefined for the AX era."
date: "2026-05-16T10:00:00"
tags:
  - dx
  - ax
  - ai-coding
  - developer-experience
  - agentic-coding
  - career
---

AX (Agent Experience) is the buzzword of the moment. [Coined by Netlify CEO Mathias Biilmann](https://nordicapis.com/what-is-agent-experience-ax/), AX is "the act of designing a product in a way that AI agents can understand it and reliably interact with it autonomously." Agentic coding, vibe coding, AI-native development — new tools and workflows drop every week. But a recurring pattern keeps emerging among people trying to ride this wave.

"I installed Claude Code but how do I use a terminal…"
"AI-generated code broke but I don't know where to start debugging…"
"I was told good prompts are all you need but the results are terrible…"

The common root cause of these problems isn't AI. It's **the absence of DX (Developer Experience) foundations**.

According to [Anthropic's 2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report), developers delegate 60% of their work to AI yet fully trust only 0–20% without oversight. This **"Delegation Gap"** exists not only because of AI's limitations, but because developers lack the DX competencies to verify and manage delegated results.

DX was the keyword of the pre-AX era. Development environments, toolchains, workflows, code quality — everything that enables developers to work effectively was DX. As AX rose, DX started being treated as "yesterday's story." But reality is the opposite. AX is a superset of DX — it requires everything DX offered and adds new layers on top.

**AX stands on top of DX. AX without DX is a castle built on sand.**

---

## What Happens When You Skip DX and Jump Into AX

### 1. You Can't Manage AI Code — No Git Foundation

AI generates hundreds of lines of code at once. To decide whether to accept, modify, or discard it, you need to read diffs. You need to isolate AI experiments in branches. You need to roll back when things go wrong.

If Git is just "commit and push" to you, AI-generated code becomes an uncontrollable black box. There's a reason agentic coding tools heavily leverage worktrees, branches, and diffs.

### 2. You Can't Tell If the Output Is Correct — No Testing Culture

AI produces code that "looks like it works." Syntax errors are rare. But whether business logic is correct, edge cases are handled, and existing code compatibility is preserved — those are separate questions entirely. The industry has started calling this **"Code Slop"** — code that is functional but lacks readability, maintainability, and adherence to style guides.

Without a testing habit, you fall into an infinite loop of "asking AI to verify AI-generated code." With no ground truth to check against, you default to "it runs, so it must be fine." You only discover problems in production.

### 3. You Can't Fix Broken Code — No Debugging Skills

AI-generated code breaks too. And when you toss "fix this" back to the AI, it makes the existing code more complex and breaks it in a *different* way. This is the **ping-pong anti-pattern**.

Reading error messages, tracing stack traces, forming hypotheses and testing them — this isn't something AI replaces. It's something you need **even more** when working alongside AI.

### 4. You Don't Know What to Ask For — No System Design Sense

"Build me an app" isn't a prompt. It's a prayer. To use AI effectively, you need to decompose problems. You need to define API designs, data models, and module boundaries. Without this sense of system design, all you can give AI is vague requirements, and all you get back is vague results.

### 5. Your Prompts Don't Work — No Context Engineering

A good prompt is a good question. Asking good questions requires knowing the current state precisely — project structure, dependencies, constraints, history. Organizing this information and delivering it to AI is context engineering. [Martin Fowler defines it as "curating what the model sees so that you get a better result"](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) and emphasizes it's **the skill that separates developers who get 10x value from AI coding agents from those who get 2x**.

CLAUDE.md, AGENTS.md, .cursorrules, system prompts — all of these are products of "the ability to structure development context." Without development experience, you don't even know what to provide as context.

### 6. You're Stuck on Tool Setup — No Environment Management Skills

Most agentic coding tools are CLI-based. You configure in the terminal, manage environment variables, install packages, and set permissions. For someone who's only used GUIs, this isn't a speed bump — it's a wall.

### Developer Insight

> **Common thread in all 6 problems: none of them are AI problems. They're DX problems.** Switching AI tools or upgrading models won't fix them. You need to build the foundation. The good news: these foundations are learnable, and you can learn them efficiently through AX-era workflows.

---

## 10 DX Skills Redefined for the AX Era

Classical DX and the DX needed today aren't the same. With AX as a new layer, each DX competency has shifted in meaning and application. [Fortune calls this shift "the rise of the Supervisor Class"](https://fortune.com/2026/03/31/fortune-com-2026-03-26-ai-agents-vibe-coding-developer-skills-supervisor-class/) — the developer's core role is moving from writing code directly to supervising AI-generated code. The skills needed now fall into three layers: **Understanding the work** (AI fluency, fundamentals, product thinking), **Directing the work** (delegation, agent orchestration, architecture), and **Verifying the work** (quality control, testing, security).

The key isn't to "learn all classical DX first, then move to AX." It's to **learn DX with AX as the destination**.

### 1. Git — From Version Control to Safety Net & Context Source

**Classical DX:** branch, merge, resolve conflicts
**AX-era DX:** reviewing AI code diffs, isolating experiments (worktrees), instant rollback, using commit history as AI context

Reading AI-generated code line by line is inefficient. `git diff` shows exactly what changed. Run AI experiments in separate branches; if they fail, `git reset` cleanly. Commit messages and history become context that tells AI "what's happened in this project."

### 2. Testing — From Manual Checks to AI Output Verification

**Classical DX:** unit tests, integration tests, TDD
**AX-era DX:** automated verification of AI-generated code, assertion-based validation, regression tests for AI change safety

Write tests **before** asking AI to generate code. When tests define expected outcomes, you can instantly judge whether AI output is correct. This isn't a TDD revival — it's **TDD finding new meaning in the AI era**.

### 3. Code Review — From Peer Review to Critical AI Output Reading

**Classical DX:** PR reviews, pair programming
**AX-era DX:** critically reviewing AI-generated code, asking "why this implementation?", checking security, performance, and maintainability

Accepting AI-generated code because "it looks right" is like merging an intern's code without review. AI code demands **stricter** review because AI writes incorrect code with full confidence.

### 4. CI/CD — From Build Automation to Generate-Verify-Deploy Pipelines

**Classical DX:** build, test, lint, deploy automation
**AX-era DX:** automated testing of AI-generated code, pre-commit hooks as quality gates, pipelining AI workflows

Without CI, you only discover that AI-generated code breaks existing code after deployment. CI is AI code's **automatic safety net**. Pre-commit hooks enforce lint and type checks, ensuring AI-generated code meets the same quality bar.

### 5. Documentation — From README Writing to Context Engineering

**Classical DX:** README, API docs, code comments
**AX-era DX:** CLAUDE.md, system prompts, structured context, prompt asset management

This is the most dramatically changed area. Past documentation was "for humans to read." Today's context engineering is **"for AI to understand precisely."** Organizing a project's rules, structure, and constraints in a format AI can parse — that's the defining DX skill of this era. [Context engineering best practices](https://packmind.com/context-engineering-ai-coding/context-engineering-best-practices/) show that effective CLAUDE.md files place project overview and tech stack at the top, followed by architecture principles, conventions, testing strategy, commands, and an explicit anti-patterns section at the bottom.

### 6. Architecture — From Modularity to AI-Friendly Structure

**Classical DX:** separation of concerns, layered architecture, microservices
**AX-era DX:** clear module boundaries that AI can understand and modify, one file = one responsibility

AI can't handle 1,000-line God classes. More precisely, it *seems* to understand them but breaks other parts when modifying. Sub-200-line focused modules let AI understand and modify code accurately. Good architecture isn't just for humans anymore — it's for AI too.

### 7. CLI/Terminal — From Command Execution to Agent Interface

**Classical DX:** shell commands, scripts, terminal workflows
**AX-era DX:** MCP server setup, tool definitions, granting agents permissions and tools

The core interface of agentic coding isn't a GUI — it's a CLI. Claude Code, Codex, aider — they all run in the terminal. Setting up MCP servers, defining tools, and managing agent permissions is the new "dev environment setup."

### 8. Debugging — From Log Tracing to AI-Collaborative Debugging

**Classical DX:** breakpoints, logging, profiling
**AX-era DX:** identifying AI hallucinations, prompt debugging, reasoning about causes with AI (but debugging AI-generated code yourself)

Debugging is a prime example of what shouldn't be delegated to AI. But you can leverage AI *during* the debugging process. Asking "what could cause this error?" is good. Tossing "fix this" wholesale is not. Knowing this difference is itself a DX competency.

### 9. Environment Management — From Docker to AI Tool Environments

**Classical DX:** Docker, environment variables, package managers, virtual environments
**AX-era DX:** API key management, model configuration, sandbox environments, tool permission management

Using AI tools means securely managing API keys, understanding per-model configurations, and setting up appropriate sandboxes when agents access the file system. This is a natural extension of traditional environment management.

### 10. API Design — From REST Endpoints to Tool/Function Design

**Classical DX:** REST API, GraphQL, SDK design
**AX-era DX:** function calling schemas, MCP protocol, structured output definitions

To give AI tools, you need to clearly define their interfaces. Parameter names, types, descriptions — all of these determine whether AI uses a tool correctly. People who can design APIs can design AI tools.

---

## "But When Do I Learn DX?"

Fair question. AX is moving this fast, and you're telling me to learn DX? The answer is: **learn DX while doing AX**.

### Parallel Learning Strategy

1. **Learn Git while building projects with AI** — Commit every time AI generates code, read diffs, create branches. Git is learned through repetition, not theory.

2. **Learn testing while verifying AI code** — Ask AI to "write tests for this function," but understand what those tests verify. Gradually shift to writing tests first and having AI implement.

3. **Learn systems while debugging with AI** — When errors occur, ask AI "what are possible causes?" and verify yourself. This process teaches you how the system works.

4. **Learn structure while writing CLAUDE.md** — Organizing context for AI is simultaneously the process of understanding your project.

### Developer Insight

> **The AX era paradox: to use AI well, you must be able to work without it.** If AI stops and you stop too, AI isn't a tool — it's a life support machine. A tool is something you miss when it's gone. Life support is something you die without. For people with DX foundations, AI is a tool. For those without, AI becomes life support.

---

## Past DX vs Present DX: Same Name, Different Game

One more thing worth noting: senior developers who think "I lived through the DX era, so I'm fine" should also pay attention. DX in 2020 and DX in 2026 share a name but play a different game.

| Area | 2020 DX | 2026 AX-Era DX |
|------|---------|-----------------|
| Documentation audience | Humans (colleagues, future self) | Humans + AI |
| Code review targets | Code written by colleagues | Code from colleagues + AI |
| Purpose of testing | Verify my code's correctness | Verify my code + AI output correctness |
| CLI usage | Development convenience | Essential for agent operations |
| Architecture criteria | Structures humans can maintain | Structures humans + AI can understand and modify |

**People who were good at DX before can adapt quickly.** They're not learning from scratch — they're adding an AI layer to existing competencies. But applying "the old way as-is" means missing things. Like writing documentation only for humans while ignoring AI's context window constraints.

---

## Conclusion: DX Didn't End. It Evolved.

In the AX era, DX is no longer an abstract concept called "developer experience." It's **the concrete foundational capability for effective collaboration with AI**.

Skip DX and jump to AX, and you'll hit fundamental limits no matter how sophisticated your prompts get. With solid DX foundations, you can adapt when tools change, models change, or paradigms change.

**AX is the destination. DX is the road that gets you there. You can't drive without a road.**

---

## References

- [Anthropic, 2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report) — Delegation gap, multi-agent architecture, role shifts
- [Martin Fowler, Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) — Defining and practicing context engineering
- [Nordic APIs, What Is Agent Experience (AX)?](https://nordicapis.com/what-is-agent-experience-ax/) — AX concept and its relationship to DX
- [GitHub Blog, The Developer Role is Evolving](https://github.blog/ai-and-ml/the-developer-role-is-evolving-heres-how-to-stay-ahead/) — How developer roles are changing in the AI era
- [Fortune, The Supervisor Class](https://fortune.com/2026/03/31/fortune-com-2026-03-26-ai-agents-vibe-coding-developer-skills-supervisor-class/) — How AI agents are remaking developer careers
- [Context Engineering Best Practices for AI-Powered Dev Teams](https://packmind.com/context-engineering-ai-coding/context-engineering-best-practices/) — CLAUDE.md structuring best practices

---

## Checklist: DX Self-Assessment for AX

- [ ] Can you read `git diff` and evaluate AI code changes?
- [ ] Can you write tests to verify AI-generated code?
- [ ] Can you read error messages and reason about root causes?
- [ ] Have you structured your project so AI can understand it? (CLAUDE.md, etc.)
- [ ] Can you set up and operate AI tools in the terminal?
- [ ] Can you perform core work without AI?
- [ ] Can you decompose problems into appropriate units before handing them to AI?
- [ ] Are you using CI/CD to automatically verify AI code quality?
- [ ] Can you design API/tool schemas that AI can use correctly?
- [ ] Can you explain AI-generated code to a teammate in 3 minutes?
