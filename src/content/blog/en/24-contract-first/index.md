---
title: "The Days of BE Building and FE Catching Up Are Over — In the Vibe-Coding Era, You Agree on the Contract First"
summary: "The real leverage in vibe coding isn't generating code faster — it's setting up a clear contract for the AI to follow before any code is written. The data backs this up: AI cuts syntax errors by 76% but adds 322% more privilege-escalation paths (Apiiro), and security quality stays flat no matter how big the model gets (Veracode). The exact areas AI is weak at are precisely the ones an API contract encodes. So in the AI era specs didn't become less important — they became more important. From 'BE builds, FE catches up' to 'BE and FE agree on the contract first, and AI generates both sides.'"
date: "2026-06-20T10:00:00"
tags:
  - agent-engineering
  - api-design
  - llm
  - ai-agent
  - backend
draft: false
---

Here's how BE and FE usually work together on a team. Once the spec is settled, BE designs and implements the API. When it's done, they hand FE a Swagger doc or a spec sheet. FE wires up the screens against it, then finds the mismatches during integration testing and goes back to fix them. It's familiar, and it has worked well for a long time.

The problem is that it boils down to one sentence — **BE builds the API and FE catches up.** FE waits on BE's output. The spec exists, but sometimes it doesn't match the actual response. The docs are centered on the happy path, so states like empty, error, and permission-denied go undefined. The gap between the data shape the screen needs and BE's domain model only surfaces at integration time. Change the API once, and FE code, mocks, and tests all wobble together.

And once AI coding enters this picture, that fuzziness gets amplified straight into wrong code. When a spec is vague, a human asks "this probably means X, right?" — but an AI just fills the blank with something plausible.

That's where this post's thesis starts. The capability worth building in the vibe-coding era isn't churning out code faster — it's **setting up a clear contract for the AI to follow, first.** And, uncomfortably, the data backs this up head-on.

---

## AI Writes Code Well. It Writes Contracts Poorly.

First, the facts. This isn't a claim that AI writes bad code. **At the surface level, it actually writes code better than humans do.**

Apiiro analyzed work across tens of thousands of repos and thousands of developers at a Fortune 50 company. With AI coding tools, output velocity went up 4×, **syntax errors dropped 76%, and logic bugs dropped 60%.** Clean. Yet in the same data, security risk went up 10×. **Paths leading to privilege escalation rose 322%, and architectural design flaws rose 153%.**

Read the direction. AI is actually good at catching the trivial surface errors humans get wrong all the time. What gets worse is the *structural* flaws — the places where authorization goes missing, boundaries break, and the design drifts. And this isn't a "just use a bigger model" problem either. In 2025, Veracode ran 80 security tasks across 100+ LLMs, and the conclusion is chilling — **"models got better at writing syntactically correct code, but no better at writing secure code. Security performance remained flat regardless of model size."** 45% of AI-generated code failed the security tests; for Java it was 72%.

What's more uncomfortable: humans barely notice. In a Stanford study (Perry et al., CCS 2023), the group using AI tools wrote less secure code while **believing they'd written more secure code.** On a SQL injection task, 36% of the AI group produced vulnerable code, versus 7% in the control group. Code quality drops while confidence rises — the most dangerous combination in vibe coding.

Stop and look at this for a second. The list of areas where AI is systematically weak — authorization, boundary conditions, input validation, per-state handling, architectural consistency. Where have we seen that list before.

**It's exactly "the information an API contract encodes."** Who's allowed to call this endpoint (authorization), which values can be null (boundaries), what comes back on bad input (validation/errors), what the screen receives when there's no data (states). Another study (Li et al., 2025) found that 43.1% of LLM-generated code is less robust than human code, and 90% of those robustness defects come from **missing conditional checks** (null checks, range checks). Even when all the tests pass.

So the conclusion flips. AI taking over the typing doesn't make specs less important. **Because the gaps AI can't fill are precisely the ones a spec fills, the spec became more important, not less.** [Post #13](/blog/13-ai-ready-data/) argued that "when AI doesn't work, it's not the model's fault — it's the data." The same goes for code: hand the AI a fuzzy contract and you get a fuzzy result. Just as we had to make data AI-Ready, now it's the API contract's turn.

---

## So We Flip the Order — Contract First, Not Code First

The shift is simple. The old way had BE write the code and the spec fall out of it (code-first). Flip that: **agree on the spec first, then generate code, mocks, and tests against it** (design-first, or contract-first). You treat the OpenAPI document not as "an artifact that pops out when implementation is done" but as "the reference the implementation must follow."

What matters is that this isn't some idiosyncratic take of mine. It's a concrete piece of the broader push to redesign the development lifecycle itself ([Post #9](/blog/09-ai-dlc/)), and both industry and academia are moving the same way.

- **Industry.** In Postman's State of the API survey, API-first adoption rose from 66% to 82% in two years. Fully API-first organizations grew to 25%. They recover from incidents faster and ship APIs faster.
- **The AI discourse.** GitHub's Spec Kit nailed it in one line — **"moving from 'code is the source of truth' to 'intent is the source of truth.'"** The spec is "a contract for how your code should behave, and the source of truth your tools and AI agents use to generate, test, and validate code." OpenAI's Sean Grove puts it more sharply: **"code is a lossy projection from the specification,"** and 80–90% of the value lives not in code but in structured communication.
- **Academia.** Evidence is piling up that the clearer the spec, types, and tests, the higher codegen accuracy. Self-planning lifted Pass@1 by up to 25.4% (arXiv:2303.06689); type-constrained generation cut compilation errors by more than half (PLDI 2025). And the line that most directly backs this post's angle — the fastest path to APIs agents can use isn't writing more code but writing better contracts, which **"shifts the bottleneck from code generation to specification quality"** (arXiv:2507.16044).

The bottleneck framing should feel familiar. In [Post #22](/blog/22-recursive-self-improvement/) I wrote that execution (writing code) has become nearly free and the bottleneck moved to judgment. Contract-first collaboration is exactly that — nailing down the judgment *before any code, in one document.* It's the same place [#21](/blog/21-claude-fable-5/) landed when it said the prompt's job shifted from accelerator to brake — a contract is the strongest brake you can put on an AI.

It isn't even a new idea. Ian Robinson at ThoughtWorks formalized Consumer-Driven Contracts in 2006, and API-first predates that. The "agent-ready API" you hear about lately is the same lineage. Take apart an MCP tool definition and it's `name` + `description` + `inputSchema (JSON Schema)` — and OpenAPI's parameters and request bodies are JSON Schema too. **An agent's tool contract is a repackaging of the machine-readable contract OpenAPI has been doing for over a decade.** All that changed is the consumer reading the contract went from human to AI — and AI doesn't cut a fuzzy contract any slack.

---

## What Actually Changes in Practice

Flip the order and the workflow becomes this.

Before: spec → BE design → BE build → hand over Swagger → FE build → integration test → fix bugs.

After: spec → **define screen states and scenarios → draft the data shape FE expects → draft the API contract → BE/FE review it together → finalize the OpenAPI** → from here, generate the mock server, FE client, and BE skeleton *in parallel* → FE develops against the mock, BE develops against the contract, simultaneously → they converge via contract tests.

The key change in one line: **from "FE integrates after BE builds" to "BE and FE develop in parallel after agreeing on the contract."** FE doesn't wait on BE.

The standards that actually pay off come down to a handful. All of them remove "places where AI would otherwise infer fuzzily."

- **Make nullability explicit.** This is where things break most often in an AI setting. Distinguish optional from nullable, distinguish empty string from null, and return an empty list as `[]`, not null.
- **Unify the error response shape.** Whether the framework is Kotlin Spring or Python FastAPI, use the same shape carrying `code`, `message`, and `traceId`. Standardize common error codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR).
- **Fix success-response, pagination, date, and ID rules to one form.** Decide *one way* on whether to wrap responses in a common envelope (mix them and FE types all go sideways); pagination as `items`, `page`, `size`, `totalCount`, `hasNext`; time as a single ISO-8601 form with offset; IDs as string, not number.
- **Don't put only the happy path in mocks.** Define empty, permissionDenied, validationError, and serverError alongside success. These mocks get reused as-is across FE development, Storybook, and E2E.

Even in a shop running both Kotlin Spring Boot and Python FastAPI, unifying isn't hard. The chain — Controller/Router → Request DTO/Schema → Validation → Service → Repository/Client → Response → Exception Handler → OpenAPI — is the same on both sides, just with different names. Put the basis for collaboration on the **HTTP API Contract** rather than the framework, and the language differences drop below it.

And when you hand work to the AI, you give it the contract as input. "Don't invent fields that aren't in the Contract; don't change nullability on your own; don't make up new enums or error codes; follow the Contract for paths, methods, and status codes." These rules aim squarely at the AI weaknesses we saw earlier — arbitrary inference, missing validation.

---

## It Isn't Free — Get One Thing Wrong and It Collapses

To be honest: contract-first isn't a silver bullet, and done wrong it's worse than code-first.

The most common failure is **not nailing the source of truth to one place.** springdoc and FastAPI auto-generate OpenAPI from code. But contract-first writes the OpenAPI by hand, first. If both are the original, you end up fighting over "which one is right" every time BE touches the code. This is most of why contract-first adoptions fail. You have to decide — **at the agreement stage, the hand-written OpenAPI is the original, and the OpenAPI generated from code is for verification.** Break the CI on a diff between the two to stop drift.

Second, maintaining contract, mocks, and contract tests all three is real overhead. Even Pact's own docs spell out "when not to use it" — when there are too many consumers to keep team-to-team relationships, public APIs, pass-through APIs that just forward what they receive. ThoughtWorks' Birgitta Böckeler called applying spec-first to small problems "like using a sledgehammer to crack a nut." For exploratory prototypes, internal tools owned by a single team, and spikes you'll rip up fast, it's overkill. Apply it **where a stable contract is actually valuable first — external, multi-team, long-lived APIs.**

Third, the contract has to stay alive. The moment it degrades into a formal document nobody touches after the first sprint, it becomes a false document — worse than code-first. So tie the rules to CI checks, not human goodwill, wherever you can.

---

## Conclusion

BE/FE collaboration in the vibe-coding era shouldn't head toward "churning out code faster with AI" but toward "setting up the spec for the AI to generate correct code, first."

The grounds are in the data. AI writes the syntax and the surface better than humans. But it's systematically weak on authorization, boundaries, validation, and architecture; a bigger model doesn't fix that; and people barely feel the defects. That weak zone is exactly the zone **an API contract encodes.** So the freer code-writing becomes, the more expensive the contract gets.

What's left to standardize comes down to four things — the OpenAPI Contract, mock data, common Error/Pagination/Nullability rules, and contract tests. Even running Kotlin Spring and FastAPI side by side, put the basis on the HTTP contract rather than the framework and it unifies.

In [#22](/blog/22-recursive-self-improvement/) I wrote that execution became free and the bottleneck moved to judgment. Contract-first collaboration is the concrete way to nail that judgment down before the code. The core capability of the vibe-coding era isn't writing code fast — it's **designing a contract the AI and the team can both read without misunderstanding.** It's the most practical conclusion of the thread running since [#11](/blog/11-cognitive-debt-and-agentic-coding) on cognitive debt.

---

*References*

- Apiiro — *4x velocity, 10x vulnerabilities*: [apiiro.com](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/)
- Veracode — *2025 GenAI Code Security Report*: [veracode.com](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
- Perry et al. — *Do Users Write More Insecure Code with AI Assistants?* (CCS 2023): [arXiv:2211.03622](https://arxiv.org/abs/2211.03622)
- Li et al. — *Robustness of LLM-generated code* (2025): [arXiv:2503.20197](https://arxiv.org/abs/2503.20197)
- GitHub — *Spec-Driven Development with AI / Spec Kit*: [github.blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) · [github.com/github/spec-kit](https://github.com/github/spec-kit)
- Sean Grove (OpenAI) — *The New Code*: [youtube.com](https://www.youtube.com/watch?v=8rABwKRsec4)
- *Specifications as the bottleneck for agent-ready APIs*: [arXiv:2507.16044](https://arxiv.org/abs/2507.16044)
- Ian Robinson — *Consumer-Driven Contracts*: [martinfowler.com](https://www.martinfowler.com/articles/consumerDrivenContracts.html)
- Postman — *State of the API Report 2025*: [postman.com](https://www.postman.com/state-of-api/2025/)
- Pact — *When not to use contract testing (FAQ)*: [docs.pact.io/faq](https://docs.pact.io/faq)
- Birgitta Böckeler (ThoughtWorks) — *Spec-driven development tools*: [martinfowler.com](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
