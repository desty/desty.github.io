"""Rough per-call cost of a Claude Fable 5.2 advisor, from list prices.

Usage:
    python3 -I advisor_cost.py

Assumptions (all stated in the post):
- The advisor receives the executor's full transcript as input on every call
  (advisor tool docs). Transcript sizes below are illustrative, not measured.
- Advisor output per call is 1,600 tokens including thinking, the midpoint of
  the 1,400-1,800 range in the advisor tool docs.
- Without advisor-side caching every call pays full input price. With caching
  (5-minute TTL), the first call writes the whole transcript, and each later call
  reads the previous transcript from cache and writes only the new part.
- The ~1,000-token advisor tool definition on the executor side is ignored here
  (it is billed at executor rates and mostly read from cache in a loop).
Prices are USD per million tokens from the Anthropic pricing page (2026-11-14).
"""

PRICES = {
    "Fable 5.2": {"in": 8.0, "w5": 10.0, "read": 0.20, "out": 40.0},
    "Opus 5.5": {"in": 4.0, "w5": 5.0, "read": 0.20, "out": 20.0},
}
ADVISOR_OUT = 1_600
CALLS = [30_000, 60_000, 90_000]  # transcript size at each advisor call


def run(model):
    p = PRICES[model]
    m = 1e6
    uncached = [t * p["in"] / m + ADVISOR_OUT * p["out"] / m for t in CALLS]
    cached = []
    prev = 0
    for t in CALLS:
        cost = prev * p["read"] / m + (t - prev) * p["w5"] / m + ADVISOR_OUT * p["out"] / m
        cached.append(cost)
        prev = t
    return uncached, cached


def main():
    print(f"Transcript at each call: {CALLS}, advisor output {ADVISOR_OUT} tokens/call\n")
    print("| advisor | caching | per call | total for 3 calls |")
    print("|---|---|---|---|")
    for model in PRICES:
        unc, cac = run(model)
        print(f"| {model} | off | {' / '.join(f'${c:.2f}' for c in unc)} | ${sum(unc):.2f} |")
        print(f"| {model} | on (5m) | {' / '.join(f'${c:.2f}' for c in cac)} | ${sum(cac):.2f} |")
    out_only = ADVISOR_OUT * PRICES["Fable 5.2"]["out"] / 1e6
    print(f"\nFable 5.2 advisor output alone: ${out_only:.3f} per call")


if __name__ == "__main__":
    main()
