---
title: '"초인적인 챗봇이 왜 AGI로 이어지지 않았나" — ChatGPT 공동 개발자가 2년 만에 내놓은 판정 모델 Jev'
summary: "OpenAI에서 RLHF를 함께 만든 Diogo Almeida가 2년 만에 내놓은 모델 Jev는 문장을 만들지 않고 선택과 확률만 돌려준다. GPT-4 기술보고서에 남아 있는 보정 붕괴(ECE 0.007에서 0.074)가 출발점이다. 나흘 동안 무엇이 만들어졌는지, 오픈소스로 풀렸다는 말이 사실인지, 지금 어떻게 써볼 수 있는지 정리했다. 시리즈 1편."
date: "2026-09-19T17:00:00+09:00"
tags:
  - llm
  - agent-engineering
  - jev
  - calibration
draft: false
---

2026년 9월 15일에 공개된 모델 하나가 나흘 만에 개발자 타임라인을 채웠다. TypeSafe AI의 [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)다. Vercel은 Jev가 AI Gateway에 올라온 지 24시간 만에 기존 어떤 모델 출시보다 두 배 많은 유료 팀에 도달했다며 [게이트웨이 사상 가장 빨리 채택된 모델이라고 발표했다.](https://vercel.com/blog/ai-gateway-jev-model-launch) TechCrunch는 수요가 몰려 회사가 한때 서비스를 제공하지 못했다고 [전했다.](https://techcrunch.com/2026/09/18/a-new-kind-of-ai-model-from-a-chatgpt-inventor-is-thrilling-developers/) GitHub에는 Jev로 브라우저를 조작하고, 코드를 리뷰하고, 매매 판단을 내리는 저장소가 하루 이틀 사이에 올라왔다.

그런데 이 모델은 글을 한 줄도 못 쓴다. 채팅도 안 되고 코드도 못 짠다. 상황과 질문과 선택지를 주면 어느 것을 골랐는지와 선택지별 확률을 돌려주는 게 전부다.

이 글은 Jev를 다루는 시리즈의 첫 편이다. 누가 어떤 문제의식에서 만들었는지, 나흘 동안 사람들이 무엇을 만들었는지, 돌아다니는 말 중 무엇이 사실인지, 지금 어떻게 써볼 수 있는지를 다룬다. [2편에서는](/blog/68-jev-style-engine/) 같은 방식을 오픈 모델로 직접 구현해 보고, [3편에서는](/blog/69-jev-measured/) API 키를 받아 직접 잰 결과를 정리한다.

## 만든 사람이 던진 질문

TypeSafe AI의 공동 창업자 Diogo Almeida는 OpenAI 연구자 출신이다. 회사와 언론은 그를 RLHF와 ChatGPT를 함께 만든 사람으로 소개한다. 그가 공개 당일 [X에 올린 글은](https://x.com/CompleteSkeptic/status/2099925682726002904) 이렇게 시작한다. "ChatGPT를 함께 만든 뒤로 계속 자문했다. 초인적인 채팅 모델이 왜 AGI로 이어지지 않았는가." 그 뒤 2년 동안 스텔스로 새 학습 방법과 새 종류의 모델을 만들었다고 적었다.

TechCrunch 인터뷰에는 같은 문제의식이 더 직설적으로 나온다. "번개를 병에 담았는데 쓸모가 없다." "문제는 우리가 사람의 언어에 최적화하고 있다는 것이다." 컴퓨터는 다른 언어를 쓰고, 사람과 대화하도록 다듬은 모델은 소프트웨어 안에서 일하기에 맞지 않는다는 주장이다. 회사는 DCVC가 주도한 시드 4,000만 달러를 받으며 [기업가치 2억 달러로 스텔스를 벗었다.](https://www.businesswire.com/news/home/20260915525333/en/TypeSafe-AI-Emerges-From-Stealth-With-$40M-in-Funding-With-New-Model-for-Composable-AI) 공동 창업자는 Erik Gafni와 Sasha Sheng이다.

## RLHF가 확률을 망가뜨렸다는 기록

이 문제의식에는 공개된 근거가 있다. [GPT-4 기술보고서](https://arxiv.org/abs/2303.08774) 5장은 이렇게 적는다. 사전학습만 마친 모델은 보정이 잘 돼 있다. 답에 매긴 확신이 실제로 맞을 확률과 대체로 일치한다. 그런데 사후 학습을 거치면 그 보정이 줄어든다. 보고서의 그림 8에는 수치가 찍혀 있다. 보정 오차(ECE)가 사전학습 모델은 0.007, PPO를 거친 모델은 0.074다. 열 배 나빠졌다.

| | ECE | 뜻 |
|---|---|---|
| 사전학습 GPT-4 | 0.007 | 80% 확신한 답이 실제로 80%쯤 맞는다 |
| PPO 이후 GPT-4 | 0.074 | 확신과 정답률이 따로 논다 |

이게 자동화에서 문제가 되는 이유는 단순하다. 95%를 맞히는 모델이라도 나머지 5%가 어느 건인지 말해주지 못하면 사람이 전부 다시 봐야 한다. 확률을 믿을 수 있어야 "0.9 이상은 자동 처리, 나머지는 사람에게"라는 규칙을 쓸 수 있다. 사람이 좋아하는 답을 내도록 학습하면 모델은 망설임을 드러내기보다 확신에 찬 말투를 고르게 되고, 그 과정에서 확률이 뜻을 잃는다.

TypeSafe가 내세운 학습 방법의 이름이 RLCD(Reinforcement Learning for Calibrated Decisions)인 것도 이 맥락이다. 사람의 선호 대신 보정된 확률을 목표로 학습한다는 뜻이다. 다만 여기서 선을 그어야 한다. 보상 함수, 학습 데이터, 내부 구조는 공개되지 않았고 논문도 없다. 공개된 것은 이름과 목표까지다.

## Jev가 하는 일

Jev에는 프롬프트 대신 상태(state)와 질문 묶음을 보낸다. 질문 타입은 세 가지다. 정해진 목록에서 하나를 고르는 Choice, 등급 위의 위치를 매기는 Score, 문장이 참일 확률을 주는 Noul이다. 고객 문의 하나에 "결제 문의인가", "어조는 어떤가", "얼마나 급한가"를 한 번에 물으면 세 답이 확률과 함께 돌아온다.

선택지는 모델 안에 들어 있지 않다. 호출할 때마다 프로그램이 그 순간의 후보를 만들어 보낸다. 체스라면 지금 국면의 합법수, 브라우저라면 화면에서 누를 수 있는 요소, 상담 업무라면 등록된 팀 목록이 그대로 선택지가 된다. Jev는 받은 목록에 확률을 매겨 고를 뿐이고, 목록에 없는 답은 구조적으로 나올 수 없다. 업무가 바뀌어도 모델을 다시 학습시키지 않고 입력만 바꾼다.

가격은 입력 100만 토큰에 $0.042이고 출력은 무료다. 입력은 텍스트만 받는다. 이미지는 아직 지원하지 않는다. 회사는 같은 작업에서 LLM보다 20배에서 200배 빠르고 40배에서 400배 싸다고 말하는데, 이 수치는 자체 평가에서 나온 것이다. 외부에서 나온 사용 보고도 있다. TechCrunch에 따르면 Vercel은 OpenAI의 Luna보다 5배에서 18배 빨랐다고 했고, Bryo AI는 이메일 분류에서 Gemini보다 10배에서 20배 쌌다고 했다.

## 나흘 동안 만들어진 것들

GitHub에 올라온 저장소를 직접 확인했다. 별 수는 9월 19일 기준이다.

| 저장소 | 별 | 하는 일 |
|---|---|---|
| [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | 6,189 | Jev가 누를 요소를 고르고, 글자를 입력할 때만 작은 LLM을 쓰는 브라우저 에이전트 |
| [jarrodwatts/jev-trader](https://github.com/jarrodwatts/jev-trader) | 945 | 블록마다 매매 판단을 하나씩 내리는 봇. 기본값은 모의 실행 |
| [awlevin/typesafe-computer-use](https://github.com/awlevin/typesafe-computer-use) | 336 | 화면을 OCR로 읽고 다음 클릭을 Jev로 고르는 Mac용 구현. 한 단계에 $0.0002 정도라고 밝힌다 |
| [devagrawal09/jev-review](https://github.com/devagrawal09/jev-review) | 287 | diff를 단계별로 검사해 정확성·안전성·호환성 위험을 구조화해 보여주는 코드 리뷰 |
| [droidrun/mobile-jev](https://github.com/droidrun/mobile-jev) | 168 | 실제 안드로이드 기기를 조작하는 모바일 에이전트 |
| [gargpratyush/jev-router](https://github.com/gargpratyush/jev-router) | 159 | Claude Code의 턴마다 쉬운 일은 싼 모델로, 어려운 일은 강한 모델로 보내는 라우터 |

사례들의 구조가 같다. 후보를 만드는 쪽은 언제나 코드다. 브라우저 에이전트는 DOM에서 조작 가능한 요소를 추리고, computer use 구현은 OCR로 화면의 글자를 뽑고, 라우터는 쓸 수 있는 모델 목록을 들고 있다. Jev는 그중 하나를 고르고, 고른 결과를 실행하는 것도 다시 코드다. 지금까지 이 자리에는 LLM이 있었고, 클릭 하나를 고르려고 몇 초씩 기다렸다. 판단 하나에 0.1초와 1만분의 몇 센트라면 매 단계마다 판단을 부르는 설계가 가능해진다. 모델 이름이 제번스 역설(Jevons Paradox)에서 온 것도 그 기대를 담고 있다. 판단이 싸지면 판단을 더 많이 쓰게 된다는 쪽에 회사가 걸었다.

## 오픈소스로 풀렸다는 말은 사실인가

사실이 아니다. Jev는 가중치가 공개되지 않은 호스팅 API이고, 직접 돌리는 방법도 발표된 적이 없다.

그런 말이 도는 데는 이유가 있다. 같은 입출력 방식을 오픈 모델로 재현하는 독립 프로젝트가 여럿 나왔기 때문이다. [SemIf](https://github.com/TheoLeeCJ/SemIf)(별 1,674, 처음 이름은 OpenJev)는 학습 없이 오픈 모델의 logits를 직접 읽는 방식이고, [NanoJev](https://github.com/TianyuCodings/NanoJev)(별 513)는 0.6B 모델에 판정 전용 헤드를 붙여 학습시키고 모델과 데이터를 모두 공개했다. [jevlike](https://github.com/vinnylarouge/jevlike)(별 918)도 자체 데이터로 학습하는 시도다. 셋 다 TypeSafe와 무관하다고 밝히고 있다. Jev가 풀린 게 아니라, Jev의 인터페이스를 따라 한 프로젝트들이 풀린 것이다.

이 재현이 어디까지 되는지는 직접 만들어 보면 알 수 있다. [2편에서](/blog/68-jev-style-engine/) 70줄짜리 엔진을 만들어 같은 문항으로 Jev와 비교했다.

## 지금 써보려면

절차는 짧다. 직접 해본 순서대로 적는다.

1. [typesafe.ai](https://typesafe.ai)에서 얼리 액세스를 신청한다. 승인되면 콘솔에서 API 키를 만든다.
2. HTTP로 바로 호출할 수 있다. SDK는 Python(`pip install typesafe-sdk`)과 JavaScript가 있다.

```bash
curl -X POST https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "state": "두 번 결제됐어요. 빨리 처리해 주세요.",
    "model": "jev-latest",
    "questions": {
      "billing": {"type": "noul", "instructions": "결제 관련 문의인가?"},
      "tone": {"type": "choice", "instructions": "어떤 어조인가?",
               "criteria": {"calm": null, "angry": null, "neutral": null}}
    }
  }'
```

3. 기다리기 싫다면 [Vercel AI Gateway에서](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway) `typesafe-ai/jev`라는 모델 이름으로 호출하는 경로도 있다.
4. 코딩 에이전트에게 맡길 거라면 TypeSafe가 배포하는 스킬을 설치한다. Claude Code는 `claude plugin marketplace add typesafe-ai/skills` 다음에 `claude plugin install typesafe@typesafe-ai`, 다른 에이전트는 `npx skills add typesafe-ai/skills --skill typesafe-ai`다. 스킬 문서는 에이전트가 질문을 잘 쓰지 못하니 같이 고쳐 쓰라고 미리 적어 놨다.

Jev를 Codex나 Claude Code 안에 설치하는 게 아니라는 점은 짚어둘 만하다. 내 프로그램이 Jev API를 부르고, 돌아온 판단에 따라 내 프로그램이 다음 행동을 실행한다.

비용은 계산해 보면 감이 온다. 3편에서 잰 값으로 짧은 상황 설명에 질문 하나를 붙인 호출이 입력 360토큰 정도였다. 하루 1,000번 판단하면 한 달에 약 1,100만 토큰이고 요금은 50센트가 안 된다. 하루 1만 번이어도 5달러 안쪽이다. 긴 문서를 매번 통째로 보내지 않는 한 비용이 문제가 되기는 어렵다.

## 확인된 것과 아직 아닌 것

지금 시점에서 확인된 것은 이렇다. 인터페이스와 가격은 공개돼 있고 누구나 호출해 볼 수 있다. 출력이 선택지 밖으로 나가지 않는다는 보장은 구조에서 나오는 것이라 사실이다. 속도와 비용이 LLM보다 크게 낮다는 외부 사용 보고가 있다.

확인되지 않은 것도 분명하다. RLCD가 실제로 어떤 학습인지는 공개되지 않았다. "20배에서 200배 빠르다"는 수치는 회사가 자기 워크플로에서 잰 값이고, 그 평가의 정답 라벨은 다른 LLM 두 개의 답을 평균 낸 것이라 독립된 기준이 아니다. "환각이 없다"는 말은 형식에 대해서만 맞다. 목록 안에서 틀린 답을 고르는 일은 그대로 남고, 회사 문서에도 같은 요청을 15번 반복했더니 확률이 0.43에서 0.53 사이를 오갔다는 [예제가 있다.](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook) 그 예제가 권하는 방법은 0.30에서 0.70 사이를 사람 검토용으로 비워 두는 것이다.

판단이 싸고 빨라졌다는 것과 판단이 맞다는 것은 따로 확인해야 한다. 그 확인을 [3편에서](/blog/69-jev-measured/) 직접 했다.
