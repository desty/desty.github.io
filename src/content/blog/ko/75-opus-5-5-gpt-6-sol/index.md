---
title: "Opus 5.5와 GPT-6 Sol로 갈아타기 전에 — effort 기본값부터 작업당 비용까지 계산해봤다"
summary: "9월 22일 Anthropic과 OpenAI가 90분 간격으로 더 싼 모델을 냈다. Claude Opus 5.5는 Opus 5보다 토큰 단가가 20% 낮고, GPT-6 Sol과 Luna는 GPT-5.6의 절반이다. Artificial Analysis가 공개한 effort별 작업당 비용으로 계산해 보면 두 모델이 싸진 방식이 다르다. Opus 5.5는 low와 high에서 절반으로 줄지만 max에서는 Opus 5보다 2% 비싸다. GPT-6 Sol은 쓰는 토큰 양이 거의 그대로이고 단가만 반으로 내려갔다. 목표 점수별로 가장 싼 설정을 고르면 37점까지는 Luna, 48점까지는 Sol, 그 위는 Opus 5.5다. effort 기본값이 medium으로 내려간 Opus 5.5의 마이그레이션 항목, GPT-6 Sol로 옮길 때 확인할 것, 직접 비교하는 절차까지 정리했다."
date: "2026-09-24T18:00:00+09:00"
tags:
  - claude-opus-5-5
  - gpt-6
  - llm
  - model-release
  - agent-engineering
draft: false
---

새 모델이 나오면 따져보는 시리즈의 여섯 번째다. 이번에도 둘을 같이 본다. 9월 22일 Anthropic이 **Claude Opus 5.5**를 냈고, 약 90분 뒤 OpenAI가 **GPT-6 Sol**과 **GPT-6 Luna**를 냈다. 두 발표 모두 성능보다 가격을 앞에 내세웠다. Opus 5.5는 "기본 설정에서 Opus 5보다 40% 싸다", GPT-6 Sol과 Luna는 "GPT-5.6보다 50% 싸다"고 했다.

같은 날 나온 "싸다"는 말이 같은 뜻인지 확인하고 싶었다. 직접 API를 돌려 측정하지는 않았다. 대신 Artificial Analysis(이하 AA)가 모델과 reasoning effort 단계마다 공개한 지능 지수(Intelligence Index v4.3.2)와 작업당 비용을 모아 계산했다. AA 지수는 에이전트 작업, 코딩, 지식, 과학 추론 평가 10개를 가중 평균한 값이고, 작업당 비용은 그 평가를 돌릴 때 실제로 쓴 토큰에 공개 단가를 곱한 값이다.

그러니 이 글의 숫자는 AA가 고른 과제 기준이다. 내 작업에서도 같은 비율이 나온다는 보장은 없다. 그래서 마지막 절에 각자의 작업으로 다시 확인하는 절차를 붙였다. 참고로 AA 지수는 그사이 구성이 바뀌어서 [#57](/blog/57-gemini-grok-migration/)에 적은 점수와 직접 비교하면 안 된다.

---

## 두 회사가 발표한 가격

먼저 발표 내용부터 정리한다(100만 토큰당 달러).

| 모델 | 입력 | 캐시 읽기 | 출력 | 이전 모델 |
|---|---|---|---|---|
| Claude Opus 5.5 | $4 | $0.20 | $20 | Opus 5: $5 / $0.50 / $25 |
| GPT-6 Sol | $2 | $0.20 | $10 | GPT-5.6 Sol: $4 / $20 |
| GPT-6 Luna | $0.10 | $0.01 | $0.50 | GPT-5.6 Luna: $0.20 / $1.20 |

Anthropic의 "40%"에는 조건이 붙어 있다. 발표문 원문은 "기본 설정에서, 일반적인 작업 기준으로(at default settings, on typical workloads) Opus 5보다 40% 싸다"이다. 토큰 단가 자체는 20% 내렸고, 나머지는 같은 일을 더 적은 토큰으로 끝낸다는 주장이다.

OpenAI의 "50%"는 GPT-5.6의 **프로모션 가격** 대비다. 발표문에 그렇게 적혀 있고, 여러 매체는 GPT-5.6 가격이 원래 한시적이었던 반면 GPT-6 가격은 정가라고 전했다.

그리고 두 모델 모두 effort 기본값이 `medium`이다. Opus 5는 `high`가 기본값이었는데 Opus 5.5에서 한 단계 내려갔다. 이 변화가 비용 계산에서 생각보다 크게 작용한다.

---

## 같은 effort끼리 비교하면 절감 폭이 다르다

AA가 공개한 effort별 수치를 직전 모델과 나란히 놓았다. "토큰 변화"는 비용 변화를 단가 변화로 나눠서 역산한 값이다. 입력과 출력 단가가 같은 비율로 내려갔기 때문에 이렇게 계산할 수 있다.

**Opus 5 → Opus 5.5** (토큰 단가 -20%)

| effort | 지수 | 작업당 비용 | 비용 변화 | 토큰 변화(역산) |
|---|---|---|---|---|
| low | 39 → 42 | $1.10 → $0.55 | -50% | -38% |
| medium | 45 → 51 | $2.19 → $1.34 | -39% | -24% |
| high | 48 → 54 | $3.61 → $1.82 | -50% | -37% |
| xhigh | 50 → 56 | $4.88 → $3.46 | -29% | -11% |
| max | 51 → 58 | $5.86 → $5.98 | **+2%** | +28% |

**GPT-5.6 Sol → GPT-6 Sol** (토큰 단가 -50%)

| effort | 지수 | 작업당 비용 | 비용 변화 | 토큰 변화(역산) |
|---|---|---|---|---|
| low | 33 → 34 | $0.26 → $0.13 | -50% | 0% |
| medium | 39 → 40 | $0.50 → $0.25 | -50% | 0% |
| high | 42 → 43 | $0.81 → $0.37 | -54% | -9% |
| xhigh | 44 → 44 | $1.18 → $0.53 | -55% | -10% |
| max | 47 → 48 | $1.99 → $1.06 | -47% | +7% |

두 표를 보면 싸진 방식이 다르다.

Opus 5.5는 모든 effort에서 점수가 3에서 7점 올랐다. 비용 절감 폭은 effort에 따라 크게 다르다. medium에서 -39%이니 Anthropic의 "40%"는 AA 측정과도 맞는다. 하지만 xhigh에서는 -29%로 줄고, max에서는 오히려 2% 비싸다. max에서는 단가가 20% 내려간 만큼 토큰을 더 쓴다. Anthropic 마이그레이션 문서에도 "같은 effort 단계에서 Opus 5.5는 Opus 5보다 한 턴에 더 많이 생각하는 경향이 있고, 특히 xhigh와 max에서 그렇다"고 적혀 있다. **Opus 5에서 max를 쓰던 팀은 이번 가격 인하 효과를 받지 못한다.**

GPT-6 Sol은 반대다. 모든 effort에서 비용이 거의 정확히 절반이 됐고, 역산한 토큰 사용량은 -10%에서 +7% 사이다. 같은 일에 쓰는 토큰은 그대로이고 단가만 반으로 내려간 것이다. 점수는 0에서 1점 올랐다. 발표 당일 X에서 "더 싸졌지만 더 똑똑해지지는 않았다"는 반응이 나온 것도 이 숫자와 맞는다.

effort를 따로 지정하지 않는 코드라면 계산이 또 달라진다. Opus 5는 effort를 생략하면 high로, Opus 5.5는 medium으로 돈다. 모델명만 바꾸면 **Opus 5 high($3.61, 48점)에서 Opus 5.5 medium($1.34, 51점)으로** 옮겨 가서 작업당 비용이 63% 줄고 점수는 3점 오른다. 이 경우에는 발표 수치보다 더 절약된다.

---

## 목표 점수별로 가장 싼 설정

이번에는 모델을 따로 보지 않고 모든 설정을 한 목록에 올렸다. 목표 점수를 정하면 그 점수 이상을 내는 설정 중 가장 싼 것이 무엇인지 보는 방식이다.

| 목표 지수 | 가장 싼 설정 | 작업당 비용 |
|---|---|---|
| 37까지 | GPT-6 Luna (effort에 따라) | $0.0045 – $0.07 |
| 40 | GPT-6 Sol medium | $0.25 |
| 43 | GPT-6 Sol high | $0.37 |
| 44 | GPT-6 Sol xhigh | $0.53 |
| 48 | GPT-6 Sol max | $1.06 |
| 51 | Claude Opus 5.5 medium | $1.34 |
| 54 | Claude Opus 5.5 high | $1.82 |
| 56 | Claude Opus 5.5 xhigh | $3.46 |
| 58 | Claude Opus 5.5 max | $5.98 |

목록에서 몇 가지가 보인다.

- **48점까지는 OpenAI, 그 위는 Anthropic이 가장 싸다.** GPT-6 Sol은 max로 올려도 48점이 한계다. Opus 5.5는 가장 낮은 low도 42점에 $0.55여서, 43점을 $0.37에 내는 Sol high보다 비싸고 점수도 낮다.
- **Luna가 Sol low보다 낫다.** Luna max는 37점에 $0.07이고, Sol low는 34점에 $0.13이다. Sol을 low로 돌리는 작업이 있다면 Luna max로 바꿔 볼 만하다.
- **GPT-6 Astra는 목록에 없다.** Astra max는 53점에 $3.26인데, Opus 5.5 high가 54점을 $1.82에 낸다. 적어도 AA 지수 기준으로는 Astra를 고를 이유가 없다. 다만 OpenAI는 컴퓨터 사용 분야에서는 여전히 Astra가 최고라고 밝혔고, 이 지수에는 그 분야가 거의 반영되지 않는다.
- **Opus 5.5는 effort를 올릴수록 1점당 비용이 크게 늘어난다.** low에서 medium은 1점당 $0.09, medium에서 high는 $0.16이다. 그런데 high에서 xhigh는 $0.82, xhigh에서 max는 $1.26이다. 마지막 4점을 얻는 데 드는 돈($4.16)이 medium 작업 세 개를 돌리는 값보다 많다.

---

## 발표문에서 강조하지 않은 부분

OpenAI 발표문은 DeepSWE v1.1(실제 코드베이스에서 푸는 소프트웨어 엔지니어링 과제) 점수를 이렇게 소개한다. "GPT-6 Sol max는 68.8%로 Claude Fable 5의 최고점(69.9%)과 1.1%p 차이이고, 작업당 비용은 약 80% 낮다." 그런데 같은 차트에 있는 GPT-5.6 Sol 점수는 본문에서 언급하지 않는다. 그 점수는 72.7%다. **새 모델이 직전 모델보다 3.9%p 낮다.** 발표 당일 Hacker News와 X에서 가장 먼저 지적된 부분이 이것이다.

코딩 성능을 재는 다른 지표는 결과가 엇갈린다. AA의 Coding Agent Index에서 GPT-6 Sol max는 57점으로 5.6보다 2점 올랐다. 반면 Luna는 2점 떨어졌다. 같은 "코딩"이라도 평가마다 방향이 반대로 나오니, 어느 한 숫자로 결론을 내기는 어렵다. 코딩 에이전트에 GPT-5.6 Sol을 쓰고 있다면 옮기기 전에 직접 재야 한다.

OpenAI가 비교 대상으로 고른 모델도 봐야 한다. AutomationBench에서 "GPT-6 Sol xhigh가 Claude Opus 5 max를 비용 9%로 이긴다"고 했는데, 비교 대상이 같은 날 나온 Opus 5.5가 아니라 이전 모델인 Opus 5다. Anthropic 발표문에 실린 AutomationBench 점수는 Opus 5.5가 40.0%, GPT-6 Sol xhigh가 33.2%다(Sol 수치는 OpenAI 발표).

Anthropic 쪽은 앞에서 본 것처럼 "40%"가 medium 기준으로는 맞는다. 다만 발표문에는 max에서는 절감이 없다는 말이 없다. 이 사실은 AA 표를 직접 대조해야 보인다.

---

## 캐시를 쓰면 가격 차이가 줄어든다

위 계산은 AA의 과제 기준이다. 긴 대화 기록을 매 턴 다시 보내는 에이전트 작업이라면 캐시가 계산을 바꾼다. [#48에서 다뤘듯](/blog/48-cache-hit-rate/) 이런 작업에서는 청구서의 상당 부분이 캐시 읽기다.

이번에 눈여겨볼 점은 두 모델의 **캐시 읽기 단가가 $0.20으로 같다**는 것이다. 정가 입력은 Opus 5.5가 두 배지만 캐시로 읽는 부분은 가격이 같다. 프롬프트 10만 토큰, 출력 2천 토큰짜리 한 턴을 캐시 히트율별로 계산해 봤다(캐시 쓰기 비용은 제외).

| 캐시 히트율 | Opus 5.5 | GPT-6 Sol | 비율 |
|---|---|---|---|
| 0% | $0.440 | $0.220 | 2.0배 |
| 90% | $0.098 | $0.058 | 1.7배 |
| 95% | $0.079 | $0.049 | 1.6배 |

캐시 히트율이 높을수록 입력 쪽 가격 차이는 줄고 출력 쪽 두 배 차이만 남는다. 그래서 캐시를 잘 설계한 에이전트일수록 모델 간 가격 차이가 표의 단가 차이보다 작다.

반대 방향의 조건도 하나 있다. GPT-6 Sol은 **프롬프트가 27만 2천 토큰을 넘으면 그 요청 전체에 입력과 캐시 단가 두 배, 출력 단가 1.5배가 붙는다**(OpenAI 모델 문서). 컨텍스트 창은 105만 토큰이지만, 대화를 27만 토큰 넘게 쌓는 설계라면 위 비율은 Sol에게 불리하게 바뀐다. Anthropic 발표문에는 이런 할증 언급이 없다. Hacker News에는 "큰 코드베이스를 다룰 때는 캐시 읽기 비용 때문에 남는 게 없다"는 경험담도 올라왔다. 개인 경험이지만, 긴 컨텍스트 작업에서는 단가표보다 캐시 설계가 청구액을 좌우한다는 점과 맞는 이야기다.

---

## Opus 5에서 Opus 5.5로 옮길 때

Anthropic 마이그레이션 문서는 "기존 Opus 5 프롬프트는 그대로 잘 동작한다"고 하면서도 요청 형식에서 깨지는 변경을 네 가지 들었다. 모두 400 에러로 드러나니 배포 전 테스트에서 잡힌다.

**반드시 고쳐야 하는 것**

- **thinking을 끌 수 없다.** Opus 5에서는 high 이하에서 `thinking: {type: "disabled"}`가 허용됐지만, Opus 5.5에서는 어느 effort에서든 400이다. `budget_tokens`도 마찬가지다. `thinking` 필드를 지우고 `output_config.effort`로 조절한다. 응답 속도 때문에 thinking을 껐던 경로라면 `low`부터 시작한다.
- **도구 강제 호출(`tool_choice`의 `any`, `tool`)이 400이다.** `auto`로 바꾸고, 프롬프트에 사용할 도구를 적고, 도구 정의에 `strict: true`를 건다. `auto`는 호출을 보장하지 않으므로 호출이 있었는지 확인하고 없으면 재시도하는 코드가 필요하다. JSON만 받으려고 강제 호출을 쓰던 경우라면 structured outputs로 옮긴다.
- **컴퓨터 사용은 `computer_toolset_20260801`만 받는다.** 이전 `computer_20251124` 도구는 400이다. 액션 이름이 `input.action`이 아니라 블록의 `name`으로 오고, 한 턴에 여러 호출이 올 수 있어서 에이전트 루프도 고쳐야 한다.
- **thinking 블록이 모델과 대화에 묶인다.** Opus 5.5의 thinking 블록은 Claude API에서 Fable 5.1과 Mythos 5.1만 읽는다. 거절(refusal) 폴백이나 라우터가 Opus 5로 넘기면, 그 뒤 턴은 Opus 5.5가 한 추론 없이 진행된다. 요청은 성공하므로 에러로는 드러나지 않는다. 2026년 8월 31일 이후 만든 계정은 이전 대화 기록을 수정하면 400이 난다.

**설정에서 다시 볼 것**

- **effort를 명시한다.** 생략하면 medium으로 돈다. 비용은 줄지만 Opus 5 high에 맞춰 품질 기준을 잡아 둔 작업이라면 결과가 달라질 수 있다. Anthropic 테스트에서는 Opus 5.5 medium이 코딩과 지식 작업에서 Opus 5 high를 넘었다고 하지만, 내 작업에서도 그런지는 확인해야 한다.
- **xhigh나 max를 고정해 둔 경우 토큰이 늘어난다.** 앞의 표처럼 max에서는 비용이 오히려 오른다. 문서는 "생각을 줄이라"는 프롬프트를 넣기 전에 effort를 먼저 낮추라고 권한다.
- **`max_tokens`를 넉넉하게 잡는다.** thinking도 `max_tokens`에 포함된다. 긴 에이전트 코딩 턴에는 64K 정도가 권장값이다.
- **도구 호출 사이의 짧은 설명이 `thinking` 블록으로 온다.** 기본 설정에서는 내용이 비어 있어서, `text` 블록만 화면에 보여주는 UI는 긴 작업 동안 조용해진다. `thinking.display: "updates"`(베타)를 켜면 짧은 진행 요약을 받을 수 있다.

**그대로 둬도 되는 것:** 컨텍스트 1M, 최대 출력 128K, 토크나이저가 Opus 5와 같다. 토큰 수를 다시 셀 필요는 없다.

---

## GPT-5.6 Sol에서 GPT-6 Sol로 옮길 때

OpenAI 쪽은 요청 형식이 깨지는 변경이 발표되지 않았다. 확인할 것은 성능과 요금 조건이다.

- **코딩 작업은 직접 재고 나서 옮긴다.** DeepSWE에서 GPT-6 Sol은 GPT-5.6 Sol보다 낮다. 코딩 에이전트가 주 용도라면 5.6을 유지한 채 같은 과제로 비교하고, 품질이 유지될 때만 옮긴다. 비용이 절반이니 조금 떨어져도 옮길 만한지는 각 팀이 정할 문제다.
- **effort 단계는 `none`, `low`, `medium`, `high`, `xhigh`, `max` 여섯 개이고 기본값은 `medium`이다.** OpenAI 모델 문서에는 Chat Completions API에서 함수 호출이 `reasoning_effort: none`일 때만 지원되고, 추론과 함수 호출을 같이 쓰려면 Responses API를 쓰라고 적혀 있다. 도구를 쓰는 에이전트를 Chat Completions로 돌리고 있다면 이 조건을 먼저 확인한다.
- **27만 2천 토큰 할증을 설계에 넣는다.** 넘으면 요청 전체에 입력 두 배, 출력 1.5배 단가가 붙는다. 긴 대화는 그 전에 요약하거나 압축하는 구조가 필요하다.
- **effort를 바꿔도 캐시가 유지된다.** GPT-6부터 대화 중간에 reasoning effort나 사용 가능한 도구를 바꿔도 앞부분 캐시가 깨지지 않는다고 OpenAI가 밝혔다. 어려운 턴에서만 effort를 올리는 방식이 전보다 싸졌다.
- **대량 처리는 Luna부터 본다.** 요약, 추출, 분류처럼 목표가 분명한 작업은 앞의 표처럼 Luna가 Sol low보다 싸고 점수도 높다. 다만 AA 측정에서 Luna는 GDPval-AA(지식 작업) 점수가 약 75 Elo 떨어졌다. 문서 작성이나 발표 자료처럼 결과물 품질이 중요한 작업은 따로 확인해야 한다.

---

## 내 작업으로 확인하는 방법

이 글의 계산은 모두 AA 과제 기준이다. 실제 전환을 결정하려면 자기 작업으로 다시 재야 한다. 직접 돌려 보지는 않았으므로 아래는 제안하는 절차다.

1. **대표 과제 20에서 50개를 고른다.** 실제 운영 기록에서 뽑고, 과제마다 완료 기준(테스트 통과, 사람의 승인 등)을 미리 정한다.
2. **지금 설정을 기준선으로 잰다.** 모델, effort, 프롬프트를 그대로 두고 성공률, 작업당 비용, 소요 시간, 사람이 개입한 횟수를 기록한다.
3. **모델만 바꿔서 잰다.** effort 값을 명시적으로 같게 맞춘다. Opus 5.5는 생략하면 medium이 되므로 반드시 적어야 한다.
4. **effort를 바꿔 가며 잰다.** 한 단계 아래와 위를 같이 돌린다. 모델 교체 효과와 설정 변경 효과를 나눠서 봐야 어느 쪽 덕분에 좋아졌는지 알 수 있다.
5. **비용은 완료된 작업 기준으로 계산한다.** 요청 하나가 싸도 재시도가 늘면 싸지 않다. 실패한 시도의 비용까지 성공한 작업 수로 나눈다.
6. **되돌릴 조건을 미리 정한다.** 예를 들어 "성공률이 기준선보다 2%p 넘게 떨어지면 유지"처럼 정해 두면, 가격만 보고 옮겼다가 품질 문제를 늦게 발견하는 일을 줄일 수 있다.

예를 들어 Opus 5를 effort 생략(high)으로 돌리는 코딩 에이전트 팀이라면 3단계에서 Opus 5.5 high와 medium을 둘 다 잰다. medium에서 품질이 유지되면 AA 기준으로 비용은 약 60% 줄어든다. 품질이 떨어지면 high로 두어도 약 50% 줄어든다. 어느 쪽이든 max를 쓰던 경로가 있다면 그 경로부터 따로 재야 한다. 그 경로는 가격 인하 효과가 없다.

---

## 정리

두 발표 모두 "싸졌다"고 했지만 AA 수치로 계산해 보면 싸진 방식이 다르다. GPT-6 Sol은 쓰는 토큰은 그대로이고 단가만 절반이 됐다. 점수는 거의 그대로이고 DeepSWE에서는 떨어졌다. Opus 5.5는 모든 effort에서 점수가 올랐고, low부터 high까지는 비용이 크게 줄었다. 하지만 effort를 올릴수록 절감 폭이 줄다가 max에서는 없어진다.

그래서 어느 모델이 더 싼지는 목표 품질에 따라 답이 갈린다. AA 지수로 48점 이하를 원하면 GPT-6 Sol과 Luna가 싸고, 그 위라면 Opus 5.5 medium이나 high가 싸다. 캐시를 많이 쓰는 에이전트라면 두 모델의 가격 차이는 단가표보다 작다.

실무에서 가장 먼저 할 일은 코드에 effort를 명시하는 것이다. Opus 5.5는 기본값이 medium으로 내려갔고, 같은 effort 이름이어도 모델마다 생각하는 양이 다르다. [#40](/blog/40-claude-opus-5/)에서는 프롬프트에서 무엇을 지울지를, [#57](/blog/57-gemini-grok-migration/)에서는 요금표에서 무엇이 바뀌었는지를 봤다. 이번에 추가할 확인 항목은 **effort별 작업당 비용**이다.

---

*참고: [Introducing Claude Opus 5.5 (Anthropic, 2026-09-22)](https://www.anthropic.com/claude-opus-5-5), [Introducing GPT-6 Sol and Luna (OpenAI, 2026-09-22)](https://openai.com/index/introducing-gpt-6-sol-and-luna/), [GPT-6 Sol 모델 문서 (OpenAI)](https://developers.openai.com/api/docs/models/gpt-6-sol), [Artificial Analysis — Claude Opus 5.5](https://artificialanalysis.ai/models/releases/claude-opus-5-5), [Claude Opus 5](https://artificialanalysis.ai/models/releases/claude-opus-5), [GPT-6 Sol](https://artificialanalysis.ai/models/releases/gpt-6-sol), [GPT-5.6 Sol](https://artificialanalysis.ai/models/releases/gpt-5-6-sol), [GPT-6 Luna](https://artificialanalysis.ai/models/releases/gpt-6-luna), [GPT-6 Astra](https://artificialanalysis.ai/models/gpt-6-astra), [GPT-6 Sol and Luna push the cost efficiency frontier](https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier), [AA 지수 산정 방법](https://artificialanalysis.ai/methodology/intelligence-benchmarking), [The Decoder](https://the-decoder.com/openais-gpt-6-sol-and-luna-cut-prices-in-half-but-barely-move-the-needle-on-performance/), [SiliconANGLE](https://siliconangle.com/2026/09/22/anthropic-releases-claude-opus-5-5-and-openai-counters-with-two-cheaper-gpt-6-models/), [Hacker News 토론](https://news.ycombinator.com/item?id=49805509). AA 수치는 2026-09-24 기준(지수 v4.3.2)이다. 작업당 비용의 캐시 적용 방식은 AA가 세부를 공개하지 않았다. 토큰 변화는 비용 변화와 단가 변화로 역산한 추정치다. GPT-5.6 Sol의 DeepSWE 점수(72.7%)는 OpenAI 발표 차트를 인용한 The Decoder 보도 기준이다. Opus 5.5의 마이그레이션 항목은 Anthropic 공식 마이그레이션 문서를 따랐다. 이 글의 비교는 공개 자료로 계산한 것이며 직접 API를 호출해 측정하지 않았다.*
