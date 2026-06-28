---
title: "Everyone's Building MCP Servers — But the Protocol Was Never the Hard Part"
summary: "Now that MCP is a de facto standard, everyone's building servers. Step back, though, and you'll see people competing on the easy part. The protocol is JSON-RPC plus three primitives — a few days of docs. What decides whether your agent actually works is the tool design on top: names, descriptions, error messages, approval gates, and how many tools you expose. And it isn't a new skill. The consumer just happens to be a model instead of a human — it's the resurrection of API design you'd forgotten you had."
date: "2026-07-03T10:00:00"
tags:
  - mcp
  - tool-design
  - ai-agent
  - api-design
  - context-engineering
draft: false
---

MCP (Model Context Protocol) has become a de facto standard. Every major coding agent reads it natively, and governance moved under the Linux Foundation. So everyone's piling into "let's build an MCP server too."

But step back and the crowd is gathering on the easy side. **The protocol was never the hard part.** Whether your agent actually works comes down not to the protocol but to the tool design layered on top of it. And that design isn't a skill you learn from scratch.

## The protocol is free

MCP's skeleton fits in your head in a day. Messages are JSON-RPC 2.0; what you expose is three primitives — [Tools] the model calls, [Resources] the app pulls in as context, [Prompts] the user picks. Transport is stdio locally, HTTP with OAuth remotely. That's it. With an official SDK, standing up one server really is a few days of work.

So "I can build an MCP server" isn't a brag. We're not writing assembly; the tooling already makes things speak the protocol for you. Stop here and you ship a server that looks fine in a demo but, in production, has the model calling the wrong tool and wandering off.

## The real contest is in tool design

A model doesn't use tools the way a human does. A person fills in context from the docs even when a function name is vague; a model decides "use this or not" on the spot, from the name and description alone. So for the same capability, design decides the outcome.

It narrows to a few things. Names should read as an action instantly (`search_orders`, not `do_action`). The description isn't a human comment — it's an instruction to the model, down to "use this here, reach for something else there." Errors shouldn't throw a stack trace; give "why it failed and how to fix it" in natural language so the model self-recovers. Hard-to-undo actions like delete or charge must pass through a human approval step.

And the most-missed one — **more tools is worse.** Throw 50 at it and the model picks the wrong one. More choices means more wrong picks and more cost. The rule isn't "expose every feature" but "only what's needed now."

## So this is the resurrection of an old skill

By now it should feel familiar. Good names, a clear contract, strict types, least privilege, guards on irreversible actions — these are instincts anyone good at API design already had. Tool design isn't a new field; it's **API design with the consumer swapped to a model.**

Exactly two things differ. First, the description is read by a model, not a person — so the description *is* a prompt. Second, get it wrong and the model doesn't "throw an error" — it *wanders*. It quietly calls the wrong tool and produces a plausible failure. So the weight lands in the same place [we saw in "Agree on the Contract First"](/blog/24-contract-first) — how you define the interface becomes the synchronization point of collaboration. The other party just happens to be a model, not a human team.

## The two most common mistakes

In the field, nearly every server trips at the same spots.

One, **rebuilding what already exists.** Major systems — GitHub, Slack, databases — usually already have an official or community server. Searching the registry first is step one. Two, **exposing an existing REST API 1:1.** Moving 50 endpoints to 50 tools. The model uses them differently than a human, so they fragment into too many. Don't keep `get_user` + `get_orders` separate — collapse them into one `get_customer_summary` that matches the model's unit of *intent*.

## Why MCP, why now

The timing isn't a coincidence either. If [last time, watching OKF](/blog/28-open-knowledge-format), we saw the standard for what a model "knows" converging bottom-up, MCP is the next slot over — the standard for what a model "does." As agents got smarter, what people actually wanted wasn't a model that knows more but one that actually does things, and MCP is the plumbing bolted onto that demand.

So the question isn't "how do I build an MCP server." That's a few days. The real question is "how do I design tools a model won't fumble." I wrote up that answer on one page in the [MCP & Tool Design Guide](https://desty.github.io/mcp-guide/en/) — the three primitives, how it works, and 10 tool-design principles.
