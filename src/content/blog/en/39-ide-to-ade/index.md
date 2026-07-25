---
title: "Zero Coding Agents Built, Stars Up 4x — What Orca Productized Is the Agent User's Day"
summary: "[#35](/blog/35-harness-engineering/) and [#38](/blog/38-tofu-white-box-harness/) argued that the performance bottleneck has moved outside the model. This time it's the workflow's turn. Orca, an open-source tool from YC-backed Stably, builds zero coding agents of its own — it's a control tower that runs 30+ third-party agents (Claude Code, Codex, and friends) in parallel git worktrees, a so-called ADE (Agent Development Environment). Its GitHub stars went from 7.7k in June to over 28k by late July. What that surge caught: four real bottlenecks of vibe coding — human wait time, nondeterminism, double-paying for tokens, and an approve button chained to your desk — plus a forecast ('the IDE doesn't die, it gets demoted') and the caveats to know before trying it."
date: "2026-07-25T21:00:00"
tags:
  - ai-agent
  - agentic-coding
  - agent-engineering
  - harness-engineering
  - ai-coding
draft: false
---

[#35](/blog/35-harness-engineering/) and [#38](/blog/38-tofu-white-box-harness/) were ultimately making one point: **the performance bottleneck has moved outside the model.** But performance isn't the only thing outside the model. What does the human do during the minutes an agent spends writing code? How many times do you re-run when the result disappoints? How many hours are you glued to your desk because of an approve button? **The workflow bottlenecks live outside the model too.**

The thing we're looking at today aimed squarely at that workflow side. [Orca](https://github.com/stablyai/orca) is an open-source tool from Stably, a YC-backed startup — and here's the odd part: the company **builds zero coding agents of its own.** It only builds the arena where other people's agents run — Claude Code, Codex, Cursor CLI, Copilot CLI, Gemini, OpenCode, thirty-plus in total. It calls itself not an IDE but an **ADE — Agent Development Environment.** A review in June pegged its GitHub stars at 7.7k; as of July 25 it's past 28k. Nearly 4x in a month and a half.

---

## The thing itself: fan one prompt out to five agents

Orca's skeleton fits in three sentences. Fan a single prompt out to multiple agents at once, run each in an **isolated git worktree**, then compare the results side by side and merge the winner. Everything else is flesh on that skeleton.

- **Mobile companion (iOS/Android)** — watch agent status and approve/reject from your phone. Caveat: it only works while the desktop app is running
- **Design Mode** — click a UI element in the built-in Chromium window and the HTML, CSS, and a screenshot get attached to your prompt automatically
- **SSH worktrees** — run agents on a remote server or VPS while your laptop fans stay quiet
- **Native GitHub and Linear integration**, WebGL-rendered terminals with unlimited splits, and CLI automation like `orca worktree create`

MIT license, free. The revenue model is still hiding behind the "bring your own subscription" positioning. On results: there's a community report of a user going from 5–10 tasks a day to 30–50 by running a fleet — but that's a self-report from Discord, so [the same parenthesis we hung on the paper numbers in #38](/blog/38-tofu-white-box-harness/) belongs here too.

---

## It nailed four real bottlenecks of vibe coding

From the feature list alone you might shrug: "a terminal multiplexer with extras?" But star graphs don't respond to feature lists — they respond to **lists of pain.** Walk through four bottlenecks that only people who actually vibe-code know, and the surge explains itself.

**Bottleneck 1 — the slow part isn't the model, it's my wait time.** Give an agent a task and it takes minutes, during which the human idles. Naturally you want to run several at once — but in the same repo, they trample each other's files. Isolated parallel worktrees are the correct answer to that problem, and Orca made it the product's skeleton. The demand isn't "make the agent smarter" — it's **"delete my wait time."**

**Bottleneck 2 — you don't fix nondeterminism, you route around it with sampling.** Everyone knows by now that the same prompt gives different results on every run. Power users were already doing best-of-N by hand — run it three times, keep the best. Orca productized that trick as fan-out plus a side-by-side comparison UI. The insight: the cheapest way to buy quality isn't a better model, it's **more attempts.**

**Bottleneck 3 — people already pay a subscription and refuse to pay a token markup on top.** For anyone who already has Claude Max or ChatGPT, "your own subscription, MIT, free" means near-zero adoption friction. It's the exact opposite position from the paid closed competitors, and being a neutral control tower that pushes no vendor's model fits how people actually work now — mixing Claude Code and Codex in the same day.

**Bottleneck 4 — agent babysitting wants to leave the desk.** The real rhythm of vibe coding is a loop of instruct → walk away → answer an approval request. There's no reason to stay at your desk, yet the approve button keeps you there. A phone app that pushes notifications and takes approve/reject decisions hit that nerve precisely — and the official iOS App Store launch in June was the trigger for the star surge.

Notice what the four have in common: **none of them are about the agent's ability. All of them are about the day of the person driving the agents.** [#25 split the inner loop (help the agent work well) from the outer loop (help the human drive agents well)](/blog/25-loop-engineering/) — if #35 and #38 were the inner-loop war, Orca is the signal that the outer-loop war has started.

---

## The IDE doesn't die — it gets demoted

If it were just Orca, this would be a story about one well-made tool. But look at the market and three directions are converging on the same point.

- **IDEs moving toward ADE** — Cursor added Cloud Agents and parallel execution, Windsurf added Plan Mode, and Copilot stretched its spectrum from autocomplete to async PR agents
- **Terminals moving toward ADE** — Warp's ADE made TIME's Best Inventions of 2025 in the AI category
- **Born as ADEs** — Google's Antigravity, JetBrains' new product Air unveiled in March, Conductor with its $22M Series A, and Orca

The real fight isn't over features — it's over **who owns the developer's home screen.** For thirty years that screen was an editor you typed code into. Now that agents write the code, the human's job has shifted from typing to instructing, waiting, reviewing, and selecting — and the ADE is a screen shaped like the new job.

So I'd call the IDE's fate not extinction but **demotion.** The editor steps down from the lead role and becomes the "operating room" panel — the place you enter when an agent's output needs manual surgery. There's precedent: the terminal didn't die, it got absorbed as a tab inside the IDE. This time it's the editor's turn to be absorbed, and the absorber looks like a kanban board crossed with a PR review screen. The moat moves with it: from editing UX to **orchestration UX and trust machinery** — isolation, checkpoints, rollback, review flows. What should scare IDE vendors isn't a better editor; it's the editor becoming a commodity.

---

## Should you use it? Four caveats

Things to know before trying it.

**First, your quota burns at N×.** Five agents in parallel means your subscription quota drains five times faster. Best-of-N isn't free — it's a trade where you buy quality at attempt-cost × N. [Per the lesson from #38](/blog/38-tofu-white-box-harness/): whether it's savings or spend, verify against the bill.

**Second, daily releases have rough edges.** The pattern reviewers describe is bugs appearing and getting fixed within about 24 hours. Memory usage runs around 250–800MB. And the mobile app is a remote control that needs the desktop running — not a standalone client.

**Third, every productivity number is a self-report.** "30–50 tasks a day" is a community claim, not a controlled experiment. More tasks completed is not the same as more good code shipped — and the question of who reviews all that parallel output loops straight back to [the subject of #31](/blog/31-reviewing-ai-code/).

**Fourth, the recommendation splits.** If you're already orchestrating multiple CLI agents with shell scripts, this is worth replacing those scripts. If you're happy with one agent inside your editor, the consistent reviewer verdict is that Cursor or Windsurf still serves you better. Also, the name "Orca" is crowded — cloud security (Orca Security), autonomous shipping (Orca AI), even a Solana DEX — so add "stablyai" when you search.

---

## What people actually wanted — a control tower

To sum up: the demand Orca proved is not "a smarter agent." It's **"a control tower for me, the person running several agents."** Worktree isolation, phone approvals, side-by-side comparison — none of it is model technology; it's all orchestration UX, and that UX alone produced 4x stars in six weeks.

I read this as the natural next chapter of the harness thread. The moment coding agents themselves become a commodity — and thirty-plus of them being hot-swappable on the same board says we're already there — the value climbs to the management layer above. [#35 argued that the harness, unlike the model, is an asset that persists](/blog/35-harness-engineering/); by the same logic, when the agents change, what persists is the board you drive them from.

There's one more question to ask at the next tool announcement: **does this tool make the agent smarter, or does it organize the day of the person driving the agents?** The next model release can erase the former. The latter persists.

---

*References: [stablyai/orca (GitHub, MIT)](https://github.com/stablyai/orca), [Orca official site](https://www.onorca.dev/), [Orca review by andrew.ooo](https://andrew.ooo/posts/orca-stablyai-parallel-coding-agents-ide-review/), [InfoWorld — The IDE is dead, long live the ADE](https://www.infoworld.com/article/4193975/the-ide-is-dead-long-live-the-ade.html), [Augment Code — Agentic IDE vs ADE](https://www.augmentcode.com/guides/agentic-ide-vs-agentic-development-environment). Star counts and features as of 2026-07-25; productivity figures are community self-reports with no third-party verification.*
