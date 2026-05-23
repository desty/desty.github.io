---
title: "모델 바깥의 전쟁 — 에이전트 엔지니어가 진짜 설계하는 것"
summary: "에이전트 = LLM + API라는 공식은 이미 깨졌다. Google, Anthropic, Cursor, OpenAI, Microsoft, ServiceNow, Salesforce — 7개 회사의 에이전트 전략을 '중심 객체' 관점으로 해부하고, 에이전트 엔지니어가 실제로 설계해야 할 시스템의 전체 그림을 그린다."
date: "2026-05-23T14:00:00"
tags:
  - ai-agent
  - agent-engineering
  - llm
  - multi-agent
  - agentic-coding
  - ai-coding
---

"LLM API 연결하고 프롬프트 잘 쓰면 에이전트 완성."

6개월 전까지는 이 공식이 통했다. 지금은 아니다.

2025년 12월, [Agentic AI Foundation(AAIF)이 Linux Foundation 산하에 출범했다](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/). 창립 멤버는 AWS, Anthropic, Google, Microsoft, OpenAI, Block, Cloudflare, Bloomberg — 서로 경쟁하는 회사들이 한자리에 모였다. Anthropic은 MCP를, OpenAI는 AGENTS.md를, Block은 goose를 기부했다. **에이전트 시스템에는 공통 인프라가 필요하다**는 데 업계 전체가 동의한 것이다.

이건 에이전트가 "프롬프트 + API 호출"의 영역을 넘어섰다는 신호다. 에이전트 엔지니어링은 이제 하나의 독립적인 엔지니어링 분야가 되고 있다.

---

## 하나의 큰 방향: 대화에서 실행으로

요즘 에이전트 흐름의 공통 방향을 한 문장으로 요약하면 이것이다.

**LLM 애플리케이션이 "대화형 답변 도구"에서 "상태를 가진 실행 시스템"으로 바뀌고 있다.**

에이전트 엔지니어가 봐야 할 대상은 더 이상 프롬프트나 모델만이 아니다. 에이전트는 이제 다음 요소를 포함하는 소프트웨어 시스템이다.

| 구성요소 | 역할 |
|---------|------|
| Model | 추론, 계획, 생성 |
| Tools | API, DB, 브라우저, 코드 실행, SaaS 커넥터 |
| Context | 파일, 대화, 사용자 상태, 조직 데이터 |
| Memory | 단기/장기 기억, 선호, 작업 이력 |
| State | 진행 중인 작업, 실패/재시도 상태 |
| Policy | 권한, 금지 행동, 승인 조건 |
| Evaluation | 결과 검증, 품질 측정 |
| Observability | 로그, trace, cost, latency |
| Human-in-the-loop | 승인, 수정, 중단, 롤백 |

이 목록을 보면 LLM은 9개 구성요소 중 하나에 불과하다. 결국 에이전트 엔지니어는 "LLM을 잘 부르는 사람"이 아니라, **불확실한 추론 엔진을 안전하게 실행 시스템 안에 넣는 사람**에 가깝다.

Matt Webb이 말한 ["context plumbing"](https://simonwillison.net/2025/Nov/29/context-plumbing/) — 다양한 소스에서 맥락을 가져와 에이전트가 필요한 곳에 전달하는 배관 작업 — 이 개념이 잘 보여준다. 에이전트를 잘 돌리는 일의 본질은 더 똑똑한 모델을 쓰는 게 아니라, **더 나은 정보 흐름 인프라를 설계하는 것**이다.

---

## 7개 회사, 7개 중심 객체

각 회사의 에이전트 전략에서 차별점의 본질은 이것이다.

**에이전트가 어떤 객체를 중심으로 움직이는가?**

이 질문 하나로 7개 회사의 접근이 명확하게 갈린다.

### Google: 사용자 표면 전체를 엮는 Context Broker

중심 객체는 **사용자, 일정, 문서, 검색 결과**다.

Gmail, Calendar, Docs, Sheets, Android — Google은 사용자 접점이 압도적으로 넓다. [ADK 2.0](https://developers.googleblog.com/en/agent-development-kit-adk/)은 그래프 기반 워크플로우 런타임을 도입해 결정론적 흐름과 적응형 AI 추론을 결합했고, [A2A 프로토콜 v1.0.0](https://github.com/google/A2A)은 50개 이상 파트너와 함께 에이전트 간 통신 표준이 됐다.

에이전트 엔지니어 관점의 핵심 문제는 **멀티앱 컨텍스트 통합과 권한 경계 설계**다. 메일, 문서, 일정, 검색 결과를 하나의 작업 맥락으로 묶으면서, 어떤 앱의 어떤 데이터까지 읽고 쓸 수 있는지 제한해야 한다.

Google을 보면 에이전트는 **사용자 표면 전체에 걸친 context broker**로 진화하고 있다.

### Anthropic / Claude: 검증 가능한 전문 워크플로우

중심 객체는 **전문 업무 문서, 분석 태스크**다.

Claude의 방향은 범용 비서가 아니라 **고신뢰 업무에 특화된 vertical agent**다. [MCP를 AAIF에 기부하며 도구 통합을 표준화](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/)했고, Agent Skills Standard를 통해 에이전트 역량 선언 스펙을 공개했다. Claude Code는 [연간 $2.5B 매출](https://simonwillison.net/2026/Feb/21/anthropic-revenue/)을 달성하며 코딩 에이전트의 레퍼런스가 됐다.

핵심 문제는 **도메인별 작업 분해와 검증 가능한 실행**이다. 복잡한 업무를 검토→추출→판단→작성 단계로 분해하고, 모든 판단에 근거 문서를 연결하며, 사람이 중간 결과를 검토할 수 있어야 한다.

배울 점은 "에이전트에게 다 맡긴다"가 아니라, **LLM이 잘하는 부분과 deterministic 로직이 맡아야 할 부분을 분리하는 설계**다.

### Cursor: Diff가 곧 결과물인 코딩 에이전트

중심 객체는 **코드베이스, diff, branch, PR**이다.

[2026년 Gartner Magic Quadrant for Enterprise AI Coding Agents에서 Leader로 선정](https://cursor.com/blog)됐다. Cursor 3은 통합 워크스페이스, Composer 2.5는 장기 에이전틱 태스크 성능을 크게 개선했고, Cloud Agent는 장시간 자율 개발 작업을 처리한다.

핵심 문제는 **작업 격리, 코드 변경 검증, 병렬 에이전트 실행**이다. 필요한 파일과 의존성을 정확히 찾고, 안전한 환경에서 실행하고, 여러 작업이 충돌하지 않도록 격리해야 한다.

여기서 중요한 교훈: 에이전트 결과물이 "텍스트 답변"이 아니라 **diff**다. 에이전트 품질은 대화 품질이 아니라 **실제 변경의 정확성, 테스트 통과, 리뷰 가능성**으로 측정된다. [블로그 #11](/blog/cognitive-debt-and-agentic-coding/)에서 다룬 감독의 역설이 여기서 가장 첨예하게 드러난다.

### OpenAI / Codex: 범용 Agent Runtime

중심 객체는 **tool, runtime, agent step**이다.

[Agents SDK](https://github.com/openai/openai-agents-python)는 100개 이상 LLM을 지원하는 경량 프레임워크로 진화했고, Sandbox Agent(컨테이너 기반 장기 실행), Session(자동 히스토리 관리), Tracing(내장 관측성)을 제공한다. Codex는 macOS 앱으로 확장되며 월 100만 이상 개발자가 사용한다.

핵심 문제는 **모델·도구·상태·평가를 분리한 agent framework 설계**다. 모델이 바뀌어도 tool interface가 유지되고, 작업별로 다른 모델을 선택하며, 결과를 자동 평가하는 품질 루프를 구성해야 한다.

OpenAI형 접근에서 배울 점은 **agent substrate** — 모델을 교체 가능한 구성요소로 보고 그 위의 레이어를 설계하는 것이다.

### Microsoft: 에이전트를 관리하는 Control Plane

중심 객체는 **agent identity, policy, tenant**다.

[Microsoft Foundry Agent Service](https://learn.microsoft.com)는 Prompt Agent(노코드), Workflow Agent(시각적/YAML 오케스트레이션), Hosted Agent(컨테이너 기반 커스텀 코드) 세 유형을 제공한다. [Microsoft Entra Agent ID](https://learn.microsoft.com)는 에이전트에게 Zero Trust 보안 모델을 적용하며, RBAC, 콘텐츠 필터, VNet 격리를 지원한다.

핵심 문제는 **Agent registry, identity, permission, audit**다. 많은 에이전트가 생기면 "잘 작동하냐"뿐 아니라 **"누가 통제하냐"**가 된다. 에이전트도 하나의 행위자로 식별되어야 하고, 계정, 권한, 로그, 책임 주체가 필요하다.

Microsoft형 관점의 핵심 메시지: **에이전트는 소프트웨어이면서 동시에 "행위자"다.** 에이전트 엔지니어링은 앞으로 DevOps, SecOps, IAM과 강하게 결합될 것이다.

### ServiceNow: 상태 기반 프로세스 오케스트레이터

중심 객체는 **ticket, workflow, incident, approval**이다.

대화창이 아니라 업무 객체를 중심으로 작동한다. 접수→분석→처리→승인→완료의 상태 전이, 사람-시스템-에이전트 간 역할 넘김, SLA 인식, 이벤트 기반 실행이 핵심이다.

ServiceNow형 에이전트는 task agent보다 **process agent**에 가깝다. 봐야 할 포인트는 "한 번의 지능적 응답"이 아니라, **장기간 상태를 유지하며 프로세스를 끝까지 밀고 가는 설계**다.

### Salesforce: 도메인 객체 위의 고객 에이전트

중심 객체는 **customer, account, case, opportunity**다.

Account, Lead, Case 같은 CRM 객체 기반으로 추론하고, follow-up, quote, case update 같은 비즈니스 액션을 수행한다.

배울 점은 에이전트의 메모리가 단순 대화 이력이 아니라, **비즈니스 객체와 관계 그래프**여야 한다는 것이다. [블로그 #13](/blog/ai-ready-data/)에서 다룬 AI-Ready Data의 조건이 여기서 직접적으로 적용된다 — 에이전트가 잘 작동하려면 도메인 객체가 구조화되어 있어야 한다.

### 개발자 인사이트

> **중심 객체가 곧 설계의 출발점이다.** 7개 회사는 각각 다른 객체를 중심에 놓았고, 그로부터 context, action, state, permission, evaluation이 모두 결정된다. 새 에이전트 시스템을 설계할 때 가장 먼저 물어야 할 질문은 "어떤 모델을 쓸까?"가 아니라 **"우리 에이전트의 중심 객체는 무엇인가?"**다.

---

## "중심 객체"가 모든 걸 결정한다

7개 회사를 한 테이블로 정리하면 이렇다.

| 회사 | 중심 객체 | 엔지니어링 차별점 |
|------|---------|----------------|
| Google | 사용자, 일정, 문서, 검색 결과 | 멀티앱 컨텍스트와 개인화 |
| Anthropic/Claude | 전문 업무 문서, 분석 태스크 | 고신뢰 vertical workflow |
| Cursor | 코드베이스, diff, branch, PR | 코드 변경 실행과 검증 루프 |
| OpenAI | tool, runtime, agent step | 범용 agent runtime과 tool abstraction |
| Microsoft | agent identity, policy, tenant | agent governance와 control plane |
| ServiceNow | ticket, workflow, incident | 상태 기반 업무 프로세스 오케스트레이션 |
| Salesforce | customer, account, case | 도메인 객체 기반 CRM 에이전트 |

중심 객체가 정해져야 나머지가 결정된다.

| 설계 질문 | 중심 객체에 따른 답 |
|---------|------------------|
| Context는 어디서 오는가? | repo, CRM, 문서, 메일, ticket |
| Action은 무엇인가? | PR 생성, 메일 발송, case update, API 호출 |
| State는 어떻게 변하는가? | pending → running → blocked → approved → done |
| Permission은 어디에 붙는가? | 사용자, agent, tool, object |
| Evaluation은 무엇으로 하는가? | 테스트, 근거 정확도, SLA, 매출, CSAT |
| Human review는 어디서 필요한가? | 발송 전, 배포 전, 고객 영향 전 |

---

## 6가지 핵심 설계 패턴

[Anthropic의 "Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents)에서도 강조하듯, 성공적인 에이전트 구현은 복잡한 프레임워크가 아니라 **단순하고 조합 가능한 패턴**에서 나온다. 에이전트 엔지니어가 익혀야 할 핵심 패턴 6가지를 정리한다.

### 패턴 1. Plan → Act → Observe → Verify

가장 기본적인 에이전트 루프다.

```
Goal → Plan → Tool Call → Observation → Verification → Next Step or Done
```

핵심은 **Act 이후에 Verify가 반드시 있어야 한다**는 것이다. 도구 호출 결과를 그대로 믿으면 안 된다. [Armin Ronacher가 지적한 것처럼](https://simonwillison.net/2025/Nov/23/agent-design-is-still-hard/) 에이전트 설계에서 가장 어려운 문제는 테스트와 검증이며, 이건 독립된 단위 테스트가 아니라 통합된 관측성을 요구한다.

### 패턴 2. Human-gated Action

위험도가 있는 액션은 반드시 사람 승인을 거쳐야 한다. 이게 왜 이론이 아니라 실전인지 보여주는 사례가 있다 — 2025년 12월, [자율 에이전트가 Rob Pike에게 스팸 메일을 보낸 사건](https://simonwillison.net/2025/Dec/), 2026년 5월, [에이전트가 조리 시설도 없는 카페에 달걀 120개를 주문한 사건](https://simonwillison.net/2026/May/).

```
Draft Action → Explain reason → Show evidence → Ask approval → Execute → Log result
```

승인이 필요한 액션: 메일 발송(외부 커뮤니케이션), 결제(금전 영향), DB update(데이터 변경), 코드 merge/deploy(서비스 영향), 권한 변경(보안 영향).

### 패턴 3. Tool Permission Matrix

모델이 **할 수 있는 것**과 에이전트가 **허용받은 것**을 분리해야 한다.

| Agent 유형 | Read | Write | External 위험도 |
|-----------|------|-------|---------------|
| Research Agent | 문서, 웹 | 없음 | 낮음 |
| Coding Agent | repo read | branch write | 중간 |
| Support Agent | 고객/정책 read | ticket draft | 높음 |
| Admin Agent | config read | 권한 변경 | 매우 높음 |

### 패턴 4. Agent State Machine

에이전트 작업은 상태 머신으로 관리해야 재시도, 중단, 재개, 감사가 가능하다.

```
CREATED → PLANNING → WAITING_FOR_TOOL → RUNNING → WAITING_FOR_APPROVAL → COMPLETED

실패 시: RUNNING → FAILED → RETRYING → ESCALATED
```

상태가 없으면 "어디까지 했고 왜 멈췄는지"를 아무도 모른다. [LangChain의 ADLC(Agent Development Lifecycle)](https://langchain.com/blog) 프레임워크도 Build→Test→Deploy→**Monitor** 구조에서 상태 추적을 핵심으로 놓는다.

### 패턴 5. Evidence-first Response

고신뢰 에이전트는 **먼저 답을 만들고 나중에 근거를 붙이는** 방식이면 위험하다.

```
Retrieve evidence → Rank evidence → Extract facts → Generate answer → Check answer against evidence
```

이 구조가 없으면 할루시네이션을 통제하기 어렵다. [블로그 #13](/blog/ai-ready-data/)에서 다룬 것처럼, evidence의 품질은 결국 데이터의 AI-Ready 수준에 달려 있다.

### 패턴 6. Evaluator as First-class Component

에이전트에는 **반드시** 평가기가 필요하다.

| Evaluator | 평가 대상 |
|-----------|---------|
| Grounding evaluator | 근거와 답변 일치 여부 |
| Tool result evaluator | 도구 호출 결과 해석 정확도 |
| Safety evaluator | 금지 행동, 민감정보 노출 |
| Task completion evaluator | 목표 달성 여부 |
| Cost evaluator | 토큰, API, 실행시간 |
| Regression evaluator | 새 버전이 기존 성능을 깨지 않았는지 |

앞으로 에이전트 시스템의 품질은 프롬프트가 아니라 **evaluation harness**가 결정한다.

### 개발자 인사이트

> **패턴을 외우는 것보다 중요한 건 "왜 이 패턴이 필요한가"를 이해하는 것이다.** 6가지 패턴의 공통점은 하나다 — LLM은 불확실한 엔진이므로, 그 불확실성을 **격리하고, 검증하고, 통제하는** 구조가 필요하다. 더 자세한 패턴 분석은 [Agentic AI 패턴 가이드](/guides/agentic-patterns/)를 참고하라.

---

## 에이전트 엔지니어의 기술 스택

에이전트 시스템을 만들 때 필요한 레이어는 7개다.

```
┌─────────────────────────────────────────────┐
│  Application Layer                          │
│  Chat UI · IDE UI · Workflow UI · Admin     │
├─────────────────────────────────────────────┤
│  Agent Layer                                │
│  Planner · Router · Executor · Verifier     │
│  Memory Manager                             │
├─────────────────────────────────────────────┤
│  Tool Layer                                 │
│  APIs · DB · Browser · Code Runner          │
│  File System · SaaS Connectors · MCP        │
├─────────────────────────────────────────────┤
│  Context Layer                              │
│  RAG · Search · Vector DB · Metadata Store  │
│  Knowledge Graph                            │
├─────────────────────────────────────────────┤
│  Control Layer                              │
│  Policy · Permission · Approval             │
│  Audit Log · Rate Limit                     │
├─────────────────────────────────────────────┤
│  Evaluation Layer                           │
│  Test Sets · Simulations · LLM Judge        │
│  Rule-based Checks · Replay                 │
├─────────────────────────────────────────────┤
│  Observability Layer                        │
│  Trace · Token Cost · Latency               │
│  Tool Error · User Feedback                 │
└─────────────────────────────────────────────┘
```

이 전체를 볼 수 있어야 "에이전트 엔지니어"라고 부를 수 있다. 대부분은 Agent Layer와 Tool Layer에서 멈추지만, 프로덕션 에이전트는 **Control, Evaluation, Observability 없이 운영할 수 없다.**

---

## 앞으로의 차별화 축

에이전트 회사들의 경쟁은 모델 성능만으로 갈리지 않을 것이다. 진짜 차별화는 이 축에서 난다.

| 차별화 축 | 핵심 질문 |
|---------|---------|
| Context depth | 얼마나 깊고 정확한 맥락을 가져오는가? |
| Tool reach | 실제로 몇 개의 시스템을 안전하게 조작할 수 있는가? |
| Statefulness | 장기 작업을 얼마나 안정적으로 수행하는가? |
| Trust | 근거, 검증, 승인, 로그가 있는가? |
| UX | 사용자가 통제감을 느끼는가? |
| Governance | 조직이 관리 가능한가? |
| Evaluation | 품질을 지속적으로 측정할 수 있는가? |
| Distribution | 이미 사용자가 있는 표면에 들어가 있는가? |

그래서 "좋은 에이전트"는 단순히 똑똑한 모델이 아니다.

**좋은 에이전트 = 좋은 모델 × 좋은 컨텍스트 × 안전한 도구 실행 × 검증 가능한 상태 관리 × 사용자가 신뢰하는 UX**

---

## 학습 우선순위 — 대부분이 멈추는 곳

에이전트 엔지니어로 성장하려면 이 순서가 효과적이다.

1. Tool calling / function calling 구조
2. RAG와 context engineering
3. **Agent state machine** ★
4. Workflow orchestration
5. Sandboxed execution
6. Human approval UX
7. **Permission / policy / audit** ★
8. **Evaluation harness** ★
9. Observability / tracing
10. Multi-agent coordination

**특히 중요한 건 3, 7, 8이다.** 많은 사람이 1, 2에서 멈춘다. 하지만 제품 수준의 에이전트는 상태 관리, 권한 관리, 평가 체계가 없으면 운영할 수 없다.

[블로그 #12](/blog/dx-for-ax/)에서 다룬 AX 시대의 개발자 역량과 연결하면 — tool calling과 RAG는 "기본기"이고, state machine과 evaluation은 "차별화 역량"이다. 에이전트 엔지니어의 진짜 가치는 **모델을 잘 부르는 것이 아니라, 실행 시스템을 설계하는 능력**에서 나온다.

기초부터 시작하려면 [AI Agent 가이드](/guides/agent/)를, 패턴을 심화하려면 [Agentic AI 패턴 가이드](/guides/agentic-patterns/)를 참고하라.

---

## 결론: LLM 앱 개발이 아니라 실행 시스템 엔지니어링이다

에이전트 엔지니어링의 방향은 명확하다.

**LLM 앱 개발 → LLM을 포함한 실행형 시스템 엔지니어링**

앞으로의 경쟁력은 "모델을 얼마나 잘 부르느냐"보다, **상태·도구·권한·검증·관찰가능성을 얼마나 잘 설계하느냐**에서 나올 것이다. AAIF의 출범, A2A와 MCP의 표준화, 각 회사의 agent governance 투자 — 이 모든 것이 같은 방향을 가리킨다.

에이전트 엔지니어에게 던지고 싶은 질문은 하나다.

**당신은 아직 모델을 고르고 있는가, 아니면 시스템을 설계하고 있는가?**

---

## 참고 자료

- [Agentic AI Foundation (AAIF) 출범](https://simonwillison.net/2025/Dec/9/agentic-ai-foundation/) — Linux Foundation 산하, 8개 창립 멤버
- [Google A2A Protocol v1.0.0](https://github.com/google/A2A) — 50+ 파트너, 에이전트 간 통신 표준
- [Google Agent Development Kit (ADK) 2.0](https://developers.googleblog.com/en/agent-development-kit-adk/) — 그래프 기반 워크플로우 런타임
- [Anthropic, "Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents) — 단순하고 조합 가능한 패턴
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — 경량 멀티 LLM 프레임워크
- [Microsoft Foundry Agent Service](https://learn.microsoft.com) — 3가지 에이전트 유형, Entra Agent ID
- [Matt Webb, "Context Plumbing"](https://simonwillison.net/2025/Nov/29/context-plumbing/) — 에이전트의 본질은 정보 흐름 인프라
- [Armin Ronacher, "Agent Design is Still Hard"](https://simonwillison.net/2025/Nov/23/agent-design-is-still-hard/) — 테스트/평가가 가장 어려운 문제
- [LangChain, Agent Development Lifecycle (ADLC)](https://langchain.com/blog) — Build→Test→Deploy→Monitor
- [Cursor 3 / Composer 2.5](https://cursor.com/blog) — 2026 Gartner Leader

---

## 체크리스트: 에이전트 엔지니어링 성숙도 자가 진단

- [ ] 우리 에이전트의 "중심 객체"가 정의되어 있는가?
- [ ] 에이전트 결과물이 텍스트 답변이 아닌 검증 가능한 산출물(diff, ticket, report)인가?
- [ ] Plan → Act → Observe → **Verify** 루프가 구현되어 있는가?
- [ ] 위험한 액션에 Human-in-the-loop 승인이 있는가?
- [ ] 에이전트별 Tool Permission Matrix가 분리되어 있는가?
- [ ] 에이전트 작업이 상태 머신으로 관리되는가? (재시도, 중단, 재개 가능)
- [ ] Evaluation harness가 있는가? (grounding, safety, regression)
- [ ] 에이전트의 trace, cost, latency를 관측할 수 있는가?
- [ ] 모델을 교체해도 시스템이 작동하는가? (model-agnostic 설계)
- [ ] 에이전트가 실패했을 때 "왜 실패했는지"를 설명할 수 있는가?
