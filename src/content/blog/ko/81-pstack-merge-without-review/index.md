---
title: "PR 2,000개를 리뷰 없이 머지하려면 먼저 갖춰야 할 것들: Lauren Tan의 pstack과 Dune"
summary: "전 Cursor 엔지니어이자 지금은 SpaceXAI에서 Grok Bot을 만드는 Lauren Tan은 7월에 PR 1,000개, 8월에 2,462개를 프로덕션에 머지했다고 밝혔다. '코드를 안 본다'는 말로 퍼졌지만 본인은 머지된 코드를 나중에 읽고, 거기서 찾은 문제를 lint와 구조로 바꾼다고 답했다. 머지 전 사람 리뷰가 하던 일은 세 장치가 나눠 맡는다. 실제 앱을 돌려 낸 증거, 코드를 쓰지 않은 에이전트의 판정, 규칙을 CI 실패로 옮긴 코드베이스다. 강연 두 편의 자막, 본인 X 게시물, 공개 플러그인 pstack의 코드와 커밋 90개를 읽고 각 장치가 어떻게 구현됐는지 확인했다. 판정을 패치에 묶는 patch-id 규칙은 직접 재현했다. 토큰 사용량과 검증되지 않은 수치를 짚은 뒤, 보통 예산의 팀이 자기 저장소에 옮길 순서를 정리했다."
date: "2026-09-27T18:36:00+09:00"
tags:
  - agent-engineering
  - harness-engineering
  - agentic-coding
  - code-review
  - multi-agent
draft: false
---

Lauren Tan은 Meta와 Netflix를 거쳐 Cursor에서 일했고, React 코어 팀에서 React Compiler를 만드는 엔지니어다. 지금은 SpaceXAI에서 Grok Bot의 클라이언트를 만든다. 이 사람이 8월 워크숍에서 "지난달(7월)에 PR 1,000개를 머지했다"고 말했고, 9월 초에 공개한 글의 이미지에는 "8월을 PR 2,462개로 마감했다"고 적었다. 9월 21일 X에 올린 강연 영상은 조회수 275만을 넘겼고, 국내에서는 "코드 한 줄 안 보고 한 달에 PR 1,000개를 머지한다"는 요약으로 퍼졌다.

이 글에서 확인하는 것은 두 가지다. 사람이 머지 전에 코드를 읽지 않는다면 그 일을 무엇이 대신하는가, 그리고 그 장치를 보통 예산의 팀이 어디까지 옮겨 올 수 있는가. 자료로는 강연 두 편의 자막(8월 12일 Maven 워크숍 59분, 9월 21일 공개 강연 38분), 본인과 동료의 X 게시물, Cursor 공식 플러그인 저장소에 MIT 라이선스로 공개된 [pstack](https://github.com/cursor/plugins/tree/main/pstack)을 읽었다. pstack은 0.15.5(9월 25일 커밋 `ecc249f`) 기준이고, 5월 22일부터 쌓인 커밋 90개의 이력도 함께 봤다. 강연에서 중심이 되는 Dune이라는 프레임워크는 코드가 공개되지 않아서, 발언과 pstack에 드러난 원칙으로만 다룬다. 실험은 patch-id 규칙을 재현한 것 하나뿐이다.

에이전트의 완료 보고를 실행 증거와 대조하는 문제는 [#74](/blog/74-jev-completion-evidence/)에서, Grok Bot의 보안 설계는 [#56](/blog/56-grok-bot-shared-computer/)에서 다뤘다. 이번 글은 머지 결정 하나만 본다.

## 코드를 읽는 시점이 머지 뒤로 옮겨 갔다

"코드를 안 본다"는 요약은 절반만 맞다. 워크숍에서 Lauren Tan은 "I really don't look at the code anymore"라고 말했다. 그런데 8월 26일 같은 질문을 받고 X에 이렇게 답했다.

> i still look at the code! i review what my agents land, and also what other engineers on my team are merging and i try to be observant about where the code smells are. then i either refactor the code to eliminate the problem entirely or i add lints to prevent it from happening. ([원문](https://x.com/poteto/status/2092512896408592713))

두 발언을 합치면 이렇다. 머지 전에 PR을 하나씩 승인하는 리뷰는 하지 않는다. 대신 이미 main에 들어간 코드를 읽고, 거기서 발견한 문제를 다시 생기지 않게 만든다. 방법은 코드 구조를 바꾸거나 lint를 추가하는 것이다. 그래서 "CI만 통과하면 머지해도 안전한 상태"가 점점 넓어진다고 설명한다.

같은 팀 Lingxi Li가 쓴 [Grok Bot 엔지니어링 가이드](https://x.com/lingxi/status/2094493172516966781)는 자동 머지 조건을 더 구체적으로 적었다. 30분마다 봇 리뷰 지적, CI 실패, 머지 충돌을 확인하고, "리뷰 확신도가 높고 영향 범위(blast radius)가 작으면" 자동으로 머지한다. 제대로 살피지 않은 PR이 사고를 낸 적도 있어서 그때마다 사후 분석을 한다고 적었다. Lauren Tan은 PR 크기에 상한을 두지 않지만 50줄에서 1,000줄 정도로 나누게 하는데, 이유는 되돌리기 쉽게 하려는 것이다.

정리하면 사람 리뷰가 없어진 것은 아니다. 머지를 결정하는 시점에서 빠졌을 뿐이다. 그 자리를 채우는 장치는 세 가지다.

## 첫 번째 장치: 실제 앱을 돌려서 얻은 증거

Lauren Tan은 신뢰의 출발점을 이렇게 설명했다.

> the ability for an agent to actually run the code or take CPU traces or heap snapshots or open an iOS simulator … that's the thing that really closes the loop. It doesn't guarantee your agent writes good code but it allows them to at least write correct code

Cursor 시절 팀은 에이전트가 앱을 직접 조작하는 control 스킬을 먼저 만들었다. 그런데 슬랙으로 들어오는 버그 신고는 UI 일부를 자른 스크린샷에 물음표 세 개만 붙은 경우가 많았다. 에이전트는 앱을 실행할 수는 있어도 사용자가 무엇을 가리키는지 몰라서 추측했다. 그래서 만든 것이 **Feature Map**이다. 앱의 기능마다 파일을 하나씩 두고, 사용자가 그 기능에 어떻게 도달하는지, 에이전트가 어떤 명령으로 조작하는지, 무엇을 보면 동작이 확인되는지를 적는다. 이 맵은 자동화 작업이 계속 갱신한다.

pstack은 이 방식을 `/create-verification-skill`로 공개했다. 이 스킬은 사용자에게 묻기 전에 저장소부터 조사해서, 프로젝트 안에 `verify-<앱이름>` 스킬을 만든다. 생성된 스킬에는 다섯 부분이 들어간다.

| 부분 | 내용 |
|---|---|
| Launch | 앱을 띄우는 정확한 명령, 준비됐는지 판단하는 신호, 종료 방법 |
| Doctor | 지금 떠 있는 인스턴스가 조작할 만한 상태인지 확인하는 읽기 전용 검사 |
| Drive | 이 저장소의 실제 선택자와 명령. 좌표 대신 ARIA 라벨, data 속성 같은 안정적인 식별자를 쓴다 |
| Evidence | 무엇을 증거로 남길지, 어디에 저장할지 |
| Cleanup | 자기가 띄운 인스턴스만 정리한다. 증거 파일은 지우지 않는다 |

스킬을 넘기기 전에 생성기가 이 절차를 처음부터 끝까지 한 번 실행하는 것도 규칙이다. 실행해 보지 않은 스킬은 "초안"으로 취급한다.

Feature Map 예시 파일에서 눈여겨볼 부분은 Gotchas 항목이다. 메모 저장 기능의 예시에는 "저장됨 메시지만으로는 증거가 부족하다. 목록에서 메모를 다시 열어라", "제목은 저장할 때 앞뒤 공백이 잘리므로 입력값이 아니라 화면에 그려진 제목을 확인하라"가 적혀 있다. 에이전트가 쉽게 속는 지점을 기능마다 미리 적어 둔 것이다. 변경 종류에 따라 확인 방법도 다르게 정한다. CLI 변경은 실제 명령을 실행하고, UI 변경은 바뀐 흐름을 앱에서 따라가고, 파서나 마이그레이션은 저장해 둔 입력을 다시 넣고, 성능 변경은 전후 프로파일을 비교한다.

다만 본인도 말했듯이 이 장치가 보장하는 것은 "맞게 동작하는 코드"까지다. 좋은 코드인지는 다른 장치가 맡는다.

## 두 번째 장치: 코드를 쓰지 않은 에이전트의 판정

pstack의 [Shipping 플레이북](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/shipping.md)은 머지 전 판정을 이렇게 정의한다.

> Safe means a verdict from an agent that did not write the code. CI green is not a verdict, and an approving bot review is not a verdict.

PR마다 새 클라우드 에이전트를 하나씩 띄우고, 이 에이전트가 control 스킬로 부모 커밋과 PR head를 각각 실제로 조작해 본 뒤 `PASS`, `PASS+NOTES`, `FAIL` 중 하나를 PR에 남긴다. 여러 에이전트를 조율하는 Orchestrate 플레이북에는 "작업자와 검증자는 서로 다른 모델 계열로 돌린다"는 규칙도 있다. 같은 모델이 쓴 코드를 같은 모델이 보면 같은 부분을 놓치기 쉽기 때문이다.

스택으로 쌓인 PR은 아래에서부터 연속으로 검증된 부분까지만 머지한다. 검증된 PR이 검증 안 된 PR 위에 있으면 기다린다. 그 PR을 머지하면 검증되지 않은 변경이 함께 딸려 들어가기 때문이다.

판정을 어떤 코드에 대해 내렸는지 기록하는 규칙이 가장 세밀하다. 검증자는 판정을 남길 때 head SHA, base SHA, 그리고 base에서 head까지의 diff로 계산한 `git patch-id --stable` 값을 함께 기록한다. 리베이스하면 SHA는 바뀌므로 SHA로는 판정이 아직 유효한지 알 수 없다. 머지 직전에 patch-id를 다시 계산해서 같으면 판정을 유지하고, 다르면 다시 검증한다.

이 규칙이 실제로 어떻게 동작하는지 작은 저장소로 확인했다. `app.txt`의 `b`를 `B`로 바꾼 브랜치를 만들고, trunk를 두 번 움직인 뒤 매번 리베이스했다.

```text
판정 시점   sha=4269ca9  patch-id=571a9bd909c3
리베이스 1  sha=c451196  patch-id=571a9bd909c3   # trunk가 다른 파일(other.txt)만 수정
리베이스 2  sha=32b07bb  patch-id=e6050eb1c7db   # trunk가 app.txt 끝에 d를 추가
```

첫 번째 리베이스에서는 SHA만 바뀌고 patch-id는 같아서 판정이 유지된다. 두 번째 리베이스에서는 브랜치의 변경 내용이 여전히 `b`→`B` 한 줄인데도 patch-id가 바뀌었다. trunk가 추가한 `d`가 diff의 문맥 줄에 들어갔기 때문이다. 즉 이 규칙은 근처 코드가 바뀌면 판정을 버리고 다시 검증하는 쪽으로 기운다.

반대 방향의 빈틈도 있다. 첫 번째 리베이스처럼 trunk가 다른 파일을 바꿨을 때, 그 변경이 이 PR과 의미상 충돌해도 patch-id는 그대로다. pstack은 이 경우 코드 판정은 유지하되 현재 head에서 CI와 머지 가능 여부를 다시 확인하게 하고, 여러 PR을 동시에 돌리는 Autopilot-full 플레이북에서는 같은 시나리오를 trunk에서도 돌리는 회귀 검사를 따로 둔다. patch-id는 "판정한 코드가 그대로인가"를 확인할 뿐이고, 합쳐진 결과가 맞는지는 다른 검사가 확인해야 한다.

한 가지 짚어 둘 점이 있다. 위 규칙은 공개된 pstack의 기준이다. Lauren Tan이 X에서 설명한 Grok Bot 저장소의 머지 기준은 "CI 통과"였고, Lingxi Li의 가이드는 "리뷰 확신도와 영향 범위"를 기준으로 들었다. 사내 설정이 Shipping 플레이북과 똑같은지는 확인하지 못했다.

## 세 번째 장치: 규칙을 CI 실패로 옮긴 코드베이스

공개 강연에서 Lauren Tan은 에이전트를 믿을 수 있게 만드는 장치를 강한 것부터 순서대로 들었다. 코드베이스 자체, 정적 분석(lint·컴파일러·CI), 규칙 문서·봇 리뷰·스킬, 사람이 리뷰로 지키는 스타일 가이드 순이다. 차이는 강제력에 있다.

> these two actually make CI red … for rules and skills and bugbot your agents can still forget

pstack의 원칙 스킬 `encode-lessons-in-structure`는 같은 생각을 규칙으로 적었다. 같은 지시를 두 번째로 쓰고 있다면 lint, 메타데이터, 런타임 검사, 스크립트로 바꿀 수 있는지 묻고, 바꿀 수 있으면 바꾼 뒤 지시문은 지운다. 여러 장치가 가능하면 가장 강한 것을 고른다. 순서는 컴파일되지 않는 상태, CI를 실패시키는 lint나 금지 API, 공용 헬퍼, 런타임 검사다. 6월 4일 커밋에서 추가된 이유가 이 글의 핵심이다.

> because agents copy whatever the surrounding code already does and a weaker guard becomes the next template.

에이전트는 주변 코드를 따라 쓴다. 강연에서는 이를 "안티패턴이 바이러스처럼 퍼진다"고 표현했다. 작은 우회 코드 하나, 그 우회를 설명하는 주석 하나가 있으면 에이전트가 그것을 계속 복사한다. 규칙 문서로만 금지한 패턴은 에이전트가 규칙을 한 번 잊으면 코드에 들어가고, 그 뒤로는 그 코드가 다음 코드의 본보기가 된다.

Dune은 이 원칙을 Grok Bot의 데스크톱 클라이언트에 적용한 프레임워크다. 본인은 "Electron 앱을 위한 Next.js 같은 것이고, 에이전트가 쓰도록 설계했다"고 소개했다. 강연에서 밝힌 규칙은 다음과 같다.

- **useEffect 금지.** Dune과 Grok Bot 코드에서 React의 `useEffect`를 쓰지 못하게 막았다.
- **코드 주석 금지.** 에이전트가 쓰는 주석은 대부분 과거 사정이나 "Lauren이 이렇게 하지 말라고 했다" 같은 내용이었다. 더 큰 문제는 에이전트가 주변 주석을 근거로 들어 실제 문제를 고치지 않았다는 점이다.
- **main과 renderer 프로세스 분리.** `electron-main`과 `electron-renderer` 디렉터리를 나누고, CI가 의존성 그래프를 검사해서 경계를 넘는 import를 실패시킨다. 근거는 60fps에서 16ms, 120fps에서 8ms인 프레임 예산이다.
- **기능 단위 폴더.** 한 기능의 코드를 한 폴더에 모은다.

이 규칙들에 공통된 원칙은 "가장 짧은 길이 가장 좋은 길"이다.

> agents love taking shortcuts. So, what if we designed a framework such that the shortcut, the easy path is the right path

본인도 이런 코드베이스는 사람에게 꽤 불편하다고 인정했다. 할 수 있는 일과 없는 일이 촘촘하게 정해져 있기 때문이다. 대신 컨텍스트가 거의 없는 에이전트도 정해진 길을 따라가면 좋은 코드가 나온다. 반대 사례로 든 것은 Cursor의 에이전트 창이었다. 이 구조가 없어서 회귀가 자주 난다고 말했다.

Dune은 오픈소스로 공개할 계획이 없다고 했다. 워크숍에서 "공개할 무언가라기보다 아이디어와 원칙의 모음"이라고 말했다. 공개된 pstack에는 같은 생각이 `/no-comments` 스킬로 들어 있다. 이 스킬은 주석을 지우는 하위 에이전트를 띄우고, "지우지 마시오" 같은 제약을 주장하는 주석을 만나면 그 제약을 타입, 테스트, lint 중 가장 싼 것으로 바꾸자고 제안한 뒤 주석을 지운다. 우리 코드에서 나온 이상한 동작을 설명하는 주석은 지우고, 이름을 바꾸거나 구조를 고칠 대상으로 표시한다.

## 모델이 좋아지면서 지운 지시와 남긴 규칙

pstack의 커밋 이력에는 흥미로운 흐름이 있다. 9월 23일 커밋 [#419](https://github.com/cursor/plugins/pull/419)의 제목은 "Opus 5.5에게 필요 없는 지시 19개를 추가로 삭제"다. 지운 것 중에는 `prove-it-works` 원칙의 이런 문장들이 있다.

```diff
-Code and features:
-1. Build it (necessary but not sufficient)
-2. Run it and exercise the actual feature path
-3. Check the full chain: does data flow from input to output?
-...
-Delegation: trust artifacts, not self-reports.
```

검증을 어떻게 하라는 설명은 모델이 이미 알아서 따르므로 지웠다. 그런데 같은 시기에 Shipping 플레이북의 "작성자가 아닌 에이전트의 판정", patch-id 규칙, 아래부터 연속으로 검증된 PR만 머지하는 규칙은 그대로다. 오히려 9월 9일에는 "모든 주장에 증거나 라벨(측정·추론·추측)을 같은 문장에 붙인다"는 규칙을 추가했다.

이 흐름을 이렇게 해석한다. 모델이 좋아지면 "무엇을 해야 하는지" 설명하는 문장은 필요 없어진다. 반면 "누가 판정하는지", "판정이 어느 코드에 대한 것인지"처럼 구조로 정한 규칙은 모델 성능과 관계없이 남는다. 모델을 바꿔도 남는 자산에 관해서는 [#44](/blog/44-surviving-model-churn/)에서 다뤘는데, pstack의 이력도 같은 방향을 가리킨다.

## 비용과 확인되지 않은 부분

이 방식은 토큰을 많이 쓴다. Lauren Tan은 X 답글에서 하루 평균 150억 토큰을 쓴다고 했고, 워크숍에서는 "나는 토큰이 사실상 무제한인 AI 연구소에서 일하므로 모두가 똑같이 하라고는 말할 수 없다"고 했다. 코드베이스를 이 구조로 리팩터링하는 초기 단계에 토큰이 많이 들고, 신뢰가 없는 상태에서 에이전트를 많이 띄우면 "엉성한 PR만 잔뜩 쌓인다"고도 경고했다. Grok Bot을 Dune 구조로 옮기는 데만 PR이 600개 넘게 들었다.

pstack을 직접 써 본 Rob Shocks는 [같은 작업을 비교한 영상](https://www.youtube.com/watch?v=lUhXa8GiXns)을 올렸다. Fable 5.1만 쓴 경우 30분이 걸렸고 pstack을 쓴 경우 1시간이 걸렸다. 대신 pstack은 에이전트의 거짓 주장 3건을 잡아냈다. 한 사람이 작업 하나로 비교한 결과라서 일반화하기는 어렵지만, 검증에 드는 시간과 토큰이 공짜가 아니라는 점은 분명하다.

수치도 조심해서 읽어야 한다. 7월 1,000건과 8월 2,462건은 모두 본인이 밝힌 수치이고 외부에서 감사한 자료는 없다. 9월 21일 게시글은 2,500건이라고 적었는데 첨부 영상 속 발언은 2,000건이다. 국내 요약에 나온 "에이전트 15\~20개"나 봇 다섯 개의 이름은 Lauren Tan이 아니라 동료 Lingxi Li의 가이드에 나온 내용이다. 본인이 동시에 몇 개를 돌리는지는 강연에서 말하지 않았다. 코드 품질에 관해서도 본인이 "이 코드가 얼마나 좋은지 의문을 갖는 건 당연하다"고 말했다.

## 내 저장소에 옮긴다면

토큰이 무제한이 아닌 팀도 옮길 수 있는 부분은 많다. 다만 순서가 중요하다. Lauren Tan이 강조했듯이 신뢰 없이 병렬 에이전트부터 늘리면 리뷰할 PR만 늘어난다. 아래는 pstack과 강연을 바탕으로 정리한 제안이고, 직접 도입해서 측정한 결과는 아니다.

**1. 완료 조건을 실행할 수 있는 명령으로 적는다.** "잘 되게 해 줘" 대신 통과하거나 실패할 수 있는 조건을 준다. pstack 가이드의 예시는 다음과 같다.

```text
이 명령에 JSON 출력을 추가해 줘. 텍스트 출력은 바이트 단위로 같아야 하고,
JSON은 파싱돼야 하고, 두 형식 모두 샘플 프로젝트에서 실행해. 증거를 보여 줘.
```

**2. 검증 스킬 하나와 Feature Map 3\~5개부터 만든다.** Claude Code라면 `.claude/skills/verify-<앱이름>/`에 Launch, Doctor, Drive, Evidence, Cleanup을 적고, 자주 고장 나는 기능부터 맵을 쓴다. pstack의 `create-verification-skill`은 Cursor 플러그인이지만 SKILL.md 본문은 도구와 무관한 절차라서 그대로 참고할 수 있다. [공개 예제 저장소](https://github.com/poteto/verification-skill-example)도 있다.

**3. 리뷰에서 같은 지적을 두 번 하면 CI 규칙으로 바꾼다.** Dune의 규칙 중 두 가지는 흔한 도구로 바로 만들 수 있다. useEffect 금지는 ESLint 설정으로 막는다.

```js
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react', importNames: ['useEffect'],
                  message: '이 저장소는 useEffect를 쓰지 않는다. 파생 상태나 이벤트 핸들러로 옮길 것.' }],
      }],
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.property.name='useEffect']",
        message: 'React.useEffect도 금지.',
      }],
    },
  },
];
```

프로세스 경계는 dependency-cruiser 같은 도구로 검사한다.

```js
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [{
    name: 'renderer-must-not-import-main',
    severity: 'error',
    from: { path: '^src/electron-renderer' },
    to: { path: '^src/electron-main' },
  }],
};
```

에러 메시지가 곧 에이전트에게 주는 지시가 된다. 무엇을 대신 써야 하는지 메시지에 적어 두면 에이전트가 다음 시도에서 바로 고친다.

**4. 판정은 코드를 쓴 에이전트가 아닌 에이전트에게 맡기고, 판정한 코드를 기록한다.** 가능하면 다른 모델 계열의 검증자가 검증 스킬로 부모 커밋과 PR head를 각각 돌려 보게 한다. 판정 결과에는 head SHA와 `git diff <base> <head> | git patch-id --stable` 값을 함께 남기고, 머지 직전에 다시 계산해서 비교한다.

**5. 자동 머지는 좁은 범위에서 시작한다.** 되돌리기 쉬운 작은 PR, 영향 범위가 작은 변경부터 맡긴다. 배포, 데이터 삭제, 공유 브랜치 force push처럼 되돌릴 수 없는 작업은 pstack도 항상 사람에게 멈춰서 묻는다. 그리고 머지 전 리뷰에서 아낀 시간 일부를 머지 후 리뷰에 쓴다. 이미 들어간 코드를 읽고, 찾은 문제를 3번의 규칙으로 바꾸는 시간이다.

효과를 확인하려면 몇 주 동안 네 가지를 세어 보면 된다. 머지 후 되돌린 PR 수, 리뷰에서 같은 지적을 반복한 횟수, 독립 검증자가 `FAIL`을 낸 비율, 그리고 PR 하나당 토큰 비용이다. 되돌린 PR이나 사고가 늘면 자동 머지 범위를 줄이고, 같은 지적이 줄지 않으면 규칙이 아직 CI가 아닌 문서에 머물러 있다는 뜻이다.

## 정리

Lauren Tan은 머지 전에 코드를 읽지 않는다. 대신 세 장치가 그 자리를 맡는다. 실제 앱을 돌려 얻은 증거, 코드를 쓰지 않은 에이전트의 판정, 반복되는 지적을 CI 실패로 바꾼 코드베이스다. 사람은 머지된 코드를 나중에 읽고, 찾은 문제를 다시 생기지 않게 만드는 일을 한다. 공개된 pstack은 앞의 두 장치를 플레이북과 스킬로 구현했고, 세 번째 장치의 사례인 Dune은 원칙만 공개됐다.

월 2,000건이 넘는 PR 수는 본인이 밝힌 수치이고, 하루 150억 토큰이라는 예산 위에서 나온 결과다. 보통 팀이 가져올 것은 PR 수보다 순서다. 검증 스킬로 증거를 먼저 만들고, 반복되는 지적을 CI로 옮긴 다음에 에이전트 수와 자동 머지 범위를 늘린다.

## 참고 자료

- [How I Shipped 2000 PRs Last Month — Trusting AI Agents (YouTube, 2026-09-21)](https://www.youtube.com/watch?v=NjoZoUm85x0)
- [How Cursor Turned AI Agents Into Better Engineers (Maven 워크숍, 2026-08-12)](https://maven.com/p/e23d9c/how-cursor-turned-ai-agents-into-better-engineers) · [녹화본](https://www.youtube.com/watch?v=Cmoh-yR-usA)
- [pstack (cursor/plugins)](https://github.com/cursor/plugins/tree/main/pstack) · [Shipping 플레이북](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/shipping.md) · [create-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/create-verification-skill/SKILL.md)
- [poteto: "i still look at the code!" (X, 2026-08-26)](https://x.com/poteto/status/2092512896408592713)
- [poteto: Dune으로 에이전트가 자기 PR을 머지한다 (X, 2026-08-11)](https://x.com/poteto/status/2087244771849089270)
- [poteto: 1,000 PR과 Full Autopilot 플레이북 (X, 2026-08-19)](https://x.com/poteto/status/2090141955695198633)
- [poteto: 하루 평균 150억 토큰 (X, 2026-08-27)](https://x.com/poteto/status/2092884264581013952)
- [Lingxi Li, Grok Bot for Engineering (X, 2026-08-31)](https://x.com/lingxi/status/2094493172516966781)
- [Rob Shocks, Pstack Is Agent Overkill. Use It Anyway! (YouTube, 2026-09-08)](https://www.youtube.com/watch?v=lUhXa8GiXns)
- [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example)
