"""Per-effort cost-per-task comparisons from Artificial Analysis data.

Usage:
    python3 -I calc.py aa-2026-11-14.json > results.md

Input is the JSON written by fetch_aa.py. All arithmetic here uses AA's published
per-task cost (Intelligence Index v5.0.1), token counts and per-evaluation results.
No API calls were made; nothing here is a measurement of our own workload.
"""
import json
import sys

EFFORTS = ["low", "medium", "high", "xhigh", "max"]
SHORT = {
    "claude-fable-5-2": "Fable 5.2",
    "claude-fable-5-1": "Fable 5.1",
    "claude-opus-5-5": "Opus 5.5",
    "claude-sonnet-5-5": "Sonnet 5.5",
    "claude-haiku-5-5": "Haiku 5.5",
}


def pct(a, b):
    return f"{(b / a - 1) * 100:+.0f}%"


def load(path):
    rows = json.load(open(path))
    by = {}
    for r in rows:
        c = r["intelligenceIndexCostPerTask"]["cost"]
        tok = r["canonicalIntelligenceIndexTokenCount"]
        evals = {e["slug"]: e for e in r["intelligenceIndexEvaluations"]}
        by[(r["release"], r["effort"])] = {
            "label": f"{SHORT[r['release']]} {r['effort']}",
            "ii": r["intelligenceIndex"],
            "cpt": c["total"],
            "cpt_output": c["output"],
            "cpt_cache_read": c["cacheRead"],
            "cpt_cache_write": c["cacheWrite"],
            "cpt_noncache_input": c["nonCacheInput"],
            "out_tokens": tok["output"],
            "in_tokens": tok["input"],
            "time": r["intelligenceIndexTimePerTask"],
            "speed": r.get("outputSpeed"),
            "evals": evals,
        }
    return by


def section_same_effort(by, a, b, price_ratio):
    print(f"\n## {SHORT[a]} -> {SHORT[b]} at the same effort (token price ratio {price_ratio})\n")
    print("| effort | index | cost/task | cost change | output tokens | input tokens | implied token-volume change |")
    print("|---|---|---|---|---|---|---|")
    for e in EFFORTS:
        x, y = by[(a, e)], by[(b, e)]
        implied = (y["cpt"] / x["cpt"]) / price_ratio - 1 if price_ratio else None
        imp_s = f"{implied * 100:+.0f}%" if implied is not None else "n/a"
        print(
            f"| {e} | {x['ii']:.0f} -> {y['ii']:.0f} | ${x['cpt']:.2f} -> ${y['cpt']:.2f} | "
            f"{pct(x['cpt'], y['cpt'])} | {pct(x['out_tokens'], y['out_tokens'])} | "
            f"{pct(x['in_tokens'], y['in_tokens'])} | {imp_s} |"
        )


def section_breakdown(by, release):
    print(f"\n## {SHORT[release]}: where cost per task goes\n")
    print("| effort | cost/task | output | cache read | cache write | uncached input | output share |")
    print("|---|---|---|---|---|---|---|")
    for e in EFFORTS:
        x = by[(release, e)]
        print(
            f"| {e} | ${x['cpt']:.2f} | ${x['cpt_output']:.2f} | ${x['cpt_cache_read']:.2f} | "
            f"${x['cpt_cache_write']:.2f} | ${x['cpt_noncache_input']:.2f} | "
            f"{x['cpt_output'] / x['cpt'] * 100:.0f}% |"
        )


def section_marginal(by, release):
    print(f"\n## {SHORT[release]}: marginal cost per index point\n")
    print("| step | +points | +cost/task | $ per point |")
    print("|---|---|---|---|")
    for lo, hi in zip(EFFORTS, EFFORTS[1:]):
        x, y = by[(release, lo)], by[(release, hi)]
        dp = y["ii"] - x["ii"]
        dc = y["cpt"] - x["cpt"]
        per = f"${dc / dp:.2f}" if dp > 0.05 else "n/a (no gain)"
        print(f"| {lo} -> {hi} | {dp:+.1f} | ${dc:+.2f} | {per} |")


def section_frontier(by):
    pts = sorted(by.values(), key=lambda v: (v["cpt"], -v["ii"]))
    print("\n## Cheapest configuration per target index (all 25 configs)\n")
    print("| config | index | cost/task | on frontier | dominated by |")
    print("|---|---|---|---|---|")
    for v in sorted(by.values(), key=lambda v: v["ii"]):
        dom = [
            w for w in by.values()
            if w is not v and w["ii"] >= v["ii"] and w["cpt"] <= v["cpt"]
            and (w["ii"] > v["ii"] or w["cpt"] < v["cpt"])
        ]
        best = min(dom, key=lambda w: w["cpt"]) if dom else None
        print(
            f"| {v['label']} | {v['ii']:.1f} | ${v['cpt']:.2f} | {'yes' if not dom else ''} | "
            f"{best['label'] + ' (' + format(best['ii'], '.1f') + ', $' + format(best['cpt'], '.2f') + ')' if best else ''} |"
        )


def section_eval(by, slug, title):
    print(f"\n## {title} (AA per-evaluation score and cost per task)\n")
    print("| config | score | cost/task | output tokens/task | time/task (min) |")
    print("|---|---|---|---|---|")
    for rel in ["claude-fable-5-2", "claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5-5"]:
        for e in EFFORTS:
            ev = by[(rel, e)]["evals"].get(slug)
            if not ev:
                continue
            score = ev["score"]
            score_s = f"{score * 100:.1f}%" if score <= 1 else f"{score:.0f}"
            print(
                f"| {by[(rel, e)]['label']} | {score_s} | ${ev['costPerTask']:.2f} | "
                f"{ev['outputTokensPerTask']:,.0f} | {ev['timePerTask'] / 60:.1f} |"
            )


def section_speed(by):
    print("\n## Output speed and time per task\n")
    print("| effort | Fable 5.1 tok/s | Fable 5.2 tok/s | Fable 5.1 min/task | Fable 5.2 min/task |")
    print("|---|---|---|---|---|")
    for e in EFFORTS:
        x, y = by[("claude-fable-5-1", e)], by[("claude-fable-5-2", e)]
        print(f"| {e} | {x['speed']:.0f} | {y['speed']:.0f} | {x['time'] / 60:.1f} | {y['time'] / 60:.1f} |")


def section_scenarios(by):
    print("\n## Model-ID swaps with effort left unset\n")
    print("API default effort: Fable 5.1 high, Fable 5.2 high, Opus 5.5 medium (platform docs).")
    print("Claude Code / apps default: Fable 5.2 medium, Opus 5.5 medium (Claude Code model-config docs).\n")
    pairs = [
        ("API: Fable 5.1 (high) -> Fable 5.2 (high)", ("claude-fable-5-1", "high"), ("claude-fable-5-2", "high")),
        ("API: Opus 5.5 (medium) -> Fable 5.2 (high)", ("claude-opus-5-5", "medium"), ("claude-fable-5-2", "high")),
        ("Claude Code: Opus 5.5 (medium) -> Fable 5.2 (medium)", ("claude-opus-5-5", "medium"), ("claude-fable-5-2", "medium")),
        ("Explicit: Opus 5.5 high -> Fable 5.2 low", ("claude-opus-5-5", "high"), ("claude-fable-5-2", "low")),
        ("Explicit: Opus 5.5 xhigh -> Fable 5.2 medium", ("claude-opus-5-5", "xhigh"), ("claude-fable-5-2", "medium")),
        ("Explicit: Opus 5.5 max -> Fable 5.2 high", ("claude-opus-5-5", "max"), ("claude-fable-5-2", "high")),
        ("Explicit: Fable 5.1 xhigh -> Fable 5.2 low", ("claude-fable-5-1", "xhigh"), ("claude-fable-5-2", "low")),
    ]
    print("| swap | index | cost/task | cost change | time/task (min) |")
    print("|---|---|---|---|---|")
    for name, a, b in pairs:
        x, y = by[a], by[b]
        print(
            f"| {name} | {x['ii']:.1f} -> {y['ii']:.1f} | ${x['cpt']:.2f} -> ${y['cpt']:.2f} | "
            f"{pct(x['cpt'], y['cpt'])} | {x['time'] / 60:.1f} -> {y['time'] / 60:.1f} |"
        )


def main():
    by = load(sys.argv[1])
    print("# Fable 5.2 cost-per-task calculations (AA Intelligence Index v5.0.1, fetched 2026-11-14)")
    section_same_effort(by, "claude-fable-5-1", "claude-fable-5-2", 0.8)
    # Opus 5.5 -> Fable 5.2: input/output/cache-write prices double but cache reads
    # stay at $0.20, so a single price ratio does not apply.
    section_same_effort(by, "claude-opus-5-5", "claude-fable-5-2", None)
    section_breakdown(by, "claude-fable-5-2")
    section_breakdown(by, "claude-fable-5-1")
    section_breakdown(by, "claude-opus-5-5")
    section_marginal(by, "claude-fable-5-2")
    section_marginal(by, "claude-opus-5-5")
    section_frontier(by)
    section_eval(by, "frontiercode-2-0", "FrontierCode-AA 2.0")
    section_eval(by, "terminalbench-4-0", "Terminal-Bench 4.0")
    section_eval(by, "aa-briefcase", "AA-Briefcase")
    section_eval(by, "terminal-bench-science", "Terminal-Bench-Science 0.1")
    section_eval(by, "automationbench-aa", "AutomationBench-AA")
    section_eval(by, "critpt-v2-hard", "CritPt v2 (Hard Subset)")
    section_eval(by, "hle-diamond", "HLE-Diamond")
    section_eval(by, "omniscience", "AA-Omniscience")
    section_eval(by, "gdp-pdf", "GDP.pdf")
    section_speed(by)
    section_scenarios(by)


if __name__ == "__main__":
    main()
