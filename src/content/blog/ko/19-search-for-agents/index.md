---
title: "검색은 더 이상 사람을 위한 게 아니다 — Web IQ가 드러낸 진짜 사용자"
summary: "마이크로소프트가 Web IQ를 내놨다. 사람이 읽을 10개 링크가 아니라, AI 에이전트가 추론에 바로 쓸 '증거 조각'을 돌려주는 검색 API다. Exa·Perplexity·Brave·Anthropic·Google까지 모두 같은 방향으로 가고 있다. 30년간 사람을 향했던 검색이, 이제 에이전트를 사용자로 모시기 시작했다. 그 전환의 구조와, 그 대가로 끊기고 있는 사람-웹의 피드백 루프를 데이터로 짚었다."
date: "2026-06-11T10:00:00"
tags:
  - ai
  - ai-agent
  - search
  - rag
  - geo
  - agent-engineering
draft: false
---

마이크로소프트가 6월에 **Web IQ**를 발표했다. Bing 검색 기술 위에 올라간 새 API 묶음인데, 소개 문구의 한 줄이 전부를 말한다 — 이건 사람을 위한 검색이 아니라 **AI 에이전트를 위한 검색**이다. 10개의 파란 링크를 돌려주지 않는다. 모델이 추론에 곧장 집어넣을 수 있는 **증거 조각(passage)과 구조화된 evidence object**를 돌려준다. ([Bing 공식 블로그](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ))

여기서 멈춰서 질문을 하나 던지고 싶다. **왜 검색 거인이 30년간 다듬어온 사람용 인터페이스를 버리고, 에이전트를 사용자로 모시기 시작했나?** [지난 글들](/blog/05-geo-seo/)에서 "AI에게 인용되는 콘텐츠를 만들자"는 *공급자* 관점을 다뤘다면, 이번엔 그 인용을 만들어내는 **검색 인프라 자체**가 어디로 가는지를 본다. 마이크로소프트의 스펙을 흠집 내려는 게 아니다. 이 발표가 신호탄이라면, **그 신호가 가리키는 수요**가 무엇인지를 읽어보려는 것이다.

---

## 1. 30년간 검색은 누구를 위한 것이었나

파란 링크 10개. 이건 **사람의 눈과 클릭과 광고**를 위한 설계였다. 사용자가 결과를 훑고, 마음에 드는 걸 클릭하고, 그 클릭이 트래픽이 되고 광고가 되고 SEO 산업이 됐다. 검색 결과 페이지(SERP)의 모든 픽셀은 "사람이 다음에 어디를 누를까"를 위해 존재했다.

그런데 이제 질의를 던지는 주체가 바뀌고 있다. 점점 더 많은 검색이 사람이 아니라 **멀티스텝으로 추론하는 에이전트**에서 나온다. 에이전틱 RAG는 한 번 검색하고 끝내지 않는다. 질문을 쪼개고, 검색하고, 부족하면 다시 검색하는 **반복적·멀티홉 회수**를 한다([arXiv 2501.09136, agentic RAG survey](https://arxiv.org/html/2501.09136v3)). 이 사용자는 파란 링크를 클릭하지 않는다. 페이지를 "읽지도" 않는다. 필요한 건 추론에 바로 꽂을 수 있는 사실 조각이다.

> **업데이트 (2026-06-07):** 이 반복 루프엔 빠진 질문이 하나 있다 — *언제 멈추나?* 구글이 최근 Gemini Enterprise에 [Sufficient Context Agent를 더했다](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/). 검색을 또 할지 멈출지를 "지금 모은 컨텍스트가 답하기에 *충분한가*"로 판단하는 에이전트다. 배경 연구([Sufficient Context, ICLR 2025](https://arxiv.org/abs/2411.06037))의 발견이 뼈아프다 — 컨텍스트를 붙이면 모델이 과신해서 **모를 때 기권하는 능력이 오히려 떨어진다**(Claude 3.5 Sonnet 기권율 84%→52%). 에이전틱 RAG의 진짜 난제는 "다시 검색하는 법"이 아니라 "충분한지 알고, 모르면 기권하는 법"이라는 뜻이다.

사용자가 바뀌면 인터페이스가 바뀐다. 이게 이 글의 한 문장짜리 명제다. **검색의 사용자가 사람에서 에이전트로 넘어가고 있고, 검색 엔진은 그 새 사용자에 맞춰 다시 설계되고 있다.**

---

## 2. 에이전트용 검색은 뭐가 다른가 — Web IQ 해부

Web IQ가 사람용 Bing과 다른 지점은 셋이다.

- **반환 단위가 페이지가 아니라 조각이다.** 문서 URL 목록 대신 passage와 구조화된 evidence object를 돌려준다. 모델이 클릭해서 읽고 요약할 필요 없이, 추론에 바로 쓸 수 있는 형태다.
- **회수가 키워드가 아니라 의미 기반이다.** 마이크로소프트의 대규모 근사 최근접 탐색 기술인 **DiskANN**을 확장해, 오픈 임베딩 모델로 의미적으로 가까운 조각을 골라 랭킹한다. ([Bing 블로그](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ))
- **지연이 UX가 아니라 추론 루프의 변수다.** 사람에게 검색 0.3초와 0.5초는 거의 같다. 하지만 멀티홉으로 5번, 10번 검색하는 에이전트에게 지연은 스텝 수만큼 **곱셈으로 누적**된다. 그래서 Web IQ는 속도를 1급 설계 목표로 내세운다.

> **정직하게 짚을 것 — 마케팅 수치는 액면 그대로 믿지 말 것**
> Web IQ는 "P95 지연 165ms 미만, 차선책 대비 약 2.5배 빠름"을 내세운다. 그런데 이건 **마이크로소프트 자체 벤치마크**이고, 비교 대상("차선책")이 누구인지·측정 방법이 무엇인지 공개돼 있지 않다. 게다가 발표 시점(2026년 6월) 기준으로 **정식 출시(GA) 전**이고, 가격·Azure 연동·정확한 접근 방식도 미확정이다. "2.5배 빠름"은 *마이크로소프트의 주장*으로만 인용하는 게 맞다.

핵심은 수치가 아니라 **설계 의도**다. passage 반환, 의미 회수, 지연 최적화 — 이 셋은 전부 "사람이 읽을 페이지"가 아니라 "모델이 추론할 증거"를 위한 선택이다.

---

## 3. 왜 하필 '조각'이어야 하나 — 에이전트 검색의 경제학

에이전트에게 조각을 돌려주는 건 친절이 아니라 **경제학**이다.

멀티스텝 추론에서 토큰과 지연은 스텝 수만큼 쌓인다. 한 번의 검색으로 페이지 통째(수만 토큰)를 컨텍스트에 넣으면, 그게 매 스텝 다시 읽히고 매번 과금된다. 회수된 컨텍스트 자체가 비용의 1차 동인이 되는 것이다([Stevens, "The Hidden Economics of AI Agents"](https://online.stevens.edu/blog/hidden-economics-ai-agents-token-costs-latency/)). 그래서 학계는 회수 단계에서 토큰을 줄이는 압축을 파고든다. 예컨대 에이전틱 RAG 프레임워크 TeaRAG는 출력 토큰을 **59~61% 줄였다**고 보고한다(단, 아직 [프리프린트](https://arxiv.org/html/2511.05385v1)다). 페이지가 아니라 조각을 돌려주는 건, 이 비용 곡선을 회수 단계에서 미리 깎는 일이다.

여기서 [지난달 뜯어본 Headroom](/blog/18-headroom/)이 정확히 반대편 짝으로 떠오른다. Headroom은 **이미 모델에 닿은(혹은 닿으려는) 컨텍스트를 사후에 압축**한다. Web IQ는 **애초에 밀도 높은 조각만 회수**한다. 한쪽은 들어온 물을 짜내고, 다른 쪽은 처음부터 적게 붓는다. 둘 다 같은 고통 — "에이전트가 토큰을 너무 먹는다" — 의 양면 해법이다. 토큰이 청구서의 한 줄이 된 시대에, 검색 엔진마저 "얼마나 적은 토큰으로 같은 답을 줄까"로 경쟁하기 시작한 것이다.

> 한 가지 경계. 리서치 중 "최소 조각만 회수하면 스텝당 토큰 95%·전체 비용 70% 절감, 추론 루프를 2~20배 더 돌릴 수 있다"는 식의 인상적인 수치를 만났지만, 검증 단계에서 근거가 무너져 **의도적으로 뺐다.** 토큰 절감 서사는 매력적인 만큼 과장도 많다.

---

## 4. 모두가 그쪽으로 가고 있다 — 경쟁 구도

Web IQ는 혼자가 아니다. "에이전트용 검색"은 이미 붐비는 시장이고, 두 진영으로 갈린다.

**(A) 단독 검색 API** — 개발자가 LLM을 직접 통제하고, 정제된 grounding 데이터만 받는다.

- **Exa** — 임베딩 기반 neural search. `/contents`가 페이지 대신 정제된 본문·하이라이트·요약을 LLM용으로 돌려준다.
- **Brave Search API** — 빅테크 밖에서 **자체 대규모 독립 인덱스**를 가진 거의 유일한 곳. "LLM Context" 엔드포인트가 질의 최적화된 snippet과 마크다운을 토큰 효율적으로 반환한다([Brave 블로그](https://brave.com/blog/most-powerful-search-api-for-ai/)).
- **Tavily / Linkup / You.com** — 검색+추출을 한 호출에. Linkup은 사실 정확도 벤치(SimpleQA)에서 **SOTA를 주장**한다([Linkup 블로그](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa), *벤더 자체 벤치로 플래그*).
- **Jina AI Reader** — 검색은 아니지만, URL 앞에 `r.jina.ai/`만 붙이면 페이지를 LLM이 읽기 좋은 마크다운으로 정제해준다.

**(B) LLM에 내장된 검색/grounding** — 검색·읽기·인용이 모델 추론 루프 안에서 자동으로 일어난다.

- **Anthropic web search** — 메시지 API에 내장. **인용이 항상 켜져** 있고, 인용 텍스트(`cited_text`)는 토큰으로 과금하지 않는다. 가격은 **검색 1,000건당 $10** + 표준 토큰비([Anthropic 문서](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-search-tool)).
- **OpenAI web search**(Responses API) — inline url_citation 기본. 표준은 1,000콜당 $10인데, **비추론 프리뷰는 $25로 더 비싼 대신 검색 콘텐츠 토큰을 무과금**한다([OpenAI 가격](https://developers.openai.com/api/docs/pricing)). "검색 토큰을 고정비에 끼울까, 따로 받을까"라는 과금 설계의 분기를 보여준다.
- **Gemini grounding**(Google Search) — Gemini에 구글 검색을 직접 붙인다. 단가가 **Gemini 3에서 1,000쿼리당 $14, Gemini 2.x에서는 $35**([Google 가격](https://ai.google.dev/gemini-api/docs/pricing)). 내장 grounding이 단독 검색 API($5~7/1k)보다 비싸다는 좋은 대조다.

세 가지 축으로 또렷하게 수렴한다 — **링크가 아니라 콘텐츠 조각 반환 / 인용 기본 탑재 / 토큰 효율과 지연**. 모두가 같은 곳을 향한다는 사실 자체가, 이게 한 회사의 베팅이 아니라 **시장 전체의 방향 전환**이라는 증거다. 그 안에서 Web IQ의 포지션은 분명하다 — 스크래핑 기반 신생 인덱스가 아니라 **수십 년 쌓은 Bing 인덱스** 위에서, **robots·퍼블리셔 선택권 준수**를 차별화 자산으로 내세운다.

---

## 5. 그 대가로, 사람-웹의 피드백 루프가 끊기고 있다

여기가 이 전환의 그늘이다. 검색이 에이전트를 향할수록, **사람이 페이지를 방문하던 오래된 거래가 깨진다.**

웹은 30년간 단순한 약속 위에 굴러갔다. 크롤러가 콘텐츠를 가져가는 대신, 검색 결과로 사람을 그 사이트에 **돌려보낸다**. 트래픽이 광고가 되고, 그 광고가 콘텐츠 제작을 먹여 살렸다. 그런데 AI 검색은 답을 *대신* 만들어 보여주고, 사람은 더 이상 출처를 클릭하지 않는다.

Cloudflare의 텔레메트리가 이 균열을 숫자로 보여준다([Cloudflare](https://blog.cloudflare.com/crawlers-click-ai-bots-training/)).

- 2025년 7월 기준, AI 봇의 크롤 중 **약 79%가 학습용**, 검색 grounding은 17%에 그쳤다.
- 크롤 대비 리퍼럴(돌려보낸 방문) 비율이 처참하다. **Anthropic은 38,065:1, Perplexity는 195:1.** 콘텐츠는 가져가는데, 사람은 거의 안 돌려보낸다는 뜻이다.

퍼블리셔 쪽 피해도 측정되기 시작했다. 구글 AI Overview가 뜬 뒤 **뉴스 사이트 리퍼럴이 15% 감소**했고, 한 분석은 **퍼블리셔 리퍼럴 트래픽이 약 25% 줄었다**고 본다([Digiday](https://digiday.com/media/google-ai-overviews-linked-to-25-drop-in-publisher-referral-traffic-new-data-shows/)). 게다가 크롤러를 막는다고 해결되지도 않는다 — 차단해도 인용은 계속된다는 데이터가 있다([ppc.land](https://ppc.land/blocking-ai-crawlers-doesnt-stop-citations-new-data-shows-why/)). 이건 [블로그 #04에서 다룬 "클릭이 사라지는 생태계"](/blog/04-ai-content-ecosystem/)가 한 단계 더 진행된 모습이다.

바로 이 맥락에서 Web IQ가 **robots 준수·퍼블리셔 선택권·IETF 표준 참여**를 전면에 내건 게 읽힌다. AI 선호도를 표현하는 표준을 만드는 [IETF AIPREF 워킹그룹](https://datatracker.ietf.org/doc/charter-ietf-aipref/)이 실제로 가동 중이고, 마이크로소프트는 거기 발을 담그고 있다. 끊긴 루프를 **거버넌스로 봉합하려는 시도**다.

> ⚖️ 균형 잡기. 이 그림에도 단서가 붙는다. (1) 퍼블리셔 피해 데이터는 상당 부분 **Cloudflare 한 곳**에 기댄다. (2) "Perplexity가 robots를 우회하는 스텔스 크롤러를 쓴다"는 Cloudflare의 고발은 **당사자가 반박한 단일 주장**이다. (3) IETF AIPREF는 아직 "선호를 *표현*하는 수단"일 뿐, **강제력은 미정**이다. robots.txt를 안 지키겠다는 곳을 막을 방법은 여전히 없다.

---

## 6. 그래서 우리는 무엇을 해야 하나

**콘텐츠를 만드는 쪽이라면** — [GEO](/blog/05-geo-seo/)에서 한 발 더 나가야 한다. "검색 1페이지"가 아니라 "**조각 단위로 인용되기 좋은 형태**"로 쓰는 것. 명확한 사실, 구조화된 단락, 출처 명시 — 에이전트가 통째로 읽지 않고 한 문단만 떼어가도 말이 되게. 동시에 robots와 AIPREF로 **내 선택권을 적극 행사**하는 것. 차단이 만능은 아니지만, 표현하지 않으면 협상 테이블에도 못 앉는다.

**에이전트를 만드는 쪽이라면** — 검색을 "툴 하나 끼우기"로 보면 안 된다. 검색은 **토큰과 지연이라는 예산을 쓰는, 추론 루프의 핵심 설계 변수**다([블로그 #14: 모델 바깥의 전쟁](/blog/14-agent-engineering/)). 어떤 검색 API가 조각을 돌려주는지, 인용을 어떻게 다루는지, 토큰을 어떻게 과금하는지가 에이전트의 비용과 정확도를 직접 가른다. Anthropic처럼 인용 토큰을 공짜로 주는지, OpenAI처럼 고정비에 끼울지 — 이런 게 더 이상 디테일이 아니다.

---

## 마치며

Web IQ 발표문 한 장을 읽고 시작했지만, 더 오래 남는 그림은 발표 너머에 있었다.

**30년간 사람을 향했던 검색이, 이제 에이전트를 사용자로 모시기 시작했다.** 파란 링크가 증거 조각으로, 클릭이 토큰으로, SEO가 GEO로 바뀐다. 한 회사가 아니라 Exa부터 구글까지 모두가 같은 방향으로 움직인다는 게 그 전환이 진짜라는 증거다.

하지만 사용자가 바뀌면, 그 사용자를 먹여 살리던 **인센티브 구조 전체가 흔들린다.** 사람이 페이지를 방문하지 않으면, 그 페이지를 만들 이유도 줄어든다. 에이전트가 읽을 좋은 웹은, 결국 사람이 만든다. Web IQ가 robots와 IETF를 꺼내 든 건 그래서 PR 문구 이상일 수 있다 — 에이전트용 검색이 오래 가려면, **사람이 웹을 계속 만들 이유**를 누군가는 지켜야 한다는 걸 가장 큰 검색 사업자가 인정한 셈이니까.

검색창은 그대로인데, 그 너머에서 읽는 게 사람이 아니게 됐다. 우리가 쓰는 글도, 만드는 도구도, 이제 그 새 독자를 염두에 둬야 한다.

---

## 참고 자료

- [Announcing Microsoft Web IQ (Bing 공식 블로그)](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ) — 1차 발표. 성능 수치는 자체 벤치·GA 전임에 유의.
- [Microsoft releases Web IQ (Search Engine Land)](https://searchengineland.com/microsoft-releases-web-iq-powered-by-bing-but-designed-for-how-ai-agents-search-479194) · [Search Engine Journal](https://www.searchenginejournal.com/microsoft-web-iq-gives-ai-agents-bing-grounding-apis/577736/)
- [The crawl-to-click gap (Cloudflare)](https://blog.cloudflare.com/crawlers-click-ai-bots-training/) — 크롤:리퍼럴 비율, 학습 79% 통계
- [Google AI Overviews & publisher traffic (Digiday)](https://digiday.com/media/google-ai-overviews-linked-to-25-drop-in-publisher-referral-traffic-new-data-shows/) · [차단해도 인용은 계속된다 (ppc.land)](https://ppc.land/blocking-ai-crawlers-doesnt-stop-citations-new-data-shows-why/)
- [IETF AIPREF Working Group](https://datatracker.ietf.org/doc/charter-ietf-aipref/) — AI 선호 표현 표준
- 검색 API: [Anthropic web search](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-search-tool) · [OpenAI 가격](https://developers.openai.com/api/docs/pricing) · [Gemini grounding 가격](https://ai.google.dev/gemini-api/docs/pricing) · [Brave Search API](https://brave.com/blog/most-powerful-search-api-for-ai/) · [Linkup SimpleQA](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa)
- Sufficient context: [Unlocking dependable responses (Google Research, 2026)](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/) · [Sufficient Context: A New Lens on RAG (ICLR 2025)](https://arxiv.org/abs/2411.06037)
- 관련 글: [GEO — AI에게 인용되는 콘텐츠](/blog/05-geo-seo/) · [AI 콘텐츠 생태계](/blog/04-ai-content-ecosystem/) · [AI 토큰을 아끼는 Headroom](/blog/18-headroom/) · [모델 바깥의 전쟁](/blog/14-agent-engineering/)
