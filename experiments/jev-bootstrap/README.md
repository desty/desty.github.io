# jev-bootstrap

Tests a narrow domain-adaptation path on this site's Korean blog posts:

1. Jev labels whether each post belongs to the repository's `agent-engineering` domain.
2. Existing human-authored tags seed the ground truth. Disagreements exposed by the first Jev run are manually adjudicated against the written task definition in `reviewed-labels.json`.
3. A local character n-gram Naive Bayes classifier learns from increasing numbers of corrected labels.
4. The experiment records when the local classifier becomes useful enough to replace routine Jev calls.

The dataset contains titles and summaries only. Article bodies are excluded to keep the task small and to avoid giving either classifier tag-like phrases from the full text.

```bash
npm run dataset
npm run local
TYPESAFE_API_KEY=... npm run jev
```

Outputs go to `results/`. `local.json` is deterministic. `jev.json` requires live API access and is not fabricated when a key is unavailable.

This is a repository-specific experiment, not a general accuracy benchmark. The first run found that older posts did not apply the editorial taxonomy consistently. Manual review changes only explicit, documented cases and remains a judgment by the site's author, not objective truth.
