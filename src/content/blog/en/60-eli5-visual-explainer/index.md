---
title: "Anthropic's ELI5 Skill: Understand the Code in Pictures Before Changing It"
summary: "Claude Code's Thariq Shihipar shared ELI5, a skill he says people at Anthropic have been using frequently. Add a subject after /eli5 and the agent reads the relevant context, then creates an HTML explainer with big pictures and few words. What is public is closer to a compact working pattern than a released plugin. This article examines the review step that pattern adds to code comprehension, design review, and incident analysis."
date: "2026-08-23T18:00:00"
tags:
  - claude-code
  - agent-skills
  - agent-engineering
  - ai-coding
  - html
draft: false
---

On August 21, Claude Code team member Thariq Shihipar [posted a short description of a skill](https://x.com/trq212/status/2090884854590382515) that people at Anthropic have recently been using. It was called `ELI5`, and both its interface and instruction fit on one line.

```text
/eli5 <what you want explained>

Explain it for someone who knows nothing about the topic,
using an HTML artifact with big pictures and few words.
```

The attached video shows a document titled "How does the Discord bot work?" A website, bot, database, and Discord appear as boxes connected by directional arrows. The next sections show a game manager creating an event, an administrator approving it, and the bot posting a card in the appropriate channel. Instead of narrating implementation in source order, the artifact redraws it as a sequence of actions among people and systems.

That is the extent of the public release. I could not find an official Anthropic ELI5 plugin or the original internal `SKILL.md`. The public ELI5 is therefore best understood as **an internal working pattern that packages a repeatable prompt behind a slash command**, not as a finished product release. Yet the tiny pattern identifies a useful problem in agentic coding: how a person reviews what an agent believes before the agent begins implementation.

## A Compressed Version of the HTML Workflow

ELI5 did not appear in isolation. In May, Thariq published [The unreasonable effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html), describing how the Claude Code team uses HTML where it previously might have produced Markdown.

Markdown is easy for an agent to write but has a limited visual vocabulary. A long plan or explanation becomes a vertical sequence of headings, paragraphs, and lists. The reader must reconstruct modules and data flows mentally while reading. HTML can divide the same information across tables, color, position, SVG illustrations, tabs, and click interactions. It can adapt to different screen sizes, open directly in a browser, and travel as a link or a single file.

Why Claude Code creates the HTML matters too. A general chat model explains the context pasted into a conversation. A coding agent can first inspect repository files, configuration, Git history, and connected work systems. The workflow turns evidence gathered from the working environment into a document optimized for a human reader.

Anthropic's public [html-effectiveness repository](https://github.com/anthropics/html-effectiveness) contains twenty examples: module maps, annotated pull-request diffs, implementation plans, incident timelines, feature explainers, and even an interactive consistent-hashing demonstration. ELI5 retains only the constraints needed for one portion of that gallery. **Assume no prior knowledge, prefer pictures to prose, and deliver one HTML document.**

"One page" does not mean one viewport. The artifact in the demonstration scrolls vertically. It means one HTML file that opens in a browser without a separate build process. The unit of delivery is singular even when the explanation needs several sections.

## Reviewing Understanding Before Implementation

A coding-agent task often moves directly from a request to implementation.

```text
request → inspect code → plan → implement → review the diff
```

Much of the inspection and planning remains inside the agent's conversational history. Even when the plan is written as a long Markdown document, a person is unlikely to reconstruct and verify every call relationship and failure path. If the mismatch in understanding becomes visible only during diff review, correcting it can require changing the implementation rather than the plan.

ELI5 inserts a visual review between inspection and implementation.

```text
request → inspect code → explain the structure in HTML
        → human corrects it → implement
```

The artifact serves two roles: an introduction for someone unfamiliar with the system and an inspection surface for the agent's current model of it. A missing box or a backward arrow is easier to spot than a subtly incorrect sentence in a long plan. The reviewer can say, "payment failures do not pass through this queue" or "that approval is automated, not performed by an administrator." The agent can then implement against the corrected map.

Despite its name, the practical value of ELI5 is not childish language. It is **checking whether the person and the agent are looking at the same system before code changes begin.**

## Code Comprehension, Design Review, and Incidents

The simplest application is learning an unfamiliar module.

```text
/eli5 how a session is created after a user logs in to this repository
```

The agent can find the entry point, authentication handler, session store, and error paths, then arrange them as one flow. The reader gets the relationships first and descends into source only where detail is needed.

For design review, alternatives and consequences can sit beside the current structure.

```text
/eli5 why this service chose SQS instead of implementing its own work queue,
including the alternatives
```

Showing the present architecture, the chosen mechanism, alternatives, and failure paths on one page exposes assumptions that can disappear inside a design document's conclusion. But "why" is rarely provable from code alone. The agent must also inspect architecture decision records, issues, pull requests, or meeting notes that contain the decision.

Incident analysis benefits from separating time from propagation.

```text
/eli5 where this incident began, which components it affected,
and the order in which service was restored
```

Logs and deployment history can form a timeline, while a separate diagram shows how the failure spread. This reduces the chance of confusing the first observed event with the causal event. Leaving unverified intervals visibly unresolved also turns the artifact into a list of follow-up investigations.

The same pattern applies to pull-request review. A before-and-after data flow, new branches, and rollback paths can lead reviewers to the relevant portions of the actual diff. Thariq's public HTML gallery includes annotated diffs and module maps as separate examples of this workflow.

## A Convincing Picture Is Not Evidence

ELI5's advantage creates its largest risk. Neat boxes and arrows make an explanation feel settled. The factual accuracy of the picture, however, depends on what the agent inspected. It can invent a call relationship or present an inferred design motive as a documented decision.

As discussed in my earlier [analysis of Archify](/en/blog/52-archify-skill-product/), visual artifacts need two kinds of validation. Confirming that lines do not overlap and that the HTML renders correctly is structural and rendering validation. Confirming that the diagram matches the code is semantic validation. The one-line ELI5 instruction that has been made public specifies neither.

An internal version of the pattern should add at least these conditions:

- Inspect the relevant code, configuration, documentation, and Git history before explaining.
- Attach file paths or function and class names to repository-specific claims.
- Distinguish facts observed in code, interpretations supported by records, and unresolved questions.
- Label incident causes and design intent as inference when direct evidence is missing.
- Open the HTML in a real browser and inspect clipping, overlaps, and unreadably small text.

Even with those conditions, an HTML explainer does not replace a security review or a root-cause report. It is an initial map of where to investigate. Important conclusions must still be checked against source, logs, and change history.

## Why One Prompt Becomes a Skill

According to the [Claude Code Skills documentation](https://code.claude.com/docs/en/slash-commands), a `SKILL.md` stored under `.claude/skills/<name>/` makes the directory name available as a slash command. A personal skill works across projects; a repository skill can be shared with a team. A skill does not need to be a large extension. It can begin as a named copy of instructions people repeatedly paste into conversations.

ELI5 demonstrates that minimum well. It adds no model and no dedicated renderer. It packages four constraints—an audience without prior knowledge, HTML, large pictures, and little text—behind a reusable command. The model generates a different document for each repository and question.

Its brevity also leaves obvious policy decisions to the team. Output location, citations to evidence, external dependencies, browser inspection, and failure reporting are unspecified. Rather than copying the public sentence verbatim, teams should add the inspection and validation rules already used in their code-review process.

## Assessment

Treating ELI5 only as a prompt for simpler language misses most of its useful range. The demonstration shows a way to make an agent's code explanation reviewable. The agent inspects a repository and draws the components and relationships it believes are present; a person checks that interpretation before implementation begins.

What is public is a short internal usage pattern and demonstration, not an official Anthropic plugin package. Even so, it can be applied immediately to tasks that require a shared overview before detail: understanding code, reviewing design, and investigating incidents. As models take on more implementation, reading every file from the beginning becomes less practical for the reviewer. The useful optimization is not to remove review, but to reduce the reconstruction required before review can start.

An HTML explainer does not replace the code. It identifies where and from which perspective the code should be read. The extra step introduced by ELI5 is not time spent decorating an answer. It is time spent catching a mistaken model of the system before that mistake turns into an implementation.

---

*Sources: [Thariq Shihipar's ELI5 post](https://x.com/trq212/status/2090884854590382515) and attached video (August 21, 2026), [Using Claude Code: The unreasonable effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html), the [HTML effectiveness gallery](https://thariqs.github.io/html-effectiveness/), [anthropics/html-effectiveness](https://github.com/anthropics/html-effectiveness), and the [Claude Code Skills documentation](https://code.claude.com/docs/en/slash-commands), retrieved August 23, 2026. The description of internal use is based on Thariq's public statement. I found neither independent internal adoption data nor an official Anthropic ELI5 skill package.*
