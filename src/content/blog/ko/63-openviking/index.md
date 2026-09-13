---
title: "OpenViking 코드 분석: 에이전트 기억을 파일 경로로 찾아 필요한 만큼만 읽기"
summary: "바이트댄스 볼케이노 엔진의 OpenViking은 에이전트 기억·문서·스킬을 viking:// 경로의 디렉터리로 둔다. 벡터 검색만으로 컨텍스트를 때려 넣지 않고, 요약(L0/L1)을 보고 필요할 때만 원문(L2)을 연다. 2026년 9월 12일 커밋을 기준으로 검색기·세션 추출·실행기에 붙이는 지점을 살펴본다."
date: "2026-09-13T10:00:00+09:00"
tags:
  - context-engineering
  - agent-memory
  - rag
  - open-source
  - bytedance
draft: false
---

에이전트에게 지난 대화를 맡기면 흔히 두 가지 중 하나가 된다. 세션 로그를 프롬프트에 그대로 붙이거나, 벡터 DB에 넣고 비슷한 조각을 몇 개 꺼낸다. 전자는 토큰이 금방 찬다. 후자도 namespace나 메타데이터 필터로 사용자·프로젝트 범위를 제한할 수 있지만, 에이전트가 그 경로를 따라 요약에서 원문으로 내려가는 탐색 절차까지 제공하지는 않는다.

[OpenViking](https://github.com/volcengine/OpenViking)은 이 컨텍스트를 `viking://` 가상 파일 시스템으로 둔다. 에이전트는 `ls`, `tree`, `read`, `write`로 디렉터리를 보고, 디렉터리 요약으로 관련 여부만 확인한 뒤 원문을 연다. 바이트댄스 볼케이노 엔진 Viking 팀이 만든 오픈소스고, 본 프로젝트 라이선스는 AGPLv3다.

이 글은 2026년 9월 12일 [`0f77ab5`](https://github.com/volcengine/OpenViking/tree/0f77ab5) 커밋을 기준으로 저장소의 검색기·파일 서비스·세션 추출 코드를 읽은 분석이다. 서버를 띄워 재현한 측정은 아니다. LoCoMo·tau2-bench 숫자는 프로젝트 README와 [벤치마크 글](https://blog.openviking.ai/post/openviking-benchmark-results/)에 적힌 공급자 평가다.

[컨텍스트 엔지니어링](/blog/30-context-engineering/)에서 창이 커져도 넣을 것을 고르는 일이 남는다고 썼다. OpenViking은 그 고르기를 경로와 계층으로 옮긴 구현이다. 회사 전체를 한 브레인으로 묶는 [Cerebras 사례](/blog/37-company-brain/)나 운영 데이터 옆 벡터 검색([TencentDB](/blog/50-tencentdb-agent-memory/), [DynamoDB](/blog/55-dynamodb-vector-search/))과는 층이 다르다. 여기서 보는 것은 에이전트가 어느 디렉터리의 어느 깊이를 읽을지다.

## 컨텍스트를 디렉터리로 나눈다

루트는 대략 이렇게 나뉜다.

```
viking://
├── resources/     # 문서, 저장소, 웹 페이지
└── user/{id}/
    ├── memories/  # 선호, 엔티티, 사건, 경험
    ├── resources/
    ├── skills/
    └── peers/
```

`FSService`는 `ls`, `mkdir`, `rm`, `mv`, `tree`, `stat`, `read`, `grep`, `glob`과 함께 디렉터리 요약용 `abstract`·`overview`를 제공한다. 에이전트 입장에서는 도구 이름이 파일 명령과 같다. URI가 기억·리소스·스킬을 가리키는지는 `classify_uri`가 나눈다.

벡터 인덱스는 파일 본문을 다시 들고 있지 않다. 저장은 내용 저장소와 인덱스(URI·벡터·메타데이터)로 나뉜다. 검색은 후보 경로를 고르는 일이고, 읽을 내용은 `read`가 담당한다.

## 요약만 보고 원문을 연다

디렉터리마다 생성되는 부가 파일이 있다.

- L0 `.abstract.md` — 한 줄 요약. 관련 있는지 볼 때
- L1 `.overview.md` — 구조와 쓰임. 어디를 더 열지 정할 때
- L2 원문 — 필요할 때만

`.abstract.md`와 `.overview.md`만 기계가 쓰는 사이드카로 다룬다. 일반 마크다운 프론트매터는 사용자 내용으로 두고 함부로 파싱하지 않는다. 이 구분은 `abstract_overview.py`에 명시돼 있다.

검색은 `HierarchicalRetriever`가 맡는다. 대상 디렉터리가 있으면 그 아래만 보고, 없으면 테넌트 기본 루트(`default_target_directories`)부터 시작한다. rerank가 있으면 THINKING, 없으면 QUICK이다. QUICK은 벡터 검색으로 후보를 넓게 가져오고, THINKING은 디렉터리를 내려가며 자식 검색을 병렬로 최대 4개까지 연다. 디렉터리 점수가 자식 최고점의 1.2배를 넘으면 디렉터리 쪽을 남긴다.

즉 검색의 첫 질문은 “이 조각이 얼마나 비슷한가”가 아니라 “어느 디렉터리 안에서 찾을 것인가”다. 디렉터리 범위를 인덱스가 먼저 정한다는 설계는 [Directory-Aware Query](https://arxiv.org/abs/2606.16903) 논문과 맞물려 있다. 공개 구현이 그 논문의 TrieHI를 그대로 옮겼는지는 이 글에서 재현하지 않았다.

기존 RAG를 쓰는 팀이라면 확인할 차이는 이것이다. 청크 목록만 받는 검색은 출처 경로가 메타데이터에 붙어 있을 뿐이다. OpenViking은 경로가 조회 API 자체다.

아래는 그 조회를 한 번 따라가는 흐름이다. 이 글에서 만든 예시이며, 서버를 띄워 받은 출력이 아니다.

```
ov find "업로드 인증" --uri viking://resources/my_project/
```

결과가 `viking://resources/my_project/docs/api/.overview.md`라면, 에이전트는 먼저 L1만 읽는다. 개요에 인증 흐름이 있으면 같은 디렉터리의 `auth.md`(L2)를 `read`하고, 없으면 그 디렉터리에서 멈춘다. 원문을 처음부터 열지 않는 것이 계층을 둔 이유다.

## 세션이 끝나면 기억을 디렉터리에 쓴다

대화 중에 프롬프트를 키우는 것과, 세션을 닫을 때 기억을 추출하는 것은 다른 루프다. OpenViking은 세션을 커밋하면 대화를 아카이브하고 백그라운드 추출을 시작한다.

추출기는 `extract_loop.py`의 ReAct 루프다. 한 번의 모델 호출에 메모리 도구를 붙여, 새 파일을 만들거나 기존 파일에 합치거나 건너뛴다. 주석에 VikingBot 에이전트 루프를 참고했다고 적혀 있다. 기본 출력 상한은 32,768토큰이다. 추출이 파일 하나를 통째로 다시 쓸 수 있어서, 제공자 기본값(예: 4,096)에 잘리면 결과가 못 쓰게 된다고 설명한다.

정책은 생성·병합·건너뛰기를 고른다. 추출 모델이 거절 문장을 내면 JSON이 아니어도 거절로 본다. 운영 DB 옆 메모리([TencentDB](/blog/50-tencentdb-agent-memory/))가 “무엇을 저장하는가”에 가깝다면, 여기는 “세션이 끝난 뒤 어느 경로에 어떤 연산을 남기는가”다.

이 루프가 자동으로 좋은 기억을 만든다고 가정하면 안 된다. 추출 모델·임베딩·정책을 설정해야 하고, `openviking-server init`이 그 제공자를 고른다. 문서가 지원한다고 적은 대상은 Volcengine, OpenAI, Codex OAuth, Kimi, GLM, 로컬 Ollama다.

## 실행기에 붙일 때

Claude Code와 Codex는 저장소의 메모리 플러그인으로 붙는다. `examples/claude-code-memory-plugin/hooks/hooks.json`을 보면 `SessionStart`에서 프로필을 넣고, `UserPromptSubmit`마다 관련 기억을 주입하며, `Stop`·`SessionEnd`·`PreCompact`에서 대화를 커밋한다. 공식 통합 문서도 매 프롬프트 전 검색, 응답 후 캡처, 세션 시작 시 인덱스 주입이라고 적는다. 설치 스크립트는 Claude와 Codex가 공유한다. OpenClaw는 컨텍스트 엔진, Hermes는 내장, [DeepSeek Harness](/blog/64-deepseek-harness/)는 플러그인+MCP로 안내돼 있다. 파트너 목록에는 이 블로그에서 다룬 [LoopX](/blog/51-loopx-state-kernel/)와 [Hermes](/blog/15-hermes-vs-openclaw/)도 있다.

실행기 쪽 변경은 모델 교체가 아니다.

| 기존에 막히던 점 | 바꿀 구성 | 확인할 결과 |
|---|---|---|
| 지난 대화를 프롬프트에 통째로 붙임 | 세션 커밋 후 기억 경로만 읽기 | 같은 질문의 입력 토큰과 정답 근거 URI |
| 벡터 top-k만 넣고 출처를 못 연다 | `find`/`search`의 대상 디렉터리를 프로젝트·사용자로 고정 | 다른 프로젝트 기억이 섞이는지 |
| 에이전트가 원문을 매번 읽음 | L0/L1을 먼저 읽게 도구 설명을 제한 | L2 `read` 횟수와 누락된 근거 |
| 기억 추출이 대화 중간에 끼어듦 | 커밋 시점과 추출 작업 상태를 실행기가 기다리거나 알림 | 추출 실패·거절·병합 건너뛰기 로그 |

직접 보려면 대표 과제 하나를 고른다. 기존 메모리(대화 첨부, mem0, 에이전트 내장 기억)를 기준선으로 돌리고, OpenViking을 붙인 구성을 같은 완료 기준으로 비교한다. 맞힌 개수와 함께 입력 토큰, `read`한 L2 수, 잘못된 디렉터리에서 가져온 근거를 남긴다.

## 도입 전에 볼 제약

오픈소스 서버는 활성화 키가 없다. 다만 AGPLv3다. 수정한 서버를 네트워크로 제공하면 소스 공개 의무가 생길 수 있다. CLI 크레이트와 예제는 Apache 2.0이다. 상용 하네스에 넣기 전에 법무 검토가 필요하다. Volcengine 호스팅과 자체 배포 상용판이 따로 있다.

README의 LoCoMo·tau2 숫자는 이 글의 재현 조건이 아니다. 공급자 평가로는 OpenClaw 네이티브 24.20% 대비 OpenViking 82.08%, Hermes 33.38% 대비 82.86%, Claude Code 57.21% 대비 80.32%이고, 입력 토큰은 34.3~91.0% 줄었다고 적는다. tau2-bench 경험 기억은 같은 LLM 대비 Retail +6.87%p, Airline +11.87%p다. 임베딩과 VLM은 Doubao 계열이다. 자신의 Claude·Codex 설정, 한국어 로그, 다른 임베딩에서는 이 폭이 나온다고 볼 수 없다.

서버는 임베딩 모델과 VLM이 있어야 한다. 요약·추출·검색이 그 두 모델에 의존하므로, 로컬만 허용되는 환경에서는 제공자부터 고른다. 멀티테넌트와 ACL은 문서에 있고 기본이 localhost다.

파일 시스템 비유는 권한 모델까지 파일과 같다는 뜻이 아니다. 공개 서브트리 읽기가 메모리 파일을 포함할 수 있는지는 `_may_include_memory_content`가 URI 분류로 판단한다. 에이전트에게 `read`를 줄 때 대상 루트를 실행기에서 제한해야 한다.

## 이 블로그에서 어디에 두나

OpenViking은 새 벡터 DB가 아니다. 에이전트가 컨텍스트를 **경로로 고르고, 요약으로 걸러서, 세션이 끝난 뒤에 디렉터리에 남기는** 저장소다. 창 크기 문제를 푸는 글은 [컨텍스트 엔지니어링](/blog/30-context-engineering/)과 [RAG 가이드](/guides/rag/)에 있다. 이 글은 그 다음 질문, 즉 실행기가 기억 위치를 파일처럼 다룰 수 있을 때 프롬프트에 무엇을 빼도 되는지에 답한다.

쓸 곳은 이미 Claude·Codex를 쓰면서 세션마다 같은 프로젝트 설명을 다시 넣는 작업이다. 운영 트랜잭션 옆에 벡터를 붙여 검색하는 일은 기존 글의 대상이다. 둘을 한 제품으로 합치지 않는 편이 낫다.
