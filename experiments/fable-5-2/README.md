# fable-5-2

Cost-per-task arithmetic for blog post #92 (Claude Fable 5.2), using public data only.
No Claude API calls were made.

```bash
# 1. Fetch the 25 Artificial Analysis model pages (Fable 5.2, Fable 5.1, Opus 5.5,
#    Sonnet 5.5, Haiku 5.5 x five effort levels) and extract the published fields.
python3 -I fetch_aa.py /tmp/aa-raw aa-2026-11-14.json

# 2. Same-effort comparisons, cost breakdown, cheapest config per score,
#    per-evaluation results, default-effort swaps.
python3 -I calc.py aa-2026-11-14.json > results.md

# 3. Rough per-call cost of an advisor (Fable 5.2 vs Opus 5.5) from list prices.
python3 -I advisor_cost.py > advisor_cost.md
```

- `aa-2026-11-14.json`: fields copied from AA model pages on 2026-11-14 (Intelligence Index v5.0.1): index score, cost per task and its breakdown (output, cache read, cache write, uncached input), token counts, time per task, output speed, per-evaluation score / cost / output tokens.
- `results.md`: output of `calc.py`.
- `advisor_cost.md`: output of `advisor_cost.py`. Transcript sizes (30K/60K/90K tokens) and advice length (1,600 tokens) are assumptions stated in the script, not measurements.
- The only derived quantity that is not a ratio of published numbers is the "implied token-volume change" column, which divides the cost change by the list-price change. It assumes input, cache and output prices moved by the same ratio, which holds for Fable 5.1 -> 5.2 (all -20%). It is left out for Opus 5.5 -> Fable 5.2, where input, output and cache-write prices double but cache reads stay at $0.20.
- AA's numbers reflect its own task mix and agent harness (Stirrup for the agentic evaluations). They are not a measurement of any particular workload.
