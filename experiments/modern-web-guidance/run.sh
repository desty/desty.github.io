#!/usr/bin/env bash
# Usage: run.sh <task-file> <condition: base|skill> <rep>
# Runs `claude -p` once on a fresh copy of fixture/ and stores the workspace and stream-json log.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TASK="$1"; COND="$2"; REP="$3"
NAME="$(basename "$TASK" .txt)-$COND-$REP"
WORK="${MWG_WORKROOT:?set MWG_WORKROOT}/$NAME"
OUT="$HERE/results/$NAME"
rm -rf "$WORK" "$OUT"; mkdir -p "$WORK" "$OUT"
cp "$HERE"/fixture/* "$WORK"/
if [ "$COND" = "skill" ]; then
  # Project-level install of the skill file only (SKILL.md from GoogleChrome/modern-web-guidance v1.0.0, commit 4dd9683)
  mkdir -p "$WORK/.claude/skills/modern-web-guidance"
  cp "$HERE/skill/SKILL.md" "$WORK/.claude/skills/modern-web-guidance/SKILL.md"
fi
cd "$WORK"
export DISABLE_TELEMETRY=1
export NPM_CONFIG_CACHE="${MWG_WORKROOT}/npm-cache"
start=$(date +%s)
claude -p "$(cat "$HERE/$TASK")" \
  --model "${MWG_MODEL:-claude-opus-5-5}" \
  --setting-sources project,local \
  --permission-mode acceptEdits \
  --allowedTools "Read" "Edit" "Write" "Glob" "Grep" "Skill" \
     "Bash(npx -y modern-web-guidance@latest:*)" "Bash(npx modern-web-guidance@latest:*)" \
  --output-format stream-json --verbose \
  --no-session-persistence \
  > "$OUT/stream.jsonl" 2> "$OUT/stderr.txt" || true
end=$(date +%s)
echo $((end-start)) > "$OUT/seconds.txt"
for f in index.html style.css app.js; do cp "$WORK/$f" "$OUT/$f" 2>/dev/null || true; done
