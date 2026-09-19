---
title: "Claude Code reads AGENTS.md after 13 months — but a CLAUDE.md still wins"
summary: "Claude Code 2.1.277 reads AGENTS.md directly. The default still prefers CLAUDE.md, and because the feature ships as a built-in plugin it never appears in /memory, skips InstructionsLoaded hooks, and is absent on Bedrock. Three headless tests of the loading rules, then a per-team split of what belongs in which file."
date: "2026-09-19T11:00:00+09:00"
tags:
  - claude-code
  - agent-engineering
  - context-engineering
  - agents-md
draft: false
---

A repository that hosts more than one coding agent ends up with more than one instruction file. Codex, Copilot, and Cursor read `AGENTS.md`; Claude Code read `CLAUDE.md`. The build commands, the test rules, and the directory tour are the same text in both, so editing one leaves the other stale.

On 18 September 2026, Anthropic shipped [Claude Code 2.1.277](https://github.com/anthropics/claude-code/releases/tag/v2.1.277), which reads `AGENTS.md` directly. The request, issue [#6235](https://github.com/anthropics/claude-code/issues/6235), was opened on 21 August 2025 and collected 5,169 upvotes and 400 comments before it closed 13 months later. `AGENTS.md` came out of OpenAI in August 2025, and Copilot, Cursor, Jules, Amp, Windsurf, and Zed adopted it while Claude Code stayed out. The standard itself was never the disagreement: Anthropic was a founding member of the [Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) in December 2025 and donated MCP to it, in the same round where OpenAI donated `AGENTS.md`. Both were at the table. Only the reading was postponed.

So the immediate question is whether you can delete `CLAUDE.md` now. I read the [official docs](https://code.claude.com/docs/en/memory) and checked three loading rules myself on 2.1.277 on macOS, using headless sessions (`claude -p`). The results below come from one machine, and none of them measure quality or performance.

## When it reads the file

One rule covers the default: Claude reads `AGENTS.md` **only when there is no `CLAUDE.md` in your working directory or above it**.

| Files in your repository | What Claude reads |
|---|---|
| `AGENTS.md` only | `AGENTS.md` |
| `AGENTS.md` and `CLAUDE.md` | `CLAUDE.md` only |
| `CLAUDE.md` that imports `@AGENTS.md` | `CLAUDE.md`, with the import included |

Three files count for that check: `CLAUDE.md`, `.claude/CLAUDE.md`, and `CLAUDE.local.md`. Your personal `~/.claude/CLAUDE.md`, your organization's managed `CLAUDE.md`, and `.claude/rules/` files do not count and keep loading alongside `AGENTS.md`.

I checked the behavior in three empty directories. The first held only an `AGENTS.md` saying the build command for the project is `zzq-build --verify`.

```bash
claude -p "What is the build command for this project? Do not use any tools."
# run 1: I don't know — I'd need to read AGENTS.md or the build config
# run 2: The secret build command is `zzq-build --verify`, according to `AGENTS.md`.
```

The first run is documented behavior, not a bug. In the first session after you install or upgrade, Claude does not read `AGENTS.md`; it does from the next session on. Test it once on upgrade day and you will conclude, wrongly, that the feature isn't there.

The second directory held only a `CLAUDE.md`, which answered on the first run. The third held both files with conflicting values.

```bash
# AGENTS.md → agents-build,  CLAUDE.md → claude-build
claude -p "What is the build command? Do not use any tools."
# → The secret build command is `claude-build`.
```

Only `CLAUDE.md` was read. Switching the setting to `claude-md-and-agents-md` in the same directory changes the outcome.

```bash
claude -p --settings '{"pluginConfigs":{"agents-md@builtin":
  {"options":{"instructionFiles":"claude-md-and-agents-md"}}}}' \
  "List every build command in your project instructions."
# → 1. claude-build, from CLAUDE.md
#    2. agents-build, from AGENTS.md
#    The two files contradict each other. Tell me which one to use.
```

In the both-files mode, a disagreement between the two stops the turn and asks. During a migration where both are switched on, duplicated text is harmless but any drift interrupts every session.

## Where the two files actually differ

The format is the same markdown. The difference is in how Claude Code handles the file.

| | `CLAUDE.md` | `AGENTS.md` read through the setting |
|---|---|---|
| Memory files list in `/memory` and `/context` | Listed | Not listed |
| `InstructionsLoaded` hooks | Fire | Don't fire |
| Private per-developer file | `CLAUDE.local.md` | None. `AGENTS.local.md` is not read |
| Directories added with `--add-dir` | Their file loads | Doesn't load |
| `@path` import of a file outside the working directory | Prompts for approval | Loads with no prompt, only where external imports were already approved |
| Path-scoped rules | `.claude/rules/` | No equivalent, though `.claude/rules/` still loads |
| Providers | Everywhere | Not on Bedrock, Vertex, or Foundry |

A `.agents/` directory and an `AGENTS.override.md` are not read either. What was adopted is one file at the repository root.

Those differences cluster because of where the feature lives. It is not part of the memory loader; it ships as a built-in plugin called `agents-md@builtin` that runs on the hook system. So the whole feature disappears, and **Project instructions** vanishes from `/config`, in these cases:

- versions before 2.1.277
- sessions that don't fetch feature flags, such as Bedrock and other third-party providers, or with telemetry disabled
- the first session after an install or upgrade
- `disableAllHooks` or `allowManagedHooksOnly` set, or the `agents-md` plugin disabled in `/plugin`

One more constraint matters for teams. The `claude-md-and-agents-md` value is only honored in `~/.claude/settings.json`, a `--settings` file, or managed settings. A project's own `settings.json` is ignored for it. A repository cannot tell its contributors "we use `AGENTS.md` here"; that choice stays with each user's settings or the organization's policy.

## What belongs in which file

Those constraints produce a straightforward split.

| Situation | Setup | Why |
|---|---|---|
| Claude Code is the only agent | Keep `CLAUDE.md` | Moving gains nothing and loses the `/memory` listing, `InstructionsLoaded` hooks, and `CLAUDE.local.md` |
| Several agents, effectively the same instructions | Keep `AGENTS.md`, delete `CLAUDE.md` | One file. Personal instructions move to `~/.claude/CLAUDE.md` |
| Shared rules plus Claude-specific directions | `CLAUDE.md` with `@AGENTS.md` and a Claude section below it | Widest compatibility: works on Bedrock, with hooks disabled, and on older versions |
| Bedrock, Vertex, Foundry, or telemetry disabled | The import is required | Direct reading does not work at all |
| Monorepo | An `AGENTS.md` at the root and in subdirectories | A subdirectory's file loads when Claude opens a file there with Read |

The third row is the sensible default for most teams, and the `CLAUDE.md` can be three lines.

```markdown
@AGENTS.md

## Claude Code

Use plan mode for changes under `src/billing/`.
```

Leaving the import in place never reads the content twice; under any **Project instructions** value, an `AGENTS.md` that was already loaded is skipped. A symlink (`ln -s AGENTS.md CLAUDE.md`) achieves the same thing, but the Edit and Write tools refuse to write through a symlink, and a Windows clone turns the committed link into a one-line text file, so the import is the safer choice.

Split the content by tool neutrality. Build and test commands, directory structure, coding conventions, and PR rules read the same to any agent, so they go in `AGENTS.md`. Plan mode, skill and subagent invocation rules, hooks, and permission guidance are Claude Code concepts and stay in `CLAUDE.md`. Rules that depend on file type or path belong in `.claude/rules/`, which has no `AGENTS.md` equivalent and keeps loading alongside it, so the combination doesn't conflict.

Clean up the old workarounds while you migrate. A `CLAUDE.md` that tells Claude in prose to read `AGENTS.md` only works if Claude decides to open the file; replace the sentence with an `@AGENTS.md` import or delete the file. Remove any `SessionStart` hook that printed `AGENTS.md`, or the same text lands in the context twice.

One trap deserves its own line. `CLAUDE.local.md` counts for the check, so adding one for your private notes in a repository standardized on `AGENTS.md` silently stops `AGENTS.md` from loading for you. If you need both, switch **Project instructions** to `claude-md-and-agents-md` and keep the two files in agreement, for the reason the third test showed.

## Confirming it loaded

`AGENTS.md` appears neither in `/memory` nor in the memory files list in `/context`. Two checks work instead: watch for a line such as `no CLAUDE.md found; AGENTS.md loaded: /path/AGENTS.md` at the start of an interactive session, or ask the agent what its project instructions say. This blog's repository is in exactly that state — an `AGENTS.md` at the root and no `CLAUDE.md`.

Loaded is not the same as followed. The docs are explicit that these files are context, not enforced configuration, and point to a `PreToolUse` hook for anything that must be blocked regardless. That matches the principle from [harness engineering](/en/blog/35-harness-engineering/): a rule written in a guide needs a sensor that enforces it, and unifying the name of the guide file is a separate job from that enforcement.

## What this amounts to

The adopted scope is narrow and specific. The file name follows the standard; precedence, implementation site, and control over the setting did not move. A `CLAUDE.md` still wins, the feature is a built-in plugin you can switch off, and a repository cannot decide which file its contributors load. For an organization on Bedrock, nothing changed yesterday.

It is still a usable change for most teams. In a repository with several agents, putting the shared rules in `AGENTS.md` and leaving `CLAUDE.md` as an import plus Claude-specific directions is the safe default today. After the move, verify the load once in a session that isn't the first after an upgrade, and once more on Bedrock if anyone on the team works there.
