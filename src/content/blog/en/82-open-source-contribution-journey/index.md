---
title: "Open Source Contribution Became Part of My Week: 18 PRs and 3 Merges with Claude Code"
summary: "Most of the open source PRs I opened in the past were documentation translations. Reading an unfamiliar codebase, fixing a bug, and getting it through maintainer review felt out of reach in the few hours I had after work. Between April and October this year I opened 18 PRs across 10 repositories with Claude Code, and 3 of them were merged in opik, penpot, and haystack. Using my own PR history, this post covers how those three got through review, what the 10 closed PRs taught me about repository rules, and an order of steps for anyone who wants to make a first contribution with an agent."
date: "2026-10-16T10:00:00+09:00"
tags:
  - open-source
  - agentic-coding
  - claude-code
  - code-review
draft: false
---

Most of the open source PRs I opened years ago are Korean translations: the nuxt docs in 2018 and the Kubernetes docs in 2019. I always wanted to send code fixes. But finding where a bug lives in an unfamiliar codebase, running the project's build tools and tests, and going back and forth in review was more than I could fit into a few hours after work. A translation was a contribution I could finish in that time.

From April 18 to October 16 this year I opened 18 PRs across 10 repositories with Claude Code. Three were merged, in comet-ml/opik, penpot, and deepset-ai/haystack. Five are waiting for review, and ten were closed. The code ranged from a Python evaluation metric and SCSS layout to a log compressor written in Rust and middleware in the Vite dev server, none of which I would have touched on my own.

This post is a record of those six months. It covers how the three merged PRs got through review, what the ten closed PRs taught me about repository rules, and an order of steps you can follow if you want to make a first contribution with an agent. The sources are my public PRs and review threads on GitHub and each repository's contribution docs. [#81](/blog/81-pstack-merge-without-review/) looked at a maintainer who merges without pre-merge review; this one is the view from the outside contributor who gets reviewed.

## What got easier

What used to stop me from contributing code was not the fix itself but everything around it: setting up an environment to reproduce the issue, finding the relevant code, satisfying the project's formatter, linter, and type checker, and adding tests. Working with an agent cut most of that down.

- **Reproduction**: I ran the reproduction script from each issue to confirm the bug first. For redis-vl-python that meant starting a `redis:8.4` container.
- **Project tooling**: hatch for haystack, cargo and pytest for headroom, prettier and stylelint for penpot. My local pnpm was broken for penpot, so only the check tools were installed separately. Alone, I would have stopped there.
- **Tests**: Every time, I checked that the new test failed on the unfixed code and passed after the fix. As you will see below, a reviewer looked at exactly this.
- **PR descriptions**: Each repository has its own template and title format, and each description explained the reason for the change and the verification.

The three merged PRs were small: +22/−6 lines (penpot), +79/−9 (opik), and +17/−3 (haystack). Most of the time went into picking bugs that could be fixed in a small change and making the reason easy for a reviewer to check.

## The three merged PRs

### opik #8528: review changed the fix proposed in the issue

opik's `ConversationDegenerationMetric` scores whether a conversational AI's replies are collapsing into repetition. [Issue #8519](https://github.com/comet-ml/opik/issues/8519) pointed out that replies with no words, such as "..." or "???", were skipped entirely, and proposed scoring them as maximum risk (1.0). My first version did exactly that.

Reviewer aadereiko requested changes with four points. Clearing the previous-turn record on a wordless turn misses repetition with filler in between, like "same sentence → ... → same sentence". Hard-coding 1.0 skips the four-factor average every other turn goes through: a verbatim repeat scores only 0.25, yet "..." would score 1.0, and since the metric reports the peak, one "..." among fifty good replies would make the whole conversation look fully degenerate. The other two points were the unchanged docs and a missing test.

Looking again, the existing helpers already handled an empty token list. Removing the single `continue` that skipped wordless turns made such a turn score 0.25, the same as a one-word reply. A wordless turn no longer touches the previous-turn record, and I added a filler-loop test and docs. When a review bot later suggested going back to 1.0, I declined, citing the maintainer's review.

The comment from awkoy, who approved and merged it, was short: "The loop-through-filler case is covered, and the tests fail on main as they should." Checking that the tests fail before the fix, and saying so in the PR, became the reason for approval. The fix went up three days after the review, and the PR was merged three days later, on September 30.

### penpot #11487: a review with four screenshots

penpot's typography sample was sized for the English "Ag" in a 24px column. In Korean the sample string is "가나다", and in Arabic it is longer still, so the sample wrapped and overflowed the row. Being a Korean speaker is why I noticed it.

I let the sample column grow with its content, and reviewer EvaMarco pointed out four places, with screenshots, where the spacing the old fixed width used to provide was gone and the sample overlapped the name. I fixed the dashboard library card, the sidebar detail view, and the rename row in one commit and answered point by point. penpot requires a DCO sign-off (`-s`) and `:bug:`-style commit messages. Before-and-after screenshots went on a separate branch of my fork, linked by commit-pinned URLs. Opened September 3, merged October 1.

### haystack #12908: a side effect the issue did not mention

[Issue #12893](https://github.com/deepset-ai/haystack/issues/12893) said the docstring of `LinkContentFetcher._resolve_handler` did not match its behavior. While reading the code I found one more problem. For an unregistered content type, the fallback read `self.handlers["text/plain"]`, and because `handlers` is a `defaultdict`, that read actually inserted a `text/plain` key.

```python
>>> f = LinkContentFetcher()
>>> "text/plain" in f.handlers
False
>>> f._resolve_handler("font/woff")
<function _text_content_handler ...>
>>> "text/plain" in f.handlers
True
```

The reproduction went into the PR description as is, along with a test that the fallback leaves `handlers` unchanged for `font/woff`, `multipart/form-data`, and an empty string. It fails on main and passes with the fix. I added the release note haystack requires, signed the CLA, and wrote in the description: "This PR was fully generated with an AI assistant. I have reviewed the changes and run the relevant tests." During review the branch conflicted with main, reviewer sjrl asked me to resolve it, and the next day I moved the test to clear the conflict. Merged October 15.

haystack's [CONTRIBUTING.md](https://github.com/deepset-ai/haystack/blob/main/CONTRIBUTING.md) has one more rule for first-time contributors: until your first PR is approved, it must be your only open PR, and additional PRs are closed automatically. This merge lifted that limit.

## What the ten closed PRs taught me

Grouped by reason, the closed PRs look like this. Only headroom lost on code quality; the rest were decided before anyone reviewed the code.

| Reason | PRs | What happened |
|---|---|---|
| Not assigned to the issue | langchain #36867, pydantic-ai #7307 | A bot closed the PR because the outside contributor was not the issue's assignee |
| An earlier PR existed | pydantic-ai #5627, llama_index #21830, openclaw #68845 | Another PR already addressed the issue. I closed the llama_index one myself |
| Agree on direction first | marimo #9762, #9806, #10434 | I was told to agree on the approach in the issue first, and that one feature would not be supported for security reasons |
| Fixed by another PR | marimo #10435, headroom #3819 | Another PR fixed the same problem first and was merged |

pydantic-ai #7307 met two bots on August 8. The Macroscope review bot gave it an approval verdict ("a straightforward bug fix… includes a test"), and a GitHub Actions bot closed it because issue #7284 was not assigned to me. That is when it sank in that a PR gets closed for skipping a step even when the code is fine. langchain's bot message states the same rule: outside contributors ask for assignment on the issue first, and once assigned, the PR is reopened automatically.

headroom #3819 lost on the code. I fixed [issue #3814](https://github.com/headroomlabs-ai/headroom/issues/3814), where compressing a pytest log dropped the middle `FAILED` lines of the `short test summary info` section, in both the Rust core and the Python implementation, and the existing tests and parity fixtures all passed. The next day another contributor opened [#3828](https://github.com/headroomlabs-ai/headroom/pull/3828) for the same issue. It implemented both options from the issue (keep the failure lines and name any that are dropped) and tested CRLF line endings and malformed headers. Collaborator JerrettDavis left two defects on my PR: a line that merely contains the phrase, like `=== diagnostic: short test summary info unavailable`, would open the summary section, and when the global line cap binds, middle lines are still dropped without names. He merged #3828 the same day. The lesson: for code with varied input, like compressors and parsers, test odd inputs and cap boundaries from the start, not only the happy path.

The marimo PRs taught me a lot too. marimo expects you to agree on the approach with a maintainer in the issue, then open the PR as a draft and sign the CLA. My first PR (#9762) was closed without comment the day I opened it, and #9806, which resubmitted the same fix, was closed three months later with a request to discuss the approach in an issue first.

## If you want to start contributing with an agent

Here is the order I settled on over six months. Each step was added as early PRs got closed, and all three merged PRs were opened in September, once the order was mostly in place.

**1. Read the repository's AI policy first.** Check `CONTRIBUTING.md`, `AI_POLICY.md`, `AGENTS.md`, and the PR template for whether agents are banned or disclosure is required. Repositories differ a lot.

Even the rules I ran into myself vary this much:

| Repository | Rule I ran into |
|---|---|
| langchain, pydantic-ai | Only the issue's assignee may open a PR; otherwise a bot closes it right away |
| marimo | Agree on the approach in the issue first, open the PR as a draft, sign the CLA |
| haystack | Add a short disclaimer to fully AI-generated PRs; only one open PR until your first is approved |
| opik | Fill in the `AI-WATERMARK` block with the tools, models, and scope used; sign the CLA |
| penpot | DCO sign-off and `:bug:`-style commit messages |

Some are stricter. polars's [AI_POLICY.md](https://github.com/pola-rs/polars/blob/main/AI_POLICY.md) forbids agents from interacting with the repository and allows PRs with AI-generated code only for `accepted` issues. So read the contribution docs end to end.

**2. Check whether the issue already has a linked PR.** Count the PR cross-references in the issue timeline. If it is not zero, someone is probably already on it.

```bash
gh api repos/<owner>/<repo>/issues/<num>/timeline \
  -q '[.[]|select(.event=="cross-referenced" and .source.issue.pull_request)]|length'
```

If the repository requires assignment, ask for it in the issue and wait. Issues filed by maintainers themselves had a clear direction and less competition, which made them good first picks. If the issue author wrote "happy to open a PR", look at their PR history; with none, it is usually just politeness.

**3. Write a test that fails before the fix.** Run the issue's reproduction to confirm the bug, and note in the PR that the new test fails on main and passes with the fix. That is exactly what the opik reviewer pointed to when approving. Test malformed input and boundary conditions, not only normal input; that is what I missed in headroom.

**4. Before implementing the issue author's proposal, check it against the existing design.** Hard-coding 1.0 in opik came from the issue, but it did not fit the existing scoring. Agents tend to implement the fix written in the issue faithfully, so this question had to come from me.

**5. Fill in the PR template completely and disclose AI use the way the repository asks.** opik's `AI-WATERMARK` block asks for the tools, models, scope, and what a human verified. When a CLA bot comments, sign right away.

**6. Address review point by point and reply with commit hashes.** All three merged PRs answered each review point in order and said which commit fixed it. When a review bot's suggestion conflicts with the maintainer's review, follow the maintainer and leave a reason for not applying the bot's suggestion.

## PRs still open

Five PRs are open. lancedb #4314, llama_index #22611, and opentype.js #875 are waiting for review. vite #22559 got a change request on June 15, which I only addressed on July 29, and it is now waiting for re-review. redis-vl-python #742 got five inline review comments on September 28 that are still on my side. Those two are teaching me that even when an agent cuts the time to write code, a PR stalls on my end unless I set aside time to answer reviews.

## Summary

Of the 18 PRs I opened in six months, 3 were merged. The number is small, but for someone whose contributions used to be translations, it meant fixing an unfamiliar Python metric, an SCSS layout, and a `defaultdict` side effect and getting maintainer approval. Reading the codebase, reproducing the bug, matching the project's tooling, and writing tests became work I could share with an agent. What remained for me was reading the repository's rules first, checking an issue's proposal against the existing design, and answering reviews to the end. Next up: the five review comments on redis-vl-python, and a new issue in haystack now that the first-PR limit is lifted.
