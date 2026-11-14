"""Summarize experiment runs in results/: skill usage, cost, and API/pattern counts.
Usage: python3 -I analyze.py > summary.md
"""
import json, re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
RES = HERE / "results"
FIX = HERE / "fixture"

PATTERNS = {
    "t1": {
        "<dialog>": r"<dialog\b",
        "showModal()": r"showModal\(",
        "command/commandfor": r"\bcommandfor=|\bcommand=\"(show-modal|close|request-close)",
        "window.confirm()": r"(?<![\w.])confirm\(|window\.confirm\(",
        "role=dialog/alertdialog": r"role=\"(alert)?dialog\"|setAttribute\(['\"]role['\"],\s*['\"](alert)?dialog",
        "aria-modal": r"aria-modal",
        "manual Tab focus trap": r"['\"]Tab['\"]",
        "manual Escape handler": r"['\"]Escape['\"]|['\"]Esc['\"]",
        "autofocus on Cancel": r"autofocus",
        "returnValue": r"returnValue",
        "::backdrop": r"::backdrop",
        "overscroll-behavior": r"overscroll-behavior",
        "body overflow lock": r"(body|html)[^{}]*\{[^}]*overflow:\s*hidden|body\.style\.overflow|documentElement\.style\.overflow",
        "custom overlay div": r"class=\"[^\"]*(overlay|modal-backdrop)",
    },
    "t2": {
        "popover attr": r"\bpopover(=|\b(?!-))",
        "interestfor": r"interestfor",
        "anchor-name": r"anchor-name",
        "position-anchor": r"position-anchor",
        "position-area / anchor()": r"position-area|anchor\(",
        "position-try(-fallbacks)": r"position-try",
        "role=tooltip": r"role=\"tooltip\"",
        "aria-describedby": r"aria-describedby",
        "getBoundingClientRect (JS positioning)": r"getBoundingClientRect",
        "JS hover/focus listeners": r"mouseenter|mouseover|focusin|'focus'|\"focus\"",
        "CSS :hover/:focus show": r":hover|:focus",
        "Escape dismiss": r"Escape",
    },
    "t3": {
        ":user-invalid": r":user-invalid",
        ":invalid (still used)": r"(?<!user-):invalid",
        "touched/dirty class or flag": r"touched|dirty|interacted",
        "blur listener": r"['\"]blur['\"]|focusout",
        "setCustomValidity": r"setCustomValidity",
        "validationMessage / validity": r"validationMessage|\.validity\b",
        "aria-invalid": r"aria-invalid",
        "aria-describedby": r"aria-describedby",
        "aria-live / role=alert": r"aria-live|role=\"alert\"",
        "novalidate kept": r"novalidate",
    },
    "t4": {
        "color-scheme property/meta": r"color-scheme",
        "light-dark()": r"light-dark\(",
        "prefers-color-scheme": r"prefers-color-scheme",
        "matchMedia in JS": r"matchMedia",
        "data-theme / class toggle": r"data-theme|dataset\.theme|classList\.(toggle|add)\(['\"](dark|light)",
        "localStorage": r"localStorage",
        "inline head script (no flash)": r"<script>(?![\s\S]*src=)",
        "radio/select control": r"type=\"radio\"|<select",
        "aria-pressed": r"aria-pressed",
    },
}

def lines(p):
    try:
        return p.read_text().count("\n")
    except FileNotFoundError:
        return 0

def parse_stream(path):
    tool_cmds, retrieved, searches, cost, out_tok, in_tok, cache_read, cache_create = [], [], [], 0.0, 0, 0, 0, 0
    skill_invoked = False
    for line in path.read_text().splitlines():
        try:
            ev = json.loads(line)
        except Exception:
            continue
        if ev.get("type") == "assistant":
            for c in ev.get("message", {}).get("content", []):
                if c.get("type") == "tool_use":
                    if c.get("name") == "Skill":
                        skill_invoked = True
                    cmd = c.get("input", {}).get("command", "")
                    if "modern-web-guidance" in cmd:
                        tool_cmds.append(cmd)
                        m = re.search(r"retrieve\s+\"?([\w,\-]+)", cmd)
                        if m:
                            retrieved += m.group(1).split(",")
                        m = re.search(r"search\s+\"([^\"]+)\"", cmd)
                        if m:
                            searches.append(m.group(1))
        if ev.get("type") == "result":
            cost += ev.get("total_cost_usd", 0) or 0
            u = ev.get("usage", {})
            out_tok += u.get("output_tokens", 0)
            in_tok += u.get("input_tokens", 0)
            cache_read += u.get("cache_read_input_tokens", 0)
            cache_create += u.get("cache_creation_input_tokens", 0)
    return dict(skill=skill_invoked, cmds=len(tool_cmds), searches=searches, retrieved=retrieved,
                cost=cost, out=out_tok, inp=in_tok + cache_read + cache_create)

rows = []
for d in sorted(RES.iterdir()):
    if not d.is_dir():
        continue
    task = d.name.split("-")[0]
    cond = "skill" if "-skill-" in d.name else "base"
    s = parse_stream(d / "stream.jsonl")
    text = "\n".join((d / f).read_text() for f in ("index.html", "style.css", "app.js") if (d / f).exists())
    hits = {k: len(re.findall(v, text)) for k, v in PATTERNS[task[:2]].items()}
    js_added = lines(d / "app.js") - lines(FIX / "app.js")
    css_added = lines(d / "style.css") - lines(FIX / "style.css")
    html_added = lines(d / "index.html") - lines(FIX / "index.html")
    secs = int((d / "seconds.txt").read_text().strip()) if (d / "seconds.txt").exists() else None
    rows.append(dict(name=d.name, task=task, cond=cond, secs=secs, js=js_added, css=css_added, html=html_added, hits=hits, **s))

print("# modern-web-guidance experiment summary\n")
print("""Setup (2026-11-14): Claude Code 2.1.325, `claude -p --model claude-opus-5-5 --setting-sources project,local`,
fresh copy of fixture/ per run. base = no skill. skill = SKILL.md from GoogleChrome/modern-web-guidance v1.0.0 (4dd9683)
placed in the workspace's .claude/skills/, CLI fetched via `npx -y modern-web-guidance@latest` (1.0.0), DISABLE_TELEMETRY=1.
4 English tasks x 2 conditions x 3 runs = 24 runs, plus t1 in Korean x skill x 2 runs. Pattern hits = regex matches over
the resulting index.html/style.css/app.js (see analyze.py); they show which APIs appear, not whether the UI works.
No browser testing was done. Cost = total_cost_usd reported by Claude Code (list price).
""")
print("| run | skill tool | CLI calls | retrieved guides | sec | cost USD | input tok (incl. cache) | output tok | +JS lines | +CSS lines | +HTML lines |")
print("|---|---|---|---|---|---|---|---|---|---|---|")
for r in rows:
    print(f"| {r['name']} | {r['skill']} | {r['cmds']} | {', '.join(r['retrieved'])} | {r['secs']} | {r['cost']:.3f} | {r['inp']:,} | {r['out']:,} | {r['js']} | {r['css']} | {r['html']} |")

for task in sorted({r["task"] for r in rows}):
    print(f"\n## {task}: pattern hits (number of runs with >=1 match, out of n)\n")
    trs = [r for r in rows if r["task"] == task]
    nb = sum(1 for r in trs if r["cond"] == "base"); ns = sum(1 for r in trs if r["cond"] == "skill")
    print(f"| pattern | base (n={nb}) | skill (n={ns}) |")
    print("|---|---|---|")
    for k in PATTERNS[task[:2]]:
        b = sum(1 for r in trs if r["cond"] == "base" and r["hits"][k] > 0)
        s = sum(1 for r in trs if r["cond"] == "skill" and r["hits"][k] > 0)
        print(f"| {k} | {b} | {s} |")

print("\n## averages by condition\n")
print("| task | cond | n | avg sec | avg cost USD | avg input tok | avg +JS lines | avg +CSS lines |")
print("|---|---|---|---|---|---|---|---|")
for task in sorted({r["task"] for r in rows}):
    for cond in ("base", "skill"):
        rs = [r for r in rows if r["task"] == task and r["cond"] == cond]
        if not rs:
            continue
        n = len(rs)
        print(f"| {task} | {cond} | {n} | {sum(r['secs'] or 0 for r in rs)/n:.0f} | {sum(r['cost'] for r in rs)/n:.3f} | {sum(r['inp'] for r in rs)/n:,.0f} | {sum(r['js'] for r in rs)/n:.1f} | {sum(r['css'] for r in rs)/n:.1f} |")

print("\n## search queries issued (skill runs)\n")
for r in rows:
    if r["searches"]:
        print(f"- {r['name']}: " + "; ".join(r["searches"]))
