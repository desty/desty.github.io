---
title: "Hermes Agent vs OpenClaw — 같은 꿈, 다른 설계"
summary: "둘 다 영구 메모리, 도구 통합, 셀프 호스팅. 겉보기엔 비슷한 두 오픈소스 AI 에이전트의 소스코드를 열어보니, 아키텍처 철학이 완전히 달랐다. OpenClaw에서 Hermes로 넘어온 경험을 바탕으로 코드 레벨에서 해부한다."
date: "2026-05-23T18:00:00"
tags:
  - ai-agent
  - open-source
  - self-hosted
  - agent-engineering
  - hermes-agent
  - openclaw
---

"오픈소스 AI 에이전트 하나 골라서 셀프 호스팅하면 되겠지."

나도 그렇게 생각했다. OpenClaw를 깔고, Docker로 띄우고, Telegram 채널을 연결했다. 잘 돌아갔다. 한동안은.

그런데 쓰다 보니 질문이 바뀌었다. "어떻게 연결하지?"에서 **"어떻게 더 똑똑하게 만들지?"로**. OpenClaw는 게이트웨이를 안정적으로 운영하는 데 최적화되어 있었고, 내가 원한 건 에이전트가 스스로 성장하는 구조였다. 그래서 [Hermes Agent](https://github.com/NousResearch/hermes-agent)로 넘어왔다.

두 프로젝트를 직접 클론해서 소스코드를 읽었다. README 비교가 아니라 **코드에서 드러나는 설계 철학의 차이**를 정리한다. 결론부터 말하면 — 둘 다 "영구 메모리 + 도구 통합 + 셀프 호스팅"이라는 같은 꿈을 꾸고 있지만, **꿈을 실현하는 방식이 근본적으로 다르다.**

---

## 핵심: Agent-first vs Gateway-first

두 프로젝트의 차이를 한 줄로 압축하면 이것이다.

| | Hermes Agent | OpenClaw |
|---|---|---|
| **한 줄 정의** | 스스로 성장하는 에이전트 | 항상 켜진 게이트웨이 비서 |
| **중심 설계** | Agent-first | Gateway-first |
| **핵심 질문** | "에이전트가 어떻게 더 나아지는가?" | "에이전트가 어떻게 항상 연결되는가?" |

이 차이가 작아 보일 수 있다. 하지만 코드를 열어보면, **이 한 가지 선택이 메모리 구조, 도구 등록 방식, 실행 모델, 확장 방향을 전부 결정한다.**

---

## 아키텍처: 누가 주인인가

### Hermes — 에이전트가 주인이다

Hermes의 진입점은 `run_agent.py` — 4,300줄짜리 `AIAgent` 클래스다. 대화 루프(`conversation_loop.py`, 3,900줄)가 심장이고, 모델 호출, 도구 실행, 메모리 갱신, 컨텍스트 압축이 여기서 전부 일어난다.

```
AIAgent (run_agent.py)
  └── conversation_loop.py  ← 심장
        ├── Tool Registry (95개 모듈, AST 자동 발견)
        ├── Memory Manager (frozen snapshot)
        ├── Skill System (자율 생성 + Curator)
        ├── MCP Client (stdio/HTTP/SSE)
        └── Subagent Delegate (병렬 실행)
```

게이트웨이(Telegram, Discord 등)는 `gateway/` 디렉토리에 있지만, 에이전트에게 메시지를 **배달하는 역할**에 불과하다. 에이전트가 주인이고 채널은 입출력 표면이다.

### OpenClaw — 게이트웨이가 주인이다

OpenClaw의 핵심은 단일 **Gateway 프로세스**다. 포트 18789에서 세션, 라우팅, 채널 연결, 도구 실행의 기준점 역할을 한다.

```
Gateway Process (port 18789)
  └── WebSocket Protocol (타입 지정, 버전 협상)
        ├── Channel Plugins (40+ 메시징 플랫폼)
        ├── Session Manager (per-session 직렬화 + 파일 락)
        ├── Agent Runtime (pi-agent-core)
        ├── Plugin SDK (498 파일, manifest 기반)
        └── Context Engine (조립 + 압축, 플러그인 교체 가능)
```

에이전트 실행은 Gateway가 받은 메시지를 `agentCommand`로 라우팅해서 처리한다. Gateway가 주인이고 에이전트는 실행 엔진이다.

이건 단순한 구조적 차이가 아니다. **중심이 어디에 있느냐가 확장 방향을 결정한다.** Hermes는 에이전트를 더 똑똑하게 만드는 방향으로 진화하고(스킬, Curator, MoA), OpenClaw는 연결과 운영을 더 안정적으로 만드는 방향으로 진화한다(채널 플러그인, 세션 관리, 샌드박스 정책). 같은 기능을 추가하더라도 설계의 무게중심이 다르다.

---

## 메모리: 성능 vs 투명성

메모리 시스템은 두 프로젝트의 설계 철학이 가장 선명하게 갈리는 지점이다. 그리고 내가 OpenClaw에서 Hermes로 넘어온 결정적 이유이기도 하다.

### Hermes — Frozen Snapshot

```
~/.hermes/memories/
  ├── MEMORY.md  (2,200자 제한 — 에이전트의 관찰)
  └── USER.md    (1,375자 제한 — 사용자 프로필)
```

- 세션 시작 시 **스냅샷을 찍어** 시스템 프롬프트에 주입한다.
- 세션 중 `memory` 도구로 쓰기가 일어나면 디스크에는 즉시 반영되지만, **진행 중인 프롬프트에는 반영되지 않는다.**
- 왜? **LLM prefix cache를 깨지 않기 위해서.** 시스템 프롬프트가 바뀌면 캐시가 무효화되어 비용과 지연이 증가한다. 이건 사소한 최적화가 아니다 — 장기 실행 에이전트에서는 비용 차이가 크다.
- 파일 락으로 동시 세션 충돌을 방지하고, `.bak` 스냅샷으로 외부 변경을 감지한다.
- 보안 스캐닝이 프롬프트 인젝션, 자격증명 유출, 보이지 않는 유니코드를 차단한다.

과거 대화 검색은 `session_search` 도구가 SQLite FTS5 인덱스를 쓴다. 여기에 8개 외부 메모리 플러그인(Honcho, Mem0, RetainDB 등)으로 시맨틱 검색이나 지식 그래프를 붙일 수 있다.

### OpenClaw — Plain Markdown

```
~/.openclaw/workspace/
  ├── MEMORY.md             (장기 기억 — 매 세션 로드)
  ├── SOUL.md               (성격)
  ├── AGENTS.md             (에이전트 설정)
  ├── DREAMS.md             (옵션 — 꿈 일기)
  └── memory/
      ├── 2026-05-22.md     (어제 로그)
      └── 2026-05-23.md     (오늘 로그 — 자동 로드)
```

OpenClaw의 원칙은 단순하다. **"메모리는 그냥 마크다운."** 숨겨진 상태가 없다. 파일을 열면 에이전트가 뭘 기억하고 있는지 그대로 보인다. 오늘과 어제의 daily log만 자동 로드되고, 나머지는 인덱싱되어 검색 가능하다.

하이브리드 검색(SQLite + `sqlite-vec` 벡터 유사도 + FTS5 키워드)이 빌트인이고, 선택적 **dreaming** 패스가 단기 메모에서 고신호 항목을 MEMORY.md로 자동 승격시킨다.

### 뭐가 다른가

| 관점 | Hermes | OpenClaw |
|------|--------|----------|
| 저장 형식 | 마크다운 (§ 구분자) | 마크다운 (파일별 분리) |
| 로드 전략 | 세션 시작 시 frozen snapshot | 세션 시작 시 직접 로드 (MEMORY + 오늘/어제) |
| 용량 제한 | 명시적 (2,200자 / 1,375자) | 암묵적 (토큰 예산 내) |
| 캐시 최적화 | prefix cache 보존이 핵심 | 컨텍스트 엔진이 토큰 예산 관리 |
| 과거 검색 | SQLite FTS5 + 8개 플러그인 | 하이브리드 (벡터 + BM25) 빌트인 |
| 자동 정리 | Curator가 스킬 정리 (메모리는 수동) | dreaming 패스가 자동 승격 |

정리하면 Hermes는 **"성능 먼저, 캐시를 깨지 마라"**, OpenClaw는 **"투명성 먼저, 사람이 읽을 수 있어야 한다"다**. 어느 쪽이 맞다 틀리다가 아니다. 장기 실행 비용이 중요하면 Hermes의 frozen snapshot이 현실적이고, 에이전트가 뭘 기억하는지 직접 확인하고 싶으면 OpenClaw의 plain markdown이 편하다.

---

## 도구 시스템: 파일 한 개 vs 패키지 구조

### Hermes — 95개 모듈, AST로 자동 발견

Hermes의 도구 등록은 우아하게 단순하다. `tools/registry.py`의 `discover_builtin_tools()` 함수가 `tools/*.py` 파일을 **AST로 스캔**해서 `registry.register()` 호출을 자동으로 찾는다. 도구를 추가하고 싶으면? Python 파일 하나 만들고 register를 호출하면 끝이다.

95개 이상의 빌트인 도구 모듈이 있다. 파일, 터미널, 웹, 브라우저, 비전, 코드 실행, 음악, 이미지, 홈 오토메이션까지. Toolset으로 카테고리 단위 활성화/비활성화가 가능하고, 도구별 결과 크기 제한도 있다.

### OpenClaw — 매니페스트 기반 플러그인

OpenClaw은 도구를 **플러그인 확장**으로 구현한다. `src/plugin-sdk/`(498 파일)가 공개 계약을 정의하고, 각 도구는 매니페스트 메타데이터로 역량을 선언한다.

Slot 시스템(하나의 슬롯에 하나의 활성 구현, 설정으로 교체 가능), 도구 생명주기 이벤트(`start → update → end`), `before_tool_call` / `after_tool_call` 후크가 있다. `boundary.ts`에서 도구 가용성과 권한 경계를 관리한다.

### 뭐가 다른가

| 관점 | Hermes | OpenClaw |
|------|--------|----------|
| 등록 방식 | AST 자동 발견 | 매니페스트 선언 + SDK |
| 언어 | Python | TypeScript |
| 도구 수 | 95+ 빌트인 | 핵심 도구 + 확장 플러그인 |
| 확장성 | 파일 하나 추가 | 플러그인 패키지 구조 |
| 정책 관리 | Toolset 그룹핑 | Slot + Boundary 시스템 |

Hermes는 **"빠르게 도구를 추가하고 돌려보자"에** 최적화되어 있고, OpenClaw은 **"도구의 권한과 생명주기를 제어하자"에** 최적화되어 있다. 프로토타이핑에는 Hermes가 빠르고, 프로덕션 정책 관리에는 OpenClaw의 Slot + Boundary가 견고하다.

---

## 스킬 시스템: Hermes가 "성장하는 에이전트"인 이유

여기가 결정적 차이다. OpenClaw에는 이에 해당하는 시스템이 **아예 없다.**

```
~/.hermes/skills/
  ├── coding/
  │   └── debug-python/
  │       └── SKILL.md   ← YAML 프론트매터 + 마크다운 본문
  ├── research/
  └── ...
```

Hermes는 복잡한 작업을 완료한 뒤, **에이전트가 자율적으로 스킬 문서를 생성한다.** 트리거 조건, 단계별 지침, 함정, 검증 방법이 포함된다. 91개 빌트인 스킬에 [agentskills.io](https://agentskills.io) 커뮤니티 스킬 520개 이상.

그리고 **Curator**가 있다. 비활성 시 트리거되는 백그라운드 에이전트로, 스킬을 채점하고 통합하고 보관한다. 7일 주기로 사용 빈도 기반 생명주기를 관리하고, 자동 삭제하지 않고 보관만 한다(복구 가능). 메인 세션 캐시를 보존하기 위해 보조 모델에서 실행된다.

이게 Hermes를 써보면 느끼는 가장 큰 차이다. **작업 경험이 재사용 가능한 절차적 지식으로 결정화된다.** 같은 유형의 작업을 반복할수록 에이전트가 실제로 빨라진다. "AI가 학습한다"는 마케팅 문구가 아니라, 스킬 문서라는 형태로 실체가 있다.

---

## 멀티에이전트: 오케스트레이터 vs 솔로 플레이어

### Hermes — 병렬 위임 + Mixture of Agents

두 가지 패턴이 있다.

1. **Delegate**: 격리된 서브에이전트를 생성해서 병렬 작업 스트림을 처리한다. RPC 기반 도구 접근, 부모로부터 자격증명/도구셋 상속.

2. **Mixture of Agents (MoA)**: 여러 참조 모델(claude-opus-4.6, gemini-2.5-pro, gpt-5.4-pro, deepseek-v3.2)이 병렬로 답변을 생성하고, 집계 모델(claude-opus-4.6)이 합성한다.

오케스트레이터가 전문 에이전트를 호출하는 directed graph 형태의 워크플로에 강하다.

### OpenClaw — 직렬 실행, 한 놈만 패기

OpenClaw의 에이전트 실행은 **per-session 직렬화**다. 한 세션에서 한 번에 하나의 에이전트만 실행된다. `sessions_spawn`으로 새 세션을 만들 수는 있지만, 본질적으로 **plan-execute-reflect 패턴의 단일 에이전트 루프**다. 세션 쓰기 락으로 경합을 방지한다.

| 관점 | Hermes | OpenClaw |
|------|--------|----------|
| 병렬 실행 | MoA + Delegate 서브에이전트 | per-session 직렬 (세션 스폰 가능) |
| 크로스 모델 합성 | MoA로 여러 모델 결과 합성 | 단일 모델 |
| 적합한 패턴 | 오케스트레이터 → 전문 에이전트 | 단일 에이전트가 분해하며 실행 |

복잡한 자동화를 여러 전문 에이전트에 분배하고 싶으면 Hermes, 하나의 에이전트가 차근차근 밀고 나가는 게 맞으면 OpenClaw다.

---

## 채널 & 게이트웨이

둘 다 메시징 플랫폼 통합을 지원한다. 하지만 접근이 다르다.

| 관점 | Hermes | OpenClaw |
|------|--------|----------|
| 플랫폼 수 | 35+ | 40+ |
| 아키텍처 | 플랫폼별 어댑터 | WebSocket 프로토콜 + 채널 플러그인 |
| 프로토콜 | 플랫폼별 직접 연결 | 타입 지정 WebSocket (버전 협상, nonce 인증) |
| 역할 분리 | 없음 (에이전트 중심) | operator vs node (스코프 기반 권한) |
| DM 보안 | 플랫폼별 | pairing 코드 기반 (기본값) |

채널 연결이 핵심 가치인 프로젝트답게, OpenClaw의 WebSocket 프로토콜은 눈에 띄게 정교하다. `connect` → 핸드셰이크 → nonce 서명 → `hello-ok` + 기능 목록이라는 구조화된 흐름, 스코프(`read`, `write`, `admin`, `approvals`)로 세밀한 접근 제어. 이 부분은 OpenClaw가 확실히 앞선다.

---

## MCP: 클라이언트 vs 양방향

Hermes는 **강력한 MCP 클라이언트**다. 3가지 전송 모드(stdio, HTTP/StreamableHTTP, SSE), 전용 비동기 이벤트 루프, 서버별 병렬 도구 호출, 샘플링 지원, 자동 재연결.

OpenClaw는 한 발 더 나간다. **자체가 MCP 서버로도 작동한다.** `openclaw mcp serve`를 실행하면 채널 대화를 stdio MCP로 노출한다. 다른 에이전트(예: Claude Code)가 OpenClaw의 대화를 MCP를 통해 읽고 쓸 수 있다는 뜻이다.

이건 OpenClaw만의 독특한 포지션이다. 에이전트이면서 동시에 **다른 에이전트의 도구**가 될 수 있다.

---

## 배포 & 운영

| 관점 | Hermes | OpenClaw |
|------|--------|----------|
| 언어 | Python 3.11+ | TypeScript (Node 24) |
| 설치 | `curl` 원라인 (Windows: 번들 인스톨러) | `npm install -g openclaw` + `openclaw onboard` |
| Docker | 지원 | 권장 (multi-stage build, Tini init) |
| 실행 백엔드 | 7가지 (로컬, Docker, SSH, Singularity, Modal, Daytona, Vercel) | 3가지 (Docker, SSH, OpenShell) |
| 보안 | 메모리 인젝션 스캔, MCP 패키지 악성코드 스캔 | cap_drop, no-new-privileges, 샌드박스 정책 |
| 관측성 | 내장 트레이싱 | OpenTelemetry + Prometheus 내장 |
| 마이그레이션 | `hermes claw migrate` (OpenClaw → Hermes) | — |

주목할 점: Hermes가 `hermes claw migrate` 명령으로 OpenClaw에서의 마이그레이션 도구를 제공한다. SOUL.md, MEMORY.md, 스킬, API 키, 플랫폼 설정까지 옮겨준다. 실제로 내가 넘어올 때 이 도구를 썼다. 생각보다 매끄러웠다.

---

## 종합 비교

| 구분 | Hermes Agent | OpenClaw |
|------|-------------|----------|
| 제작 | Nous Research | OpenClaw 커뮤니티 |
| 라이선스 | MIT | MIT |
| 언어 | Python 3.11+ | TypeScript (Node 24) |
| 중심 설계 | Agent-first (자기 개선 루프) | Gateway-first (채널 운영) |
| 메모리 | Frozen snapshot + 8개 플러그인 | Plain markdown + 하이브리드 검색 |
| 스킬 시스템 | 자율 생성 + Curator 관리 | 없음 |
| 도구 등록 | AST 자동 발견 (95+ 모듈) | 매니페스트 기반 플러그인 SDK |
| 멀티에이전트 | MoA + Delegate 서브에이전트 | per-session 직렬 실행 |
| 채널 | 35+ 플랫폼 어댑터 | 40+ 채널 플러그인 |
| 프로토콜 | 플랫폼 직접 연결 | 타입 지정 WebSocket + 스코프 |
| MCP | 클라이언트 (3가지 전송) | 서버 + 클라이언트 |
| 실행 백엔드 | 7가지 | 3가지 (Docker/SSH/OpenShell) |
| 관측성 | 내장 트레이싱 | OpenTelemetry + Prometheus |
| 마이그레이션 | OpenClaw→Hermes 지원 | — |

---

## 결론: 에이전트에게 뭘 기대하는가

[블로그 #14](/blog/agent-engineering/)에서 정리한 에이전트 9대 구성요소를 이 두 프로젝트에 대입하면 패턴이 보인다.

Hermes는 **Agent Layer를 깊게 판다** — 스킬 축적, MoA, 서브에이전트 위임, prefix cache 최적화. 에이전트가 매일 더 똑똑해지는 방향이다.

OpenClaw는 **Control Layer와 Distribution Layer를 넓게 깐다** — 세션 격리, 샌드박스 정책, WebSocket 프로토콜, 40개 채널 플러그인, MCP 서버 모드. 에이전트가 어디서든 안정적으로 운영되는 방향이다.

나는 OpenClaw로 시작해서 Hermes로 넘어왔다. 만족한다. 하지만 이건 Hermes가 "더 좋아서"가 아니라, **내가 에이전트에게 기대하는 것이 "안정적인 비서"에서 "성장하는 동료"로 바뀌었기 때문이다.**

에이전트를 고르기 전에 먼저 자신에게 물어봐야 할 질문은 하나다.

**당신은 에이전트에게 안정성을 기대하는가, 성장을 기대하는가?**

---

## 참고 자료

- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent) — Nous Research, MIT 라이선스
- [Hermes Agent 공식 문서](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Agent 5-Pillar Architecture](https://www.mindstudio.ai/blog/hermes-agent-5-pillar-architecture-memory-skills-soul-crons)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw) — MIT 라이선스
- [OpenClaw 공식 문서](https://docs.openclaw.ai/)
- [OpenClaw Memory Concepts](https://docs.openclaw.ai/concepts/memory)
- [Awesome Hermes Agent](https://github.com/0xNyk/awesome-hermes-agent) — 커뮤니티 리소스
