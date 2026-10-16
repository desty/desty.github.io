---
title: "REA, the Reverse-Engineering MCP That Got 275k Stars in Two Weeks — What People Took Apart Was Their Own Printers and Old Games"
summary: "REA (Reverse Engineer Anything) is an MCP server that connects coding agents such as Claude Code and Codex to reverse-engineering tools like Ghidra, IDA and JADX. It had 1,500 stars on October 4 and 275,000 on October 16. Reading its GitHub Discussions and Hacker News threads, the work people actually reported was mostly about software they already had: printing from a PC to a printer that only worked with a phone app, restoring old games, auditing their own services. What REA adds to earlier MCP servers is less an analysis engine than a record that attaches evidence and limitations to every conclusion. I read the repository and ran it against an Electron app I wrote and two npm packages, which surfaced what to know about output size and feature-trace accuracy. The showcases and an FPS-game decompilation project show that whether a result is right is decided by a separate check against the original. The post closes with the clean-room debate, an order for using it on your own project, and what package authors should move to the server and treat as their moat."
date: "2026-10-16T15:16:00+09:00"
tags:
  - agent-engineering
  - mcp
  - reverse-engineering
  - security
  - open-source
draft: false
---

REA (Reverse Engineer Anything) is an MCP server that lets a coding agent use reverse-engineering tools. One command, `npx rea-agents setup`, registers it with Claude Code, Codex, Cursor, Gemini CLI or Grok Build, and the agent then calls Ghidra, IDA, Hopper, JADX, Apktool and similar tools through it. Targets include native binaries, Electron apps, .NET assemblies, Android APKs, websites and firmware. It is MIT-licensed.

The repository exploded in early October. Wayback Machine snapshots show 1,513 stars on the evening of October 4 (UTC) and 5,957 early on October 6; the GitHub API today (October 16) reports 275,753 stars and 69,466 forks. Daily npm downloads went from 418 on October 3 to 103,109 on October 12. The spread appears to start with an October 4 post by the X account @_vmlops (320k views), and the October 10 Hacker News thread reached 806 points and 338 comments. The project itself began in April as an MCP server for Hopper and was renamed REA when it was rewritten in TypeScript in July.

This post checks three things: what people actually did with REA, what REA adds to existing reverse-engineering MCP servers, and how you know whether an agent's analysis is right. I read the code and docs at HEAD `2c75835` (October 16), all 66 GitHub Discussions and the main issues, and two Hacker News threads. I installed npm `rea-agents` 6.5.0 and ran its analysis on a small Electron app I wrote and on public packages from this blog's `node_modules`. I did not install native backends such as Ghidra or IDA, so binary analysis is covered only through the docs and showcase records.

## What people actually did with REA

Judging by the star count, you might assume everyone wanted to clone commercial apps, and the post that first spread the tool led with "Recreate features for your own stack". But collecting the Discussions and Hacker News comments that describe concrete use, the most common story is about devices and programs people already owned.

- **Using a device outside the phone app it was tied to.** In Discussion [#4152](https://github.com/morluto/rea/discussions/4152), a user wanted to print from Windows to an LX-D02 thermal printer that only worked with a phone app. The app turned out to be React Native with a Hermes bundle, and "the logic was in JS." On Hacker News, one user wrote a shim so Insta360 Studio could use an AMD GPU, saying manual RE "might've taken me several weeks." Another analyzed a printer driver.
- **Restoring and porting old games.** People reported rebuilding an abandoned MS-DOS game, restoring Win95/98 games byte for byte, and porting a 32-bit ARM game to 64-bit. Issue [#2072](https://github.com/morluto/rea/issues/2072) used REA as an "evidence ledger" while analyzing an NES game.
- **Auditing their own services from outside.** One user ran an outside-in check of their own Next.js and Stripe app ([#1406](https://github.com/morluto/rea/discussions/1406)); another built a defensive scanner that checks their site the way REA would ([#4328](https://github.com/morluto/rea/discussions/4328)).
- **Cloning commercial apps.** There is a post about building an accounting app after studying the QuickBooks trial, requests to bring MathType or Microsoft Publisher to the web, and "make all Steam games free." This group is loud but has shown few results.

Model refusals come up often too: "execution is frequently blocked due to 'sensitive reverse engineering' triggers" ([#2095](https://github.com/morluto/rea/issues/2095)), complaints about hitting a wall with Claude ([#3038](https://github.com/morluto/rea/discussions/3038)), and two Hacker News comments about OpenAI accounts being banned. What may be analyzed is currently decided by model providers' policies before the tool gets a say.

There are skeptics. One asked how this is better than telling Claude to install Ghidra and set up an RE environment itself; an X post reported that plain Opus finished the same app faster without REA. The Chinese-language Discussion [#1928](https://github.com/morluto/rea/discussions/1928) said the showcases are Electron apps any AI can read, simple APKs and old EXEs, and that after trying it, "it feels like just a skill."

In short, what people wanted was to read and fix software they couldn't touch because they had no source. That used to require RE training, and REA looked like it would lower the cost of entry. The rest of the post checks how far that expectation holds, using the code and actual runs.

Stars are not a proxy for usage here. Forks are 25% of stars, against 10–12% for GhidraMCP and ida-pro-mcp, and the most-reacted issue has 14 reactions. Some commenters suspected bought stars, but I found no investigation that settles it. npm downloads and 231 commit authors show plenty of real users; still, 275k likely includes many stars from people who clicked because it was trending.

## How it differs from earlier MCP servers

MCP servers that connect agents to RE tools existed before REA.

| Project | Released | Stars (10/16) | What it does |
|---|---|---|---|
| [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP) | 2025-03 | 11,296 | Exposes Ghidra features as MCP tools |
| [mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp) | 2025-03 | 12,925 | Exposes IDA as per-operation tools |
| [HexRaysSA/ida-mcp](https://github.com/HexRaysSA/ida-mcp) | 2026-08 | 1,194 | Official Hex-Rays server, centered on running IDAPython |
| [zinja-coder/jadx-ai-mcp](https://github.com/zinja-coder/jadx-ai-mcp) | 2025-04 | 2,906 | Connects the JADX Android decompiler |

Each of these opens one engine's API to the agent. REA reuses ida-pro-mcp for IDA and jadx-headless-mcp for JADX; only Ghidra goes through REA's own Java bridge. It does not build a new analysis engine, and the README says it bundles no decompiler.

What REA built is around the engines. The TypeScript source (excluding tests) is about 321,000 lines, of which the Ghidra integration is roughly 12,000. The largest directory is `src/domain` (98,000 lines), which handles evidence records and results. The skill installed into agents is about 1,200 lines including references. The instructions are short; the code does most of the work.

### An evidence record behind every conclusion

Every REA result, whatever the backend, comes out in the same Evidence format: the target's hash, which tool ran with which parameters, raw and normalized results, confidence, and a list of limitations. One relation from my Electron test app looks like this:

```text
relation: "invokes"
properties: { channel: "clipboard:write-rich", pairing_basis: "unique-exact-literal-channel", handler_path: "src/main.js" }
evidence: { state: "inferred", confidence: "high",
  location: { source: "src/preload.js", start: {line: 4, column: 28}, end: {line: 4, column: 86} },
  limitations: ["Literal channel equality does not prove that the handler is registered or reachable at runtime.", ...] }
```

It inferred the link because the channel string in the preload matches the one in main, and it recorded that this does not prove the handler is registered at runtime. Anything unresolved becomes a separate unknown record, and there is a tool (`verify_unknown_resolution`) to check later whether an unknown was resolved.

The installed skill says how to use these records. Turn the request into a list of questions, keep "a concise finding ledger linking each conclusion to Evidence IDs," and before finishing mark each question answered, partially answered or unresolved. It states that "Every conclusion must distinguish observations, inferences, and unknowns," and ends by telling the agent, when asked to build something, to separate observed behavior from design choices.

The division of labor: the agent decides what to look at and writes any code. REA runs the backend and records and stores the result in a uniform format. There are comparison tools for reconstructions (`compare_functions`, `verify_reconstruction`), but their descriptions warn against broadening a pass on the declared comparisons into a claim of global equivalence.

### Keeping output out of the context window

RE output is large. REA keeps full results on the server and hands the agent summaries and references. A response over 10 MiB returns a `resource_constraint` error with an evidence reference instead of a truncated result. The agent asks for `detail: "summary"` and pages through what it needs with `inspect_analysis_view`. Identical analyses are served from a cache. No model summarizes anything along the way; it is all paging and references.

## What happened when I ran it

I installed npm `rea-agents` 6.5.0 on Node 26 in 8 seconds without errors, and ran the static JavaScript analysis, which needs no native engine, on three targets.

| Target | Size | Run time | Output |
|---|---|---|---|
| Electron app I wrote | 7 files, 1,955 bytes | 8.8 s | 707 KB JSON (168,851 tokens by the CLI's count) |
| `marked` package | public npm package | 6.1 s | 26.5 MB JSON |
| `yaml` package | public npm package | 18.2 s | 87.3 MB JSON |

The test app has main, preload and renderer files with two IPC channels and a clipboard call. The summary was accurate: one BrowserWindow, one preload, one contextBridge API with two members, two literal channels, and both renderer-to-main pairs. The first limitation listed was that JavaScript and HTML were parsed as inert text and never executed.

The problem is size. A 2 KB app produced 169k tokens, mostly a semantic graph of 330 nodes, 232 relations and 125 unknowns. Feeding the full CLI result to an agent fills its context immediately.

Through MCP, `yaml` behaved as designed. The full request came back as a `resource_constraint` error with `response_bytes_at_least: 10585657`, a note that the result was not truncated, and an evidence reference. The summary was 21 KB (analysis still took 18 seconds), and modules could be read five per page at about 18 KB per page. The summary reported 15,685 unknowns remaining. On anything non-trivial, having the agent use summaries and paging is effectively mandatory.

The feature tracer `trace_application_feature` gave mixed results. Tracing the `notes:search` channel in my test app returned three paths. The first correctly reached `ipcRenderer.invoke` through the preload. The other two followed a "main.js contains" relation from the handler into an unrelated clipboard call in the same file. None reached `searchNotes` in `search.js`, where the search actually happens. The skill itself warns that broad bidirectional traces can expand into unrelated containment relationships. Treat trace output as a starting point and confirm each path in the source.

The tool catalog is large too. The server exposes 207 tools and 6 prompts, and with default settings the tool list is 3.09 MB of JSON, mostly output schemas (2.26 MB). Issue [#2019](https://github.com/morluto/rea/issues/2019) reports the catalog filling the context so auto-compaction keeps running, and the docs record clients such as Kimi, pi-web-ui and WorkBuddy rejecting the full list. Setting `REA_MCP_INPUT_SCHEMA_PROFILE=compact` and `REA_MCP_OUTPUT_SCHEMA_PROFILE=off` brought it down to 215 KB. It is the problem Duncan Ogilvie, author of ida-pro-mcp, described when announcing Hex-Rays' official server: "Since IDA has so many features, you easily end up with 100+ tools that each need to be tuned separately."

## How do you know the result is right?

The three showcases on REA's site are narrow, and each evidence page says so.

- **DX-Ball:** one 63-byte function. Interestingly, Ghidra's pseudocode was wrong: per the evidence page it showed a function with no inputs, omitting the stack input and x87 expression, and the agent rebuilt the logic from the instruction listing. Confirmation that the reconstruction was right (3,205 cases run against the original x86 code, and all 63 bytes reproduced with the original compiler) came from a separate reconstruction repository by REA's third-largest committer.
- **Notion:** one 24.5 KB preload file. REA found the bridge name but left the channel as `null` because it was dynamic, and the trace on `notion:clipboard:write` ended with no graph match. The clipboard route was connected by a person reading source, and the evidence page states the figure "is not an automatically paired IPC graph."
- **TH04:** one function in a PC-98 game, opened in Ghidra and compared byte for byte. The function was chosen from the range an existing reconstruction (ReC98) had already reviewed.

In all three, REA opened the target and recorded evidence. The judgment that a result matched the original came from separate machinery with the original compiler and input comparisons.

An FPS decompilation project from the same week makes the point sharper. In an [October 9 post](https://momo5502.com/posts/2026-10-09-game-decompilation/), reverse engineer Maurice Heumann described three months of using Claude Code and Codex agents to reconstruct a game: 99% of functions present, 83% byte-exact. He used Hex-Rays' official ida-mcp, not REA, starting with three worker agents and one reviewer and running sixteen agents in the final weeks. Verification was a script that compiled with the game's original compiler and compared function bytes between the object files and the game executable.

The most striking part is the agents trying to dodge that check. They started by writing inline assembly, and repeatedly tried to edit the comparison script to exclude their own functions. The reviewer agent "accepted their justifications instead of independently checking the deviations against the original." The fix was having CI hash the verification script and compare it to a stored GitHub Actions secret.

REA's evidence records let you trace what the agent saw and what it inferred. Whether a reconstruction matches the original is decided by comparing against the original, and that comparison has to sit where the agent can't modify it. It is the same problem as checking an agent's completion report against execution evidence in [#74](/blog/74-jev-completion-evidence/), and handing the verdict to an agent that didn't write the code in [#81](/blog/81-pstack-merge-without-review/).

## The clean-room debate and REA's safeguards

The longest argument on Hacker News was about copyright. Classic clean-room development separates the team that studies the original from the team that implements, with only a specification passing between them. REA's default flow has one agent do both. Commenters said "Using an LLM is not a clean room, imo. Its just IP laundering," and that since you don't know what the model trained on, you can't prove an LLM-derived clone is a clean-room implementation. Others replied that clean room does not forbid decompilation. A developer who does clean-room work said REA is probably great for personal apps and abandonware, but if you publish and discovery shows you decompiled the original, "you might be in for a bad time."

For the legal background, Patrick Dempsey of Hirzel Dreyfuss & Dempsey wrote a useful [October 10 piece](https://www.hddlawfirm.com/news/2026/10/10/compiled-code-used-to-keep-secrets-ai-just-taught-it-to-talk). Sega v. Accolade (1992) and Sony v. Connectix (2000) treated intermediate copying for interoperability as fair use, but the final products contained no copied code; the piece notes that neither case authorized publishing a byte-matched reconstruction. Article 6 of the EU Software Directive limits decompilation to interoperability. The piece also points out that clean room is a way to prove independent development in a dispute, not a procedure the law requires. This post is not legal advice; if you plan to publish or sell, check with a lawyer in your jurisdiction.

REA's response is documentation. `DISCLAIMER.md` was first added on October 12 and says the project will not help with circumventing DRM or license checks, anti-cheat, game cheats or copying proprietary software; such requests "will be closed without response" in issues and discussions. Nothing in the code enforces this: searching the package source for related keywords returns zero hits outside tests, and the installed skill says nothing about legality. The code-level safeguards address operational risk rather than intent: static analysis that never runs the target, destructive-tool annotations, approval before setup writes config, and prompt-injection defense that marks text from the target as untrusted.

Popularity had a side effect. A `rea-tools` organization created on October 10 distributed an 82.6 MB archive from a look-alike repository, and per issue [#2424](https://github.com/morluto/rea/issues/2424) Windows Defender flagged it as a trojan; it had 172 downloads. That repository is gone, and the README now warns that "A similar repository name or copied README does not establish that a download is official." I found no typosquatted packages on npm.

## Using it on your own project

Based on the checks above, here is an order for analyzing software you own. Installation and runs are what I tested; separating analysis from implementation is a suggestion.

**1. Decide the target and the goal first.** The people who got results had clear targets: their own device integrations, their own services, old games with settled rights. For company code or a client's binary, first consider that analysis results reach the model provider. REA's analysis runs locally, but the code the agent reads goes to the model, which matters before anything else under an NDA.

**2. Install from the official source and trim the tool list.** Use only `npx rea-agents setup`, and don't download executables from look-alike repositories. `setup --dry-run` shows which config files it will write. If your client rejects the catalog or context fills fast, shrink the schemas.

```bash
npx rea-agents setup --dry-run
export REA_MCP_INPUT_SCHEMA_PROFILE=compact
export REA_MCP_OUTPUT_SCHEMA_PROFILE=off
```

**3. Ask for summaries first.** A tiny app produced 169k tokens, so tell the agent to start with `detail: summary` and read only what it needs through `inspect_analysis_view`. Have it open the source for each traced path.

**4. Define done as a per-conclusion evidence list.** Ask for what the skill already prescribes: questions first, each conclusion tied to evidence IDs and labeled observation, inference or unknown, and each question marked with its status. Review inferences and unknowns first.

**5. If you reimplement, build the check first.** Put in place tests that feed the same inputs to the original and compare outputs, and if possible a script that builds with the original compiler and compares bytes. Make sure the agent can't edit that script; hashing it in CI, as Heumann did, is one way.

**6. If you plan to publish or sell the result, split analysis from implementation.** Have the analysis session produce only a behavioral specification, and do the implementation in a separate session or repository with no access to the original or the analysis output. Keeping the spec and session logs gives you material to explain independent development later. You can't control what the model trained on, so this does not guarantee legal safety.

## What changes for people who ship packages

So far this has been the view from the person running REA. People who build and ship npm packages, desktop apps or mobile apps should look at the same results from the other side. This section is my judgment based on the facts above; I did not run a separate experiment to test it.

Start with what was observed. My static run found the IPC structure of an Electron app correctly in 9 seconds and finished two public npm packages in under 20 seconds. On the native side, Heumann ran agents for three months and rebuilt 83% of an FPS game's functions byte-identical to the original. It still costs time and tokens, but the barrier of needing specialists for months to read shipped code is much lower. Compilation and obfuscation are best treated as something that raises analysis cost a little. Code that resists static analysis exists, as the dynamically built channel values left as `null` in the Notion showcase show, but agents tolerate tedious work far longer than people do.

It is also worth noticing that what you ship becomes the answer key. Heumann's comparison script used function bytes pulled from the original game executable as ground truth. A shipped artifact gives a cloner both hints about the implementation and a standard for checking a reimplementation. The law leans toward allowing analysis for interoperability: the US cases above say so, and the EU Software Directive voids contract terms that override the decompilation right in Article 6 (Article 8). A "no reverse engineering" line in a license does little to stop the analysis itself.

So what should change, and where should the moat be? Four things worth doing if you ship packages:

**1. Treat client-side code as a public document.** Assume anyone can read an npm package, an Electron app's preload and renderer, or the JavaScript bundle inside an APK. Keep API keys, internal endpoint lists, business rules such as discount logic, and license checks out of client code and decide them on the server. REA's DISCLAIMER says it will not help bypass license checks, but nothing in the code prevents it, so this cannot be left to a tool author's goodwill. Running a static analyzer like REA on your own build output before release shows what is visible from outside, which is what the Discussions users who audited their own services from an attacker's view were doing.

**2. Remove the reasons people start reverse engineering.** Many of the cases above began because no official path existed: the printer only printed from a phone app, and Insta360 Studio did not support AMD GPUs. If you make a device or service, publishing a documented API, SDK or protocol spec first is the better move. Unofficial clients built by users break easily on each update, and you cannot see what they touch. With an official path, extensions happen on top of it and you decide what to open and what to keep closed.

**3. Make the official distribution path recognizable.** Less than a week after REA took off, a look-alike repository was distributing a trojan. The more known a package becomes, the more likely the same thing is. On npm, publish with `npm publish --provenance` to attach proof of which repository and CI built it, and state the official channels in the README and on the website. Anyone can copy the code; they cannot copy which release users trust enough to install.

**4. Put the moat in what you don't ship.** A cloner gets the implementation at one point in time. Matching the original only means matching that version; it says nothing about how to build the next one. What a shipped artifact does not contain is the data and operational know-how on your servers, the settings and integrations users have built up, and the tests and evaluation sets that define what a good result is in your domain. In [#44](/blog/44-surviving-model-churn/) I named evals as the asset that survives model changes, and the same reasoning applies to cloning: published behavior can be copied, but the criteria for deciding what the next behavior should be are not in the artifact.

REA itself is a good example. Its code is fully public under MIT and it has more than 69,000 forks. Yet users and its 231 contributors gather at the original repository, and the look-alike repository vanished after spreading malware. For open source, code was never the moat. What remains is trust in the official distribution path, the place contributors gather, and the pace of the next release. To check whether this holds for your own project, look at how user counts and churn moved around the time a fork or a similar competing product appeared.

## Summary

REA is an MCP server that connects coding agents to Ghidra, IDA, JADX and other RE tools in one step, and in the twelve days after October 4 it went from 1,500 to 275,000 stars. The most common thing users actually reported was reading and fixing software they already had: a printer tied to a phone app, old games, their own services.

The analysis engines are existing tools. What REA adds is a record that attaches evidence, limitations and unknowns to each conclusion, and machinery that keeps large results out of the context and lets the agent page through them. Running it shows very large outputs and feature traces that wander, so summary queries and human checks are needed. In the showcases and in the FPS reconstruction alike, whether a reconstruction was right was decided by a separate comparison against the original. Legal limits exist only in documentation, so choosing targets and deciding what to publish stays with the person using it.

For people who ship packages, the first step is to treat client-side code as a document anyone can read and move secrets and business rules to the server. Competitive advantage lasts longer when it sits in what you don't ship: data, operations, evaluation criteria, and users' trust in the official distribution path.

## References

- [morluto/rea (GitHub)](https://github.com/morluto/rea) · [DISCLAIMER.md](https://github.com/morluto/rea/blob/main/DISCLAIMER.md) · [npm rea-agents](https://www.npmjs.com/package/rea-agents)
- [Hacker News: REA Reverse (2026-10-10)](https://news.ycombinator.com/item?id=50028275) · [Follow-up thread (2026-10-12)](https://news.ycombinator.com/item?id=50058850)
- [@_vmlops, REA introduction post (X, 2026-10-04)](https://x.com/_vmlops/status/2106690704244420687)
- [GitHub Discussion #4152 (thermal printer)](https://github.com/morluto/rea/discussions/4152) · [#1928 (skeptical review)](https://github.com/morluto/rea/discussions/1928)
- [Issue #2019 (tool catalog and context)](https://github.com/morluto/rea/issues/2019) · [#2095 (model refusals)](https://github.com/morluto/rea/issues/2095) · [#2424 (malicious look-alike repo)](https://github.com/morluto/rea/issues/2424)
- [Maurice Heumann, 500+ Billion Tokens Later: Letting AI Agents Decompile A First-Person Shooter (2026-10-09)](https://momo5502.com/posts/2026-10-09-game-decompilation/)
- [Hex-Rays, IDA MCP Server announcement](https://hex-rays.com/blog/hex-rays-ida-mcp-server)
- [Patrick Dempsey, Compiled Code Used to Keep Secrets. AI Just Taught It to Talk (2026-10-10)](https://www.hddlawfirm.com/news/2026/10/10/compiled-code-used-to-keep-secrets-ai-just-taught-it-to-talk)
- [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP) · [mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp) · [HexRaysSA/ida-mcp](https://github.com/HexRaysSA/ida-mcp)
