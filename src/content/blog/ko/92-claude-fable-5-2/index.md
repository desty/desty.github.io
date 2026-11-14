---
title: "Claude Fable 5.2에는 어떤 일부터 맡길까: Anthropic은 Opus 5.5를 기본으로 두라고 했다"
summary: "11월 9일 Anthropic이 Claude Fable 5.2를 내면서 앞세운 건 가격보다 길고 어려운 작업이었다. 서브에이전트 1,000개 이상으로 8일 만에 만든 OS 프로토타입, 에이전트 1,000개가 30시간 만에 끝낸 페르마 정리 형식화 같은 사례다. 그러면서도 대부분의 코딩과 지식 작업은 Opus 5.5로 시작하라고 권했다. 이 글은 그 기준이 어디인지 따져 본다. Anthropic 비용 문서의 자체 측정에서 Fable 5.2가 값을 한 곳은 컨텍스트 하나를 넘는 결함 탐색 같은 일이었고, SWE-bench Pro와 리서치 과제에서는 Opus 5.5가 같거나 나은 점수를 더 싸게 냈다. 짧은 표준 과제로 잰 Artificial Analysis 수치로 계산하면 결과가 다르다. Fable 5.2 low가 Opus 5.5 high보다 싸고 점수도 높다. 두 선이 어긋나는 곳, 비싼 모델을 지휘에만 쓰는 advisor·orchestrator 구성의 비용, 5.1과 Opus 5.5에서 옮길 때 고칠 것, 어떤 신호가 보일 때 Fable로 올리고 effort를 어디서 시작할지 정리했다."
date: "2026-11-14T12:00:00+09:00"
tags:
  - claude-fable-5-2
  - claude-opus-5-5
  - model-release
  - multi-agent
  - agent-engineering
draft: false
---

11월 9일 Anthropic이 **Claude Fable 5.2**와 **Claude Mythos 5.2**를 냈다. 발표문이 앞세운 건 길고 어려운 기술 작업이다. 엔지니어 한 명이 Fable 5.2에게 서브에이전트 1,000개 이상을 8일 동안 지휘하게 해서 노트북에서 부팅되는 OS 프로토타입을 만들었다. Fable 5.2 에이전트 1,000개가 30시간 만에 페르마의 마지막 정리를 Lean으로 형식화했고, 같은 구성의 Opus 5.5는 18시간 동안 26%까지만 진행했다. 사내 운영 서비스를 Python에서 Rust로 옮겨 시작 속도를 약 26배 높였다는 사례도 있다. 벤치마크도 같은 방향이다. 에이전트 코딩 평가 FrontierSWE v2에서 69.9%(Opus 5.5 62.3%), 원격 업무 대행을 재는 Remote Labor Index에서 41.3%(Opus 5.5 21.3%)를 냈다. 토큰 단가 20% 인하($8/$40), 최대 30% 빨라진 출력, 안전장치 차단 55% 감소는 그 뒤에 나온다.

이 사례들은 모두 Anthropic의 자체 보고다. 외부에서 같은 조건으로 다시 돌려 볼 수 없다. 페르마 정리의 경우 9월에 공개한 첫 형식화(Fable 5.1급 내부 모델, 에이전트 수십 개, 11일)는 [Lean 코드가 공개](https://github.com/anthropics/fermats-last-theorem)됐고 Kevin Buzzard가 검토했다. 반면 Fable 5.2로 30시간 만에 끝냈다는 두 번째 실행은 발표문의 설명과 그래프가 전부다. OS 프로토타입도 영상만 있고 코드는 없다.

그리고 같은 발표문은 이렇게 권한다. "대부분의 코딩과 지식 작업은 우리의 가장 강력한 일상용 모델인 Claude Opus 5.5로 시작하라." Fable은 Opus 5.5를 높은 effort로 돌려도 부족할 때 올려 쓰는 등급이라는 뜻이다. 그렇다면 실무에서 궁금한 건 하나다. 어떤 일부터 Fable 5.2로 올려야 하나?

이 글은 그 기준을 두 가지 자료로 따져 본다. 하나는 Anthropic이 비용 최적화 문서에 공개한 자체 측정이고, 다른 하나는 Artificial Analysis(이하 AA)가 짧은 표준 과제로 잰 effort별 작업당 비용이다. 직접 API를 호출해 측정하지는 않았다. AA 수치를 내려받아 계산한 스크립트는 [`experiments/fable-5-2`](https://github.com/desty/desty.github.io/tree/main/experiments/fable-5-2)에 두었다.

<!-- 필자 확인: 이 모델을 실제로 써 본 경험(Claude Code에서 medium 기본값 체감 등)이 있으면 도입 둘째 문단에 한두 문장 넣기 -->

---

## Anthropic의 자체 측정이 보여 주는 기준

Anthropic은 플랫폼 문서의 [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence) 페이지에 모델별 작업당 비용을 측정해 올려 두었다. Fable 5.2가 들어간 결과를 모았다. 모두 Anthropic 내부 측정이고, 일부는 한 번만 돌린 결과다.

| 과제 | Fable 5.2 | 비교 대상 | 읽는 법 |
|---|---|---|---|
| SWE-bench Pro 부분집합(463문제) | low 94.6%, 해결당 $0.39 / high 96.3%, $1.39 | Opus 5.5 high 95.5%, $0.30 / xhigh 96.5%, $0.75 | 같은 점수대에서 Opus가 싸다 |
| 내부 에이전트 코딩(370과제) | low 88.9%, 시도당 $1.05 / high 93.5%, $5.39 | Opus 5.5 medium 86.6%, $0.84 | Fable low가 2.3%p 높고 25% 비싸다 |
| DeepResearch Bench II | high 57.7%, $4.82 | Opus 5.5 기본값보다 1.9점 낮고 비용은 2.9배 | 리서치에서는 Opus가 낫다 |
| 내부 결함 탐색(컨텍스트 하나를 넘는 작업) | low F1 0.866, $357 / high 0.909, $563 | Opus 5.5 high보다 1.6\~5.9점 높고 비용 1.5\~2.4배 | Fable이 점수를 더 낸다 |

문서의 결론은 분명하다. SWE-bench Pro는 Opus 5.5와 Fable 5.1이 모두 거의 다 푸는 과제라 비싼 모델이 더 얻을 게 적다. 리서치 과제에서는 Fable 5.2가 오히려 Opus 5.5보다 낮았고, Fable 5.1보다도 4.7\~7.0점 낮았다. Fable 5.2가 점수를 더 낸 건 결함 탐색처럼 작업 전체가 컨텍스트 하나에 들어가지 않는 경우였다. 문서는 그래서 "Claude Fable 5.2는 까다로운 추론과 장시간 에이전트 작업에, 또는 Opus 5.5를 높은 effort로 돌려도 평가 기준을 못 넘을 때 쓰라"고 정리한다.

같은 문서에는 Fable 5.1과의 비교도 있다. 결함 탐색에서 Fable 5.2는 effort마다 5.1보다 3.6\~6.1점 높으면서 비용은 21\~37% 낮았다. 반대로 SWE-bench Pro에서 high끼리 비교하면 해결당 비용이 $1.17에서 $1.39로 19% 올랐다. 같은 모델 교체라도 과제에 따라 비용 방향이 다르다.

---

## 짧은 과제로 잰 AA 수치로 계산하면

AA 지수는 지식 노동, 코딩, 과학, 일반 지식 네 분야를 25%씩 섞은 짧은 표준 과제 묶음이다. 에이전트 과제도 있지만 한 과제가 길어도 한두 시간이고, 서브에이전트 수백 개를 며칠씩 돌리는 작업은 재지 않는다. 그러니 아래 숫자는 Fable 5.2가 내세운 영역 바깥에서 잰 값이다. 그래도 많은 팀의 실제 트래픽은 이런 짧은 과제에 가깝기 때문에 따로 볼 가치가 있다. 수치는 2026-11-14 기준 AA 지수 v5.0.1이다. 작업당 비용은 실제로 쓴 토큰에 공개 단가를 곱하고 AA가 측정한 캐시 적중률을 반영한 값이다.

### 같은 effort에서 Fable 5.1과 비교

마지막 열은 비용 변화를 단가 변화(0.8배)로 나눠 역산한 토큰 사용량 변화다. 입력, 캐시, 출력 단가가 모두 20%씩 내렸기 때문에 이렇게 계산할 수 있다.

| effort | 지수 | 작업당 비용 | 비용 변화 | 출력 토큰 | 입력 토큰 | 토큰 사용량(역산) |
|---|---|---|---|---|---|---|
| low | 39 → 54 | $4.47 → $3.10 | -31% | -4% | -33% | -13% |
| medium | 43 → 56 | $5.56 → $3.80 | -32% | -17% | -29% | -15% |
| high | 47 → 62 | $7.54 → $9.08 | +20% | +22% | +54% | +51% |
| xhigh | 50 → 62 | $10.85 → $14.83 | +37% | +25% | +82% | +71% |
| max | 49 → 65 | $12.99 → $26.54 | +104% | +68% | +199% | +155% |

점수는 모든 effort에서 12\~16점 올랐다. 비용은 low와 medium에서 3분의 1 가까이 줄고, high부터는 오히려 늘었다. 늘어난 토큰은 주로 입력 쪽이다. AA의 에이전트 평가는 매 턴 지금까지의 대화를 다시 보내므로, 입력이 출력보다 빨리 늘었다는 건 같은 과제를 더 많은 턴에 걸쳐 풀었다는 뜻으로 읽힌다. high의 작업당 비용 $9.08 중 출력은 43%이고 나머지는 캐시 읽기와 쓰기다. [#90](/blog/90-token-saving-tools/)에서 내 Claude Code 로그로 본 구조와 같다. high에서 5.1보다 비싸졌다는 결과는 앞의 SWE-bench Pro 측정(+19%)과 방향이 같다.

### 모델 이름만 바꾸면

effort를 코드에 적지 않으면 기본값끼리 비교하게 된다. API 기본값은 Fable 5.1과 5.2가 high, Opus 5.5가 medium이다. Claude Code 기본값은 Fable 5.1이 high, Fable 5.2와 Opus 5.5가 medium이다.

| 바꾸는 방식 | 지수 | 작업당 비용 | 비용 변화 |
|---|---|---|---|
| API: Fable 5.1 (high) → Fable 5.2 (high) | 47 → 62 | $7.54 → $9.08 | +20% |
| API: Opus 5.5 (medium) → Fable 5.2 (high) | 48 → 62 | $2.45 → $9.08 | +270% |
| Claude Code: Fable 5.1 (high) → Fable 5.2 (medium) | 47 → 56 | $7.54 → $3.80 | -50% |
| Claude Code: Opus 5.5 (medium) → Fable 5.2 (medium) | 48 → 56 | $2.45 → $3.80 | +55% |

Opus 5.5에서 API로 올라오면서 effort를 적지 않은 코드는 모델과 effort가 동시에 한 단계씩 올라가 작업당 비용이 3.7배가 된다.

### 목표 점수별로 가장 싼 설정

Fable 5.2, Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5의 다섯 단계 effort, 모두 25개 설정을 한 목록에 올리고 목표 점수마다 가장 싼 설정을 골랐다.

| 목표 지수 | 가장 싼 설정 | 작업당 비용 |
|---|---|---|
| 36까지 | Haiku 5.5 (effort에 따라) | $0.04 – $0.41 |
| 42 | Sonnet 5.5 high | $1.64 |
| 48 | Opus 5.5 medium | $2.45 |
| 54 | Fable 5.2 low | $3.10 |
| 56 | Fable 5.2 medium | $3.80 |
| 57 | Opus 5.5 xhigh | $6.05 |
| 62 | Fable 5.2 high | $9.08 |
| 65 | Fable 5.2 max | $26.54 |

Fable 5.1은 다섯 설정 모두 목록에서 빠졌다. Opus 5.5 high(52점, $3.46)도 Fable 5.2 low(54점, $3.10)에 밀려 빠졌다. Fable 5.2의 high와 xhigh는 61.8점과 62.2점으로 거의 같은데 xhigh가 작업당 $5.75(63%) 더 든다.

### Opus 5.5와 분야별 비교

AA가 공개한 평가별 점수와 비용으로 같은 점수대의 설정을 짝지었다.

| 평가 (분야) | Fable 5.2 | Opus 5.5 | 읽는 법 |
|---|---|---|---|
| FrontierCode-AA 2.0 (코딩) | medium 41.3%, $2.69 | high 35.9%, $2.49 | 비슷한 비용에 Fable이 5.4%p 높다 |
| | high 49.1%, $9.64 | max 46.4%, $13.46 | Fable이 높고 28% 싸다 |
| Terminal-Bench 4.0 (터미널 작업) | high 59.6%, $13.47 | xhigh 59.6%, $8.78 | 같은 점수에 Opus가 35% 싸다 |
| AA-Briefcase (장시간 지식 노동, Elo) | high 1677, $15.49 | high 1682, $6.27 | 같은 점수에 Opus가 60% 싸다 |
| GDP.pdf (문서 산출물) | low 26.8%, $1.53 | high 28.8%, $0.83 | Opus가 높고 싸다 |
| Terminal-Bench-Science (과학 작업) | high 70.0%, $24.28 | xhigh 61.9%, $14.12 | Fable이 8%p 높다 |
| HLE-Diamond (어려운 추론 문제) | medium 66.3%, $0.18 | max 67.9%, $1.20 | 비슷한 점수에 Fable이 85% 싸다 |
| AA-Omniscience (지식·환각) | low 63 | max 48 | Fable이 모든 effort에서 15점 이상 높다 |

Fable 5.2가 앞서는 건 과학 추론, 어려운 문제 풀이, 사실 지식, FrontierCode 같은 코딩이다. 터미널 작업과 문서를 만드는 지식 노동에서는 Opus 5.5가 같은 점수를 35\~60% 싸게 낸다. 과학과 일반 지식이 지수의 절반을 차지하기 때문에 지수 하나로 보면 Fable의 우위가 실제보다 넓어 보인다.

### 발표문 수치와 AA 측정의 차이

발표문은 FrontierCode 2.0에서 Fable 5.2 high가 45.3%로 Opus 5.5의 최고점(45.5%)과 비슷한데 작업당 비용은 "대략 절반"이라고 했다. xhigh에서는 49.1%였다. AA가 자체 하네스로 돌린 FrontierCode-AA 2.0(실제 오픈소스 저장소 132개 과제, 메인테이너가 머지할 수준인지로 채점)에서는 Fable 5.2 high가 49.1%에 $9.64, Opus 5.5 max가 46.4%에 $13.46으로, 비용 차이가 절반보다 작은 28%였다. 그리고 xhigh(47.6%)가 high(49.1%)보다 낮았다. 하네스가 달라서 어느 쪽이 맞다고 할 수는 없다. Anthropic 문서도 xhigh는 "이득을 측정해 확인한" 작업에만 쓰라고 한다.

---

## 두 기준이 어긋나는 곳

두 자료를 겹쳐 보면 Anthropic의 기준과 AA 계산이 같은 결론을 내는 곳과 다른 결론을 내는 곳이 나뉜다.

**같은 결론을 내는 곳.** 문서를 만들거나 리서치하는 지식 작업, 터미널 중심의 에이전트 작업은 Opus 5.5에 두는 게 맞다. Anthropic 측정에서는 DeepResearch Bench II에서 Fable 5.2가 더 낮았고, AA에서는 AA-Briefcase, GDP.pdf, Terminal-Bench 4.0에서 Opus 5.5가 같은 점수를 더 싸게 냈다. 반대로 작업이 컨텍스트 하나를 넘고 오래 걸리는 경우, 그리고 과학·수학 추론처럼 모델의 기본 능력 차이가 큰 경우는 둘 다 Fable 쪽이다.

**다른 결론을 내는 곳은 코딩이다.** AA의 FrontierCode-AA에서는 Fable 5.2 low(38.4%, $2.12)가 Opus 5.5 high(35.9%, $2.49)보다 점수가 높고 싸다. AA 지수 전체로도 Fable 5.2 low가 Opus 5.5 high보다 싸다. 그런데 Anthropic의 SWE-bench Pro 측정에서는 Fable 5.2 low(94.6%, 해결당 $0.39)가 Opus 5.5 high(95.5%, $0.30)보다 점수가 낮고 비싸다. 내부 에이전트 코딩에서도 Fable 5.2 low는 Opus 5.5 medium보다 2.3%p 높은 대신 25% 비쌌다.

차이는 과제의 성격에서 나오는 것으로 보인다. SWE-bench Pro는 두 모델이 모두 95% 안팎을 푸는 과제라서 더 똑똑한 모델이 올릴 점수가 거의 남아 있지 않다. FrontierCode-AA는 최고 점수가 50%에 못 미치는 어려운 과제다. 코딩 중에서도 Opus 5.5가 이미 거의 다 푸는 종류의 일이라면 Fable로 올려도 비용만 늘고, Opus 5.5도 절반 넘게 실패하는 어려운 일이라면 Fable low가 더 싸게 더 많이 푼다. 이 해석은 두 자료를 겹쳐 본 내 추론이고, 같은 과제에서 검증한 결과는 아니다.

---

## 비싼 모델은 지휘만 맡기는 구성

발표문은 Fable 5.2를 혼자 쓰는 방식 말고 두 가지 구성을 함께 소개한다. 작은 모델이 일을 하다가 Fable에게 조언을 구하는 **advisor**와, Fable이 일을 나눠 작은 모델에게 맡기는 **orchestrator**다. 둘 다 비싼 모델의 토큰을 판단에만 쓰자는 생각인데, 비용 구조가 다르다.

### Advisor: 작은 모델이 막힐 때만 묻는다

[advisor 도구](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)(베타)는 이렇게 동작한다.

- 요청의 `model`(실행 모델)이 일을 진행하다가 `advisor` 도구를 호출한다. 언제 부를지는 실행 모델이 정한다.
- 서버가 advisor 모델로 별도 추론을 돌린다. advisor는 시스템 프롬프트, 도구 정의, 지금까지의 대화와 도구 결과를 **전부** 입력으로 받는다. 도구는 쓰지 않고 조언만 돌려준다.
- advisor 토큰은 advisor 모델 단가로 따로 과금되고, 응답의 `usage.iterations`에 `advisor_message`로 기록된다.
- 조언은 보통 텍스트 400\~700토큰, thinking 포함 1,400\~1,800토큰이다. Fable 5.2가 advisor면 조언은 암호화되어 와서 클라이언트에서 읽을 수 없다.
- Fable 5.2는 Opus 5.5, Sonnet 5.5, Haiku 5.5의 advisor가 될 수 있다. 반대로 Fable 5.2가 실행 모델일 때는 advisor로 Fable 5.2나 Mythos 5.2만 받는다.

비용의 대부분은 조언 출력이 아니라 대화 기록을 읽는 데서 나온다. 공개 단가로 대략 계산해 봤다. 조언 출력을 1,600토큰으로 두고, advisor 호출 시점의 대화 기록이 3만, 6만, 9만 토큰이라고 가정한 예시다.

| advisor | advisor 쪽 캐시 | 호출당 비용 | 3회 합계 |
|---|---|---|---|
| Fable 5.2 | 끔 | $0.30 / $0.54 / $0.78 | $1.63 |
| Fable 5.2 | 켬(5분) | $0.36 / $0.37 / $0.38 | $1.11 |
| Opus 5.5 | 끔 | $0.15 / $0.27 / $0.39 | $0.82 |
| Opus 5.5 | 켬(5분) | $0.18 / $0.19 / $0.19 | $0.56 |

조언 출력 자체는 호출당 $0.064다. 나머지는 대화 기록을 읽거나 캐시에 쓰는 값이다. 문서도 advisor 쪽 캐시는 대화당 호출이 세 번 정도 될 때 본전이라고 적었다. 그러니 advisor 비용은 실행 모델이 몇 번 묻느냐와 대화가 얼마나 길어졌느냐에 따라 정해진다.

Anthropic의 측정 결과는 조심스럽다. Opus 5.5 high에 Fable 5.1 advisor를 붙인 내부 코딩 평가에서 점수는 1.7점 올랐지만(측정 오차 수준) 비용은 2.1배가 됐고, 문서는 이것이 "Opus 5.5의 effort를 올린 것과 비슷한 효과"라고 평가했다. 실행 모델이 거의 묻지 않은 Chartography에서는 오히려 7점 떨어졌다. advisor는 실행 모델이 부를 때만 도움이 되고, 부르지 않아도 도구 정의 약 1,000토큰이 매 요청에 붙는다.

### Orchestrator: Fable이 나눠 주고 작은 모델이 실행한다

orchestrator 구성은 [Managed Agents의 multiagent 기능](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)으로 만든다. 지휘 에이전트와 그가 부를 수 있는 서브에이전트를 정의하고, 각각 다른 모델을 지정한다. 발표문의 고객 사례도 이런 형태다. Uber는 Fable 5.2로 검토 에이전트 약 170개를 띄워 10\~12시간 동안 보안 감사를 돌렸다고 한다.

Anthropic의 결함 탐색 측정이 이 구성의 비용을 잘 보여 준다.

| 구성 | F1 | 실행당 비용 |
|---|---|---|
| Fable 5.2 혼자, high | 0.909 | $563 |
| Fable 5.2 혼자, low | 0.866 | $357 |
| Fable 5.2 지휘 + Sonnet 5.5 서브에이전트 | 0.833 | $165 |
| Opus 5.5 지휘 + Sonnet 5.5 서브에이전트 | Fable 지휘와 비슷 | Fable 지휘가 이보다 19% 더 듦 |
| Fable 5.2 지휘 + Haiku 5.5 서브에이전트 | 0.716 | $85 |

Sonnet 서브에이전트를 붙이면 Fable 혼자 low보다 비용이 54% 줄고 점수는 3.2점 떨어졌다. 지휘 모델을 Fable 5.2에서 Opus 5.5로 바꿔도 점수는 거의 같았다. 이 과제에서는 지휘를 Fable에게 맡겨서 얻는 게 없었다는 뜻이다. 문서는 orchestrator가 앞선 경우를 두 가지로만 정리한다. 쉬운 일인데 일부 과제가 비용을 많이 잡아먹는 경우와, 작업 전체가 컨텍스트 하나보다 큰 경우다. 일이 하나의 연결된 흐름이면, 이전 모델들로 잰 모든 경우에서 지휘 모델 혼자 effort를 낮춰 돌리는 쪽이 나았다.

정리하면 두 구성 모두 "Fable을 혼자, effort를 낮춰 돌린 경우"를 먼저 이겨야 쓸 이유가 생긴다. Anthropic 문서의 첫 권고도 같다. 두 번째 모델을 붙이기 전에 지금 모델의 effort부터 조정하고, 차이가 남으면 더 강한 모델을 낮은 effort로 먼저 재 보라는 것이다.

---

## Fable과 Mythos: 같은 모델, 다른 안전장치

Fable 5.2와 Mythos 5.2는 같은 모델이다. Fable은 사이버 보안과 생물학 분야의 안전장치를 더 강하게 걸어 모든 사용자에게 열었고, Mythos는 Cyber Verification Program이나 Life Sciences Verification Program을 통과한 기관에만 준다. 가격과 사양은 같다. Fable 5.2에서 차단된 요청은 Opus 4.8(사이버)이나 Opus 5(생물학)가 대신 답하고, 차단 자체는 5.1보다 약 55% 줄었다. 보안 연구나 생명과학 업무가 Fable에서 자주 막힌다면 모델을 바꾸기보다 검증 프로그램을 신청하는 게 정해진 경로다. Mythos 5.2는 CVE 재발견 평가에서 Opus 5.5보다 취약점을 10.2% 더 찾았다고 발표됐다.

---

## 옮길 때 고칠 것

### Fable 5.1에서

모델 문서는 5.1에서 5.2로의 이동을 "대부분 모델 ID 교체"라고 하면서 코드를 깨뜨릴 수 있는 변경 네 가지를 든다.

- **이전 턴을 수정하면 모든 계정에서 400이 난다.** 5.2의 thinking 블록은 그 앞의 `system`, `tools`, 대화 기록에 묶인다. 5.1은 2026년 8월 31일 이후 만든 계정에만 이 검사를 적용했는데 5.2는 계정 나이와 상관없이 적용한다. Claude Code, claude.ai, Managed Agents, Agent SDK가 대화를 관리하면 영향이 없다. 직접 `messages`를 만드는 하네스라면 `system`과 `tools`를 세션 동안 고정하고, 대화는 뒤에 붙이기만 하고, 응답은 받은 그대로 돌려보낸다. `prefix_mismatch_behavior: "drop_block"`은 고치는 동안 쓰는 임시방편이고, 버려진 추론을 다시 하느라 출력 토큰이 는다.
- **이전 모델은 5.2의 thinking 블록을 읽지 못한다.** Fable 5.1과 Opus 5.5도 마찬가지다. 라우터가 대화를 다른 모델로 넘기면 그 뒤 턴은 5.2의 추론 없이 진행된다. 오류는 나지 않고 넘어간 첫 턴의 비용과 지연만 는다.
- **컴퓨터 사용은 `computer_toolset_20260801`만 받는다.** 이전 `computer_20251124`는 Amazon Bedrock을 빼고 400이다.
- **advisor는 Fable 5.2나 Mythos 5.2여야 한다.** 도구 정의를 바꾸는 일이므로 새 대화에서 바꾼다.

프롬프트 쪽에서는 지울 것이 먼저다. [#40](/blog/40-claude-opus-5/)의 Opus 5 때와 비슷하다.

- "생각하지 말고 바로 답하라"는 줄은 5.2가 medium 이상에서 따르지 않는다. 지우고 effort를 내린다.
- 모델에게 보여주는 토큰 예산 문구를 빼고 시험한다. high와 xhigh 코딩 과제에서 큰 예산 문구를 지웠더니 같은 성능에 비용이 줄었다.
- 위임을 권하는 문구를 다시 읽는다. 위임을 권하는 하네스에서는 5.2가 서브에이전트를 쉽게 띄우고, xhigh 이상에서는 자기 작업 검토에도 썼다.
- 메모리와 노트에 쌓인 "절대 재시도하지 마라" 같은 규칙은 5.2가 그대로 따른다. 이유가 사라진 규칙은 지우고, 금지 규칙에는 예외를 적는다.

상황을 보고 더할 것도 있다. low와 medium에서 할 일을 남기고 턴을 끝내면 문서의 "끝까지 하라" 문구를 넣는다(남은 일이 있는 채 끝난 세션이 절반으로 줄고 출력 토큰은 약 30% 늘었다). 구조 개선까지 맡기려면 코드 소유권 문장을 넣는다(중복 코드를 합치는 비율이 10% 미만에서 약 75%로 올랐고 출력 토큰은 70\~80% 늘었다). `text` 블록만 보여 주는 클라이언트라면 `thinking.display: "updates"`(베타)를 켜야 긴 작업 중에도 진행 상황이 보인다.

### Opus 5.5에서

- **effort를 명시한다.** API 기본값이 medium에서 high로 한 단계 올라간다.
- **ZDR 조직은 바로 쓸 수 없다.** Fable 5.2는 30일 데이터 보관이 필요하다.
- **CMEK 조직은 structured outputs를 못 쓴다.** `strict: true`와 `output_config.format`을 빼고 코드에서 검증한다.
- **Opus로 되돌아가는 라우팅을 점검한다.** Fable 5.2는 Opus 5.5의 thinking 블록을 읽지만 반대는 안 된다. 어려운 턴만 Fable로 올렸다가 Opus로 내리는 라우팅은 내려간 턴에서 앞선 추론을 잃고, 캐시도 모델별로 따로 쌓인다.
- **rate limit을 확인한다.** Fable 5.2는 별도 한도를 쓴다.
- **캐시 읽기 단가는 $0.20으로 같다.** 입력·출력·캐시 쓰기만 두 배다.

---

## 무엇을 Opus 5.5에 두고 언제 Fable 5.2로 올릴까

두 자료와 문서 권고를 합친 판단 기준이다. 출발점으로만 쓰고, 마지막 절의 절차로 내 작업에서 확인한다.

**Opus 5.5에 둘 일**

- 일상적인 코딩, 특히 테스트로 확인할 수 있고 Opus 5.5가 이미 90% 넘게 해내는 종류의 일. SWE-bench Pro에서 Opus 5.5 high는 Fable 5.2 high보다 0.8%p 낮을 뿐인데 해결당 비용은 4분의 1 아래였다.
- 리서치, 보고서와 문서 작성, 터미널 중심의 운영 작업. 어느 자료에서도 Fable이 비용만큼 낫지 않았다.
- 서브에이전트를 거느리는 지휘 역할. 결함 탐색에서 지휘를 Fable로 바꿔도 점수는 같고 비용은 19% 늘었다.
- 대량 처리는 한 단계 더 내려 Haiku 5.5나 Sonnet 5.5로 보낸다. AA 기준으로 지수 36까지는 Haiku가 가장 싸다.

**Fable 5.2로 올릴 신호**

- Opus 5.5를 xhigh로 돌려도 같은 과제에서 계속 실패한다. AA 지수 기준으로 Opus 5.5 xhigh(57점, $6.05)와 비교하면 Fable 5.2 medium(56점, $3.80)은 37% 싸고, high(62점, $9.08)는 5점 높다.
- 작업이 컨텍스트 하나에 들어가지 않거나 몇 시간 이상 이어진다. Anthropic 측정에서 Fable이 점수를 더 낸 곳이 여기다.
- 과학·수학 추론이나 사실 정확도가 결과를 좌우한다. AA의 HLE, CritPt, Omniscience에서 차이가 컸다.
- Fable 5.1을 쓰고 있다. 5.2는 같은 effort에서 점수가 높고, low·medium에서는 비용도 낮다.

**올릴 때 effort는 어디서 시작할까**

- Opus 5.5에서 올라온 일이라면 **low부터** 잰다. AA 지수와 Anthropic의 결함 탐색 측정에서 Fable 5.2 low는 Opus 5.5 high보다 점수가 높았다. 다만 SWE-bench Pro에서는 0.9%p 낮았다. low에서 할 일을 남기고 끝나는 턴이 늘면 "끝까지 하라" 문구를 넣거나 medium으로 올린다.
- Fable 5.1에서 옮기는 일이라면 쓰던 effort보다 **한두 단계 낮게** 시작한다. AA 기준으로 5.1 xhigh(50점, $10.85)를 5.2 low(54점, $3.10)가 넘는다.
- high는 저 두 단계에서 부족할 때만 쓴다. API 기본값이 high이므로 effort를 코드에 적지 않으면 자동으로 여기서 시작한다는 점을 기억한다.
- xhigh는 내 과제에서 high보다 낫다는 걸 확인한 뒤에만. AA 코딩 평가에서는 high보다 낮았다.

---

## 내 작업으로 확인하는 방법

직접 돌려 보지 않았으므로 아래는 제안하는 절차다.

1. **대표 과제 20\~50개를 고르고 완료 기준을 정한다.** 운영 기록에서 뽑고, Opus 5.5가 쉽게 푸는 과제와 자주 실패하는 과제를 나눠 표시한다. 두 자료의 결론이 갈리는 곳이 이 사이다.
2. **지금 설정을 기준선으로 잰다.** 성공률, 완료된 작업당 비용, 소요 시간, 사람이 끼어든 횟수를 기록하고, 비용은 `usage`의 캐시 읽기·쓰기·출력을 나눠 적는다.
3. **prefix 검사부터 통과시킨다.** 직접 `messages`를 만드는 하네스라면 이전 턴을 수정하는 곳부터 고친다. 그대로 재면 `drop_block`으로 버려진 추론 때문에 비용이 부풀려진다.
4. **Fable 5.2를 혼자, low와 medium으로 잰다.** 실패하던 과제 묶음에서 얼마나 더 푸는지, 쉬운 과제 묶음에서 비용이 얼마나 느는지를 따로 본다.
5. **advisor나 orchestrator는 4단계 결과를 이길 때만 붙인다.** advisor는 실행 모델이 실제로 몇 번 묻는지(`usage.iterations`의 `advisor_message` 수)부터 기록한다.
6. **되돌릴 조건을 미리 정한다.** 예를 들어 "실패하던 과제 묶음의 성공률이 10%p 이상 오르지 않으면 Opus 5.5 유지"처럼 정해 둔다.

예를 들어 Opus 5.5 high로 코딩 에이전트를 돌리는 팀이 있다고 하자. 이 글에서 만든 예시다. 과제를 나눠 보니 80%는 Opus가 무난히 풀고 20%에서 반복해서 실패한다. 이 팀에게 맞는 구성은 전체를 Fable로 바꾸는 게 아니라, 실패하던 20%만 Fable 5.2 low로 다시 돌려 보는 것이다. 그 묶음에서 성공률이 충분히 오르면 실패 신호(테스트 반복 실패, 재시도 횟수)를 기준으로 Fable로 넘기는 라우팅을 만든다. 넘길 때는 새 대화로 시작해야 thinking 블록 문제를 피할 수 있다.

<!-- 필자 확인: 실제로 Fable 5.2로 옮겨 본 작업이 있으면 이 예시를 그 경험으로 바꾸기 -->

---

## 정리

Fable 5.2 발표의 주인공은 서브에이전트 수백, 수천 개를 며칠씩 돌리는 길고 어려운 작업이었다. 그 사례들은 자체 보고라서 밖에서 확인할 수 없지만, Anthropic이 공개한 비용 측정은 같은 방향을 가리킨다. Fable 5.2가 비용만큼 점수를 더 낸 건 컨텍스트 하나를 넘는 작업이었고, SWE-bench Pro나 리서치처럼 Opus 5.5가 이미 잘하는 일에서는 비용만 늘었다. 그래서 Anthropic은 Opus 5.5를 기본으로 두라고 한다.

짧은 과제로 잰 AA 계산은 이 기준을 코딩 쪽에서 조금 옮긴다. Opus 5.5도 절반 넘게 실패하는 어려운 코딩 과제에서는 Fable 5.2 low가 Opus 5.5 high보다 싸게 더 많이 풀었다. 그러니 Fable로 올릴지의 기준은 작업 분야보다 Opus 5.5가 그 일에서 실제로 실패하는지에 두는 게 맞다. 올린 뒤에는 low부터 시작하고, advisor나 orchestrator 같은 구성은 Fable 혼자 낮은 effort로 돌린 결과를 이길 때만 붙인다.

effort별 작업당 비용을 따져 본 [#75](/blog/75-opus-5-5-gpt-6-sol/), 캐시가 청구액에 미치는 영향을 다룬 [#48](/blog/48-cache-hit-rate/)과 함께 보면 좋다.

---

*참고: [Introducing Claude Fable 5.2 and Claude Mythos 5.2 (Anthropic, 2026-11-09)](https://www.anthropic.com/claude-fable-and-mythos-5-2), [Formalizing Fermat's Last Theorem (Anthropic, 2026-09-04)](https://www.anthropic.com/news/formalizing-fermats-last-theorem), [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence), [Advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool), [What's new in Claude Fable 5.2](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2), [Claude Fable 5.2 migration guide](https://platform.claude.com/docs/en/models/fable-5-2/migration-guide), [Prompting Claude Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Claude Code model configuration](https://code.claude.com/docs/en/model-config), Artificial Analysis 릴리스 페이지 [Claude Fable 5.2](https://artificialanalysis.ai/models/releases/claude-fable-5-2), [Claude Fable 5.1](https://artificialanalysis.ai/models/releases/claude-fable-5-1), [Claude Opus 5.5](https://artificialanalysis.ai/models/releases/claude-opus-5-5), [Claude Sonnet 5.5](https://artificialanalysis.ai/models/releases/claude-sonnet-5-5), [Claude Haiku 5.5](https://artificialanalysis.ai/models/releases/claude-haiku-5-5)와 각 effort별 모델 페이지, [FrontierCode-AA 2.0](https://artificialanalysis.ai/evaluations/frontiercode-2-0), [AA 지수 산정 방법](https://artificialanalysis.ai/methodology/intelligence-benchmarking). AA 수치는 2026-11-14에 수집했다(지수 v5.0.1). AA의 설정 이름에는 "Default Fallback"이 붙어 있다. AA가 설명을 따로 적지 않았지만 거절 시 기본 폴백을 켠 설정으로 보이며, 그렇다면 일부 과제는 Opus 4.8이나 Opus 5가 대신 답했을 수 있다. 토큰 사용량 변화는 비용 변화와 단가 변화로 역산한 추정치다. advisor 호출 비용은 대화 길이와 조언 길이를 가정해 공개 단가로 계산한 예시다. Anthropic 비용 문서의 측정은 Anthropic 내부 결과이고 일부는 한 번만 돌린 값이다. 비교는 모두 공개 자료로 계산했으며 직접 API를 호출해 측정하지 않았다.*
