---
title: "RAG의 진짜 난제는 '다시 검색'이 아니라 '기권'이다 — 구글이 제품에 박은 Sufficient Context"
summary: "RAG에 문서를 쥐여주면 모델이 더 정직해질 것 같지만, 실측은 반대다 — 컨텍스트가 생기면 과신부터 하고, '모른다'고 말하는 능력을 잃는다(Claude 3.5 Sonnet 기권율 84%→52%). ICLR 2025 논문 Sufficient Context는 '관련 있는가' 대신 '충분한가'를 묻는 것으로 이 문제를 갈랐고, 13개월 뒤 구글이 그걸 Gemini Enterprise 에이전트 루프의 정지 신호로 제품화했다(factuality 최대 +34%). [#19](/blog/19-search-for-agents/)의 검색 루프에 빠져 있던 브레이크, [#32](/blog/32-ai-eval/)의 평가 축 하나가 여기서 채워진다. 메커니즘을 뜯고, 내 RAG에 기권을 붙이는 실전 레시피까지 정리했다."
date: "2026-07-19T14:00:00"
tags:
  - rag
  - agentic-rag
  - sufficient-context
  - hallucination
  - ai-eval
draft: false
---

[블로그 #19](/blog/19-search-for-agents/)에서 에이전트 검색을 다루면서 질문 하나를 걸어뒀다. 검색하고, 부족하면 또 검색하는 반복 루프에서 — **언제 멈추나?** 그때 업데이트 단락으로 짧게 붙였던 답이 구글의 Sufficient Context였는데, 그 뒤로 이게 단락 하나로 두기 아까운 이야기가 됐다. 6월 5일, 구글이 ICLR 2025 논문을 [Gemini Enterprise의 에이전트 루프 안에 정식으로 넣었기 때문이다](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/).

그래서 이번엔 처음부터 뜯는다. 결론을 먼저 말하면, **agentic RAG의 진짜 난제는 "다시 검색하는 법"이 아니라 "충분한지 알고, 모르면 기권하는 법"이다.** 다시 검색하는 건 이미 다들 한다. 어려운 건 멈출 때와 입 다물 때를 아는 것이다.

---

## RAG의 역설: 문서를 쥐여주면 겸손부터 사라진다

이상적인 모델의 행동은 두 가지뿐이다. 아는 건 맞히고, 모르는 건 모른다고 한다(기권, abstention). 우리가 RAG를 붙이는 이유도 결국 이 기대다. 문서를 쥐여주면 환각이 정답으로, 최소한 기권으로 바뀌겠지.

그런데 [원논문](https://arxiv.org/abs/2411.06037)이 실측한 결과는 기대와 반대로 움직인다.

| 모델 | 조건 | 변화 |
|---|---|---|
| Claude 3.5 Sonnet | 기권율 | RAG 없이 **84.1% → RAG 붙이면 52%** |
| GPT-4o | 기권율 | 34.4% → 31.2% |
| Gemma | 오답률 | 컨텍스트가 불충분할 때 **10.2% → 66.1%** |

컨텍스트가 손에 들어오면 모델은 자신감부터 붙는다. "관련 있어 보이는 문서를 받았으니 답해야겠다". 그 문서가 부족해도 그런다. 그래서 RAG는 환각을 줄이는 바로 그 순간에, **모를 때 입을 다무는 능력을 같이 깎는다.** 원래 신중하던 Claude가 가장 크게 무너진 게 상징적이다.

더 나쁜 소식은, 검색을 좋게 만들어도 이 문제가 안 사라진다는 것이다. 검색과 리랭커는 "관련 있는 것"을 가져오는 기술이지 "충분한 것"을 보장하는 기술이 아니다. 그 간극이 다음 절의 주제다.

---

## relevant ≠ sufficient — 문제를 자르는 새 칼

논문의 기여는 거창한 아키텍처가 아니라 정의 하나다. **컨텍스트가 충분하다(sufficient) = 그 컨텍스트만으로 질문에 확정적인 답을 만들 수 있다.** 관련성이 "질문과 같은 주제인가"를 묻는다면, 충분성은 "이걸로 답이 되는가"를 묻는다.

이 둘은 자주 어긋난다. "영화 X의 주연 배우의 배우자는 누구인가"라는 multi-hop 질문에서, 영화 X의 문서는 분명히 관련 있고 주연 배우까지는 알려준다. 하지만 배우자는 그 문서에 없다 — **관련 있지만 불충분하다.** 리랭커를 아무리 좋은 걸로 갈아도 이 구분은 안 생긴다. 리랭커는 관련성을 재는 물건이니까.

이 분리가 강력한 이유는 **생성하기 전에 판정할 수 있어서다.** 정답 라벨도, 생성된 답도 필요 없다. 질문과 컨텍스트만 놓고 "이걸로 확정적인 답이 나오는가"를 물으면 된다. 뒤에서 보겠지만, 이 성질이 그대로 에이전트 루프의 정지 신호가 된다.

덧붙여 논문에는 반직관적인 발견이 하나 더 있다. 컨텍스트가 불충분한데도 모델이 맞히는 경우가 꽤 있다 — 파라미터 속 사전 지식(prior)으로 답한 것이다. 거꾸로 충분한데도 틀리는 경우도 있다. 즉 **retrieval 품질과 최종 정답은 생각보다 많이 분리돼 있다.** recall@k 같은 검색 지표만 보고 RAG 품질을 말하면 안 되는 이유가 여기서 하나 더 나온다.

---

## '충분한가'는 어떻게 재나 — 입력을 심사하는 LLM-as-Judge

정의만 있으면 반쪽이다. 실제로 판정할 수 있어야 한다. 논문의 답은 의외로 소박하다. **Gemini 1.5 Pro에 chain-of-thought와 예시 하나를 넣은 프롬프트(autorater).** 이게 115문항 골드셋 기준 **약 93%의 정확도로,** 파인튜닝한 판정 모델(FLAMe/PaLM 24B)과 NLI 모델(TRUE-NLI)을 프롬프트만으로 이겼다. 프롬프트는 [공개돼 있다](https://github.com/hljoren/sufficientcontext).

눈치챘겠지만 이건 [#32에서 다룬 LLM-as-Judge](/blog/32-ai-eval/)의 특수형이다. 다만 결정적인 차이가 하나 있다. 심사 대상이 **출력이 아니라 입력이다.** 생성된 답을 평가하는 judge는 이미 생성 비용과 지연을 치른 뒤에 온다. 반면 컨텍스트를 심사하는 judge는 **생성 전에 개입한다.** 틀린 답을 채점하는 게 아니라, 틀린 답이 나올 조건을 미리 걸러내는 것이다.

---

## 재기만 하면 뭐하나 — 기권을 '결정'하는 법

sufficiency 신호가 생겼다고 "불충분 = 기권"으로 직결하면 안 된다. 위에서 봤듯 불충분해도 prior로 맞히는 경우가 있어서, 그 규칙은 맞을 답까지 죽인다.

논문의 selective generation이 이걸 다룬다. 신호 두 개를 결합한다.

1. **모델 자기평가 confidence:** P(True), P(Correct) 같은 "네 답이 맞냐"는 자기 신고
2. **sufficiency 라벨:** autorater가 매긴 "컨텍스트가 충분한가"

이 둘을 **로지스틱 회귀로** 묶고, coverage–accuracy 곡선 위에서 임계값을 골라 기권을 결정한다. 요란한 학습이 아니다. ground-truth 정답 라벨도 필요 없다. 이 단순한 결합만으로 Gemini·GPT·Gemma에서 **"답하기로 한 문항"의 정답 비율이 2~10% 올라갔다.**

포인트는 두 신호가 서로의 구멍을 메운다는 것이다. confidence만 쓰면 과신(위의 역설)에 당하고, sufficiency만 쓰면 prior로 맞힐 답을 버린다. 둘을 겹치면 "컨텍스트도 부족하고 자신도 없는" 진짜 위험 지대만 도려낼 수 있다.

---

## 13개월 뒤: 논문이 에이전트 루프의 브레이크가 됐다

2024년 11월 arXiv에 올라온 논문이 ICLR 2025를 거쳐, 2026년 6월 5일 [Gemini Enterprise Agent Platform의 Agentic RAG](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/)로 public preview에 들어갔다. 연구 → 제품까지 13개월. 구조는 멀티 에이전트다. Orchestrator가 지휘하고, Planner가 질문을 쪼개고, Query Rewriter가 검색어를 다시 쓰고, RAG Agent가 가져온다. 그리고 그 한가운데에 **Sufficient Context Agent가** 있다. 구글 스스로 "가장 결정적인 부분"이라고 부르는 이 에이전트의 일은 딱 하나다. 검색된 청크를 실제로 읽고 "이걸로 답이 되는가"를 판정한다. 부족하면 **뭐가 빠졌는지 피드백을 만들어** 재검색을 트리거하고, 충분해지면 그때 생성으로 넘긴다.

[#19](/blog/19-search-for-agents/)의 반복 검색 루프에서 비어 있던 정지 조건이 정확히 이 자리다. "몇 번 돌았나"로 멈추는 iteration cap은 임의적이다. 쉬운 질문엔 낭비고 어려운 질문엔 모자란다. "충분해졌나"로 멈추는 건 질문마다 필요한 만큼만 돈다. 수치도 따라온다.

- factuality 데이터셋에서 표준 RAG 대비 정확도 **최대 +34%**
- FramesQA(824문항, PDF 2,676개)의 cross-corpus 설정에서 **정답률 90.1%** — 여러 corpus 중 맞는 소스를 골라 라우팅하는 것까지 포함한 수치다
- 그러면서 지연은 단일 corpus 구성 대비 **평균 3% 이내**

판정 한 번 끼워 넣는 비용으로 이 정도면, "생성 전에 개입한다"가 왜 남는 장사인지가 숫자로 나온 셈이다.

---

## 실전: 내 RAG에 '기권'을 붙이는 4단계

구글 제품을 사라는 얘기가 아니다. 메커니즘은 전부 공개돼 있고, 어느 RAG 파이프라인에든 이식 가능하다.

**1) sufficiency 체크를 생성 앞에 끼워라.** 시작은 프롬프트 한 장이다. [논문 공개 프롬프트](https://github.com/hljoren/sufficientcontext)를 그대로 가져다 써도 된다. 판정은 생성보다 짧고 싸니 저렴한 등급의 모델로 충분하다. "지연 3% 이내"라는 구글 벤치가 예산의 근거가 돼 준다.

**2) '불충분' 판정의 첫 대응은 기권이 아니라 보강이다.** 판정이 불충분이면 먼저 쿼리를 재작성해 다시 검색하고, 그래도 채워지지 않을 때 기권한다. 구글 루프의 순서가 정확히 이거다. Sufficient Context Agent는 기권 버튼이 아니라, 빠진 조각을 짚어 주는 피드백 생성기로 먼저 일한다.

**3) 기권 결정은 sufficiency + confidence 두 신호로 내려라.** 로지스틱 회귀면 충분하고 정답 라벨도 필요 없다. 임계값은 자기 도메인의 coverage–accuracy 트레이드오프에서 고른다. 법무·의료·금융처럼 오답 비용이 큰 곳이면 coverage를 버리고 accuracy를 사는 쪽으로, 사내 위키 검색이면 반대로.

**4) eval에 sufficiency를 축으로 추가하라.** 오답을 두 종류로 갈라 보라: **retrieval 실패**(불충분한데 답함)와 **생성 실패**(충분한데 틀림). 전자는 검색·청킹·소스 커버리지를 고쳐야 하고, 후자는 프롬프트·모델을 고쳐야 한다. 이 라벨 없이는 둘이 한 덩어리로 보여서 엉뚱한 데를 고치게 된다. [#32의 3계층 평가](/blog/32-ai-eval/)에 축 하나를 더하는 일이고, 자세한 방법론은 [AI Eval 가이드](https://desty.github.io/ai-eval-guide/)에 있다.

어디까지 필요한가도 갈라두자. 사실성이 생명인 도메인 — 사내 지식베이스, 법무, 의료, 컴플라이언스 — 이라면 이 4단계는 필수에 가깝다. 반대로 브레인스토밍·창작 보조라면 기권하는 RAG는 과하다. 틀려도 싼 곳에 브레이크부터 달 필요는 없다.

---

## 사람들이 진짜 원한 것

이 논문이 13개월 만에 엔터프라이즈 제품의 간판이 된 이유를 생각해 보면, 기술보다 수요가 보인다. 기업이 RAG에 원했던 건 "더 많이 답하는 시스템"이 아니었다. **"믿어도 되는 시스템"이었다.** 데모에서 RAG는 늘 그럴듯했다. 도입을 막은 건 95%의 그럴듯한 정답이 아니라 5%의 그럴듯한 오답이었고, 그 5%가 법무팀 앞에서는 전부였다.

Sufficient Context는 그 5%에 대한 공학적 답이다. 모델을 더 똑똑하게 만드는 게 아니라, **모른다고 말할 조건을 시스템에 박는 것.** 구글이 이걸 Gemini Enterprise의 전면에 내세웠다는 건, "모른다고 말하는 AI"가 이제 팔리는 상품이 됐다는 뜻이기도 하다.

시리즈로 보면 이렇게 이어진다. [#19](/blog/19-search-for-agents/)가 에이전트가 **찾는 법이었고,** [#32](/blog/32-ai-eval/)가 **잘했는지 재는 법이었다면,** 이 글은 그 사이의 접점 — **찾은 것으로 답해도 되는지 아는 법이다.** 셋이 갖춰져야 신뢰할 수 있는 agentic RAG가 된다. 기초 개념부터 쌓고 싶다면 [RAG 완전 가이드](https://desty.github.io/rag-guide/)를, 커리큘럼으로 파고 싶다면 [스터디 §5.6 Sufficient Context](https://desty.github.io/study-ai-assistant-engineering/part3/13-advanced-rag/)를 보라.

---

*참고: [Sufficient Context: A New Lens on RAG (ICLR 2025)](https://arxiv.org/abs/2411.06037), [Deeper insights into RAG: the role of sufficient context (Google Research)](https://research.google/blog/deeper-insights-into-retrieval-augmented-generation-the-role-of-sufficient-context/), [Unlocking dependable responses with Gemini Enterprise Agent Platform's Agentic RAG (Google Research, 2026-06-05)](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/), [공식 코드·프롬프트 (GitHub)](https://github.com/hljoren/sufficientcontext), [Google Research Adds Agentic RAG to Gemini Enterprise (MarkTechPost)](https://www.marktechpost.com/2026/06/08/google-research-adds-agentic-rag-to-gemini-enterprise-agent-platform-with-a-sufficient-context-agent-for-multi-hop-queries/), [Why enterprise RAG systems fail (VentureBeat)](https://venturebeat.com/ai/why-enterprise-rag-systems-fail-google-study-introduces-sufficient-context-solution). 수치는 2026-07-19 기준 논문·구글 발표 공개치.*
