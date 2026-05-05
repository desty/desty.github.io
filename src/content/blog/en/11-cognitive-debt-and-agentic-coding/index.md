---
title: "The Warning Signs of AI Coding Are Flashing — So What Do We Actually Do?"
summary: "A head-on analysis of the cognitive debt, token cost, and skill atrophy debates, with a practical framework for developers navigating this shift."
date: "2026-05-05T22:00:00"
tags:
  - ai-coding
  - agentic-coding
  - cognitive-debt
  - developer-productivity
  - career
---

The developer community is sounding alarms. "Agentic Coding is a trap." "Cognitive debt is piling up." "Token costs aren't sustainable." [GeepawHill's piece](https://www.geepawhill.org/2025/05/02/agentic-coding-is-a-trap/) is a prominent example, and many senior developers are raising similar concerns.

These warnings are valid. But if we stop at "so let's use less AI," we miss what's actually shifting in the industry.

Let's be precise about what to fear — and then talk about **how to grow in this era**.

---

## What the Warnings Actually Say

### 1. The Supervision Paradox

> The more you use AI, the less capable you become at supervising what it produces.

This is real. The moment you merge 200 lines of AI-generated code because "it looks about right," nobody owns that code. When it breaks in production, you're asking AI "why did you do this?" — which is asking a tool to explain decisions it didn't consciously make.

### 2. Skill Atrophy

Research suggests developers who over-rely on AI tools see a 47% decline in debugging ability. Junior developers who never write code from scratch — only edit AI outputs — may never develop the fundamental ability to reason about *why* code behaves the way it does.

### 3. Token Cost Overheating

Agentic coding workflows consume significant tokens. A single feature implementation can burn through hundreds of thousands of tokens. Without cost optimization strategies, individuals and organizations hit budget walls fast.

### 4. Vendor Lock-in

When Claude goes down, the entire team stops. This is happening in real teams today. Building your entire workflow around a single AI service is an infrastructure risk.

---

## But Warnings Alone Aren't Enough

These criticisms share a common assumption: they define AI as **"a thing that writes code instead of me."**

If you limit agentic coding to "I throw requirements, AI implements," then yes — it's dangerous. But observe developers who use AI coding tools *well*, and you'll see something entirely different.

**What the critics miss:**

1. **The value of faster feedback loops** — When AI produces a prototype in 3 seconds, you can validate "is this design correct?" in 3 minutes instead of 3 hours. Fast failure is a precondition for deep understanding.

2. **Expanded exploration space** — You can rapidly explore approaches you'd never try alone. This is acceleration of learning, not replacement of it.

3. **Cognitive resource reallocation** — Cognitive resources previously spent on boilerplate can shift to architecture, business logic, and edge cases. But this must be intentional.

---

## Practical Framework: What to Delegate, What to Protect

Here are principles you can apply right now, with the warnings fully internalized.

### Safe to Delegate (Low Cognitive Risk)

| Area | Example | Why |
|------|---------|-----|
| Boilerplate | CRUD endpoints, config files, type definitions | Patterns are clear, verification is easy |
| Exploratory prototypes | "Can this library do X?" | Throwaway code carries no debt |
| Refactoring execution | Variable renames, function extraction, file splits | I set the intent, only execution is delegated |
| Test generation | Tests for code I already understand | I know the logic, so I can verify |

### Must Do Yourself (High Cognitive Risk)

| Area | Example | Why |
|------|---------|-----|
| Architecture decisions | Service boundaries, data models, API contracts | Hard to reverse, large blast radius |
| Debugging | Reproduce-hypothesize-verify loops | This process *is* system understanding |
| Code review | All code, including AI-generated | The moment you merge, it's your responsibility |
| Core business logic | Payments, auth, data integrity | Errors cause direct harm |

### Developer Insight

> **The delegation criterion is reversibility.** Easily reversible work? Let AI do it, verify the output. Hard-to-reverse decisions? Make them yourself. This single criterion prevents 90% of cognitive debt.

---

## Token Costs: Strategy, Not Panic

The current anxiety around token costs resembles early-2000s cloud cost anxiety. "Renting servers? Can anyone afford that?" led to discovering usage patterns more efficient than on-premise ever was.

### The Common Anti-Pattern: "Just Connect Everything"

Here's a scene playing out everywhere right now. MCP servers, custom tools, RAG pipelines, web search, codebase indexing — every possible capability enabled simultaneously, followed by "why am I burning through tokens so fast?"

This is like ordering every item on the menu and asking why the bill is high. When every tool stays connected, each request burns thousands of tokens just on system prompts and tool definitions before any real work happens. The irony: **more tokens spent describing tools than actually using them.**

The worse problem hits when token limits are reached. "I'm out of tokens, can't do anything today" — the moment that sentence appears, AI has stopped being a productivity tool and become **a productivity bottleneck**. It's like being unable to send a single email when the internet goes down — except here, it's basic coding that becomes impossible.

### Realistic Cost Strategies

1. **Tiered model usage** — Fast, cheap models (Haiku-tier) for exploration and prototypes. High-performance models (Opus-tier) for core design and complex implementation.

2. **Context hygiene** — Don't dump unnecessary files into context. Precise context reduces cost *and* improves quality. Same goes for tools — only connect what this specific task needs.

3. **Prompt as asset** — Refine and reuse prompts for recurring tasks. Explaining from scratch every time is token waste.

4. **Measure ROI** — Track "how many hours did these tokens save?" not just "how many tokens did I spend?"

5. **Token depletion contingency** — Maintain a workflow that doesn't stop when token limits hit. Being unable to function without AI is itself a form of technical debt.

### The Invisible Overhead: Tokens Charged Before You Even Type

The strategies above address *how* to use tokens wisely. But instrumented session data reveals a more fundamental problem — **tokens consumed before your prompt is even read** often account for over half of total usage. No amount of prompt craft helps when the baseline overhead is already massive.

**1. CLAUDE.md bloat** — A 5,000-token project rules file costs 5,000 tokens every single turn. At 200 turns per week, that's 1 million tokens on project rules alone. Keep only rules that actively matter, split framework-specific rules into project-level files, extract repeated patterns into skills. **Target: combined under 1,500 tokens.**

**2. Conversation history accumulation** — Every follow-up re-tokenizes the entire conversation. Message 30 costs 30× message 1. **Cap conversations at 20 messages.** When you need continuity, use `/compact` to summarize and restart. Editing a previous message (↑ → edit → resend) replaces a bad exchange instead of stacking it.

**3. Hook and plugin injection** — Multiple UserPromptSubmit hooks can inject thousands of tokens on every prompt before you've typed a word. Audit your `settings.json` hooks regularly. If you can't articulate why a hook needs to fire on *every* prompt, disable it.

**4. Cache misses** — Prompt cache has a 5-minute default lifetime. A coffee break means the system prompt, CLAUDE.md, and tool schemas all re-tokenize at full price. Sending a simple prompt before stepping away keeps the cache warm and saves significant cost.

**5. Stopping wrong-direction generation** — When AI starts a long response and you can see within the first few lines it's heading the wrong way, don't wait for it to finish. `Cmd+.` (Mac) / `Ctrl+.` (Windows) stops generation immediately. A completed wrong response wastes output tokens *and* inflates the next turn's history cost.

The core realization: **every session is an invoice, not a blank slate.** CLAUDE.md + hooks + plugins + tool schemas + conversation history are pre-charged on every turn. Reducing this baseline overhead has higher ROI than any amount of prompt optimization.

### Developer Insight

> **Token costs are falling, and will continue to fall.** GPT-4-level performance dropped ~100x in cost over two years. Don't plan strategy around today's pricing as if it's permanent. But "it'll be cheap later so ignore it now" is also dangerous. **Use rationally today, bet on cost reduction tomorrow.** And above all — be someone who can still work when the tokens run out.

---

## Preventing Skill Atrophy: Deliberate Practice

Maintaining core skills while using AI is possible — but requires **conscious effort**.

### 1. The "30 Minutes Without AI" Rule

Write code without AI assistance for at least 30 minutes daily. Debug manually. This is like physical exercise — skip it regularly and the muscle atrophies.

### 2. The "Why?" Habit for AI Output

Before accepting AI-generated code, ask yourself:
- Why was this code written this way?
- What alternatives exist, and why is this approach better?
- Where will this code fail?

If you can't answer, don't accept.

### 3. Weekly Deep Dive

Once a week, pick the most complex AI-generated code and rewrite it from scratch. Compare results. Learn what AI missed and what you missed.

### 4. If You Can't Explain It, You Don't Own It

"AI wrote it and it works" is not an acceptable answer in code review. If you can't explain the code to a teammate in 3 minutes, you don't understand it. And if you don't understand it, you shouldn't merge it.

---

## Vendor Lock-in and the "Team Stops When AI Stops" Problem

Single-vendor AI dependency is a real operational risk. And this isn't just an organizational issue.

At the individual level, the same pattern is emerging. When monthly token limits are exhausted or an AI service has an outage, developers are **literally stopping work**. "Waiting for token reset" isn't a joke — it's an actual message in real Slack channels.

This isn't dependence on a productivity tool. It's **outsourcing of basic capability**. When your IDE's autocomplete breaks, typing gets slower but you can still code. When AI is blocked and the response is "I don't know what to do" — that's not tool dependency, that's delegation of the ability to think.

Approaches to reduce it:

1. **Don't couple workflows directly to AI services** — Maintain an abstraction layer. AI services should be swappable.

2. **Keep core work possible without AI** — A 3-hour AI outage should slow your team, not stop it. "Slower" and "stopped" are fundamentally different.

3. **Maintain local models as fallback** — Not every task needs peak performance. Basic autocomplete and generation can run locally when the internet is down.

4. **Keep an "AI downtime" task list** — Documentation, manual refactoring, code review — work that progresses without AI should always be in your backlog. Losing an entire day because tokens ran out is a strategy failure.

---

## Conclusion: Not "Use Less" — "Use Differently"

The real lesson of the cognitive debt debate isn't "stay away from AI." It's **"design your relationship with AI intentionally."**

Borrowing the Star Trek analogy — advice to only use it as Ship's Computer is too conservative, and advice to treat it like Data is too reckless. The realistic answer:

**AI is a tool for thinking deeper, not a replacement for thinking.**

Use that single sentence as your criterion, and what to delegate versus what to protect becomes natural.

The developers who thrive in this era won't be those who use AI the most, nor those who use it the least. They'll be the ones who **use it the most deliberately**.

---

## Checklist: Start Tomorrow

- [ ] Has your team agreed on delegation vs. hands-on boundaries?
- [ ] Do you have review criteria specifically for AI-generated code?
- [ ] Are you tracking token costs and measuring ROI?
- [ ] Are you regularly auditing your CLAUDE.md, hooks, and MCP connections?
- [ ] Do you have a fallback path for core work when AI is unavailable?
- [ ] Are you reserving regular time for coding without AI?
- [ ] Can you explain "why this code?" before every merge?
