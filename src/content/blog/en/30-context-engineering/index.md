---
title: "The Context Window Hit 1M — So Why Are We Still Trimming Context?"
summary: "From 8k to 1M, the context-window arms race is effectively over. And it created a paradox — the moment you could put in more, the skill of putting in less mattered more. The intuition is 'more context, smarter model.' The reality is the opposite: the longer the tokens, the worse the model finds what it needs (context rot). So the center of gravity moved. If prompt engineering was 'how do I ask,' context engineering is 'what goes in, what stays out, and when do I clear it.'"
date: "2026-07-04T10:00:00"
tags:
  - context-engineering
  - context-rot
  - claude-md
  - prompt-engineering
  - ai-coding
draft: false
---

In a few years the context window ballooned from 8k to 1M. The arms race is effectively over, and any decent frontier model now swallows a whole book. So context worries should be done — just put it all in.

What actually happened in the field is the opposite. **The moment you could put in more, the skill of putting in less became the one that mattered.** That counterintuitive turn is where context engineering begins.

## The betrayal of "longer is better"

A 1M window doesn't mean fill 1M. As context grows, the model's ability to pick out exactly the information it needs actually **drops** — especially for facts buried in the middle (lost in the middle). "Throw it all in, just in case" cuts accuracy while inflating cost and latency.

This is context rot. Window capacity is a ceiling, not a target. "It fits" and "it should go in" are two different claims.

## Center of gravity, from prompt to context

So the nature of the work changed. Prompt engineering was "how do I polish a single question." Context engineering is designing **everything** that goes into the window — not just the instructions, but retrieval results, tool output, conversation history, memory, all of it.

The core question changed too. Not "how do I ask," but "what goes in, what stays out, when do I clear it." A window that holds only what's relevant and sheds the rest beats one clever prompt line. In the agent era, what you put in overwhelms how you ask.

## The highest-ROI move — commands

The first place you design that window is the standing context you hand an agent — a file like `CLAUDE.md` or `AGENTS.md`. It's the same pattern [we saw with OKF and llms.txt last time](/blog/28-open-knowledge-format) — using plain markdown as the model's context.

A structure of overview → architecture → conventions → testing → commands → anti-patterns works well. And the item Anthropic calls "the highest ROI" is, surprisingly, **commands.** Write the build/test/lint commands down verbatim and the model runs what it used to guess, forming a loop that verifies its own code. Before any grand explanation, that one section comes first.

Conversely, the most common anti-pattern is a 3,000-line monolithic file. You think more is better, but the instructions that matter get buried and you burn tokens on every request.

## When the window overflows — compact what's done, clear what's spent

On long tasks and long conversations the window fills up eventually. Management comes down to three moves. Swap past conversation for a summary of the essentials (compaction), clear tool output once you've extracted the conclusion (tool-result clearing), and park facts you don't need to carry every turn outside the window, fetched only when needed (memory).

One principle underneath all three — **the window is a workbench that holds only "what's needed right now."** Compact what's finished, clear what's spent, park what's for later. It's the same spirit as [a trustworthy RAG that "judges whether the context is sufficient and abstains when it isn't"](/blog/19-search-for-agents). More is not the answer.

I wrote this up as a practical, one-page [Context Engineering Guide](https://desty.github.io/context-engineering-guide/en/) — from CLAUDE.md structure to the three management strategies to the anti-patterns.
