---
title: "Code Written by AI, to Save AI's Tokens — Cracking Open a Netflix Engineer's Headroom"
summary: "A Netflix engineer's Headroom compresses context before it reaches the LLM, cutting tokens by 60–95%. I cloned it and read the source — the compression engine is real. But the more interesting find was elsewhere: traces all over the repo show the tool itself was built by AI agents. AI is building a tool to solve AI's cost problem, with AI."
date: "2026-06-03T10:00:00"
tags:
  - ai-agent
  - coding-agent
  - context-engineering
  - claude-code
  - open-source
  - agent-engineering
draft: false
---

In [my last post](/en/blog/17-maps-and-skills/) I cracked open four trending repos and concluded that what people actually want isn't a smarter model — it's everything around the model. This month another one rode that exact wave. **Headroom** — open source from Netflix senior engineer Tejas Chopra — compresses context (tool outputs, logs, RAG chunks, files, conversation history) *before* the prompt reaches the LLM, cutting tokens by **60–95%**. Shipped in January, it claims to have saved 200 billion tokens and roughly $700K.

As usual, [I cloned it to `/tmp` and read the code](https://github.com/chopratejas/headroom), to see whether the compression engine was as real as the marketing. The short version — **it is.** But while reading, I found something more interesting. *How* the tool was built is stamped all over the repo, and that says more than the tool itself.

---

## What demand does it answer — "agents eat too many tokens"

Same root as the problem codegraph solved last time. Anyone who's run a coding agent knows it: pipe in one log and it's tens of thousands of tokens, 100 lines of `grep` output, a giant JSON response — when the model only needs a few lines of it, and the rest fills the context window and gets billed. Worse, the longer the context, the more recall accuracy degrades (context rot).

Headroom's answer is **"prune before it reaches the model."** It sits between your agent and the LLM and compresses whatever you're about to send, per content type. One line from the demo captures it — **10,144 tokens cut down to 1,260, and the FATAL log you were looking for is still there.** One-eighth the cost, same answer.

1,389 commits in five months, dozens of external contributors, v0.22 — those numbers accumulating means "agents eat too many tokens" isn't somebody's vague annoyance. It's **a real, money-leaking pain.**

---

## Reading the code — the compression is real

The README leans hard on marketing, so I started skeptical. "Compression," sure — but isn't it just truncation underneath? It isn't. The engines split by content type, and each uses a legitimate technique.

- **JSON (SmartCrusher)** — implemented in Rust. Analyzes per-field variance, drops rows that don't vary or that closely resemble each other, while preserving the first 30% and last 15% as boundaries. Not blind truncation — it *identifies* redundancy and drops that.
- **Code (CodeCompressor)** — **parses the AST via tree-sitter.** Analyzes the call graph to score which functions matter, then truncates bodies *at complete statement boundaries.* Keeps signatures, imports, type annotations. It never cuts mid-expression and breaks syntax.
- **Prose (Kompress-base)** — **real ML inference.** Downloads a ModernBERT-based model from HuggingFace and runs a per-token keep/discard binary classification. Not a heuristic imitation — a trained model actually runs.
- **Logs / search / diff** — also Rust. Scores by log level, and preserves stack traces to the end via a state machine.

The most impressive part was a single design principle. **If the dependencies (tree-sitter, the ML model) aren't installed, it doesn't fall back to some sloppy heuristic — it passes the original through untouched.** "No silent fallback" — if it isn't confident it can compress, it doesn't touch it. The judgment is that failing to save tokens beats corrupting information to save them. That's honest engineering.

> **When it's a good fit**
> You run coding agents daily and the token bill stings. `headroom proxy` slots in with zero code changes, and `headroom wrap claude` wraps an agent in one line. Your data stays local (with one caveat below).

---

## And the gap between README and code

As real as it is, there's overstatement too. I note it for balance. (That AI code deserves longer per-line review was also the conclusion of [post #11](/en/blog/11-cognitive-debt-and-agentic-coding/).)

**CacheAligner** — the README architecture diagram has a confident box: "stabilizes prefixes so KV caches actually hit." Open the code and this module is currently a **detect-only no-op, disabled by default.** A comment still sits there explaining that the old prefix-rewrite path was removed for violating the invariant that "the system prompt (cache hot zone) must never be mutated." There's a gap between what the diagram promises and what runs.

**CCR (reversible compression)** — "originals are never deleted; the LLM retrieves them on demand" is a core selling point. In the code, the original is kept in local memory under a hash key, and is recovered only if the LLM **explicitly calls** an MCP tool, `headroom_retrieve(hash)`. Two caveats. (1) If the model never calls it, the information is simply gone. (2) Storage has a **5-minute TTL** (proxy mode). "Reversible" is accurate, but it's not permanent storage — it's a **5-minute scratch cache.**

I'm not trying to nitpick. This is a well-made tool. The point is that **you shouldn't trust the README's diagram and the actual code at equal weight** — that's table stakes for evaluating open source in the AI era.

---

## The most interesting signal — this tool was built by AI

This is what I actually wanted to talk about. While reading, I found a folder at the repo root called `REALIGNMENT/`. Inside:

```
REALIGNMENT/
  00-overview.md
  01-bug-list.md          (26KB)
  02-architecture.md
  03-phase-A-lockdown.md
  04-phase-B-live-zone.md
  05-phase-C-rust-proxy.md
  ... phase-D ~ phase-I ...
  12-decisions-needed.md
```

This isn't a human jotting notes. It's a **large-scale refactoring spec aimed at an agent.** A bug list, a phased (A–I) execution plan, a "decisions needed" list — a meal laid out for a coding agent to pick up and process one step at a time. The code comments matched: scattered everywhere are traces like `PR-A2 / P2-23 fix` and `removed for violating invariant I2` — too mechanical and tracking-numbered for a human to hand-author.

In other words: **Headroom is a tool that saves AI agents' tokens, built by AI agents (Claude-like, from the looks of it).**

That recursion is the heart of this post. Step back and the picture is:

> Agents eat too many tokens → let's build a tool to cut that → build that tool **with an agent** → which burns tokens in the process → …

In [post #14](/en/blog/14-agent-engineering/) I wrote that what an agent engineer really designs is the layer outside the model. Headroom proves that thesis at its most extreme. The tool's **function** (context compression) is an around-the-model layer, and the tool's **method of construction** (agent-driven development) is too. The inside and the outside are working on the same problem.

---

## So what does this show

**① Context is now an explicitly *managed* cost.**
The context window used to be something you just filled. Now what you include and what you drop is money and accuracy. A $700K-saved narrative attaching to a tool like Headroom, and stars piling up, means **tokens became a line item.** Compression is the first lever to shave that bill.

**② The tool does the compressing, but *what to keep* is still design's job.**
SmartCrusher keeping the first 30% and last 15%, CodeCompressor preserving signatures — all of it is someone's **judgment** frozen into code. The tool automates the execution, not the judgment. Context engineering doesn't disappear; it gets baked into the tools.

**③ "Code built by AI" is about to be ordinary — which makes knowing how to read it matter.**
Headroom wasn't built by AI because it's unusual. Soon most active OSS will be built this way. Artifacts like `REALIGNMENT/phase-A~I` living in the repo will be the default, not a flaw. The more that happens, the more an evaluator needs **an eye for the code over the README, the behavior over the diagram.** You can't tell CacheAligner is a no-op from the diagram alone.

---

## Closing

I set out to verify one thing — is the 60–95% compression real? It is (the two overstatements were a bonus find). But after reading the code through, a different picture stuck longer.

**AI is building a tool to solve AI's cost problem, with AI.** If that recursion doesn't feel strange to you, that's the signal that context engineering has crossed from hobby into industry. The model is strong enough. Now people spend money and code on **what to feed it, how efficiently to run it, and how to see what goes inside** — even outsourcing that work itself to the model.

Next time I crack open a trending repo, I've got one more question to ask. Next to "what problem does this solve" — **"how was this built, and what does that tell us?"**

---

## References

- [Headroom (chopratejas/headroom)](https://github.com/chopratejas/headroom) — LLM context compression layer (library · proxy · MCP)
- [Kompress-base on HuggingFace](https://huggingface.co/chopratejas/kompress-base) — the model behind its text compression
- Related: [Reading what developers actually want through 4 trending repos](/en/blog/17-maps-and-skills/) · [What an agent engineer really designs](/en/blog/14-agent-engineering/) · [Cognitive debt and agentic coding](/en/blog/11-cognitive-debt-and-agentic-coding/)
