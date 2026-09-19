# jev-context

Decision-based context pruning for coding agents. The core normalizes a transcript into text,
tool calls, and tool results; asks a bounded judge whether each old call and result should remain;
then keeps, truncates, or drops the pair without rewriting retained content.

This repository is an experiment, not a claim that semantic deletion is lossless. The benchmark
tracks reduction separately from recovery work and task success.

## Status

- Core library: working prototype
- Offline replay benchmark: included
- Jev transport: included, requires `TYPESAFE_API_KEY`
- Claude Code adapter: planned first-class integration
- Codex adapter: experimental; current `PreCompact` hooks can stop compaction but cannot replace
  the transcript, so parity requires an App Server/SDK integration

## Run

```bash
npm install
npm test
npm run bench
npm run bench:astro
npm run bench:session -- /path/to/claude-session.jsonl bench/results/session.json
```

The package has no runtime dependencies. In this monorepo it can also be compiled with the root
TypeScript installation.

`bench:astro` replays reads of real files from the installed Astro package. Its path oracle marks
route and manifest files as relevant, so the result is an upper bound on reducible context rather
than a Jev accuracy claim. Replace that oracle with `JevJudge` to run the same fixture live.

Latest live run over 240 file reads (60 relevant, 180 irrelevant):

| Judge and threshold | Relevant retained | Irrelevant retained | Reduction |
|---|---:|---:|---:|
| Path oracle | 60/60 | 0/180 | 73.3% |
| Jev 0.5 | 52/60 | 1/180 | 94.2% |
| Jev 0.3 | 60/60 | 6/180 | 79.4% |

The six concurrent Jev batches completed in 1.01 seconds. This is a path-labeled replay, not an
end-to-end coding-task result.

The real-session replay produced a materially weaker result. Across checkpoints at 50%, 70%, and
85% of a completed 188-call Claude Code session, threshold 0.3 retained an average 76.9% of calls
whose paths or URLs appeared later and removed 20.4% of calls that did not. Threshold 0.2 retained
100% but removed only 0.5%. There was no tested threshold with both safe recall and useful removal.
The replay is stored in `bench/results/claude-session-297c442d.json`; it measures future-reference
recall, not counterfactual task completion or billed savings.

## Agent A/B runner

`bench/agent-ab.mjs` copies a repository into isolated `native` and `jev` workspaces, runs the same
Claude model and prompt with a per-run budget cap, then executes the same verification command.
It defaults to a dry run because even a trivial Claude Code invocation can create an expensive
system-prompt cache. Review the plan before adding `--execute yes`:

```bash
node bench/agent-ab.mjs \
  --repo /path/to/repo \
  --prompt /path/to/task.md \
  --test "npm test" \
  --model sonnet \
  --budget 1
```

The runner never copies `.git`, `node_modules`, or `dist`. Put `TYPESAFE_API_KEY` in the environment
for the Jev arm. Results are written under the system temp directory, not into the source repo.

## Safety model

By default, recent messages and tool classes matching `Deploy`, `Database`, `ExternalAPI`,
`Permission`, or `AskUser` are pinned. Repository reads and searches are treated as cheap to
recover. Production users should replace these defaults with policies for their own tools.

## Evaluation

Compare no compaction, native summary compaction, and Jev pruning on the same task. Record total
input/output tokens, billed cost, wall time, re-reads, re-runs, human interventions, and final test
success. Reduction ratio alone is not a success metric.
