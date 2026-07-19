---
title: "BE가 만들고 FE가 맞추던 시대는 끝났다 — 바이브코딩 시대 BE/FE는 계약을 먼저 합의한다"
summary: "바이브코딩의 진짜 레버리지는 코드를 빨리 뽑는 게 아니라, AI가 따를 명확한 계약(API Contract)을 먼저 세우는 것이다. 데이터가 이걸 뒷받침한다 — AI는 문법 오류는 76% 줄이지만 권한 상승 경로는 322% 늘리고(Apiiro), 모델이 커져도 보안 품질은 평평하다(Veracode). AI가 못 메우는 영역이 정확히 '계약에 담기는 정보'다. 그래서 AI 시대에 명세는 덜 중요해진 게 아니라 더 중요해졌다. BE가 만들고 FE가 맞추는 협업에서, BE/FE가 Contract를 먼저 합의하고 AI가 양쪽을 생성하는 협업으로."
date: "2026-06-20T10:00:00"
tags:
  - agent-engineering
  - api-design
  - llm
  - ai-agent
  - backend
draft: false
---

팀에서 BE와 FE가 일하는 방식은 보통 이렇다. 기획이 정리되면 BE가 API를 설계하고 구현한다. 다 되면 Swagger나 명세서를 FE에 넘긴다. FE는 그걸 보고 화면을 붙이고, 연동 테스트에서 어긋난 부분을 찾아 다시 고친다. 익숙하고, 오래 잘 굴러온 방식이다.

문제는 이 방식이 한 문장으로 요약된다는 데 있다 — **BE가 API를 만들고 FE가 맞춘다.** FE는 BE 산출물을 기다린다. 명세는 있지만 실제 응답과 다를 때가 있다. 문서는 정상 케이스 위주라 empty·error·권한 없음 같은 상태 정의가 비어 있다. 화면에 필요한 데이터 모양과 BE 도메인 모델 사이의 간극은 연동 단계에서야 드러난다. API가 한 번 바뀌면 FE 구현·mock·테스트가 같이 흔들린다.

그리고 여기에 AI 코딩이 들어오면, 이 애매함이 그대로 잘못된 코드로 증폭된다. 명세가 흐릿하면 사람은 "이건 아마 이런 뜻이겠지" 하고 물어보지만, AI는 흐릿한 자리를 그냥 그럴듯하게 메워버린다.

이 글의 테제는 거기서 출발한다. 바이브코딩 시대에 길러야 할 역량은 코드를 빨리 뽑는 게 아니라, **AI가 따를 명확한 계약을 먼저 세우는 것**이다. 그리고 불편하게도, 데이터가 이걸 정면으로 뒷받침한다.

---

## AI는 코드는 잘 쓴다, 계약은 못 쓴다

먼저 사실관계부터. AI가 코드를 못 쓴다는 얘기가 아니다. **표면적인 코드는 오히려 사람보다 잘 쓴다.**

Apiiro가 Fortune 50 기업의 수만 개 repo, 수천 명 개발자의 작업을 분석했다. AI 코딩 도구를 쓰자 산출 속도는 4배가 됐고, **문법 오류는 76% 줄었고 로직 버그는 60% 줄었다.** 깔끔하다. 그런데 같은 데이터에서 보안 리스크는 10배로 늘었다. **권한 상승으로 이어지는 경로가 322% 늘었고, 아키텍처 설계 결함이 153% 늘었다.**

방향을 읽어야 한다. AI는 사람이 자주 틀리는 사소한 표면 오류는 오히려 잘 잡는다. 대신 위험한 건 *구조적인* 결함 쪽에서 악화된다. 인가가 빠지고, 경계가 무너지고, 설계가 어긋나는 자리. 이건 "더 큰 모델을 쓰면 해결되는" 문제도 아니다. Veracode가 2025년에 100개 넘는 LLM으로 80개 보안 과제를 돌렸는데, 결론이 서늘하다 — **"모델이 문법적으로 맞는 코드를 쓰는 능력은 좋아졌지만, 안전한 코드를 쓰는 능력은 나아지지 않았다. 보안 성능은 모델 크기와 무관하게 평평했다."** AI가 생성한 코드의 45%가 보안 테스트를 통과하지 못했고, Java는 72%였다.

더 불편한 건, 사람이 이걸 잘 못 느낀다는 점이다. 스탠퍼드 연구(Perry et al., CCS 2023)에서 AI 도구를 쓴 그룹은 덜 안전한 코드를 쓰면서 **자기가 더 안전한 코드를 썼다고 믿었다.** SQL 인젝션 과제에서 AI 그룹의 36%가 취약한 코드를 냈는데, 대조군은 7%였다. 코드 품질이 떨어지는데 자신감은 올라가는 갭. 바이브코딩에서 가장 위험한 조합이다.

여기서 멈추고 한 번 보자. AI가 체계적으로 약한 영역의 목록 — 인가, 경계 조건, 입력 검증, 상태별 처리, 아키텍처 일관성. 이게 어디서 본 목록인가.

**정확히 'API 계약에 담기는 정보'다.** 누가 이 엔드포인트를 부를 수 있는가(인가), 어떤 값이 null일 수 있는가(경계), 잘못된 입력에 뭘 돌려주는가(검증·에러), 데이터가 없을 때 화면이 뭘 받는가(상태). 또 다른 연구(Li et al., 2025)는 LLM이 생성한 코드의 43.1%가 사람 코드보다 덜 robust하고, 그 robustness 결함의 90%가 **누락된 조건 검사**(null 체크, 범위 체크)에서 나온다고 했다. 테스트를 다 통과해도 그렇다.

그러니까 결론은 이렇게 뒤집힌다. AI가 코드 타이핑을 대신해준다고 해서 명세가 덜 중요해지는 게 아니다. **AI가 못 메우는 자리가 정확히 명세가 담는 자리이기 때문에, 명세는 오히려 더 중요해졌다.** [블로그 #13](/blog/13-ai-ready-data/)에서 "AI가 안 되는 건 모델 탓이 아니라 데이터 탓"이라고 했는데, 코드도 똑같다 — AI에게 주는 계약이 흐릿하면 결과도 흐릿하다. 데이터를 AI-Ready로 만들어야 했듯, 이제 API 계약을 AI-Ready로 만들 차례다.

---

## 그래서 순서를 뒤집는다 — 코드 먼저가 아니라 계약 먼저

전환은 단순하다. 기존엔 BE가 코드를 짜고 그 결과로 명세가 나왔다(code-first). 이걸 뒤집어, **명세를 먼저 합의하고 그걸 기준으로 코드·Mock·테스트를 만든다**(design-first 또는 contract-first). OpenAPI 문서를 "구현 끝나고 나오는 산출물"이 아니라 "구현이 따라야 할 기준점"으로 보는 것이다.

이게 나만의 별난 주장이 아니라는 게 중요하다. 개발 라이프사이클 자체를 다시 짜는 흐름([블로그 #9](/blog/09-ai-dlc/))의 구체적인 한 조각이고, 산업도 학계도 같은 방향으로 가고 있다.

- **산업.** Postman의 State of the API 조사에서 API-first 채택률은 2년 만에 66%에서 82%로 올랐다. 완전한 API-first 조직도 25%로 늘었다. 이들은 장애에서 더 빨리 복구하고, API를 더 빨리 만든다.
- **AI 쪽 담론.** GitHub의 Spec Kit은 이걸 한 문장으로 못 박았다 — **"코드가 진실의 원천이던 시대에서, 의도(intent)가 진실의 원천인 시대로."** 명세는 "코드가 어떻게 동작해야 하는지에 대한 계약이자, 도구와 AI 에이전트가 코드를 생성·테스트·검증하는 기준"이라는 것이다. OpenAI의 Sean Grove는 더 세게 말한다. "**코드는 명세로부터의 손실 있는 투영(lossy projection)일 뿐**"이고, 가치의 80~90%는 코드가 아니라 구조화된 소통에 있다고.
- **학술.** 명세·타입·테스트가 명확할수록 코드 생성 정확도가 오른다는 실증이 쌓이고 있다. self-planning은 Pass@1을 최대 25.4% 끌어올렸고(arXiv:2303.06689), 타입 제약 생성은 컴파일 에러를 절반 이하로 줄였다(PLDI 2025). 그리고 이 글의 앵글을 가장 직접적으로 뒷받침하는 한 문장 — 에이전트가 쓸 수 있는 API를 만드는 가장 빠른 길은 "코드를 더 많이 쓰는 게 아니라 계약을 더 잘 쓰는 것"이고, 그렇게 **"병목을 코드 생성에서 명세 품질로 옮긴다"**(arXiv:2507.16044).

병목 얘기가 익숙할 것이다. [블로그 #22](/blog/22-recursive-self-improvement/)에서 실행(코드 작성)은 거의 공짜가 됐고 병목은 판단으로 옮겨갔다고 썼다. 계약 우선 협업은 바로 그 판단을 *코드를 짜기 전에, 문서 한 곳에* 못 박는 일이다. [#21](/blog/21-claude-fable-5/)에서 프롬프트의 일이 액셀에서 브레이크로 바뀌었다고 한 것과도 같은 자리다 — 계약은 AI에게 거는 가장 강력한 브레이크다.

사실 새로운 발상도 아니다. Consumer-Driven Contracts는 2006년 ThoughtWorks의 Ian Robinson이 정리했고, API-first는 그보다 오래됐다. 요즘 자주 들리는 "agent-ready API"도 결국 같은 줄기다. MCP의 툴 정의를 뜯어보면 `name` + `description` + `inputSchema(JSON Schema)`인데, OpenAPI의 파라미터·요청 본문도 똑같이 JSON Schema다. **에이전트의 툴 계약은 OpenAPI가 10년 넘게 해온 머신리더블 계약의 재포장이다.** 달라진 건 계약을 읽는 소비자가 사람에서 AI로 바뀌었다는 것, 그리고 AI는 흐릿한 계약을 봐주지 않는다는 것뿐이다.

---

## 실전에서 뭐가 달라지나

순서를 바꾸면 협업 흐름이 이렇게 된다.

기존: 기획 → BE 설계 → BE 구현 → Swagger 제공 → FE 구현 → 연동 테스트 → 오류 수정.

바꾼 뒤: 기획 → **화면 상태·시나리오 정의 → FE가 기대하는 데이터 모양 초안 → API Contract 초안 → BE/FE 같이 리뷰 → OpenAPI 확정** → 여기서부터 Mock 서버·FE 클라이언트·BE 스켈레톤을 *병렬로* 생성 → FE는 Mock으로, BE는 Contract로 동시에 개발 → Contract 테스트로 합류.

핵심 변화 한 줄. **"BE 구현 후 FE 연동"에서 "Contract 합의 후 BE/FE 병렬 개발"로.** FE가 BE를 기다리지 않는다.

실제로 박아두면 효과 보는 표준은 몇 개로 좁혀진다. 전부 "AI가 흐릿하게 추론할 자리"를 없애는 것들이다.

- **Nullable을 명시한다.** AI 환경에서 가장 자주 사고 나는 자리다. optional과 nullable을 구분하고, 빈 문자열과 null의 의미를 구분하고, 빈 목록은 null이 아니라 `[]`로 내린다.
- **에러 응답 구조를 통일한다.** 프레임워크가 Kotlin Spring이든 Python FastAPI든, `code`·`message`·`traceId`를 담는 같은 형태로. 공통 에러 코드(VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR)를 표준화한다.
- **성공 응답·페이지네이션·날짜·ID 규칙을 하나로 고정한다.** 응답을 공통 래퍼로 감쌀지 말지 *한쪽으로* 정하고(섞으면 FE 타입이 다 어긋난다), 페이지네이션은 `items`·`page`·`size`·`totalCount`·`hasNext`로, 시간은 offset 포함 ISO-8601 하나로, ID는 number 대신 string으로.
- **Mock에 정상 케이스만 넣지 않는다.** success뿐 아니라 empty·permissionDenied·validationError·serverError를 같이 정의한다. 이 Mock은 FE 개발·Storybook·E2E에 그대로 재사용된다.

Kotlin Spring Boot와 Python FastAPI를 같이 쓰는 환경이라도 공통화가 어렵지 않다. Controller/Router → Request DTO/Schema → Validation → Service → Repository/Client → Response → Exception Handler → OpenAPI로 이어지는 구조는 양쪽이 이름만 다를 뿐 같다. 협업의 기준을 프레임워크가 아니라 **HTTP API Contract**에 두면, 언어 차이는 그 아래로 내려간다.

그리고 AI에게 일을 시킬 땐 계약을 입력으로 준다. "Contract에 없는 필드를 만들지 말 것, nullable을 임의로 바꾸지 말 것, enum과 에러 코드를 새로 지어내지 말 것, 경로·메서드·상태 코드는 Contract를 따를 것." 이 규칙들이 앞에서 본 AI의 약점(임의 추론, 누락된 검증)을 정확히 겨냥한다.

---

## 공짜는 아니다 — 한 가지만 못 박으면 무너진다

정직하게. 계약 우선이 만능은 아니고, 오히려 잘못 도입하면 code-first보다 못하다.

가장 흔한 실패는 "**진실의 원천을 하나로 못 박지 않는 것**"이다. springdoc이나 FastAPI는 코드에서 OpenAPI를 자동 생성한다. 그런데 contract-first는 OpenAPI를 손으로 먼저 쓴다. 둘 다 원본이면, BE가 코드를 고칠 때마다 "어느 쪽이 맞냐"로 싸우게 된다. 이게 contract-first 도입 실패의 대부분이다. 정해야 한다 — **합의 단계에선 손으로 쓴 OpenAPI가 원본이고, 코드에서 생성된 OpenAPI는 검증용이다.** CI에서 둘의 diff를 깨뜨려 드리프트를 막는다.

두 번째, 계약·Mock·Contract 테스트를 셋 다 유지하는 건 분명한 오버헤드다. Pact 공식 문서조차 "쓰지 말아야 할 경우"를 직접 적어둔다 — 소비자가 너무 많아 팀 간 관계를 유지할 수 없을 때, 공개 API, 받은 걸 그대로 흘려보내는 pass-through API. ThoughtWorks의 Birgitta Böckeler는 작은 문제에 spec-first를 들이대는 걸 "호두 까는 데 큰 망치 쓰는 격"이라고 했다. 탐색적 프로토타입, 한 팀이 다 가진 내부 도구, 빠르게 갈아엎는 스파이크에는 과하다. **안정적인 계약이 실제로 가치 있는 곳 — 외부·다팀·장수하는 API부터** 적용하는 게 맞다.

세 번째, 계약은 살아있어야 한다. 첫 스프린트 뒤 아무도 손대지 않는 형식 문서로 전락하면, 그 순간 code-first보다 나쁜 거짓 문서가 된다. 그래서 규칙은 가능한 한 사람의 선의가 아니라 CI 검사에 묶어야 한다.

---

## 결론

바이브코딩 시대의 BE/FE 협업은 "AI로 코드를 더 빨리 뽑는" 방향이 아니라 "AI가 올바르게 코드를 생성할 규격을 먼저 세우는" 방향으로 가야 한다.

근거는 데이터에 있다. AI는 문법과 표면은 사람보다 잘 짠다. 대신 인가·경계·검증·아키텍처에서 체계적으로 약하고, 모델이 커져도 그건 안 나아지며, 정작 사람은 그 결함을 잘 못 느낀다. 그 약한 영역이 정확히 **API 계약이 담는 영역**이다. 그러니 코드 작성이 공짜가 될수록, 비싸지는 건 계약이다.

표준화할 건 결국 네 가지로 좁혀진다 — OpenAPI Contract, Mock 데이터, 공통 Error/Pagination/Nullable 규칙, Contract 테스트. Kotlin Spring과 FastAPI를 같이 써도 기준을 프레임워크가 아니라 HTTP 계약에 두면 공통화된다.

[#22](/blog/22-recursive-self-improvement/)에서 실행은 공짜가 됐고 병목이 판단으로 옮겨갔다고 했다. 계약 우선 협업은 그 판단을 코드 이전에 못 박는 구체적인 방법이다. 바이브코딩 시대의 핵심 역량은 코드를 빨리 쓰는 능력이 아니라, **AI와 팀이 함께 오해 없이 읽을 수 있는 계약을 설계하는 능력**이다. 인지적 부채를 다룬 [#11](/blog/11-cognitive-debt-and-agentic-coding)에서부터 이어온 이야기의, 가장 실무적인 결론이다.

---

*참고 자료*

- Apiiro — *4x velocity, 10x vulnerabilities*: [apiiro.com](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/)
- Veracode — *2025 GenAI Code Security Report*: [veracode.com](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
- Perry et al. — *Do Users Write More Insecure Code with AI Assistants?* (CCS 2023): [arXiv:2211.03622](https://arxiv.org/abs/2211.03622)
- Li et al. — *Robustness of LLM-generated code* (2025): [arXiv:2503.20197](https://arxiv.org/abs/2503.20197)
- GitHub — *Spec-Driven Development with AI / Spec Kit*: [github.blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) · [github.com/github/spec-kit](https://github.com/github/spec-kit)
- Sean Grove (OpenAI) — *The New Code*: [youtube.com](https://www.youtube.com/watch?v=8rABwKRsec4)
- *Specifications as the bottleneck for agent-ready APIs*: [arXiv:2507.16044](https://arxiv.org/abs/2507.16044)
- Ian Robinson — *Consumer-Driven Contracts*: [martinfowler.com](https://www.martinfowler.com/articles/consumerDrivenContracts.html)
- Postman — *State of the API Report 2025*: [postman.com](https://www.postman.com/state-of-api/2025/)
- Pact — *When not to use contract testing (FAQ)*: [docs.pact.io/faq](https://docs.pact.io/faq)
- Birgitta Böckeler (ThoughtWorks) — *Spec-driven development tools*: [martinfowler.com](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
