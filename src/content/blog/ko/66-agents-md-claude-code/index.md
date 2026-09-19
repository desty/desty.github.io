---
title: "13개월 버틴 Claude Code가 AGENTS.md를 읽기 시작했다 — 그런데 CLAUDE.md가 있으면 지금도 무시한다"
summary: "Claude Code 2.1.277이 AGENTS.md를 직접 읽는다. 다만 기본값은 CLAUDE.md 우선이고, 구현이 내장 플러그인이라 /memory에 안 뜨고 훅도 안 터지며 Bedrock에서는 아예 동작하지 않는다. 헤드리스로 로딩 규칙 세 가지를 직접 확인하고, 팀 상황별로 어느 파일에 무엇을 둘지 정리했다."
date: "2026-09-19T11:00:00+09:00"
tags:
  - claude-code
  - agent-engineering
  - context-engineering
  - agents-md
draft: false
---

코딩 에이전트를 두 개 이상 쓰는 저장소에는 지침 파일이 두 개 이상 있다. Codex와 Copilot과 Cursor는 `AGENTS.md`를 읽고, Claude Code는 `CLAUDE.md`를 읽었다. 빌드 명령과 테스트 규칙과 디렉터리 설명은 같은데 파일만 둘이라, 한쪽을 고치면 다른 쪽이 낡는다. 저장소를 관리하는 쪽에서는 이게 계속 거슬렸다.

Anthropic은 2026년 9월 18일 공개한 [Claude Code 2.1.277](https://github.com/anthropics/claude-code/releases/tag/v2.1.277)에서 `AGENTS.md`를 직접 읽게 했다. 요청 이슈 [#6235](https://github.com/anthropics/claude-code/issues/6235)는 2025년 8월 21일에 열려 찬성 5,169표와 댓글 400개를 모았고, 닫히기까지 13개월이 걸렸다. `AGENTS.md`가 2025년 8월 OpenAI에서 나온 뒤 Copilot, Cursor, Jules, Amp, Windsurf, Zed가 차례로 붙는 동안 Claude Code만 남아 있었다. 표준 자체를 거부한 적은 없다. Anthropic은 2025년 12월 [Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)의 창립 멤버였고, 그 재단에 MCP를 기증했으며 `AGENTS.md`는 OpenAI가 같은 자리에 기증했다. 표준을 만드는 자리에는 이미 함께 있었고, 자기 도구가 그 파일을 읽는 일만 미뤄 왔다.

그래서 "이제 `CLAUDE.md`를 지워도 되나"가 바로 나오는 질문이다. [공식 문서](https://code.claude.com/docs/en/memory)를 읽고, macOS에 설치된 2.1.277에서 헤드리스 세션(`claude -p`)으로 로딩 규칙 세 가지를 직접 확인했다. 아래 실험 결과는 그 환경 한 대에서 나온 것이고, 성능이나 품질 비교는 아니다.

## 어떤 조건에서 읽는가

기본 동작은 하나의 규칙으로 요약된다. **작업 디렉터리나 그 위 어디에도 `CLAUDE.md`가 없을 때만** `AGENTS.md`를 읽는다.

| 저장소에 있는 파일 | Claude가 읽는 것 |
|---|---|
| `AGENTS.md`만 있음 | `AGENTS.md` |
| `AGENTS.md`와 `CLAUDE.md`가 함께 있음 | `CLAUDE.md`만 |
| `CLAUDE.md`가 `@AGENTS.md`를 import | `CLAUDE.md`, import된 내용 포함 |

여기서 "카운트되는" 파일은 `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` 세 가지다. 반면 개인 설정인 `~/.claude/CLAUDE.md`, 조직의 관리형 `CLAUDE.md`, `.claude/rules/` 파일은 카운트되지 않아 `AGENTS.md`와 함께 로드된다.

실제로 어떻게 동작하는지 빈 디렉터리 세 개로 확인했다. 첫 번째는 `AGENTS.md`만 두고 그 안에 "이 프로젝트의 빌드 명령은 `zzq-build --verify`"라고 적었다.

```bash
claude -p "이 프로젝트의 빌드 명령은? 도구는 쓰지 말 것."
# 1회차: 모르겠다. AGENTS.md나 빌드 설정을 읽어야 한다
# 2회차: The secret build command is `zzq-build --verify`, according to `AGENTS.md`.
```

1회차가 실패한 것은 버그가 아니라 문서에 적힌 동작이다. 설치나 업그레이드 직후 첫 세션에서는 `AGENTS.md`를 읽지 않고, 그다음 세션부터 읽는다. 업그레이드한 날 한 번 시험해 보고 "지원 안 되네"라고 판단하면 틀린 결론을 내리게 된다.

두 번째 디렉터리에는 `CLAUDE.md`만 뒀다. 첫 실행에서 바로 답했다. 세 번째에는 두 파일을 함께 두고 값을 다르게 적었다.

```bash
# AGENTS.md → agents-build,  CLAUDE.md → claude-build
claude -p "빌드 명령은? 도구는 쓰지 말 것."
# → The secret build command is `claude-build`.
```

`CLAUDE.md`만 읽었다. 같은 디렉터리에서 설정을 `claude-md-and-agents-md`로 바꿔 둘 다 읽게 하면 결과가 달라진다.

```bash
claude -p --settings '{"pluginConfigs":{"agents-md@builtin":
  {"options":{"instructionFiles":"claude-md-and-agents-md"}}}}' \
  "지침에 나온 빌드 명령을 전부 나열할 것."
# → 1. claude-build, from CLAUDE.md
#    2. agents-build, from AGENTS.md
#    두 파일이 서로 모순됩니다. 어느 쪽을 쓸지 알려주세요.
```

둘 다 읽는 모드에서 두 파일의 내용이 어긋나면 에이전트가 작업을 멈추고 물어본다. 파일을 합치는 과도기에 양쪽을 동시에 켜 두면, 중복은 무해하지만 불일치는 매번 대화를 끊는다.

## 두 파일의 실제 차이

내용 형식은 같은 마크다운이다. 차이는 Claude Code가 그 파일을 다루는 방식에 있다.

| | `CLAUDE.md` | 설정으로 읽는 `AGENTS.md` |
|---|---|---|
| `/memory`와 `/context`의 메모리 파일 목록 | 뜬다 | 안 뜬다 |
| `InstructionsLoaded` 훅 | 발동한다 | 발동하지 않는다 |
| 개인용 비공개 파일 | `CLAUDE.local.md` | 없다. `AGENTS.local.md`는 안 읽는다 |
| `--add-dir`로 추가한 디렉터리 | 해당 디렉터리의 파일도 로드 | 로드하지 않는다 |
| 작업 디렉터리 밖 파일을 `@path`로 import | 승인 프롬프트가 뜬다 | 이미 승인해 둔 프로젝트에서만, 프롬프트 없이 로드 |
| 경로별 규칙 | `.claude/rules/` | 대응물 없음. 단 `.claude/rules/`는 함께 로드된다 |
| 제공자 환경 | 어디서나 | Bedrock, Vertex, Foundry에서 동작하지 않음 |

`.agents/` 디렉터리와 `AGENTS.override.md`도 읽지 않는다. 받아들인 것은 저장소 루트의 파일 하나다.

차이가 이렇게 흩어져 있는 이유는 구현 위치에 있다. 이 기능은 메모리 로더 안에 들어간 게 아니라 `agents-md@builtin`이라는 내장 플러그인으로 붙었고, 훅 위에서 동작한다. 그래서 다음 경우에 기능이 통째로 사라지고, `/config`의 `Project instructions` 항목 자체가 안 보인다.

- 2.1.277 이전 버전
- 피처 플래그를 받아오지 않는 세션. Bedrock 같은 서드파티 제공자를 쓰거나 텔레메트리를 껐을 때가 여기 해당한다
- 설치·업그레이드 직후 첫 세션
- `disableAllHooks`나 `allowManagedHooksOnly`를 켰거나, `/plugin`에서 `agents-md` 플러그인을 끈 경우

하나 더 있다. 둘 다 읽는 `claude-md-and-agents-md` 값은 `~/.claude/settings.json`, `--settings` 파일, 관리형 설정에서만 먹는다. 프로젝트의 `settings.json`에 적으면 무시된다. 저장소가 기여자에게 "우리 팀은 `AGENTS.md`를 쓴다"고 강제할 방법이 없고, 그 선택은 각자의 사용자 설정이나 조직 정책에 남아 있다.

## 앞으로 어느 파일에 무엇을 둘까

위 제약을 그대로 쓰면 팀 상황별 선택이 나온다.

| 상황 | 둘 방법 | 근거 |
|---|---|---|
| Claude Code만 쓴다 | `CLAUDE.md` 유지 | 옮겨서 얻을 게 없다. `/memory` 노출, `InstructionsLoaded` 훅, `CLAUDE.local.md`를 잃는다 |
| 에이전트를 여러 개 쓰고 지침이 사실상 같다 | `AGENTS.md` 하나만 남기고 `CLAUDE.md` 삭제 | 파일이 하나가 된다. 대신 팀원 개인 지침은 `~/.claude/CLAUDE.md`로 옮긴다 |
| 공통 규칙과 Claude 전용 지시가 둘 다 있다 | `CLAUDE.md`에 `@AGENTS.md` import, 그 아래 Claude 전용 섹션 | 호환성이 가장 넓다. Bedrock에서도, 훅을 꺼도, 옛 버전에서도 읽힌다 |
| Bedrock, Vertex, Foundry를 쓰거나 텔레메트리를 껐다 | import 방식 필수 | 직접 읽기가 아예 동작하지 않는다 |
| 모노레포 | 루트와 하위 디렉터리 각각에 `AGENTS.md` | 하위 디렉터리 파일은 Claude가 그 안의 파일을 Read로 열 때 로드된다 |

세 번째 줄이 대부분의 팀에 맞는 기본값이다. `CLAUDE.md`는 한 줄로 시작하면 된다.

```markdown
@AGENTS.md

## Claude Code

`src/billing/` 아래를 고칠 때는 플랜 모드를 쓴다.
```

import를 남겨 둬도 같은 내용을 두 번 읽지는 않는다. 어느 `Project instructions` 값에서도 이미 로드한 `AGENTS.md`는 건너뛴다. 심볼릭 링크(`ln -s AGENTS.md CLAUDE.md`)도 같은 효과를 내지만, Edit과 Write 도구가 링크를 통한 쓰기를 거부하고, Windows에서 클론하면 한 줄짜리 텍스트 파일이 되므로 import 쪽이 안전하다.

내용을 나누는 기준은 도구 중립성이다. 빌드와 테스트 명령, 디렉터리 구조, 코딩 컨벤션, PR 규칙처럼 어떤 에이전트가 읽어도 같은 말이 되는 것은 `AGENTS.md`에 둔다. 플랜 모드, 스킬과 서브에이전트 호출 규칙, 훅과 권한 설정 안내처럼 Claude Code에만 있는 개념은 `CLAUDE.md`에 남긴다. 파일 확장자나 경로에 따라 달라지는 규칙은 `.claude/rules/`가 맡는다. `AGENTS.md`에는 경로별 규칙에 해당하는 장치가 없고, `.claude/rules/`는 `AGENTS.md`와 함께 로드되므로 이 조합은 충돌하지 않는다.

`AGENTS.md`로 옮길 때 같이 정리할 것들도 있다. `CLAUDE.md`에 "AGENTS.md를 읽어라"라고 문장으로 적어 둔 경우, Claude가 그 파일을 열기로 결정해야만 내용을 본다. `@AGENTS.md` import로 바꾸거나 `CLAUDE.md`를 지우는 쪽이 확실하다. `AGENTS.md`를 출력하던 `SessionStart` 훅은 제거한다. 그대로 두면 같은 내용이 컨텍스트에 두 번 들어간다.

주의할 함정이 하나 더 있다. `CLAUDE.local.md`도 카운트 대상이라, `AGENTS.md`로 통일한 저장소에서 개인 지침을 넣겠다고 `CLAUDE.local.md`를 만들면 그 순간부터 `AGENTS.md`가 안 읽힌다. 둘 다 필요하면 `Project instructions`를 `claude-md-and-agents-md`로 바꾸되, 앞의 실험에서 본 대로 두 파일의 내용이 어긋나지 않게 관리해야 한다.

## 읽혔는지 확인하는 법

`AGENTS.md`는 `/memory`에도 `/context`의 메모리 파일 목록에도 뜨지 않는다. 확인 방법은 두 가지다. 대화형 세션 시작 때 `no CLAUDE.md found; AGENTS.md loaded: /path/AGENTS.md` 같은 줄이 지나가는지 보거나, 에이전트에게 프로젝트 지침에 뭐라고 적혀 있는지 직접 물어보는 것이다. 이 블로그 저장소가 그 상태다. 루트에 `AGENTS.md`만 있고 `CLAUDE.md`는 없다.

지침이 읽혔다는 것과 지켜진다는 것은 다르다. 문서도 이 파일들을 강제 설정이 아니라 컨텍스트로 취급한다고 명시한다. 무슨 일이 있어도 막아야 하는 행동은 `PreToolUse` 훅으로 처리하라고 안내한다. [하네스 엔지니어링 글에서](/blog/35-harness-engineering/) 정리한 원칙과 같다. 지침에 적은 규칙은 검사 장치로도 강제돼야 하고, 지침 파일의 이름을 통일하는 일은 그 강제와 별개다.

## 정리

받아들인 범위를 그대로 적으면 이렇다. 파일 이름은 표준을 따랐고, 우선순위와 구현 위치와 설정 권한은 그대로 남겼다. `CLAUDE.md`가 있으면 지금도 `CLAUDE.md`가 이기고, 기능은 끌 수 있는 내장 플러그인이며, 저장소는 읽을 파일을 정할 수 없다. Bedrock을 쓰는 조직은 어제와 달라진 게 없다.

그래도 대부분의 팀에는 실제로 쓸 만한 변화다. 여러 에이전트를 쓰는 저장소라면 `AGENTS.md`에 공통 규칙을 모으고 `CLAUDE.md`는 import 한 줄과 Claude 전용 지시만 남기는 구성이 지금 시점의 안전한 기본값이다. 옮긴 다음에는 업그레이드 직후 첫 세션이 아닌 상태에서 한 번, 그리고 팀에서 Bedrock을 쓰는 사람이 있다면 그 환경에서 한 번 더 읽히는지 확인하면 된다.
