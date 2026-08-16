---
title: "Grok Bot, xAI's Always-On AI Teammate — What Makes It Convenient Is Exactly What Makes It Risky"
summary: "On August 11, xAI shipped Grok Bot in beta: always-on AI teammates you message like colleagues. The tagline says 'Bots have their own computer,' but the docs say something else — there is one computer per account, every Bot shares its files, browser sessions, and CLI credentials, and the official documentation tells you outright not to use separate Bots as a security boundary. What the persistent design sells (log in once, no repeated setup, compounding context) and the risk it creates (untrusted input + resident credentials + outbound communication) come from the same place. I compare how Claude Cowork, Claude Code, ChatGPT Work, and Codex answered the same design question differently, flag the fact that the official security doc never once says 'prompt injection,' and close with the rules I'd follow if you try it anyway."
date: "2026-08-16T14:00:00"
tags:
  - agent-engineering
  - ai-agent
  - multi-agent
  - security
  - productivity
draft: false
---

On August 11, xAI released [Grok Bot](https://x.ai/news/introducing-grok-bot) in early beta. The product: AI teammates that run in the cloud around the clock, which you direct by messaging them like colleagues. The tagline is "Bots have their own computer."

Open the [official docs](https://docs.x.ai/grok-bot/overview), though, and the first section reads differently: "All of your Bots use the same persistent cloud computer." The computer is per account, not per Bot, and every Bot on it shares files, browser sessions, and logins. The [security documentation](https://docs.x.ai/grok-bot/approvals-security-and-privacy) then states it plainly — **"Do not use separate Bots as a security boundary."**

This post does two things. First, it reads what this persistent design sells and what it gives up, strictly from the documentation. Second, it compares how the Anthropic and OpenAI products already in this category — Claude Cowork and Claude Code, ChatGPT Work and Codex — answered the same design question differently.

---

## What shipped — a resident agent you direct by message

The product rests on four pieces. First, **computer use**. Bots operate a browser and desktop apps on the cloud computer the way a person would. The docs recommend connectors (API/MCP) when available, but the selling point is the other side: work gets done even in tools with no clean API, where the screen is the only interface.

Second, **learning by demonstration**. With "Teach a task," you perform a browser workflow once instead of describing every step, and the Bot drafts it as a skill. A skill captures six things: when to use it, required inputs and access, the sequence of work, how to validate the result, what to return, and what requires approval. Third, **routines**. Skills run on a schedule ("every weekday at 8:00 AM") or on an event (a Slack message, a GitHub notification). Fourth, **Bot-to-Bot collaboration**. Bots message each other in threads, and in a group chat they divide work and pass ownership on their own. Internally, xAI reportedly runs a chief-of-staff Bot on top with a specialist for each lane.

Availability: macOS and Windows desktop plus iOS, no standalone SKU — it comes bundled with SuperGrok Heavy, Cursor Ultra ($200/month), and Cursor Teams Premium ($120/seat/month), with an enterprise waitlist. The Cursor plans look odd until you see the corporate backdrop: SpaceX absorbed xAI in February (the combined entity now goes by "SpaceXAI"), announced a $60B acquisition of Cursor (Anysphere) in June, and closed it on August 14 — the day before this post. Grok Bot's login is literally "Sign in with Cursor." The announcement doesn't name the underlying model; Grok 4.6, released the same week, is reported to power it.

## What "their own computer" actually means — one per account, one screen per Bot

What the persistent computer sells is clear. Log in once and the next task doesn't ask again. Files and browser state stay put, so handing work between Bots doesn't repeat setup. In the docs' words: "Context compounds instead of resetting to a fresh environment on every task." That is the sharpest break from agent products that hand you a fresh environment per task — and, honestly, the part that makes you want to try it.

The login mechanics are also specific. Bots don't handle passwords, passkeys, two-factor codes, CAPTCHAs, or payment confirmations. You take control of the remote screen, complete only the blocked step yourself, and tell the Bot to continue. The docs warn against pasting passwords or one-time codes into chat. In other words, the Bot never receives a credential string — it inherits the **signed-in session** you created.

The question is how far that session spreads. Straight from the docs: the computer is "isolated to your account, not to an individual Bot." Browser cookies and signed-in sessions are shared. Files are visible to every Bot. Command-line credentials are available across your Bot roster. Each Bot gets its own screen, but — "The screens are separate work surfaces, **not separate security boundaries**." The CRM login you gave your sales Bot and the bank session you gave your bookkeeping Bot sit on the same machine. Splitting work across named Bots is organization, not privilege separation — and xAI's own documentation is the one saying so.

## What Claude and OpenAI have

Grok Bot didn't open this category. Anthropic shipped [Claude Cowork](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/) on January 12 — a work agent for non-developers built on the Claude Code foundation, reportedly assembled in ten days using Claude Code itself. It started as a desktop app where you grant access to a local folder and hand over tasks, then expanded to web and mobile in July (Max plans), letting jobs continue in the cloud after you close your laptop. OpenAI shipped [ChatGPT Work](https://www.forbes.com/sites/madhulika-pathak/2026/07/09/openai-debuts-chatgpt-work-workplace-ai-agent-with-gpt-56/) on July 9 alongside GPT-5.6: an agent that gathers context from connected apps and grinds through hours-long jobs step by step, with Codex technology inside. For teams there are workspace agents, launched in April as the successor to custom GPTs — they keep running in the cloud after you log off and sit in Slack channels like teammates.

On features alone, the three companies have nearly converged. OpenAI has learning-by-demonstration too (Record & Replay in the Mac app and Codex — show a workflow once, get a reusable skill), everyone has scheduled runs (ChatGPT Scheduled Tasks, Claude Code Routines), everyone has background cloud execution. Anthropic's usage data shows where the category is heading: in the analysis of 1.2M sessions across 600K organizations published with Cowork's expansion, software development was just 8.7% of usage — business processes took 33.4%, content creation 16.4%. The companies that built coding agents are all selling office teammates now, and the demand really is there.

Where they split is state and isolation. The same problem — an agent needs surviving state to continue work, and surviving state means surviving risk — got three different answers.

| Axis | Grok Bot (xAI) | Claude (Anthropic) | OpenAI |
|---|---|---|---|
| Execution environment | One persistent computer per account, shared by all Bots | Isolated cloud VM per session (Claude Code on the web) | Codex cloud spins up a fresh container per task (12-hour cache) |
| Logins & credentials | Sessions, cookies, CLI credentials persist and are shared across Bots | Credential proxy — tokens never placed inside the VM | Only cloud browser keeps signed-in sessions; screenshots disabled during takeover |
| Learning by demonstration | Teach a task → skill | Skills (file-based, user-authored) | Record & Replay → skill |
| Scheduling | Routines (time or event) | Routines (cron, GitHub events) | Scheduled Tasks (capped around once per hour) |
| Agent-to-agent collaboration | Group chats, ownership transfer between Bots | Agent Teams (experimental) | No equivalent found |
| Target | Non-developer teammates (sales, ops, back office) | Cowork for non-developers / Claude Code for developers | Work for individuals / workspace agents for teams |

Two cells stand out. One is isolation — only Grok Bot puts everything on one machine, while the other two cut execution into task- or session-sized environments and keep credentials outside them. OpenAI's cloud browser retaining login sessions is the closest parallel, and even there you get per-site access prompts plus separate confirmation for consequential actions like purchases. The other is collaboration — Bots dividing work in a group chat is, as far as I could confirm, unique to Grok Bot. And the two cells are really one design decision. Bots can hand off files and sessions cheaply because they share one computer; the handoff is smooth precisely because there is no isolation.

## The word missing from the security doc

Agent security has a well-known worst-case combination: processing untrusted input, holding sensitive credentials, and communicating externally. Put all three in one agent and a malicious webpage or email becomes a channel for steering the agent and exfiltrating data (Simon Willison named it the lethal trifecta). Grok Bot ships all three as product features. Reading the web and inboxes is the job (untrusted input), signed-in sessions persist (credentials), and sending messages is a headline capability (outbound communication).

So I read the official security documentation — and **the phrase "prompt injection" never appears.** The risk framing is entirely approvals and credential hygiene. Seven action types sit behind approval — sending messages, publishing content, purchases and transfers, deleting data, changing permissions, production changes, accepting legal terms — and you're told to delete sensitive temporary files after work is done and revoke connectors you no longer need. Sensible advice, but all of it is homework for the user; the document has no mitigation for the scenario where malicious input steers the Bot. It also concedes the limit of approvals itself: "An approval controls the proposed action. It does not reverse work already completed."

Put competitor docs next to it and the gap is stark. OpenAI maintains multiple documents dedicated to prompt injection and has begun applying Lockdown Mode by default on business plans. Anthropic's security docs spell out VM isolation, network access controls, and the credential proxy for Claude Code cloud sessions. And this is not a hypothetical for xAI: Grok on X has already been fooled by a Morse-code-disguised injection, with [$150,000 drained from an AI wallet](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet). That incident exposed one wallet. This product hosts every login on your account.

Performance is unverifiable too. The launch materials lean on demos and internal testimonials ("2-3x more efficient because it does it without me verifying and reviewing" — anonymous), with no success rate, human-intervention rate, or representative task suite published. An audit view of what Bots did is promised, not shipped.

## If you try it anyway

The territory this product opens is real: repetitive office workflows running through tools with no API, where the screen is the only interface — automation's blind spot until now. If you're going to test it, here's how I'd draw the lines.

**Pick reversible work.** Start with jobs where failure can be undone and a human reviews the output before it leaves. The approval list (send, publish, pay, delete) is a floor, not a ceiling — take the docs' own line that an approval doesn't reverse completed work as your benchmark.

**Build isolation at the account level yourself.** There is no isolation between Bots, so work of different sensitivity needs different accounts. Grant this account only what every Bot may share, and keep banking, payments, and production access off this computer entirely.

**Credentials via takeover only.** Do what the docs say: never type passwords into chat, take over the screen for login steps, and revoke connector authorizations you're done with. xAI won't do this part for you.

**Keep development work out.** Code belongs with the tools designed for it — Claude Code and Codex, with isolated VMs, credential proxies, and audit logging. Grok Bot's place is the GUI-only work those tools can't reach.

Zooming out: the shift I covered in [#39](/blog/39-ide-to-ade/) — productizing the day of the person who uses agents — spilled beyond development this half. Cowork in January, Work in July, Grok Bot in August: within six months, all three coding-agent companies started selling office teammates. The features have converged, so the next dividing line is trust. In [#50](/blog/50-tencentdb-agent-memory/) I wrote that the unfinished work in agent memory is governance; the unfinished work in resident teammates is exactly the same — everyone has built the ability to accumulate state, and what remains is drawing boundaries around it.

---

*References: [Introducing Grok Bot](https://x.ai/news/introducing-grok-bot) (xAI, 2026-08-11), [Grok Bot docs — Overview](https://docs.x.ai/grok-bot/overview) · [Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps) · [Approvals, security and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy) · [Skills, routines and automations](https://docs.x.ai/grok-bot/skills-routines-and-automations) (quotes reflect the docs as of publication), [Claude Cowork expands to mobile and web](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/) (TechCrunch, 2026-07-07), [OpenAI debuts ChatGPT Work](https://www.forbes.com/sites/madhulika-pathak/2026/07/09/openai-debuts-chatgpt-work-workplace-ai-agent-with-gpt-56/) (Forbes, 2026-07-09), [Codex cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment) · [Cloud browser](https://learn.chatgpt.com/docs/browser) · [Record & Replay](https://learn.chatgpt.com/docs/extend/record-and-replay) (OpenAI docs), [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web) · [Security](https://code.claude.com/docs/en/security) (Anthropic docs), [SpaceX Completes $60 Billion Cursor Acquisition](https://www.bloomberg.com/news/articles/2026-08-14/spacex-completes-its-60-billion-cursor-acquisition) (Bloomberg, 2026-08-14), [How Grok got prompt injected](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet) (Giskard). Grok Bot's efficiency testimonial is an anonymous user quote inside xAI's launch materials, with no independent verification. Cowork usage shares (8.7%, etc.) are Anthropic's own published data. For the IDE-to-ADE shift see [#39](/blog/39-ide-to-ade/); for agent-memory governance see [#50](/blog/50-tencentdb-agent-memory/).*
