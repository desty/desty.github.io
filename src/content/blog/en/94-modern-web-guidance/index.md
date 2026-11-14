---
title: "Modern Web Guidance, a Web Guide for Coding Agents Maintained by Chrome, Edge, and Firefox: 209 Guides the Agent Reads Only When Needed"
summary: "Modern Web Guidance, which the Chrome team shipped as 1.0 on November 10, is a skill that makes coding agents look up current browser features and fallback rules before writing web UI. Edge and Firefox have joined the project, and it has passed 11,000 stars. Reading the code and history of its two repositories shows four parts: a roughly 200-token skill description, 209 guides the agent pulls only when needed, Baseline compatibility data regenerated twice a week, and a per-project .mwgrc file that sets the browser support target. I gave Claude Code (Opus 5.5) four tasks, three runs each with and without the skill. A delete-confirmation <dialog> came out almost the same either way. The tooltip moved from JS coordinate math to CSS anchor positioning, form errors moved to :user-invalid, and dark mode moved to light-dark(). Cost per task rose 1.3x to 2.1x. The post covers installation, where it pays off, how to write a browser support policy, and what to borrow if you ship your own team's rules the same way."
date: "2026-11-14T12:03:00+09:00"
tags:
  - agent-engineering
  - context-engineering
  - ai-coding
  - claude-code
  - ai-eval
  - open-source
  - web-platform
draft: false
---

On November 10 the Chrome team released [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) 1.0, a skill plus CLI that makes a coding agent look up guides on current web platform features and their fallbacks before writing web UI, CSS, or browser-side JavaScript. The repository was created on March 23, the project was introduced as an "early preview" at Google I/O in May, and with 1.0 Firefox and Edge joined. The line "Stewarded by the Google Chrome, Microsoft Edge, Mozilla Firefox, and MDN teams" entered the README in the 1.0 commit. The GitHub API showed 11,273 stars on November 14.

The background is simple. Models know the names `<dialog>`, the Popover API, and anchor positioning, but when they write code they often fall back to the `<div>`-plus-JavaScript patterns that dominate their training data. Browsers also ship new features faster than models are retrained. This project is a browser vendor trying to close that gap itself.

I checked three things. I read the code and commit history of the publish repository and the source repository ([modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)) to see how guides are built and how they change week to week. I ran the published CLI 1.0.0 to see how browser support policy is applied. And I gave Claude Code the same four web UI tasks three times without the skill and three times with it, then compared which APIs the generated code used. I did not test the results in a browser, so the experiment only says which APIs were used.

<!-- Author check: why this topic, and any first-hand experience of agents writing outdated web patterns -->

## Why a browser vendor ships guidance for coding agents

The README states the reason: "Coding agents often default to older patterns because LLM training data contains vast amounts of legacy code." Even when a model knows an API exists, it lacks enough real implementation patterns to write production code with it. Paul Irish of Chrome put it more bluntly in his [Show HN post](https://news.ycombinator.com/item?id=50443812) on release day: models know these features by name but "consistently won't default to using the platform-native solution and instead prefer the incumbent `<div>`+JS based pattern."

Philip Walton's [1.0 announcement](https://developer.chrome.com/blog/modern-web-guidance-v1) frames it a little differently. Code from frontier models usually works, but experts "can almost always find ways to make the code faster, more accessible, or more secure," and bad ARIA can make a page less accessible than no ARIA at all. The target, in other words, is code that works but rebuilds by hand what the browser already does.

The reception sharpens what people wanted. The Show HN post reached 442 points and 146 comments. Some replies were simply "Finally. This is exactly what I need," and others said the guides are useful for humans too. Most requests were about distribution. Simon Willison asked for a grep-able markdown index on GitHub Pages ("That way I don't have to install anything at all"), and Paul Irish said they would do it. Jeremy Howard suggested calling it llms.txt, and another commenter asked why text is being distributed through a package manager.

Cross-browser worries came up often: whether a Chrome-led guide leads back to "best viewed in [dominant browser]," and the observation that the owners group has three Chromium seats, one Firefox seat, and no Safari. Chrome's Kadir Topal [replied](https://news.ycombinator.com/item?id=50452911) that the default target is Baseline Widely available (supported across major browsers for about 2.5 years), that anything newer needs progressive enhancement or a fallback, and that this policy was worked out with Edge and Firefox. Accessibility specialist Adrian Roselli tested the May preview and [concluded](https://adrianroselli.com/2026/05/maybe-dont-rely-on-googles-modern-web-guidance.html) that its accessibility guidance falls short, noting that "there is no guarantee any guideline will be used for any given prompt." One user also reported that it costs "~$5 per use" on their codebase, while adding that the number came from Claude's usage stats and might be off.

Put together, people wanted code a web expert would write today, within their own browser support target, without a heavy install. That is why questions clustered around distribution, browser neutrality, and context cost more than guide content, and most of the project's structure answers those three questions.

## Structure: one skill, 209 guides, and a search CLI

### It started as one skill per discipline

The publish repository's history shows one big restructuring. From late April to early May there were per-discipline skills (`css`, `forms`, `performance`, `webmcp`) next to a `modern-web` search skill, and the discipline skills carried their rules in the SKILL.md body. On May 11, in v0.0.99, they were deleted and merged into a single `modern-web-guidance` skill. Today's SKILL.md is 9.8 KB, but only its description is always in context; the README lists it at about 205 tokens.

The guides live outside the skill. As of 1.0 there are 209 of them, about 1.97 MB in total. The agent never loads them all; it pulls what it needs with two commands:

```sh
npx -y modern-web-guidance@latest search "confirmation modal dialog"   # returns ids and descriptions
npx -y modern-web-guidance@latest retrieve "dialog"                    # returns one guide (dialog is 12.4 KB)
```

Search runs locally using an embedding model and BM25 bundled in the npm package. Paul Irish wrote that it started as a 500 MB native stack and was cut to a ~7 MB pure-JS package. Guides over 9.5 KB are written to a temporary file, and the agent is told to read that file in full. He described the design as a way to ship guidance "without blowing up your context window," and said they chose not to hand activation over to MCP dynamic tool search.

The skill description is assertive about when it should fire. It starts with "MANDATORY: Execute FIRST for all HTML/CSS and clientside JS tasks. Do NOT skip — web APIs evolve rapidly and training weights contain obsolete patterns," and it lists backend, CI, Vite config, and tests as cases where it should not trigger. Version 1.0 added an instruction to translate intent into UI primitives: when a user says "confirm first," search for "confirmation modal dialog."

### Each guide is four kinds of files

In the source repository, each guide is a folder. `guides/ui-components/dialog/` contains:

| File | Role |
|---|---|
| `guide.md` | The only file agents read. Front matter lists `web-feature-ids`; the body uses macros like `{{ BASELINE_STATUS("dialog-closedby") }}` |
| `demo.html` | A reference implementation of the guide |
| `expectations.md` | Testable requirements, e.g. "No `<dialog>` has `role="dialog"` or `aria-modal`" |
| `targets/daily-grind/` | A task on a real sample app (`task.md`), a Playwright grader (`grader.ts`), golden patches from Claude, Codex, and Antigravity, and an untouched baseline patch |

At build time, `BASELINE_STATUS` becomes a sentence generated from the web-features package, such as "Browser support for `<dialog closedby>`: Limited availability. Supported by: Chrome 134, Edge 134, Firefox 141. Unsupported in: Safari." In 1.0, 153 such Limited availability notes appear across the guides, each followed by a fallback. Because nobody writes compatibility text by hand, the sentences change when browsers ship.

### What changes each week

Two GitHub Actions handle updates. `update-web-features.yml` bumps web-features at 05:00 UTC on Mondays and Thursdays and comments on the PR with the guides it affects. `publish.yml` publishes to npm `@latest` and to the publish repository every Monday. Of the publish repository's 216 commits, 194 are release commits from the bot, roughly one per week since June.

Releases mix guide edits with data refreshes. In v0.0.197 on November 2, `showPopover` moved from "Newly available" to "Widely available." The October 12 release added Firefox 157 support, and the October 26 release attached ship dates to Firefox 157 and Safari 27. The guide count grew from 137 in mid-May to 194 on November 2 and 209 in 1.0; the 1.0 commit alone added 7,180 lines across 134 files.

This is why the skill calls `npx -y modern-web-guidance@latest`. Every lookup uses the newest npm version, so guides and compatibility data update without reinstalling the plugin. The command in SKILL.md carries `--skill-version 2026_11_09-5bcc021b`, so the CLI can tell when the skill file itself is stale.

### Per-agent manifests only carry names and descriptions

The nine manifests at the top level all point at the same `skills/` folder. Claude Code and Gemini CLI manifests were in the first commit on March 23, followed by Cursor (May 12), GitHub Copilot (August 3), Kimi (August 11), Grok (August 17), Codex and `.agents/plugins` (September 7), and a `plugin.json` following the agent-plugins.org schema (October 26). Most hold a name, description, and version. The Codex one adds marketplace fields such as display name, privacy policy URL, and default prompts, and the Kimi one lists both skill folders explicitly. Only the manifest format differs per agent; the skill and CLI are shared.

## How the skill and the policies are split

Despite its name, `policies/modern-web-guidance.toml` is not a content policy. It is a Gemini CLI permission rule:

```toml
[[rule]]
toolName = "run_shell_command"
commandRegex = "modern-web"
decision = "ask_user"
priority = 100
modes = ["plan"]
```

According to the [Gemini CLI docs](https://geminicli.com/docs/reference/policy-engine/), shell commands are denied by default in Plan Mode. This rule raises commands containing `modern-web` to "ask the user," so the agent can consult guides while planning. It arrived in the same release that merged the skills into one, because the skill now depended on calling a CLI. SKILL.md has the same concern: allowlist `npx -y modern-web-guidance@latest *`, never bare `npx *`.

The browser support policy lives in three places:

| Where | What | Applied by |
|---|---|---|
| SKILL.md | Default target is Baseline Widely available; newer features MUST use the guide's fallbacks | Prompt |
| The project's AGENTS.md or CLAUDE.md | Suggests documenting a "Browser Support" policy when the user targets a restricted runtime or worries about fallback size | Prompt |
| `.mwgrc` | Opt-ins for Origin Trial and "volatile" features, and the Baseline target | CLI code |

The CLI reads `.mwgrc` itself. A "volatile" feature is one that has shipped in a single engine for less than three months; the list is `features/volatile-features.json` in the source repository. Here is what I observed with CLI 1.0.0 (commands and output are in `experiments/modern-web-guidance/cli-checks.txt`):

- With no `.mwgrc`, `retrieve summarizer` (Chrome's built-in AI summarization API) prints a warning instead of the guide and exits with code 1. The warning says "Never bypass this gate (do not edit `.mwgrc` … or read raw `.md` guide files from disk)" and tells the agent to implement a standard cross-browser approach unless the user explicitly named that API.
- With `{"baseline": "newly"}` in `.mwgrc`, `retrieve dialog` prepends a note saying Newly available features meet the project target, so their fallbacks should be omitted. The `baseline` key is not in the README, but it is in `src/core/mwgrc.ts` and the 1.0.0 CLI, accepting `widely`, `newly`, `limited`, or a year like `2024`.

As with [#91 DeepSeek Super-Agent](/blog/91-deepseek-super-agent/), code and prompt share the work. The CLI decides whether to hand out a guide; the prompt carries the Widely available default and the instruction not to bypass the gate. The raw guide markdown sits on GitHub and inside the npm package, so nothing stops an agent from reading it directly. The gate's purpose is to keep still-changing APIs out of code without the user's consent, not security, which seems to be why this level of enforcement was chosen.

## Running the same tasks with and without the skill

### Setup

I built a small static to-do page (`index.html`, `style.css`, `app.js`) and wrote four tasks in English without naming any API.

| Task | Request |
|---|---|
| t1 delete confirmation | Show a centered confirmation box on Delete, with Cancel as the default |
| t2 tooltip | A tooltip on the "?" icon on hover and keyboard focus, above the icon, moving below when there is no room |
| t3 form errors | Fields show red errors on page load; only show them after interaction, with a message |
| t4 dark mode | Follow the OS by default, with a light/dark/system toggle in the header that is remembered |

I used Claude Code 2.1.325 with `claude -p`, model `claude-opus-5-5`, and `--setting-sources project,local` to exclude user settings. In the skill condition, the 1.0 SKILL.md was placed in the workspace's `.claude/skills/`, and the CLI came from npm 1.0.0 (`DISABLE_TELEMETRY=1`). Each task ran three times per condition, 24 runs in total. I counted API usage with regular expressions and did not verify that the UI behaves correctly. Scripts and full results are in `experiments/modern-web-guidance/`.

### Results

| Pattern | Without skill (of 3) | With skill (of 3) |
|---|---|---|
| t1 `<dialog>` and `showModal()` | 3 | 3 |
| t1 `autofocus` on Cancel, `returnValue` handling | 3 | 3 |
| t1 `overscroll-behavior` to stop background scroll | 0 | 2 |
| t2 JS positioning (`getBoundingClientRect`) | 3 | 1 |
| t2 Popover API + CSS anchor positioning + `position-try` | 0 | 2 |
| t2 `interestfor` (HTML attribute that opens on hover/focus) | 0 | 2 |
| t3 `:user-invalid` | 0 | 3 |
| t3 manual errors via `setCustomValidity` | 3 | 0 |
| t4 `light-dark()` | 1 | 3 |
| t4 `data-theme` attribute or class toggle | 3 | 0 |
| t4 three-way light/dark/system control (radio or select) | 0 | 3 |

t1 stands out first. Without the skill, Opus 5.5 used `<dialog>` and `showModal()` in all three runs and added no `role="dialog"`, `aria-modal`, manual focus trap, or Esc handler. The "rebuilding dialog with `<div>`s" problem that the README and Show HN post lead with was already mostly solved for this model. The skill added two lines of CSS that stop the page behind the modal from scrolling, and added JavaScript dropped from an average of 27 lines to 14. Paul Irish wrote that "some of the things we thought AI didn't know turned out to be wrong," and that evals are used to prune what models already know. t1 looks like one of those cases.

The differences showed up in recently standardized features. Without the skill, all three t2 runs computed positions with `getBoundingClientRect` and opened the tooltip with event listeners. Two of the three skill runs handed the same job to `popover`, `interestfor`, `anchor-name`, and `position-try`. t3 switched to `:user-invalid` in all three runs, and t4 moved to a theme driven by `color-scheme` and `light-dark()`. This lines up with 1.0 having dedicated guides for anchor positioning, `:user-invalid`, `light-dark()`, and dark mode toggles.

### Skill activated, guide not read

The skill activated in all 12 runs. In Vercel's January [eval](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) on Next.js tasks, "In 56% of eval cases, the skill was never invoked." All my tasks were web UI work that matched the description exactly, and the "MANDATORY" wording seems to have worked. Whether the same rate holds in mixed real work, this experiment cannot say.

In 2 of the 12 runs (one t1, one t2) the agent searched but never called `retrieve`; it read the result descriptions and went straight to implementation. That t2 run built the tooltip with JS coordinate math, just like the runs without the skill. Roselli's point that a guideline may not be used showed up here in about one run out of six.

### Polyfills loaded from a CDN

Both t2 skill runs that used the new APIs added code like this to `index.html`:

```js
if (!("interestForElement" in HTMLButtonElement.prototype)) {
  await import("https://unpkg.com/interestfor@latest");
}
if (!CSS.supports("anchor-name: --a")) {
  import("https://unpkg.com/@oddbird/css-anchor-positioning");
}
```

The guide marks `interestfor` as Limited availability (Chrome and Edge 149, June 2026) and tells the agent to feature-detect and load the polyfill only when needed, which the agent did. The guide also says to prefer bundling over a CDN, but this task had no bundler, so the agent imported unpinned `@latest` scripts from unpkg. Depending on your security policy, that should be caught in review. A guide that pushes newer features needs to be paired with a team rule on where polyfills come from.

### Korean prompts

The CLI's search does not handle non-English queries: `search "툴팁 위치"` ("tooltip position") returns an empty array, a problem tracked in source repository issue #3492. So I ran t1 twice more with a Korean prompt and the skill enabled. Both times the agent searched in English ("confirmation modal dialog") and read the `dialog` guide. Inside Claude Code a non-English prompt was fine, but a human using the CLI directly should search in English.

### Cost and time

| Task | Cost, without → with (avg) | Ratio | Seconds |
|---|---|---|---|
| t1 delete confirmation | $0.184 → $0.242 | 1.32x | 45 → 48 |
| t2 tooltip | $0.244 → $0.361 | 1.48x | 59 → 87 |
| t3 form errors | $0.240 → $0.504 | 2.10x | 52 → 93 |
| t4 dark mode | $0.251 → $0.455 | 1.81x | 62 → 103 |

Cost is Claude Code's `total_cost_usd` at list price. Most of the increase is input tokens from reading guides. In t3 every run read three guides (`validate-input-after-interaction`, `accessible-error-announcement`, `required-field-feedback`), and average input tokens including cache went from 179K to 332K. The skill description is small, but each retrieval adds tens of thousands of tokens per task. These are single tasks on a tiny page; touching several features in a large codebase could widen the gap.

### Limits of this experiment

Four tasks, three runs per condition, one model. I counted API usage with regexes and did not grade behavior or accessibility in a browser. Chrome's eval grades 215 tasks and about 1,800 assertions with Playwright and reports, for November 8 in the README, Claude Code (Opus 5.5) going from 57% to 88%, Codex (GPT-6.1 Sol) from 54% to 82%, and Antigravity (Gemini 4 Argon) from 58% to 94%. Because the guide authors also write `expectations.md`, those numbers largely measure how often agents follow the approach the guides prescribe. My experiment shares that limit. Whether an anchor-positioned tooltip serves real users better than JS positioning depends on your browser mix and the cost of polyfills.

## Installing and applying it

### Installation

In Claude Code, install from the plugin marketplace:

```sh
/plugin marketplace add GoogleChrome/modern-web-guidance
/plugin install modern-web-guidance@googlechrome
```

Issue #3533 (November 12) reports that Claude Code's built-in plugin directory serves v0.0.194, so users see an update warning they cannot act on; the docs recommend installing from the GitHub marketplace as above. For Codex, use `codex plugin marketplace add GoogleChrome/modern-web-guidance`; to install into several agents at once, use `npx modern-web-guidance@latest install`.

After installing, check three things:

- **Telemetry.** The CLI sends install counts, the calling agent's name, retrieved guide ids, and agent-generated search queries to Google; the README says raw prompts are not collected. To opt out, add `export DISABLE_TELEMETRY=1` to your shell profile. Paul Irish prefixed every example command in his Show HN post with it.
- **Permission allowlist.** Allow only `npx -y modern-web-guidance@latest *`. Allowing bare `npx *` lets the agent run any package.
- **Network.** Each call fetches the newest version from npm. In sandboxes with blocked network, allow it before the first call or use `npx --offline`.

### Where it fits

It pays off most in projects that frequently build or change web UI, in any framework, for users on modern browsers. As the experiment shows, the gains come in features standardized in the last two or three years, such as tooltips, form validation, and theming. For an existing codebase, `legacy-scan` finds outdated patterns, but its rules cover only about 20% of the guides, and issue #3596 reports that 1.0.0 silently stops at 5,000 files: on a ~64,000-file monorepo it found 5 issues, and 47 once the cap was lifted.

Where it adds burden:

- **Projects with older browser targets.** For internal enterprise apps on older browsers, even the default (Widely available plus fallbacks) may not fit. Write your target in AGENTS.md, and if needed set a year in `.mwgrc`'s `baseline`.
- **Projects that must not load third-party scripts.** As shown above, code importing CDN `@latest` scripts can appear. Add a rule such as "Install polyfills from npm and bundle them; never load from a CDN."
- **Tight token budgets.** A single web UI task cost 1.3x to 2.1x as much. The description is written not to fire on non-web work, but a team doing a lot of web work will see the difference on its monthly bill.

Building on SKILL.md's own example, a browser policy in AGENTS.md could look like this:

```md
## Browser Support
- Target: Baseline Widely available, plus Safari 17.4+ on iOS.
- Newly available features are allowed only with feature detection and graceful degradation.
- Fallback code must add 20 lines or less and no new runtime dependencies.
- Install polyfills from npm and bundle them. Never load scripts from a CDN.
```

### Measuring the effect

To decide whether to adopt it, measure on your own project. Pick about five recent web UI tasks and run each with the same prompt once without the skill and once with it. Then look at three things:

1. Did code that a reviewer would flag as "the browser can do this" decrease? Count API usage with regexes as in the experiment's `analyze.py`, or grep for the patterns your team usually fixes.
2. Does it work in your supported browsers? Code using newer features needs separate checks that fallbacks behave in Safari and Firefox. That is why Chrome's harness uses Playwright graders.
3. How much did cost and time per task rise? Compare `total_cost_usd` and usage from Claude Code's `--output-format stream-json` output.

If item 1 does not improve while item 3 rises, your current model already knows that area. In that case, a few lines in AGENTS.md about the mistakes it does make will serve you better than the skill.

## Shipping your team's rules the same way

The project is also a useful reference for teams that want to ship internal coding rules, design system usage, or internal API guides to agents. Worth borrowing:

**Separate what is always read from what is read on demand.** Only a short description of when to activate stays in context; bodies are retrieved by id. If your rules are few and apply to nearly every task, putting them directly in AGENTS.md works better, as in Vercel's eval, where a docs index compressed to 8 KB in AGENTS.md reached 100% while a skill reached 53% (79% with explicit instructions). At 2 MB of guides, as here, AGENTS.md is not an option. Choose by the volume of rules and how often they apply. Where each kind of rule belongs was covered in [#77](/blog/77-i-have-adhd-skill/), and how agents read AGENTS.md in [#66](/blog/66-agents-md-claude-code/).

**Generate changing facts from data.** Just as browser support text comes from web-features rather than guide authors, fill fast-changing values in internal rules, such as supported versions, deprecation dates, and endpoint lists, from source data at build time. Weekly updates then do not depend on someone editing prose.

**Write a grader with each guide.** Write `expectations.md` and a Playwright grader alongside the guide, confirm the grader passes 100% on golden solutions and 0% on the untouched app, then measure the pass-rate gap between runs with and without the guide. Items that pass without the guide are candidates for removal; the source repository has an open issue (#3234) on removing guides whose with/without gap is small. Running the same comparison with Claude Code's plugin eval is covered in [#65](/blog/65-claude-plugin-eval/), and why evals outlast model changes in [#44](/blog/44-surviving-model-churn/).

**Take per-project policy from a config file and apply it in code.** When a CLI reads a config file at the project root, like `.mwgrc`, and filters guides or prepends notes, several teams can use the same guides with different targets. That is more reliable than reminding the agent "we support Safari 16" in every prompt.

**Separate the authoring repository from the publish repository.** The source repository holds graders, golden patches, and eval results that agents never need. Keep only skills, guides, and manifests in the publish repository and let a bot release on a schedule. Point every agent manifest at one skill folder so supporting another agent means adding one file.

**Write down who maintains it.** The source repository's `GOVERNANCE.md` reserves authoring new guidance for vetted experts (Peers) and has area leads (Content ATLs) review and merge, "because guidance is directly ingested by AI coding assistants." If agents follow your internal rules verbatim, decide who can change them and who approves.

## Summary

Modern Web Guidance does not try to put all web knowledge into the agent. Only a roughly 200-token skill description is always read; the 209 guides are pulled through search and retrieve when needed. Compatibility text is generated from web-features data and refreshed twice a week, and the per-project browser target and experimental-feature opt-ins are read from `.mwgrc` by the CLI. Which guides stay is decided by evals comparing runs with and without them.

In my experiment (four tasks, three runs per condition, Opus 5.5), the `<dialog>` confirmation came out nearly the same without the skill. For recent features, such as anchor-positioned tooltips, `:user-invalid`, and `light-dark()`, the generated code changed, and cost per task rose 1.3x to 2.1x. Even with the skill on, 2 of 12 runs did not read a guide, and one pattern loaded polyfills from CDN `@latest`. If you adopt it, write your browser target and dependency rules in AGENTS.md, and compare runs with and without it on your own tasks first.

Sources for this post are the code and commit history of both repositories (publish repository at `4dd9683`, November 10), output from the npm CLI 1.0.0, the official announcements, Hacker News and GitHub issues, and my own experiment. The experiment did not grade browser behavior or accessibility, and I did not reproduce Chrome's eval numbers.

- Repositories: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), [modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)
- Announcements: [Modern Web Guidance 1.0 (Chrome for Developers)](https://developer.chrome.com/blog/modern-web-guidance-v1), [Show HN](https://news.ycombinator.com/item?id=50443812)
- Comparison: [Vercel, AGENTS.md outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- Related posts: [#91 DeepSeek Super-Agent](/blog/91-deepseek-super-agent/), [#77 i-have-adhd](/blog/77-i-have-adhd-skill/), [#66 AGENTS.md and Claude Code](/blog/66-agents-md-claude-code/), [#65 Claude Code plugin eval](/blog/65-claude-plugin-eval/), [#44 What survives model changes](/blog/44-surviving-model-churn/)
