---
title: "같은 모델로 30위에서 5위로 — '모델 바깥의 전쟁'에 하네스라는 이름이 붙었다"
summary: "LangChain은 모델을 한 번도 안 바꾸고 Terminal Bench 2.0에서 30위권을 5위로 끌어올렸다. 고친 건 전부 모델 바깥 — 프롬프트의 자기검증 루프, 도구, 실패 패턴을 감지하는 미들웨어다. 이 '모델 빼고 전부'를 가리키는 하네스 엔지니어링이 2026년 주요 엔지니어링 조직의 실전 보고와 설계 글을 통해 빠르게 주류화됐다. [#14](/blog/14-agent-engineering/)에서 '모델 바깥의 전쟁'이라 불렀고 [#25](/blog/25-loop-engineering/)에서 이름만 걸어뒀던 그것의 본편이다. Guides×Sensors 제어 시스템 프레임과 Apiiro가 공개한 관측치(문법 오류 −76%, 권한상승 경로 +322%)까지 — 왜 하네스가 모델과 달리 '남는 자산'인지 정리했다."
date: "2026-07-19T16:00:00"
tags:
  - harness-engineering
  - agent-engineering
  - ai-agent
  - agentic-coding
  - ai-coding
draft: false
---

[블로그 #14](/blog/14-agent-engineering/)를 이 질문으로 끝냈었다. **"당신은 아직 모델을 고르고 있는가, 아니면 시스템을 설계하고 있는가?"** 그때는 그 '시스템'을 글 내내 구성요소 목록과 레이어 그림으로 에둘러 설명했다. 이제는 업계에서 널리 쓰이는 이름이 있다. **하네스 엔지니어링(harness engineering).** [#25](/blog/25-loop-engineering/)에서 "inner loop은 하네스 문제"라고 이름만 걸어뒀던 그 단어를 [OpenAI가 2월 실전 보고로](https://openai.com/index/harness-engineering/), [Birgitta Böckeler가 4월 설계 프레임으로](https://martinfowler.com/articles/harness-engineering.html) 각각 구체화했다.

용어 하나 주류화된 게 뭐가 중요하냐 싶겠지만 이 단어가 뜬 배경에는 벤치마크 사건이 하나 있다. 거기서 시작하자.

---

## 모델을 한 번도 안 바꾸고 25계단

올해 3월, LangChain 팀이 자기네 코딩 에이전트(deepagents-cli)로 [Terminal Bench 2.0 순위를 30위권에서 5위로 끌어올렸다](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering). 점수로는 52.8%에서 66.5%. 그동안 모델은 gpt-5.2-codex 그대로였다. 바꾼 건 전부 모델 바깥이다.

- 시스템 프롬프트에 **자기검증 루프를** 박았다 — 답을 내기 전에 스스로 확인하게
- 에이전트가 자기 환경을 파악하게 돕는 **도구와 컨텍스트 주입을** 손봤다
- 같은 실패를 반복하는 doom loop 같은 패턴을 감지하는 **미들웨어 훅을** 달았다

방법도 요란하지 않다. 트레이스를 대량으로 쌓아 실패 유형을 찾고, 하네스를 고치고, 다시 돌리는 반복이다. [#32에서 말한 "측정할 수 없으면 개선할 수 없다"](/blog/32-ai-eval/)를 하네스에 적용한 것뿐이다.

같은 방향의 증거가 하나 더 있다. [Faros가 실제 엔지니어링 태스크 211개로 실험한 결과](https://www.faros.ai/blog/harness-engineering), 하네스를 제대로 최적화하면 GLM-5.2, Kimi K2.6 같은 오픈 모델이 프런티어 모델과 대등하게 붙었다.

두 사례가 가리키는 결론은 하나다. **"벤치 순위 = 모델 성능"이라는 등식이 깨졌다.** 같은 모델을 쓰는데 결과가 저렇게 갈린다면, 그 차이는 전부 모델 바깥에서 나온 것이다. 병목이 이동했다.

---

## 하네스 = 모델 빼고 전부

정의는 Böckeler의 공식이 가장 깔끔하다. **Agent = Model + Harness.** 에이전트에서 모델을 뺀 나머지 전부가 하네스다 — 도구 인터페이스, 컨텍스트 전달, 계획 아티팩트, 검증 루프, 메모리, 샌드박스. 에이전트가 원치 않는 결과를 내기 전에 막고 냈을 때 스스로 고치게 만드는 제어 장치 일체다.

이걸 시간 축에 놓으면 지난 4년이 한 줄로 정리된다.

| 시기 | 병목 | 다루는 것 |
|---|---|---|
| 2022–23 | 프롬프트 엔지니어링 | 언어 — 어떻게 묻나 |
| 2024–25 | 컨텍스트 엔지니어링 | 정보 — 무엇을 보여주나 |
| 2026– | 하네스 엔지니어링 | 환경과 제어 — 어디서 어떻게 일하게 하나 |

[#30에서 다룬 컨텍스트 엔지니어링](/blog/30-context-engineering/)이 두 번째 단계였다. 하네스는 그걸 버리는 게 아니라 포함한다. 컨텍스트 엔지니어링이 "무엇을 넣나"였다면, 하네스는 그 컨텍스트가 흘러다니는 배관과 밸브 전체다.

미리 짚어둘 것 하나. 하네스 엔지니어링은 새 학문이 아니다. 목록을 다시 보라. 린터, 테스트, CI, 코드 리뷰, 관측성 — **전부 소프트웨어 엔지니어링이 30년 동안 쓰던 물건이다.** 새로운 건 도구가 아니라 소비자다. 이 장치들의 1차 사용자가 사람에서 에이전트로 바뀌었고, 그러자 요구 스펙이 달라졌다. 사람용 린트 에러는 "고치세요"로 충분하지만 에이전트용 린트 에러는 그 메시지 자체가 프롬프트다.

---

## Guides × Sensors — 하네스는 제어 시스템이다

Böckeler 글의 진짜 기여는 용어가 아니라 프레임이다. 하네스를 부품 목록이 아니라 **제어 시스템으로** 보라는 것. 부품은 두 종류뿐이다.

**Guides(피드포워드)** — 에이전트가 잘못되기 *전에* 방향을 잡아주는 것. AGENTS.md·CLAUDE.md 같은 규칙 파일, 스킬 문서, 부트스트랩 스크립트, 아키텍처 정의. [#30의 컨텍스트 설계가](/blog/30-context-engineering/) 대부분 여기 속한다.

**Sensors(피드백)** — 결과를 *관찰해서* 자체 수정하게 만드는 것. 여기에 중요한 2분법이 있다.

| 센서 유형 | 성격 | 속도·비용 | 예 |
|---|---|---|---|
| Computational | 결정론적 | ms~초, 싸다 | 린터, 타입체커, 테스트, 구조 테스트 |
| Inferential | 의미를 판단 | 초~분, 비싸다 | AI 코드 리뷰, LLM judge |

실무 장면은 이미 있다. OpenAI는 [약 100줄의 짧은 `AGENTS.md`를 목차로 두고 저장소 안의 구조화된 문서를 진실의 원천으로 삼으며](https://openai.com/index/harness-engineering/), 계층 아키텍처를 커스텀 린터와 구조 테스트로 강제하고 문서 드리프트를 주기적으로 스캔한다. Stripe는 [Minions의 로컬 검사와 pre-push 린트로 피드백을 CI보다 앞으로 당겼고](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), Spotify는 [Honk로 생성한 PR 1,500개 이상을 실제 코드베이스에 머지했다고 보고했다](https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1).

그리고 설계 원칙 하나가 이 프레임에서 바로 나온다. **가이드에 적은 규칙은 센서로도 강제돼야 한다.** 지침만 있고 검증이 없으면 확률적 엔진인 에이전트는 언젠가 그 지침을 잊는다. AGENTS.md에 "레이어를 건너뛰어 import하지 말 것"이라고 썼다면 그걸 잡는 구조 테스트가 짝으로 있어야 한다. 지침은 방향이고, 강제는 센서가 한다.

---

## 왜 지금인가 — AI 코드는 결함의 '종류'가 다르다

하네스가 왜 중요해졌는지를 보여주는 한 관측치는 [보안 업체 Apiiro가 공개한 분석](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/)이다. Apiiro는 여러 Fortune 50 기업의 수만 개 리포지토리와 수천 명 개발자를 자사 분석 엔진으로 조사했다고 밝히며, AI 지원 개발자의 커밋 속도는 3~4배, 월간 신규 보안 결함은 약 1천 건에서 **1만 건 이상으로 10배**가 됐다고 보고했다. 원시 데이터와 독립 재현이 공개된 학술 연구는 아니므로, 아래 수치는 보편 법칙이 아니라 해당 표본에서 나온 업체 관측치로 읽어야 한다.

진짜 중요한 건 총량이 아니라 구성이다.

| 결함 유형 | 변화 |
|---|---|
| 문법 오류 | **−76%** |
| 로직 버그 | **−60%** |
| 권한상승 경로 | **+322%** |
| 아키텍처 설계 결함 | **+153%** |

AI 코드는 컴파일러와 린터가 잡는 종류의 결함은 오히려 덜 만든다. 늘어난 건 정확히 그 반대편, **계산형 센서가 원리적으로 못 잡는 의미와 구조의 결함이다.** [#31에서 "AI 코드는 그럴듯한데 미묘하게 틀린다"고 썼는데](/blog/31-reviewing-ai-code/), 이게 그 문장의 통계 버전이다.

하네스 설계에 주는 함의가 바로 나온다. 계산형 센서만으로는 이제 안 된다. 늘어나는 결함이 그 그물을 통과하니까. 그렇다고 추론형 센서를 모든 커밋에 돌리면 느리고 비싸다. 그래서 하네스 설계의 중심 문제는 이것이 된다. **싼 계산형 센서로 최대한 왼쪽(작성 시점)에서 거르고, 비싼 추론형 센서는 계산형이 못 보는 것에만 아껴 쓴다.** Böckeler도 같은 말을 한다. 좋은 하네스는 사람의 개입을 없애는 게 아니라 사람의 판단이 가장 필요한 곳으로 몰아준다.

---

## 실전: 시작은 하루면 된다

하네스라는 말이 거창하게 들리지만, [Augment의 가이드에 나오는 시작 레시피는](https://www.augmentcode.com/guides/harness-engineering-ai-coding-agents) 하루짜리다.

**1) 최근 에이전트 PR 5개를 다시 열어보라.** 리뷰에서 반복적으로 지적됐거나 머지 후에 문제가 된 패턴을 찾는다. 대개 3개쯤의 반복 부채 패턴이 나온다.

**2) 그 패턴을 린트 규칙으로 인코딩하라.** 핵심은 에러 메시지다. "이렇게 고치라"는 지침까지 메시지에 넣는다. 사람에게는 친절이지만 에이전트에게는 그 메시지가 다음 시도의 프롬프트가 된다. 에러 메시지가 곧 가이드다.

**3) CI 게이트로 승격하라.** 통과 못 하면 머지가 안 되게. 이 순간부터 규칙은 '지침'이 아니라 '강제'가 되고 에이전트는 스스로 고치는 루프를 돈다.

**4) 전후를 측정하라.** 리뷰 시간과 결함 탈출률. 측정이 없으면 하네스도 [#32의 표현대로](/blog/32-ai-eval/) 운에 맡기는 개선이 된다.

그리고 이 모든 걸 관통하는 사실 하나. 프롬프트는 대화가 끝나면 사라지고 모델은 계속 바뀐다. 하지만 린트 규칙, 구조 테스트, AGENTS.md, CI 게이트는 **리포지토리에 산다.** LangChain이 모델을 고정하고 순위를 올린 사례를 뒤집어 읽으면, 개선분 중 적어도 일부는 특정 모델이 아니라 그 위의 운영 체계에 축적됐다는 뜻이다. 모델은 임대고, 하네스는 자산이다.

---

## 사람들이 진짜 원한 것

이 용어가 뜬 수요를 생각해 보면 그림이 선명해진다. [Faros에 따르면 엔지니어의 약 75%가 이미 AI 도구를 쓰는데](https://www.faros.ai/blog/harness-engineering) 조직 단위의 측정 가능한 성과는 미미하고, DORA 조사에서는 개발자 30%가 AI 코드를 거의 신뢰하지 않는다고 답했다. 도입은 끝났는데 성과와 신뢰가 안 따라온다. 이 간극에서 조직들이 원한 건 더 똑똑한 모델이 아니었다. **더 예측 가능한 시스템이었다.** 모델 업그레이드는 기다리는 것이지만 하네스는 설계하는 것이고, 엔지니어링 조직은 기다리는 것보다 설계하는 것에 늘 강했다.

이 렌즈로 보면 이 블로그의 최근 글들이 사실 한 그림의 조각이었다. [#30(컨텍스트)](/blog/30-context-engineering/)은 가이드 설계였고, [#31(AI 코드 리뷰)](/blog/31-reviewing-ai-code/)은 추론형 센서였고, [#32(eval)](/blog/32-ai-eval/)은 센서를 만드는 기반이었고, [#25(루프)](/blog/25-loop-engineering/)는 하네스 바깥의 트리거였다. 조각들에 이제 조립도가 생긴 셈이다.

모델을 고르고 있는가, 시스템을 설계하고 있는가. [#14](/blog/14-agent-engineering/)의 이 질문에 업계는 이름을 붙이는 것으로 답했다. 이름이 붙었다는 건 직무가 됐다는 뜻이다. 다음 벤치마크 발표에서 순위표를 보게 되면 이제 한 가지를 더 물어야 한다. **저 점수는 모델이 낸 것인가, 하네스가 받쳐준 것인가?**

---

*참고: [Harness engineering: leveraging Codex in an agent-first world (OpenAI)](https://openai.com/index/harness-engineering/), [Harness Engineering for Coding Agent Users (Birgitta Böckeler, martinfowler.com, 2026-04-02)](https://martinfowler.com/articles/harness-engineering.html), [Improving Deep Agents with harness engineering (LangChain)](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering), [Minions Part 2 (Stripe)](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), [Honk Part 1 (Spotify)](https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1), [Harness Engineering (Faros AI)](https://www.faros.ai/blog/harness-engineering), [4x Velocity, 10x Vulnerabilities (Apiiro, 2025-09)](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/). 수치는 2026-07-19 기준 각 발표 공개치이며, 업체 발표 수치는 해당 업체가 설명한 표본과 방법론의 범위에서 인용했다.*
