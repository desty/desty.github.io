"""Fetch Artificial Analysis model pages and extract per-effort cost data.

Usage:
    python3 -I fetch_aa.py <raw_html_dir> <output_json>

Raw HTML is cached in <raw_html_dir> (keep it outside the repo; pages are ~1.5 MB each).
Only fields published on each model page are extracted. Nothing is estimated here.
"""
import json
import pathlib
import re
import sys
import urllib.request

MODELS = {
    "claude-fable-5-2": ["low", "medium", "high", "xhigh", "max"],
    "claude-fable-5-1": ["low", "medium", "high", "xhigh", "max"],
    "claude-opus-5-5": ["low", "medium", "high", "xhigh", "max"],
    "claude-sonnet-5-5": ["low", "medium", "high", "xhigh", "max"],
    "claude-haiku-5-5": ["low", "medium", "high", "xhigh", "max"],
}


def page_slug(release: str, effort: str) -> str:
    # On AA, the max-effort variant uses the bare release slug.
    return release if effort == "max" else f"{release}-{effort}"


def fetch(slug: str, raw_dir: pathlib.Path) -> str:
    path = raw_dir / f"{slug}.html"
    if not path.exists():
        req = urllib.request.Request(
            f"https://artificialanalysis.ai/models/{slug}",
            headers={"User-Agent": "Mozilla/5.0 (research script)"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            path.write_bytes(resp.read())
    return path.read_text(encoding="utf-8").replace('\\"', '"')


def balanced(s: str, start: int) -> str:
    """Return the JSON object or array that starts at s[start]."""
    open_ch = s[start]
    close_ch = "}" if open_ch == "{" else "]"
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
    raise ValueError("unbalanced")


def field(s: str, pos: int, key: str):
    i = s.find(f'"{key}":', pos)
    if i < 0:
        return None
    j = i + len(key) + 3
    if s[j] in "{[":
        return json.loads(balanced(s, j))
    m = re.match(r"(-?[0-9.eE+-]+|null|true|false|\"[^\"]*\")", s[j:])
    return json.loads(m.group(1))


def extract(slug: str, html: str) -> dict:
    # The bare release slug is shared by the release object; match the model
    # object, whose name carries the effort in parentheses.
    m = re.search(r'"slug":"' + re.escape(slug) + r'","name":"[^"]*\(', html)
    anchor = m.start() if m else -1
    if anchor < 0:
        raise ValueError(f"model object not found: {slug}")
    cpt_pos = html.find('"intelligenceIndexCostPerTask"', anchor)
    if cpt_pos < 0 or cpt_pos - anchor > 200_000:
        raise ValueError(f"cost block not found near {slug}")
    out = {
        "slug": slug,
        "name": field(html, anchor, "name"),
        "intelligenceIndex": field(html, anchor, "intelligenceIndex"),
        "priceInput": field(html, anchor, "price1mInputTokens"),
        "priceOutput": field(html, anchor, "price1mOutputTokens"),
        "cacheHitDiscountPercent": field(html, anchor, "cacheHitDiscountPercent"),
        "intelligenceIndexCost": field(html, anchor, "intelligenceIndexCost"),
        "intelligenceIndexCostPerTask": field(html, anchor, "intelligenceIndexCostPerTask"),
        "canonicalIntelligenceIndexTokenCount": field(
            html, anchor, "canonicalIntelligenceIndexTokenCount"
        ),
        "intelligenceIndexTimePerTask": field(html, anchor, "intelligenceIndexTimePerTask"),
        "outputSpeed": field(html, anchor, "outputSpeed"),
        "intelligenceIndexEvaluations": field(html, anchor, "intelligenceIndexEvaluations"),
    }
    return out


def main():
    raw_dir = pathlib.Path(sys.argv[1])
    raw_dir.mkdir(parents=True, exist_ok=True)
    out_path = pathlib.Path(sys.argv[2])
    rows = []
    for release, efforts in MODELS.items():
        for effort in efforts:
            slug = page_slug(release, effort)
            html = fetch(slug, raw_dir)
            row = extract(slug, html)
            row["release"] = release
            row["effort"] = effort
            rows.append(row)
            cpt = row["intelligenceIndexCostPerTask"]["cost"]["total"]
            print(f"{slug:28s} II={row['intelligenceIndex']:.1f} cost/task=${cpt:.2f}")
    out_path.write_text(json.dumps(rows, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
