---
title: "The 10.7k Stars Went to the Validator, Not the Diagrams — Archify and the Moment Skills Became Products"
summary: "A repository less than four months old has 10.7k stars, and its core is a 104-line SKILL.md. Archify is an agent skill that makes coding agents draw architecture diagrams — but what made it a hit isn't drawing talent, it's the 25,000 lines of deterministic validation code behind the instructions. A typed JSON intermediate representation, no delivery without passing validation, a repair budget of two rounds, and the instruction 'a non-zero exit can never be described as success' — I dissect a design that wraps a fuzzy generation task in a task-sized harness. Plus the lineage of a fork overtaking its dormant original, a skills ecosystem that now has sponsors and benchmarks, and five design moves worth stealing for your in-house skills."
date: "2026-08-09T10:00:00"
tags:
  - agent-engineering
  - harness-engineering
  - context-engineering
  - ai-coding
  - open-source
draft: false
---

I cloned a 10.7k-star repository and opened it to find that the core product is a single markdown file. [Archify](https://github.com/tt-a1i/archify) is an "agent skill" that makes coding agents — Claude Code, Cursor, Codex CLI — draw architecture diagrams, and the instruction file the agent actually reads, SKILL.md, is 104 lines long. Repository created April 15, 2026; less than four months later it has 10,751 stars, 833 forks, and a #9 spot on GitHub trending on June 30. It has two contributors.

If your takeaway is "we live in an era where a markdown file earns ten thousand stars," you're missing what makes this repository interesting. Behind SKILL.md sit six JSON schemas and 25,000 lines of JavaScript, and most of that code doesn't draw diagrams — **it verifies them.** My reading is that the stars went to that verification structure, not to the pretty pictures.

---

## What People Wanted Wasn't Diagrams — It Was Diagrams They Could Trust

Anyone who has asked a coding agent to "draw this system's architecture" knows how it goes. Nine times out of ten you get Mermaid. Arrows punch through nodes, labels overlap, and on any moderately complex topology the rendering breaks outright on a syntax error. The worse part comes after: even when the picture looks plausible, you have **no way to check whether it's right.** Diagrams, unlike code, have no tests.

That is precisely the gap Archify sells into. The repository description advertises "verifiable" right alongside "beautiful," and the first line of its product principles document is "Truth before spectacle." The agent never draws a picture. It writes a typed JSON intermediate representation, a local CLI checks that against schemas and layout rules, and only what passes gets rendered into a self-contained HTML file. The checks go all the way down to geometry: does an edge cross an unrelated node, does a relationship label mask another route.

The sentence in SKILL.md that stopped me:

> A non-zero exit can never be described as success.

Anyone who has operated agents knows why that sentence exists. An agent is an animal that reports "diagram generated successfully!" even when the validation command failed. This skill knows the species and plants a sentence at the instruction layer to block the false report. The output rules repeat the theme — never claim a visual inspection you did not perform; report unresolved diagnostics truthfully.

In [#17](/blog/17-maps-and-skills/) I read four trending repos and argued that what people want isn't a smarter model but the things around the model — less wandering, one-time setup, and control. Archify is a high-purity specimen of that third demand. Models are already smart enough to draw diagrams. What was missing was trust in the output, and the trust came from a validator, not a prompt.

## Anatomy: What Sits Behind 104 Lines of SKILL.md

Take the structure apart and this is less a diagramming tool than **a harness for exactly one task.** In [#35](/blog/35-harness-engineering/) I summarized the harness as "everything except the model" — the full set of controls that stop an agent before it produces an unwanted result and make it self-correct when it does. Here that control system has shrunk from app-sized to skill-package-sized. The design has four layers.

**First, the contract comes first.** There are exactly five diagram types — architecture, workflow, sequence, dataflow, lifecycle — and each exists as a JSON schema contract. The agent's degrees of freedom fold into the schema: seven component types, four variants, at most 12 primary nodes. I can't think of a cleaner case of the contract-first design from [#24](/blog/24-contract-first/) applied to a generation task. Not "make it pretty" in natural language, but a type system that only admits what it can express.

**Second, the generate-validate-repair loop has a budget.** Write a candidate JSON and `validate` runs nine checks; on failure, the agent fixes only the `subject` and `evidence` the diagnostic names, then revalidates. And there's a stop condition: if two consecutive rounds fail to reduce the error count, stop and report the remaining diagnostics as they are. It's bookkeeping that forces the agent to admit failure instead of burning tokens in an endless repair loop — the same philosophy as "spend budget only on verified work" from [#51](/blog/51-loopx-state-kernel/), shrunk to the size of a single task.

**Third, context has a budget too.** SKILL.md tells the agent what *not* to read as much as what to read. Read one schema and one example, nothing else. Do not open renderer source, validator source, or tests before the first candidate. Read the viewer-runtime document only if the user asks about those features. Three reference documents sit in a lazy-loaded tier. In the language of [#30](/blog/30-context-engineering/), this skill is not a prompt — it's a context budget sheet. Out of a 25,000-line codebase, what the agent actually reads is held to a few hundred lines.

**Fourth, the skill carries its own benchmark.** The repository ships a benchmark called Ordinary-Model Floor, and the question it measures is specific: can an ordinary coding agent produce a usable diagram on the first attempt, with no human repairing the JSON? It calls itself a delivery gate, not a model leaderboard. A renderer-valid but semantically wrong diagram counts as failure; so does a pretty diagram that fails deterministic validation. Skill quality is defined as **first-pass rate on a floor model.** The thesis from [#44](/blog/44-surviving-model-churn/) — the model is rented, the eval is owned — implemented literally, inside a skill repository.

The final delivery step is consistent with all of it. The `deliver` command freezes the exact specification bytes into a snapshot, renders it, atomically commits the HTML, and reports SHA-256 hashes and byte counts for both the spec and the artifact. A design that replaces the agent's "all done!" with a hash.

## Lineage: Skills Became Products

The second reason this repository makes good material is its ancestry. The SKILL.md metadata reads `based_on: Cocoon-AI/architecture-diagram-generator (MIT, v1.0)`. The original is a Claude skill from December 2025 that earned 6.8k stars and stopped receiving commits this May. Archify started in April as its fork — its very first version number is v2.0.0 — added the validator, typed renderers, exports, and the benchmark, and overtook the original within four months.

The relationship isn't entirely pretty. The August 4 commit log contains "docs: remove attribution section" — the README paragraph introducing the original was deleted, leaving only the one metadata line in SKILL.md. Legal under MIT, and it's also true that what was added outweighs the original. Still, it's worth recording as a sign that the skills ecosystem is importing open source's oldest dramas intact: forks, overtakings, and provenance fading.

The ecosystem facts: Vercel shipped the [skills CLI](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) this January, and one line — `npx skills add tt-a1i/archify -g` — installs a skill into Claude Code, Cursor, and a dozen other agents. Archify shows 8.7k installs on the skills.sh directory. The repository has two paying sponsors — an API reseller and an agent-memory startup — a v2.13.0 version number, a changelog, a roadmap, and a contribution guide.

List those out and you're describing an ordinary software product: versions, changelog, benchmark, sponsors, install counts, fork competition. In [#17](/blog/17-maps-and-skills/), looking at 250-skill bundles like ECC, I wrote that agent configuration would "eventually converge on a light, standardized format." Half right — the format converged on SKILL.md. The half I missed is that **a product layer would grow on top of that format.** A skill is no longer a config file; it's a distribution unit with its own validator, its own benchmark, and its own sponsors.

## In Practice: Use It, or Steal From It

**Using it first.** Installation is the one-liner above; then tell your agent "use archify to map this repository's runtime architecture." The output is a single self-contained HTML file — dark/light themes, node search, upstream/downstream tracing, PNG/SVG/WebM export. It's especially useful for architecture review: a delta feature compares two validated snapshots as Before/Delta/After and extracts exactly what was added, removed, changed, or moved. For attaching "here's how the architecture changes" to a PR, it beats Mermaid outright.

The limits are just as clear. The recommended cap of 12 primary nodes says it plainly: this draws **one story about one system,** not an org-wide map of dozens of microservices. Two contributors — effectively a single-person project — is a sustainability risk. And the factual accuracy of the diagram still depends on whether the agent read your code correctly: the validator guarantees structural and geometric consistency, not that the picture is the truth of the code. The repository-evidence feature (pinning revision-verified source links to nodes) narrows that gap, but it's opt-in.

**Stealing from it is the more valuable option.** If you're building agent skills in-house — release-note generation, migration scripts, report writing — there are five design moves to carry over from Archify.

1. **Route output through a typed intermediate representation.** Don't let the agent write the final format directly; make it pass through an IR a schema can validate. An output you can't validate is an output you can't improve.
2. **Make the validator a local CLI.** The gate should be a command with an exit code, not a checklist inside a prompt. Let the exit code — not the model's conscience — answer "did you validate?"
3. **State a repair budget.** "Fix it until it passes" is a token incinerator. Fix only what the diagnostic names, and report failure when improvement stalls.
4. **Write a do-not-read list.** Half of a good skill instruction is what not to read. Once an agent starts digging through implementation internals before its first artifact, you burn context and get worse results.
5. **Ship a floor-model eval with the skill.** Working on a strong model proves nothing. An ordinary model's first-pass rate is the skill's quality, and that number is what lets the skill survive as an asset when you switch models.

## What Remains

- Trust in agent output is built by validators. Archify's 10.7k stars were earned less by drawing skill than by the sentence "a non-zero exit can never be described as success."
- Harnesses are splitting from app-sized to task-sized. A contract (schema), a loop (generate-validate-repair), budgets (two repair rounds, a do-not-read list), and an eval (floor-model first-pass rate) all fit inside one skill package.
- The essence of a SKILL.md is not knowledge injection but the design of permissions and budgets. What to read and not read, when to stop, what to report — the document that decides those things is a good skill.
- Skills went from config files to products — versions, changelogs, benchmarks, and sponsors attached, forks overtaking originals, attribution fading. Open source's drama included.
- Even if you never use the tool, take the questions. Is your skill's output verifiable? Is the gate an exit code? Does repair have a budget? Is failure reported honestly?

Four months ago this repository started as the fork of a stalled skill. Today it's a product with a validator, a benchmark, and sponsors — and the conditions for the next fork to overtake it already exist in the same ecosystem. Saying skills became products means the fate of products now applies to skills too.

---

*Notes: [tt-a1i/archify](https://github.com/tt-a1i/archify) (star/fork/commit figures retrieved 2026-08-09; SKILL.md, DESIGN.md, PRODUCT.md, and benchmark docs from a same-day clone), [Ordinary-Model Floor benchmark](https://github.com/tt-a1i/archify/tree/main/benchmarks/ordinary-model-floor), [Cocoon-AI/architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) (the original skill), [Vercel — Introducing skills](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem), [Archify on skills.sh](https://www.skills.sh/tt-a1i/archify), [Trendshift history](https://trendshift.io/repositories/31352). For skill-bundle demand see [#17](/blog/17-maps-and-skills/), for the harness definition [#35](/blog/35-harness-engineering/), for contract-first [#24](/blog/24-contract-first/). This post is commentary on the design of skills as a distribution unit, not a recommendation to adopt any specific tool.*
