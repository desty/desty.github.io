---
title: "i-have-adhd, the Skill That Makes Coding Agents Stop Burying the Answer — What 50,000 Stars Wanted Was the Conclusion on Line One"
summary: "i-have-adhd, a skill that keeps coding agents from burying the answer under explanation, hit the Hacker News front page in September and picked up about 20,000 stars in two weeks, passing 50,000. The skill itself is a 142-line SKILL.md whose core rule is: put the next action or the result on the first line. The repo's history and issues show the rules evolving mostly into exceptions, and the author's only measurement found gains concentrated in progress and error reports, while the 'state cause and fix' rule produced unfounded diagnoses. Anthropic answered the same complaint with Claude Code's Concise output style and a change to Opus 5.5's response structure. This post sorts each rule into where it belongs (skill, output style, harness, or UI) and lays out how to measure the effect."
date: "2026-09-24T20:00:00+09:00"
tags:
  - claude-code
  - prompt-engineering
  - agent-engineering
  - open-source
draft: false
---

The GitHub repo `ayghri/i-have-adhd` describes itself as "a skill to stop your coding agent from burying the answer." It was created in May and briefly hit #1 on GitHub Trending in mid-July. It took off again after reaching the Hacker News front page on September 8, where the thread got 542 points and 371 comments. Stars went from about 31,000 on September 9 to 50,730 on September 24.

The content is simple: put what the reader should do on the first line, number multi-step work, drop preambles, recaps, and closers. When rules this simple draw this much attention, they say something about what people were frustrated with. Whether the rules actually work, and where they need to live to work, is a separate question.

This post draws on the repo's code, commit history, and issues, the Hacker News comments, and Anthropic's official docs. I didn't install and measure the skill myself; effect numbers come from the author's measurement and an outside one.

---

## What the 142-line skill does

The repo has 72 files and about 13,000 lines. The skill itself is `skills/i-have-adhd/SKILL.md`, 142 lines, about 1,700 tokens. More than half of the rest is install docs and translations into 10 languages, followed by evaluation scripts and tests. The author said as much on Hacker News: "Repository is mostly evals and benchmark code + translations."

SKILL.md starts from five premises about a reader with ADHD: working memory is small, so anything not on screen is forgotten; knowing the answer is not doing it; starting is the hardest step; time estimates feel uniform; visible progress matters. Ten rules follow.

1. Lead with the next action. Not context, not a plan: something the reader can do.
2. Number multi-step tasks, one bounded action per step.
3. End with one concrete next action doable in under two minutes.
4. Suppress tangents.
5. Restate state every turn; use the harness's task or plan tool if there is one.
6. Give specific time estimates.
7. Make completed work visible.
8. Report errors matter-of-factly, as cause then fix.
9. Cap lists at about five items per group.
10. No preamble, no recap, no closing pleasantries; no "Let me..." or "I'll..." openers.

On top of that come six cases where the rules may be broken and a pre-send check. The check's final question: if the reader reads only the first and last lines, do they know what to do next and what just happened?

---

## When the stars came

The star growth lines up with the Claude Opus 5 launch. Opus 5 shipped on July 24, and Anthropic's own docs say "Claude Opus 5's default user-facing responses run longer than prior Opus models'." Much of the September 8 Hacker News thread was about Opus 5's writing rather than the skill. One commenter said their most-used follow-ups with Opus 5 were "one thing at a time" and "too much text." Another said they had the skill installed "and it did not help much."

The alternatives in the comments pointed the same way. One person puts a single line in CLAUDE.md asking for a TLDR at the end of each summary covering what was found, what's recommended, and what's needed from them. Another says "be concise" is enough; someone replies that it's less consistent and that giving a reason helps. What people wanted was largely the same thing: **the answer or result on the first line.** The 50,000 stars are best read as a sign of how widespread that wish was.

Reactions to the name were split, including among people with diagnosed ADHD, some finding it useful and some offensive. This post focuses on whether the rules work.

---

## The rules turned mostly into exceptions

The commit history shows exceptions and precedence clauses growing faster than the ten rules themselves.

**From always-on to invoke-only.** The first version in May had a description telling the model to use it on every message. On July 21 the author switched to `disable-model-invocation: true`, so it only turns on with `/i-have-adhd`. To keep it always on in Claude Code now, you create a flag file so a SessionStart hook injects SKILL.md. For Codex or Copilot, always-on means pasting a 10-line summary into a config file. The same skill runs as a different rule set depending on the runtime.

**Conflicts with the harness.** Issue #43, filed July 22, pointed out that rule 10 bans "Let me..." and "I'll..." openers while Claude Code's system prompt asks the model to say in one sentence what it's about to do before its first tool call. When they conflict, the model alternates between them turn by turn. The author added a clause saying the system prompt outranks the skill inside an agent harness.

**The five-item cap.** In issue #96, a user reported that the cap dropped relevant findings. Rule 9 was rewritten three times. It now says the rule "shapes presentation only; it must not limit analysis, search, tool results," and that extra items should be retained until requested. But the model has nowhere outside the conversation to retain anything. The same user wrote that sometimes they didn't even learn there were more.

**Side effects of the error rule.** Rule 8 says to report errors as cause, then fix. In the author's evaluation this pushed the model to assert causes without evidence. It's filed as issue #99 and still open; more on it below.

The author wrote in an issue that "structure alone wasn't enough" and that additions kept landing in the pre-send check. The history shows that putting tone rules into one skill keeps creating friction with other rules, other instructions, and the task itself.

---

## What the author's measurement shows

The author ran one evaluation on August 2: Claude Opus 4.8, 14 cases, 3 trials each, with and without the skill, blind-judged by a model from the same family. The weighted score went from 4.05 to 4.47.

The gains weren't spread evenly. Multi-step progress reports gained +2.53 and error reports +2.40. Cases asking for code or long-form writing didn't change; where the output format was already fixed, the skill had nothing to do.

There was one regression: -0.63 on a case reporting partial success. The judge's note says the model "asserts 'missing auth header' as the definitive cause and prescribes a specific fix without any evidence." The results file itself attributes this to rule 8 pressuring the model to name a cause even when the evidence doesn't identify one.

The evaluation has clear limits. It ran with tools turned off, so it measured single replies, not agent work. It failed the author's own release gate (zero blockers). Output tokens weren't recorded. The author has said, "Reducing token usage is not a target."

There is one outside measurement of a similar skill. caveman (about 107,000 stars), which makes the agent talk in clipped fragments, claims to cut output tokens by 65%. JetBrains measured it on 86 real agent tasks and got -8.5%, with no quality difference, explaining that "only the narration between tool calls gets compressed, and there is not much of it." In agent work most tokens go to tool calls, tool results, and code, which limits how much tone rules can save.

---

## How Anthropic answered the same complaint

Anthropic's docs and products already contain mechanisms pointed the same way as this skill. They just don't live in a skill.

**The Opus 5 prompting guide.** It says "the effort parameter controls how much the model thinks rather than how much it says," and that to control response length you should prompt for it explicitly. It calls a short conciseness instruction effective and gives an example. For agentic work it recommends one sentence: when you finish, lead with the outcome; your first sentence should answer what happened or what you found. That's nearly rule 1. It also advises that positive examples of the desired style work better than instructions about what not to do, which is the opposite of rule 10's ban list.

**Claude Code's Concise output style.** The docs describe it this way: the first sentence states what happened or what the answer is; Claude leaves out the lead-in, the step-by-step narration, and the closing recap; the engineering work stays as thorough as in the default style. And **error reports, failing test output, security warnings, and confirmations for destructive actions keep their complete content.** An output style is sent with every request, unlike a skill injected once at session start or on invocation. The same docs' feature table says a voice, length, or format for every response belongs in an output style, instructions for one kind of task belong in a skill, and something that must happen every time without exception belongs in a hook. By that standard, i-have-adhd's use case is an output style. Hacker News commenters and issue #187 made the same point.

**Opus 5.5's response structure.** For Opus 5.5, released September 22, Anthropic said it "puts the most important information up front" and "is less likely to use jargon or idiosyncratic phrases, and follows the writing rules you give it." Customer Box said Opus 5.5 "used a third of the tokens Opus 5 did, and its answers were 40% less verbose without losing accuracy"; that's a customer quote. There's a structural change too. As covered in [#75](/blog/75-opus-5-5-gpt-6-sol/), Opus 5.5 returns the short notes between tool calls as progress-update thinking blocks rather than regular text, and under the default setting they come back empty. The "Let me..." sentences rule 10 targets have moved to a different slot at the API level.

There's one conflict. In its example prompt for unattended agent runs, Anthropic's Opus 5.5 guide bans turns that end by announcing the next step with no tool call, and turns that end by offering to carry on. Those overlap with endings the skill's examples recommend ("Next: run `npm test`", "Want me to handle that next?"). Anthropic tells you to leave that instruction out of human-in-the-loop applications, so the conflict only matters for unattended runs.

---

## Where each rule belongs

Sorted by function, most of the skill's rules have a better home than a skill. This is my proposal.

| Rule | Better home | Why |
|---|---|---|
| Result or next action on line one | Output style, system prompt | It applies to every response, and it holds better where it's sent every request. The official docs have a one-sentence version |
| No preamble or closers | Output style, model | The Concise style already does this, and Opus 5.5 moves between-tool narration into thinking blocks |
| Numbered steps, restated progress | The harness's task-list tool | The skill itself says to use a task tool if one exists. When a tool holds the state, the model doesn't have to remember it |
| List-length caps | UI | Collapsing long lists is the screen's job. Capping in the model drops items (#96) |
| Errors as cause and fix | Remove or make conditional | Only state a cause when it's been confirmed (#99). The Concise style keeps error reports in full |
| Verification evidence in completion reports | Hook, harness check | A "no recap" rule can delete which commands ran and what passed. Check for evidence with a stop hook instead of trusting the model |
| Report formats for specific tasks | Skill (invoked) | A format like "step 3 of 5 done" for a long migration is task-specific, which is what skills are for. It's also where the author's evaluation found gains |

In short, what's worth keeping as a skill is roughly the task-specific report formats. Output styles, the harness, and the UI handle the rest more reliably.

---

## How to measure the effect

Measuring tone rules only by "shorter" misses what matters. Here's a proposed comparison; I haven't run it.

**Use three conditions:** no instruction, the official one-line conciseness instruction, and the full i-have-adhd skill, plus Claude Code's Concise style if you can. Comparing only "skill vs nothing," as the author's evaluation did, credits the skill with effects a one-line instruction would also get.

**Measure on real tasks with tools on.** The author's evaluation used single replies without tools. Pick 10 to 20 tasks from your own repo (bug fixes, refactors, investigations) and run them as real agent work.

**Metrics:**

- Visible output tokens in the final message
- Total output tokens including thinking; the two can move in opposite directions
- Input tokens the skill adds per turn (about 1,700) and whether they hit the cache
- Whether the first line contains an actionable step or result
- Task success rate
- Whether completion reports include the commands run and their results; count how often verification evidence is missing
- How often a cause is asserted without evidence, to catch rule 8's regression

**Look at long sessions separately.** Both the author and Hacker News commenters said the model forgets the rules as the conversation grows. Count rule adherence at turn 1, turn 10, and after context compaction. That's where the difference between an output style (sent every request) and a skill (injected once) should show up.

---

## Summary

Fifty thousand people starred i-have-adhd because coding agents' answers were long and the conclusion came last. The stars arrived after the Opus 5 launch, and much of the Hacker News discussion was about exactly that. What people wanted was the result or next action on the first line.

The history shows the ten rules colliding with harness instructions, dropping list items, and producing unfounded diagnoses, with exceptions piling on. The author's measurement found gains concentrated in progress and error reports, and never measured agent work or tokens. Anthropic answered the same demand with the Concise output style, sent on every request, and with Opus 5.5's response structure, which moves between-tool narration into separate blocks.

If long agent answers bother you, a reasonable order is: first add "lead with the result in the first sentence" to your output style or system prompt. Hand progress tracking to a task-list tool, and check completion reports for verification evidence with a hook. Use a skill when a specific task needs a specific report format. The Archify skill in [#52](/blog/52-archify-skill-product/) had a validator far larger than its skill text. This case points the same way: moving rules into tools and settings works more reliably than adding more sentences.

---

*Sources: [ayghri/i-have-adhd (GitHub)](https://github.com/ayghri/i-have-adhd), [Hacker News discussion (2026-09-08)](https://news.ycombinator.com/item?id=49610631), [issue #43 harness conflict](https://github.com/ayghri/i-have-adhd/issues/43), [issue #96 list cap](https://github.com/ayghri/i-have-adhd/issues/96), [issue #99 asserted causes](https://github.com/ayghri/i-have-adhd/issues/99), [issue #187 output-style proposal](https://github.com/ayghri/i-have-adhd/issues/187), [Prompting Claude Opus 5 (Anthropic docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), [Claude Code output styles](https://code.claude.com/docs/en/output-styles), [Introducing Claude Opus 5.5 (Anthropic)](https://www.anthropic.com/claude-opus-5-5), [Prompting Claude Opus 5.5 (Anthropic docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [JetBrains: measuring caveman](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/). Star counts are from the GitHub API on 2026-09-24. Repo analysis is at commit 839872f (2026-09-19). Evaluation figures are from the author's evals/RESULTS.md (run 2026-08-02). Box's "40% less verbose" is a customer quote in Anthropic's announcement. The placement table and measurement method are this post's proposals and have not been verified directly.*
