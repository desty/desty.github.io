---
title: "AI Writes Code 10× Faster — and Nobody Reviews 10× Harder"
summary: "Generation got explosively faster; review didn't move. So the bottleneck quietly shifted to review. And it's not just about speed. AI code fails differently than human code — clean names, fine structure, and yet subtly wrong. That 'looking right' is the trap. So reviewing AI code isn't about going faster; it's about reviewing differently. Not 'does it read well' but 'is the part you can't see correct.'"
date: "2026-07-05T10:00:00"
tags:
  - code-review
  - ai-coding
  - agentic-coding
  - quality
  - security
draft: false
---

Almost the entire AI-coding conversation leans toward generation. Faster agents, bigger context, more autonomous loops. But while code pours out 10× faster, the speed of verifying it has barely budged.

So the bottleneck quietly moved. From hitting keys to **telling whether the thing is correct.** And this isn't a problem you fix by reviewing faster.

## AI code fails differently

Human mistakes are usually visible. Typos, a missed case, awkward structure. The surface is uneven, so something says "this part was rushed" and you get suspicious.

AI code is the opposite. Clean names, fine structure, even comments. It's all so smooth that you approve fast. But the model writes the happy path well and **drops quality in the less glamorous places** — error handlers, retries, boundary conditions. Subtle errors hide under a smooth surface. That "looking right" is exactly the trap.

There's a nastier wrinkle. When the model writes implementation and tests together, the two **share the same wrong assumption.** The tests are green while verifying wrong behavior. "Tests pass = correct" no longer holds.

## So: differently, not faster

The key is changing the order. AI code almost always passes on style, so don't let that fool you into skipping what actually matters.

Read top-down — did it build the thing that was asked (intent), did it break an existing contract (API), is input validation and auth handled (security), are edge cases and failure paths covered (behavior). Doubt the tests' authenticity separately, and leave readability and style for last, lightly. Smoothness is not evidence of correctness.

And as generation speeds up, you have to spend proportionally more time verifying to stay in balance. Write 10× faster but skim at the same speed, and the gap accrues as debt — the very debt I flagged in ["Cognitive Debt"](/blog/11-cognitive-debt-and-agentic-coding).

## Review is the outer loop's verification gate

Zoom out one level and it gets clear. In ["Loop Engineering"](/blog/25-loop-engineering) I argued the genuinely new thing isn't the inner loop (generation) but the outer loop — what you assign, verify, and re-submit. Code review is **the most important verification gate** in that outer loop.

The more you automate generation, the more the quality of this gate sets the ceiling on system quality. A flimsy gate turns fast generation into fast accident production. That's why baking the review criteria into your team's PR template matters — the blind spots stay consistent even as reviewers change.

I wrote up the checklist and a 10–15-minute-per-PR workflow on one page in the [AI Code Review Guide](https://desty.github.io/ai-code-review-guide/en/) — from the four failure modes to the six-layer checklist.
