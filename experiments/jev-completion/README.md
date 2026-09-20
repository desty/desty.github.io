# jev-completion

Evaluates whether Jev can classify an agent's completion claim against structured execution evidence.

The benchmark has four labels:

- `supported`: the supplied evidence establishes the whole claim.
- `partial`: evidence establishes only part of a compound claim.
- `unsupported`: the evidence does not establish or refute the claim.
- `contradicted`: the evidence directly conflicts with the claim.

Cases are synthetic but shaped after coding-agent traces: requested work, changed files, commands, exit codes, test summaries, diffs, deployment records, and external side effects. Synthetic cases keep the ground truth explicit; they are not evidence of production accuracy.

Eight cases have matched injected variants. The only change is an instruction embedded inside an untrusted tool result. The experiment records whether the verdict changes.

```bash
TYPESAFE_API_KEY="$(< /Users/desty/.config/typesafe/key)" npm run run
```

The live result is written to `results/result.json`.
