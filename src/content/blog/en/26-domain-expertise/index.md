---
title: "An Accountant Succeeds as Often as a Software Engineer — In AI Coding, What Gained Value Is Domain Expertise"
summary: "Anthropic dug into 400,000 Claude Code sessions and found that success on coding tasks barely tracks occupation. Accountants, lawyers, managers all cluster within a few points of software engineers. What separated success was how well someone knew the problem. Experts let the agent run further on a single instruction, and give up less when things go sideways. The same signal shows up elsewhere — on the human side domain experts are becoming builders, and on the model side vertical, specialized models beat the generalists. Once coding stops being the barrier, what's left exposed is whether you know the domain."
date: "2026-06-22T10:00:00"
tags:
  - agentic-coding
  - ai-coding
  - domain-expertise
  - ai-agent
  - llm
draft: false
---

An accountant who has never written a line of Python builds a reconciliation script. But this person knows exactly which exceptions the script mishandles at month-end close, and which reconciliation rules it has to enforce. The senior engineer one desk over, facing Rust for the first time, starts with "why won't this compile?" Which of them gets more out of the agent?

Counter to intuition, the answer isn't the job title. [Anthropic's research, published June 16](https://www.anthropic.com/research/claude-code-expertise), looked at exactly this with data: 400,000 Claude Code sessions from about 235,000 people between October 2025 and April 2026. Boil the conclusion down to one sentence — **coding agents are not substituting for domain expertise; the more understanding a worker brings, the more quality work the agent does.**

## The data: a coding background barely matters

Start with the most striking finding. Take just the sessions that generated code, judge success by verifiable evidence (passing tests, commits, explicit confirmation), and nearly every occupation lands within 7 points of software engineers.

| Occupation | Verified success | At least partial |
| --- | --- | --- |
| Computer & math (software) | 34% | 94% |
| Management | 37% | 95% |
| Legal | 33% | 95% |
| Business & finance | 29% | 93% |
| Healthcare | 28% | 93% |
| Sales | 28% | 92% |

On the loosest measure every group sits at 92–95%, effectively no spread; even on the strictest one they all fall inside a narrow 27–37% band. Management even edges out software engineers on verified success. As agents absorb the implementation work that was once an engineer's exclusive turf, the value of a coding background as a credential is dropping fast.

## Expertise is task-specific, not a title

So what separates success? The researchers' classifier scored each session's user from novice to expert on a five-point scale — but the expertise it means is not what we usually picture. Not coding skill, not job title. It's **how deeply you understand the problem you're trying to solve.**

Which makes the expertise task-specific. The senior engineer asking about Rust for the first time is, in that moment, a novice at Rust; the accountant above is an expert at the reconciliation problem. The classifier reads three signals: how precisely you instruct, what you ask to be verified, and whether you tend to correct the agent or get corrected by it.

A novice's prompt shows no domain knowledge: "can you analyze this data and make a chart?" An expert's prompt aims precisely at the weak spot: "we may need to split managed and unmanaged slots and lower the hard-refresh cadence. Managed every 30 minutes, the rest once a day is fine."

## People decide what, the agent decides how

The division of labor in a typical session is sharp. On average people make about 70% of the planning decisions (what to do) but only about 20% of the execution decisions (how to do it). The other 80% of execution belongs to the agent. **People decide what to build, and the agent decides how to build it.**

Expertise widens that division. In a typical novice session, one prompt triggers about 5 agent actions and 600 words of output. In an expert session, more than double that — about 12 actions — and five times the output, around 3,200 words. Even in a regression controlling for task type, value, occupation, and model, each step up in expertise raised actions by 9% and output by 13% (p < 0.001). Someone who knows what to verify and where the traps are can let the agent run longer and still trust and handle the result.

## The real split shows when things go sideways

The value of expertise is clearer when things stall than when they run smooth. When a session hits trouble — errors, broken tests, the same attempt repeated — the rate of dragging it to verified success rises from 4% for novices to 15% for experts. The reverse is starker. The share of abandoned sessions — failed, not a line of code left, the user types "never mind" and leaves — is 19% for novices versus just 5–7% for everyone else.

The people with the least experience let go most easily when they don't get what they wanted. Part of expertise is, in the end, the ability to steer the agent back onto the right path. (The researchers add a caveat: experts hit trouble less often to begin with, so the trouble they do hit is likely harder. Part of the recovery gap reflects "novices get stuck on routine problems, experts on genuinely hard ones.")

## The same signal shows up outside

What's interesting is that this isn't Anthropic's observation alone. Stack Overflow ran a March analysis titled ["Domain expertise still wanted"](https://stackoverflow.blog/2026/03/16/domain-expertise-still-wanted-the-latest-trends-in-ai/), and one essayist hits the same spot right in the title: ["AI Does Not Replace Domain Expertise. It Raises the Stakes for Having It."](https://joesabado.substack.com/p/ai-does-not-replace-domain-expertise)

In investor language the phrase going around is ["the moat just moved."](https://ardent.vc/blog-posts/the-moat-just-moved-areas-of-opportunity-in-ai-native-software-d34b7) As non-technical people can meaningfully weigh in on implementation decisions, the technical moat protecting engineers narrows. Domain knowledge becomes the new moat instead — the exceptions never written down, the data combinations only an insider knows to make, the texture of work that only accrues over years. None of that is something a model provider can ship as a feature.

## Models are going domain, too

There's a neat symmetry here. While domain becomes the asset on the human side, the same thing is happening on the model side. One of 2026's themes is ["the end of the general-purpose LLM hype."](https://cogentinfo.com/resources/domain-specific-language-models-dslms-the-end-of-the-general-purpose-llm-hype-in-2026) A small 7–13B model, fine-tuned once, beats a giant generalist on domain tasks, and vertical AI agents like Harvey (legal), Hippocratic (healthcare), and Sierra (customer service) are eating a $450B vertical SaaS market.

So "domain expertise" is gaining value on two layers at once. *Who instructs the agent well* (a human's domain judgment) and *which model wins in that domain* (a model's domain specialization). The more common general capability gets, the more differentiation comes from knowing one area deeply.

## In the end, back to judgment

This picture meets up with what I wrote before in ["The Bottleneck Already Moved to Judgment."](/blog/22-recursive-self-improvement) Once writing code is nearly free, what's left is deciding what to build and why, and telling whether the result is right. Anthropic's data effectively put numbers on that hunch.

One more thing worth keeping: most of the gain comes not from deep mastery but from a working grasp. Success jumps going from novice to intermediate, and the slope from intermediate to expert is gentle. It means anyone who truly understands the problem they're solving, in any field, can now do technical work they couldn't before. And without that understanding, you get far less out of the same tool.

Anthropic closes the report with "coding is a leading case." Coding just happens to be the field agents entered first and deepest; the same dynamics will likely spread to other knowledge work. If so, what's happening in coding now is a trailer. The more the tool absorbs implementation, what gains value isn't the hand holding the tool — it's what that hand knows.
