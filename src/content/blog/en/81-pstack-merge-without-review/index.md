---
title: "What You Need Before Merging 2,000 PRs Without Review: Lauren Tan's pstack and Dune"
summary: "Lauren Tan, a former Cursor engineer now building Grok Bot at SpaceXAI, says she merged 1,000 PRs to production in July and 2,462 in August. The story spread as 'she doesn't look at the code', but she answered that she reads what her agents land after the fact and turns what she finds into lints and structure. The job pre-merge human review used to do is split across three mechanisms: evidence from running the real app, a verdict from an agent that did not write the code, and a codebase where rules fail CI. I read the transcripts of two talks, her posts on X, and the code and 90-commit history of pstack, her open plugin, to see how each mechanism is built, and reproduced the patch-id rule that ties a verdict to a patch. After covering token usage and the numbers nobody has audited, the last section lays out the order in which a team on a normal budget could adopt this."
date: "2026-09-27T18:36:00+09:00"
tags:
  - agent-engineering
  - harness-engineering
  - agentic-coding
  - code-review
  - multi-agent
draft: false
---

Lauren Tan worked at Meta, Netflix and Cursor, and is on the React core team working on React Compiler. She now builds the Grok Bot client at SpaceXAI. In an August workshop she said she had merged 1,000 PRs the previous month (July), and an image in a guide she published in early September reads "Ending the month of August with 2,462 PRs in production." The talk she posted on X on September 21 passed 2.75 million views, and it circulated as "she merges 1,000 PRs a month without looking at a single line of code."

This post answers two questions. If no human reads the code before merge, what does that job instead? And how much of it can a team on an ordinary budget bring over? I read the transcripts of two talks (a 59-minute Maven workshop on August 12 and a 38-minute talk released September 21), posts by her and a teammate on X, and [pstack](https://github.com/cursor/plugins/tree/main/pstack), which is published under MIT in Cursor's official plugin repository. I read pstack at 0.15.5 (commit `ecc249f`, September 25) along with its 90 commits since May 22. Dune, the framework at the center of the talk, is not public, so I cover it only through what she said and the principles visible in pstack. The only experiment is a reproduction of the patch-id rule.

[#74](/blog/74-jev-completion-evidence/) covered checking an agent's completion report against execution evidence, and [#56](/blog/56-grok-bot-shared-computer/) covered Grok Bot's security design. This post looks only at the merge decision.

## Reading the code moved to after the merge

"She doesn't look at the code" is half right. In the workshop she said, "I really don't look at the code anymore." But when asked the same thing on August 26, she replied:

> i still look at the code! i review what my agents land, and also what other engineers on my team are merging and i try to be observant about where the code smells are. then i either refactor the code to eliminate the problem entirely or i add lints to prevent it from happening. ([source](https://x.com/poteto/status/2092512896408592713))

Put together: she does not approve PRs one by one before merge. She reads code that is already on main and makes whatever she finds impossible to repeat, either by restructuring the code or by adding a lint. That, she says, steadily widens the set of changes that are safe to land as long as CI passes.

A [Grok Bot engineering guide](https://x.com/lingxi/status/2094493172516966781) by her teammate Lingxi Li gives the auto-merge conditions in more detail. Every 30 minutes a check looks at bot review findings, CI failures and merge conflicts, and "if the review is highly confident and the blast radius is low, the PR is merged automatically." The guide also mentions running postmortems when a PR that was not examined carefully caused an incident. Lauren Tan puts no hard cap on PR size but has her agents split work into PRs of roughly 50 to 1,000 lines so they are easy to revert.

So human review has not disappeared. It has left the merge decision. Three mechanisms fill that slot.

## Mechanism one: evidence from running the real app

She describes where trust starts:

> the ability for an agent to actually run the code or take CPU traces or heap snapshots or open an iOS simulator … that's the thing that really closes the loop. It doesn't guarantee your agent writes good code but it allows them to at least write correct code

At Cursor the team first built control skills that let an agent drive the app. But bug reports in Slack were often a cropped screenshot with three question marks. The agent could run the app but had to guess what the user meant. That led to the **Feature Map**: one file per feature describing how a user reaches it, which commands an agent uses to drive it, and what observable state proves it works. An automation keeps the map up to date.

pstack publishes this as `/create-verification-skill`. It interviews the repository before asking the user anything and generates a project-local `verify-<app>` skill with five sections.

| Section | Contents |
|---|---|
| Launch | The exact start command, the signal that it is ready, and teardown |
| Doctor | A read-only check that the running instance is worth driving |
| Drive | Real selectors and commands from this repo, preferring stable handles like ARIA labels and data attributes over coordinates |
| Evidence | What to capture as proof and where it goes |
| Cleanup | Tear down only what the run started, never the evidence |

The generator must also run the skill end to end once before handing it over. A skill that was never executed counts as a draft.

The Gotchas section of the example feature file is worth a look. For a note-saving feature it says "A save status alone is insufficient proof. Reopen the note from the list," and "Titles are trimmed on save. Assert the rendered title, not the draft input value." The places an agent is easily fooled are written down per feature. The check also depends on the kind of change: a CLI change runs the real command, a UI change walks the changed flow in the running app, a parser or migration replays saved input, and a perf change compares before and after profiles.

As she says herself, this mechanism gets you to correct code. Whether the code is good is another mechanism's job.

## Mechanism two: a verdict from an agent that did not write the code

pstack's [Shipping playbook](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/shipping.md) defines the pre-merge verdict:

> Safe means a verdict from an agent that did not write the code. CI green is not a verdict, and an approving bot review is not a verdict.

Each PR gets its own fresh cloud agent, which drives both the parent commit and the PR head through a control skill and posts `PASS`, `PASS+NOTES` or `FAIL` on the PR. The Orchestrate playbook, which coordinates many agents, adds that a unit's verifier should run on a different model family from its worker, since the same model reviewing its own output tends to miss the same things.

For stacked PRs, only the contiguous verified run from the bottom lands. A verified PR above an unverified one waits, because merging it would pull the unverified change in underneath.

The most careful rule is about recording which code a verdict applies to. The verifier records the head SHA, the base SHA, and the `git patch-id --stable` of the base-to-head diff. A rebase changes the SHA, so the SHA cannot tell you whether a verdict still holds. Right before merge the patch-id is recomputed: same value, the verdict stands; different value, verify again.

I checked how this behaves in a small repository: a branch that changes `b` to `B` in `app.txt`, rebased twice after trunk moved.

```text
verdict    sha=4269ca9  patch-id=571a9bd909c3
rebase 1   sha=c451196  patch-id=571a9bd909c3   # trunk changed only other.txt
rebase 2   sha=32b07bb  patch-id=e6050eb1c7db   # trunk appended d to app.txt
```

After the first rebase only the SHA changes and the verdict survives. After the second, the branch's change is still the single line `b`→`B`, yet the patch-id changed, because the `d` trunk added now appears as a context line in the diff. The rule leans toward discarding a verdict and re-verifying whenever nearby code moves.

The gap runs the other way too. When trunk changes a different file, as in the first rebase, the patch-id stays the same even if that change conflicts with the PR semantically. pstack keeps the code verdict in that case but re-runs CI and mergeability at the current head, and the Autopilot-full playbook adds a regression lane that runs the same scenario on trunk. patch-id only confirms that the judged code is unchanged. Whether the combined result is correct needs a different check.

One caveat. These are the rules in the public pstack. The merge bar Lauren Tan described on X for the Grok Bot codebase was "CI passes," and Lingxi Li's guide names review confidence and blast radius. I could not confirm that the internal setup matches the Shipping playbook.

## Mechanism three: a codebase where rules fail CI

In the public talk she ranked the things that make agents trustworthy from strongest to weakest: the codebase itself, static analysis (lints, compiler, CI), rules, bot review and skills, and finally a style guide that humans enforce in review. The difference is enforcement.

> these two actually make CI red … for rules and skills and bugbot your agents can still forget

pstack's `encode-lessons-in-structure` principle writes the same idea as a rule. When you catch yourself writing an instruction for the second time, ask whether it can be a lint, a metadata flag, a runtime check or a script; if it can, encode it and delete the instruction. When several mechanisms would work, pick the strongest: an unrepresentable state that cannot compile, then a lint or banned API that fails CI, then a canonical helper, then a runtime check. The reason, added in a June 4 commit, is the core of this post:

> because agents copy whatever the surrounding code already does and a weaker guard becomes the next template.

Agents write like the code around them. In the talk she said anti-patterns "spread kind of like a virus": one small workaround, or one comment explaining a workaround, and agents keep copying it. A pattern forbidden only in a rules document gets into the code the first time an agent forgets the rule, and from then on that code is the template for the next change.

Dune applies this principle to Grok Bot's desktop client. She describes it as "like Next.js for Electron apps, and it's designed for agents to write." The rules she described:

- **No useEffect.** React's `useEffect` is banned in Dune and the Grok Bot code.
- **No code comments.** Most comments agents wrote were history or things like "Lauren said you should never do this." Worse, agents cited the comments around the code as justification for not solving the actual problem.
- **Main and renderer separated.** There are `electron-main` and `electron-renderer` directories, and CI checks the dependency graph and fails imports that cross the boundary. The reason is the frame budget: 16ms at 60fps, 8ms at 120fps.
- **Feature folders.** Code for one feature lives in one folder.

The principle behind all of them is "the shortest path is the best path."

> agents love taking shortcuts. So, what if we designed a framework such that the shortcut, the easy path is the right path

She admits a codebase like this is annoying for humans, because it pins down what you can and cannot do. In exchange, even an agent with almost no context produces good code by following the paved path. Her counterexample was Cursor's agents window, which she said regresses often because it lacks this architecture.

She said Dune will not be open-sourced; in the workshop she called it "more of a collection of ideas and principles." The public pstack carries the same idea as the `/no-comments` skill. It spawns a comment-deleting subagent; when it finds a comment asserting a constraint such as "do not remove," it offers to encode that constraint as the cheapest type, test or lint and then deletes the comment. Comments explaining surprising behavior in our own code are deleted and the code is flagged for a rename or restructure.

## What the model upgrade removed, and what it kept

pstack's commit history shows an interesting pattern. Commit [#419](https://github.com/cursor/plugins/pull/419) on September 23 is titled "cut 19 more instructions Opus 5.5 does not need." Among the deletions were these lines from the `prove-it-works` principle:

```diff
-Code and features:
-1. Build it (necessary but not sufficient)
-2. Run it and exercise the actual feature path
-3. Check the full chain: does data flow from input to output?
-...
-Delegation: trust artifacts, not self-reports.
```

Explanations of how to verify were cut because the model now follows them without the text. Over the same period, the Shipping playbook's independent verdict, the patch-id rule and the contiguous-verified-run rule all stayed. On September 9 a rule was even added: every claim carries its evidence or its label (measured, inferred or guess) in the same sentence.

My reading: as models improve, sentences explaining what to do become unnecessary, while rules that fix structure, such as who judges and which code a verdict applies to, stay regardless of model strength. [#44](/blog/44-surviving-model-churn/) covered the assets that survive model changes, and pstack's history points the same way.

## Cost, and what is not verified

This approach burns tokens. In a reply on X she said she averages about 15 billion tokens a day, and in the workshop she said, "I work at an AI lab where we have unlimited tokens, so I definitely cannot say this is something everyone should do in the exact same way." Refactoring a codebase into this shape is token-heavy up front, and spawning many agents before you trust them, she warned, just produces a pile of sloppy PRs. Moving Grok Bot to the Dune architecture alone took more than 600 PRs.

Rob Shocks, who tried pstack, posted [a side-by-side comparison](https://www.youtube.com/watch?v=lUhXa8GiXns). The task took 30 minutes with Fable 5.1 alone and an hour with pstack, and pstack caught three false claims from the agent. It is one person and one task, so it does not generalize, but it makes clear that verification costs time and tokens.

The numbers deserve care too. The July 1,000 and August 2,462 figures are self-reported, and nobody outside her team has audited them. The September 21 post says 2,500 while the attached video says 2,000. The "15 to 20 agents" and the five named bots in some summaries come from Lingxi Li's guide, not from Lauren Tan; she did not say in the talks how many agents she runs at once. On code quality she said herself that "a lot of you will definitely be questioning how much of this code is actually good, and I think that's definitely fair to question."

## Bringing it to your own repository

Much of this carries over to teams without unlimited tokens, but order matters. As she stressed, adding parallel agents before you have trust only adds PRs to review. What follows is my proposal based on pstack and the talks, not something I adopted and measured.

**1. Write the finish condition as something that can pass or fail.** Instead of "make it better," give checks. The pstack guide's example:

```text
add json output to this command. text output stays byte-identical, the json parses,
both run against the sample project. show me the evidence.
```

**2. Start with one verification skill and three to five feature map entries.** In Claude Code, put Launch, Doctor, Drive, Evidence and Cleanup in `.claude/skills/verify-<app>/` and map the features that break most often first. pstack's `create-verification-skill` is a Cursor plugin, but the SKILL.md body is a tool-neutral procedure you can follow as is. There is also a [public example repository](https://github.com/poteto/verification-skill-example).

**3. When you make the same review comment twice, turn it into a CI rule.** Two of Dune's rules are easy with common tools. The useEffect ban is an ESLint config:

```js
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react', importNames: ['useEffect'],
                  message: 'This repo does not use useEffect. Derive state or move it to an event handler.' }],
      }],
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.property.name='useEffect']",
        message: 'React.useEffect is banned too.',
      }],
    },
  },
];
```

The process boundary can be checked with a tool like dependency-cruiser:

```js
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [{
    name: 'renderer-must-not-import-main',
    severity: 'error',
    from: { path: '^src/electron-renderer' },
    to: { path: '^src/electron-main' },
  }],
};
```

The error message becomes the instruction the agent reads. If it says what to use instead, the agent fixes it on the next attempt.

**4. Have an agent other than the author judge, and record what it judged.** Ideally a verifier from a different model family runs the verification skill against both the parent commit and the PR head. Store the head SHA and `git diff <base> <head> | git patch-id --stable` with the verdict, and recompute right before merge.

**5. Start auto-merge narrow.** Begin with small PRs that are easy to revert and changes with a small blast radius. Irreversible actions such as deploys, data deletion and force-pushing shared branches always pause for a human in pstack too. Spend part of the time saved on pre-merge review on post-merge review: reading what landed and turning what you find into rules as in step 3.

To see whether it works, count four things over a few weeks: PRs reverted after merge, repeated review comments, the share of `FAIL` verdicts from independent verifiers, and token cost per PR. If reverts or incidents rise, narrow auto-merge. If the same comments keep coming, the rule still lives in a document rather than in CI.

## Summary

Lauren Tan does not read code before merge. Three mechanisms take that place: evidence from running the real app, a verdict from an agent that did not write the code, and a codebase where repeated review comments have become CI failures. The human reads merged code later and makes what they find impossible to repeat. The public pstack implements the first two as playbooks and skills; Dune, the example of the third, is public only as principles.

The 2,000-plus PRs a month are self-reported and come from a budget of about 15 billion tokens a day. What an ordinary team should take is the order rather than the count: build evidence with a verification skill first, move repeated comments into CI, and only then grow the number of agents and the scope of auto-merge.

## References

- [How I Shipped 2000 PRs Last Month — Trusting AI Agents (YouTube, 2026-09-21)](https://www.youtube.com/watch?v=NjoZoUm85x0)
- [How Cursor Turned AI Agents Into Better Engineers (Maven workshop, 2026-08-12)](https://maven.com/p/e23d9c/how-cursor-turned-ai-agents-into-better-engineers) · [recording](https://www.youtube.com/watch?v=Cmoh-yR-usA)
- [pstack (cursor/plugins)](https://github.com/cursor/plugins/tree/main/pstack) · [Shipping playbook](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/shipping.md) · [create-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/create-verification-skill/SKILL.md)
- [poteto: "i still look at the code!" (X, 2026-08-26)](https://x.com/poteto/status/2092512896408592713)
- [poteto: agents merge their own PRs because of Dune (X, 2026-08-11)](https://x.com/poteto/status/2087244771849089270)
- [poteto: 1,000 PRs and the Full Autopilot playbook (X, 2026-08-19)](https://x.com/poteto/status/2090141955695198633)
- [poteto: about 15b tokens a day (X, 2026-08-27)](https://x.com/poteto/status/2092884264581013952)
- [Lingxi Li, Grok Bot for Engineering (X, 2026-08-31)](https://x.com/lingxi/status/2094493172516966781)
- [Rob Shocks, Pstack Is Agent Overkill. Use It Anyway! (YouTube, 2026-09-08)](https://www.youtube.com/watch?v=lUhXa8GiXns)
- [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example)
