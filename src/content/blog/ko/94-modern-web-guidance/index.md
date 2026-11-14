---
title: "Chrome·Edge·Firefox가 함께 관리하는 코딩 에이전트용 웹 가이드 Modern Web Guidance: 가이드 209개를 필요할 때만 꺼내 읽힌다"
summary: "Chrome 팀이 11월 10일 1.0을 낸 Modern Web Guidance는 코딩 에이전트가 웹 UI를 만들 때 최신 브라우저 기능과 폴백 규칙을 찾아 쓰게 하는 스킬이다. Edge와 Firefox가 운영에 합류했고, 스타는 1만 1천 개를 넘었다. 저장소 두 개의 코드와 커밋 이력을 읽어 보니 구조는 약 200토큰짜리 스킬 설명 하나, 필요할 때만 꺼내 읽는 가이드 209개, 가이드에 붙는 Baseline 호환성 데이터의 주 2회 갱신, 프로젝트별 브라우저 지원 범위를 정하는 .mwgrc로 나뉜다. Claude Code(Opus 5.5)에 같은 과제 4개를 스킬 없이, 스킬을 켜고 3번씩 시켜 보니 <dialog> 확인 창은 스킬 없이도 거의 같은 코드가 나왔다. 반면 툴팁은 JS 좌표 계산이 앵커 포지셔닝으로, 폼 오류 표시는 :user-invalid로, 다크 모드는 light-dark()로 바뀌었다. 비용은 과제당 1.3~2.1배 늘었다. 설치와 적용 범위, 브라우저 지원 정책을 적는 법, 팀 규칙을 같은 구조로 배포할 때 참고할 점을 정리했다."
date: "2026-11-14T12:03:00+09:00"
tags:
  - agent-engineering
  - context-engineering
  - ai-coding
  - claude-code
  - ai-eval
  - open-source
  - web-platform
draft: false
---

Chrome 팀이 11월 10일 [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) 1.0을 냈다. 코딩 에이전트가 웹 UI, CSS, 브라우저 쪽 JavaScript를 작성할 때 최신 웹 플랫폼 기능과 폴백 방법을 담은 가이드를 찾아 읽게 하는 스킬과 CLI다. 3월 23일에 저장소를 만들었고, 5월 Google I/O에서 "early preview"로 소개된 뒤 1.0에서 Firefox와 Edge가 운영에 합류했다. README에는 "Google Chrome, Microsoft Edge, Mozilla Firefox, MDN 팀이 함께 관리한다"는 문구가 1.0 커밋에서 들어갔다. 11월 14일 GitHub API로 확인한 스타는 1만 1,273개다.

배경은 단순하다. 모델은 `<dialog>`, Popover API, 앵커 포지셔닝 같은 이름을 알지만, 실제로 코드를 쓸 때는 학습 데이터에 훨씬 많은 `<div>`와 JavaScript 조합으로 돌아가는 경우가 많다. 브라우저에 새 기능이 들어가는 속도도 모델 학습 주기보다 빠르다. 이 가이드는 그 차이를 브라우저 벤더가 직접 메우겠다는 시도다.

이 글에서는 세 가지를 확인했다. 배포용 저장소와 원본 저장소([modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src))의 코드와 커밋 이력을 읽고 가이드가 어떤 구조로 만들어져 매주 바뀌는지 봤다. npm에 올라간 CLI 1.0.0을 직접 실행해 브라우저 지원 정책이 어떻게 적용되는지 확인했다. 그리고 Claude Code에 같은 웹 UI 과제 4개를 스킬 없이 3번, 스킬을 켜고 3번 시켜 생성된 코드의 API를 비교했다. 브라우저에서 결과 화면을 검증하지는 않았으므로, 실험 결과는 "어떤 API를 썼는가"까지만 말한다.

<!-- 필자 확인: 이 소재를 고른 이유, 필자가 평소 웹 UI 작업에서 에이전트가 낡은 패턴을 쓴다고 느낀 경험이 있다면 여기에 한두 문장 -->

## 브라우저 벤더가 에이전트용 가이드를 내는 이유

README가 밝힌 이유는 이렇다. "LLM 학습 데이터에는 레거시 코드가 매우 많아서 코딩 에이전트는 오래된 패턴을 기본값으로 쓰는 경우가 많다." 모델이 API를 알더라도 실제 프로덕션 코드에 필요한 구현 패턴은 부족하다는 설명도 붙어 있다. 1.0 출시 날 Chrome의 Paul Irish가 Hacker News에 올린 [Show HN 글](https://news.ycombinator.com/item?id=50443812)은 더 직접적이다. 모델은 이런 기능을 이름으로는 알지만 "플랫폼 기본 기능을 기본값으로 쓰지 않고 기존의 `<div>`+JS 패턴을 고른다"는 것이다.

Philip Walton의 [1.0 발표 글](https://developer.chrome.com/blog/modern-web-guidance-v1)은 문제를 조금 다르게 설명한다. 최신 모델이 만든 코드는 대개 동작하지만, 웹 전문가가 보면 "더 빠르고, 접근성이 좋고, 안전하게 만들 방법을 거의 항상 찾을 수 있다"는 것이다. 잘못 쓴 ARIA는 ARIA가 없을 때보다 접근성을 해칠 수 있다는 예도 들었다. 즉 이 프로젝트가 다루는 것은 "동작하지 않는 코드"보다 "동작은 하지만 브라우저가 이미 해 주는 일을 손으로 다시 만든 코드"다.

반응을 보면 사람들이 원한 것이 조금 더 선명해진다. Show HN 글은 442점, 댓글 146개를 받았다. "드디어, 딱 필요했던 것"이라는 반응과 함께 사람이 읽어도 유용하다는 댓글이 있었다. 요청은 주로 배포 방식에 몰렸다. Simon Willison은 npm 패키지 말고 grep으로 찾을 수 있는 마크다운 색인을 GitHub Pages에 올려 달라고 했고("그러면 아무것도 설치하지 않아도 된다"), Paul Irish는 그렇게 하겠다고 답했다. Jeremy Howard는 이름을 llms.txt로 바꾸라고 했고, 다른 사용자는 "왜 텍스트를 패키지 매니저로 배포하느냐"고 물었다.

크로스 브라우저 우려도 많았다. Chrome이 주도하는 가이드가 결국 "이 사이트는 ○○ 브라우저에서 보세요"로 돌아가는 것 아니냐는 댓글, 운영 위원 자리에 Chromium 쪽이 셋이고 Firefox는 하나이며 Safari는 없다는 지적이 나왔다. Chrome의 Kadir Topal은 기본값이 "Baseline Widely available", 즉 주요 브라우저 전체에서 2.5년 이상 지원된 기능이고, 그보다 새로운 기능은 점진적 향상이나 폴백이 있어야 하며, 이 정책은 Edge, Firefox와 합의한 것이라고 [답했다](https://news.ycombinator.com/item?id=50452911). 접근성 전문가 Adrian Roselli는 5월 프리뷰를 시험한 뒤 [접근성 가이드가 기준에 못 미친다](https://adrianroselli.com/2026/05/maybe-dont-rely-on-googles-modern-web-guidance.html)고 썼다. 특히 "어떤 프롬프트에서 어떤 가이드가 쓰일지 보장되지 않는다"는 점을 짚었다. 비용 이야기도 있었다. 한 사용자는 자기 코드베이스에서 "한 번 쓸 때 5달러쯤 든다"고 적었다(본인도 Claude 사용량 통계 기준이라 정확하지 않다고 덧붙였다).

정리하면 사람들이 원한 것은 "지금 웹 전문가가 쓸 법한 코드를, 내 브라우저 지원 범위 안에서, 무겁지 않게"다. 가이드 내용보다 배포 방식, 브라우저 중립성, 컨텍스트 비용에 질문이 몰린 것도 그래서다. 이 프로젝트의 구조는 대부분 이 세 질문에 답하는 쪽으로 짜여 있다.

## 구성: 스킬 하나와 가이드 209개, 검색 CLI

### 처음에는 분야별 스킬이었다

배포용 저장소의 커밋 이력을 보면 구조가 한 번 크게 바뀌었다. 4월 말부터 5월 초까지는 `css`, `forms`, `performance`, `webmcp` 같은 분야별 스킬과 검색용 `modern-web` 스킬이 나란히 있었다. 분야별 스킬은 SKILL.md 본문에 규칙을 직접 담았다. 5월 11일 v0.0.99에서 이것들을 지우고 `modern-web-guidance` 스킬 하나로 합쳤다. 지금 SKILL.md는 9.8KB이고, 항상 컨텍스트에 올라가는 것은 앞부분의 설명(description)뿐이다. README는 이 설명을 약 205토큰으로 표시한다.

가이드 본문은 스킬과 따로 있다. 1.0 기준으로 가이드는 209개, 합쳐서 약 1.97MB다. 에이전트는 이걸 한꺼번에 읽지 않는다. 다음 두 명령으로 필요한 것만 꺼낸다.

```sh
npx -y modern-web-guidance@latest search "confirmation modal dialog"   # id와 설명 목록을 돌려준다
npx -y modern-web-guidance@latest retrieve "dialog"                    # 가이드 하나를 돌려준다(dialog는 12.4KB)
```

검색은 npm 패키지에 들어 있는 임베딩 모델과 BM25로 로컬에서 한다. Paul Irish는 처음 500MB짜리 네이티브 스택이던 것을 약 7MB 순수 JS 패키지로 줄였다고 밝혔다. 9.5KB가 넘는 가이드는 임시 파일로 저장되고, 에이전트에게 그 파일을 끝까지 읽으라고 안내한다. Paul Irish는 이 구조를 컨텍스트 창을 크게 차지하지 않으면서 스킬과 검색 CLI로 배포하는 방법이라고 설명했다. MCP의 동적 도구 검색에 활성화 여부를 맡기지 않았다는 말도 했다.

스킬 설명은 언제 켜질지를 꽤 강하게 적었다. "MANDATORY: 모든 HTML/CSS와 클라이언트 JS 작업에서 먼저 실행하라. 웹 API는 빠르게 바뀌고 학습된 가중치에는 낡은 패턴이 들어 있다"로 시작하고, 백엔드, CI, Vite 설정, 테스트 같은 작업에서는 켜지 말라고 명시한다. 1.0에서는 사용자가 "먼저 확인받아 줘"처럼 UI 이름 없이 말해도 "confirmation modal dialog"처럼 UI 부품 이름으로 바꿔 검색하라는 지시가 추가됐다.

### 가이드 하나는 파일 네 종류로 만든다

원본 저장소에서 가이드 하나는 폴더 하나다. `guides/ui-components/dialog/`에는 다음 파일이 있다.

| 파일 | 역할 |
|---|---|
| `guide.md` | 에이전트가 실제로 읽는 유일한 파일. 앞머리에 관련 `web-feature-ids`를 적고, 본문에 `{{ BASELINE_STATUS("dialog-closedby") }}` 같은 매크로를 둔다 |
| `demo.html` | 가이드대로 만든 참조 구현 |
| `expectations.md` | 검증 가능한 요구사항 목록. 예: "`<dialog>`에 `role="dialog"`나 `aria-modal`을 붙이지 않는다" |
| `targets/daily-grind/` | 실제 예제 앱에 시킬 과제(`task.md`), Playwright 채점기(`grader.ts`), Claude·Codex·Antigravity가 만든 정답 패치, 아무것도 안 바꾼 기준 패치 |

빌드할 때 `BASELINE_STATUS` 매크로가 web-features 패키지 데이터로 바뀌어 "Browser support for `<dialog closedby>`: Limited availability. Supported by: Chrome 134, Edge 134, Firefox 141. Unsupported in: Safari." 같은 문장이 된다. 1.0 가이드 중 153곳이 이런 Limited availability 표시를 달고 있고, 그 아래에 폴백 방법이 붙는다. 호환성 정보를 사람이 손으로 적지 않으니, 브라우저가 새 버전을 내면 가이드 문장도 따라 바뀐다.

### 매주 무엇이 바뀌나

갱신은 GitHub Actions 두 개가 맡는다. `update-web-features.yml`이 월요일과 목요일 05:00 UTC에 web-features 패키지를 올리고, 영향받는 가이드를 검사한 결과를 PR 댓글로 단다. `publish.yml`은 매주 월요일 npm `@latest`와 배포용 저장소에 새 버전을 올린다. 배포용 저장소 커밋 216개 중 194개가 이 봇의 "Release" 커밋이다. 6월 이후로는 거의 매주 하나씩 올라왔다.

실제 변경을 보면 가이드 수정과 호환성 데이터 갱신이 섞여 있다. 11월 2일 v0.0.197에서는 `showPopover`가 "Newly available"에서 "Widely available"로 바뀌었다. 10월 12일 버전에서는 Firefox 157 지원이 추가됐고, 10월 26일 버전에서는 Firefox 157과 Safari 27에 출시 시기가 붙었다. 가이드 수는 5월 중순 137개에서 11월 2일 194개, 1.0에서 209개로 늘었다. 1.0 커밋 하나에서만 134개 파일, 7,180줄이 추가됐다.

`npx -y modern-web-guidance@latest`로 호출하는 이유도 여기 있다. 에이전트가 가이드를 부를 때마다 최신 npm 버전을 쓰므로, 플러그인을 다시 설치하지 않아도 가이드와 호환성 데이터가 바뀐다. SKILL.md의 명령에는 `--skill-version 2026_11_09-5bcc021b`가 붙어 있어서, 스킬 파일이 오래됐는지 CLI가 알 수 있다.

### 에이전트별 매니페스트에는 이름과 설명만 있다

최상위의 매니페스트 9종은 모두 같은 `skills/` 폴더를 가리킨다. 추가된 순서는 다음과 같다. Claude Code와 Gemini CLI용이 3월 23일 첫 커밋에 있었고, Cursor(5월 12일), GitHub Copilot(8월 3일), Kimi(8월 11일), Grok(8월 17일), Codex와 `.agents/plugins`(9월 7일), agent-plugins.org 스키마를 따르는 `plugin.json`(10월 26일)이 뒤따랐다. 대부분은 이름, 설명, 버전만 있다. Codex용은 표시 이름, 개인정보 처리방침 URL, 기본 프롬프트 같은 마켓플레이스 정보를 더 담았고, Kimi용은 스킬 폴더 두 개를 명시적으로 나열한다. 에이전트마다 다른 것은 매니페스트 형식뿐이고, 스킬 본문과 CLI는 하나다.

## 스킬과 정책은 어떻게 나뉘었나

저장소의 `policies/modern-web-guidance.toml`은 이름만 보면 가이드 운영 정책 같지만, 내용은 Gemini CLI의 권한 규칙이다.

```toml
[[rule]]
toolName = "run_shell_command"
commandRegex = "modern-web"
decision = "ask_user"
priority = 100
modes = ["plan"]
```

[Gemini CLI 문서](https://geminicli.com/docs/reference/policy-engine/)에 따르면 Plan 모드에서는 셸 명령이 기본으로 거부된다. 이 규칙은 `modern-web`이 들어간 명령만 "사용자에게 묻기"로 올려서, 계획을 짜는 단계에서도 가이드를 검색할 수 있게 한다. 5월 11일 스킬을 하나로 합친 같은 버전에서 추가됐다. 스킬이 CLI를 부르는 구조로 바뀌면서 에이전트 권한 설정이 필요해졌다. SKILL.md에도 같은 이유로 `npx -y modern-web-guidance@latest *`만 허용 목록에 넣고 `npx *` 전체는 넣지 말라는 안내가 있다.

브라우저 지원 범위에 관한 정책은 세 군데에 나뉘어 있다.

| 위치 | 내용 | 적용 방식 |
|---|---|---|
| SKILL.md | 기본값은 Baseline Widely available. 그보다 새 기능은 가이드의 폴백을 반드시 따른다 | 프롬프트 |
| 프로젝트의 AGENTS.md·CLAUDE.md | 사용자가 Electron 같은 제한된 런타임을 쓰거나 폴백 크기를 신경 쓰면 "브라우저 지원" 정책을 적어 두라고 제안한다 | 프롬프트 |
| `.mwgrc` | Origin Trial 기능과 "volatile" 기능 허용 여부, Baseline 목표 | CLI 코드 |

`.mwgrc`는 CLI가 직접 읽는다. "volatile"은 한 브라우저 엔진에서만 출시된 지 3개월이 안 된 기능이고, 목록은 원본 저장소의 `features/volatile-features.json`에 있다. 필자가 1.0.0 CLI로 확인한 동작은 다음과 같다(명령과 출력은 `experiments/modern-web-guidance/cli-checks.txt`).

- `.mwgrc` 없이 `retrieve summarizer`(Chrome 내장 AI 요약 API)를 부르면 가이드 본문 대신 경고문이 나오고 종료 코드 1로 끝난다. 경고문은 "이 게이트를 우회하지 말라(`.mwgrc`를 고치거나 디스크의 원본 `.md`를 읽지 말라)"고 하고, 사용자가 해당 API를 직접 지목하지 않았다면 표준 크로스 브라우저 방식으로 구현하라고 한다.
- `.mwgrc`에 `{"baseline": "newly"}`를 두고 `retrieve dialog`를 부르면 가이드 맨 앞에 "Newly available 이상은 이 프로젝트의 지원 범위를 만족하니 폴백을 빼라"는 안내가 붙는다. 이 `baseline` 키는 README에는 없지만 원본 저장소의 `src/core/mwgrc.ts`와 1.0.0 CLI에 들어 있다. `widely`, `newly`, `limited`, 연도(`2024`)를 받는다.

[#91 DeepSeek Super-Agent](/blog/91-deepseek-super-agent/)에서 본 것처럼 여기서도 코드와 프롬프트가 나눠 맡는다. 가이드를 내주지 않는 판단은 CLI 코드가 하고, 기본값 Widely available을 지키는 일과 게이트를 우회하지 않는 일은 프롬프트가 맡는다. 원본 가이드 마크다운은 GitHub와 npm 패키지에 그대로 있으므로, 에이전트가 직접 읽으려 하면 막을 장치는 없다. 다만 게이트의 목적은 보안보다 "아직 바뀔 수 있는 API를 사용자 동의 없이 쓰지 않게" 하는 것이라서, 이 정도 강도로 설계한 것으로 보인다.

## 같은 과제를 스킬 없이, 스킬을 켜고 돌려 봤다

### 실험 방법

할 일 목록이 있는 작은 정적 페이지(`index.html`, `style.css`, `app.js`)를 만들고 과제 4개를 영어로 줬다. 프롬프트에는 API 이름을 넣지 않았다.

| 과제 | 요청 내용 |
|---|---|
| t1 삭제 확인 | Delete를 누르면 화면 가운데 확인 창을 띄우고 Cancel을 기본으로 |
| t2 툴팁 | "?" 아이콘에 마우스와 키보드 포커스로 뜨는 툴팁, 위쪽에 두고 공간이 없으면 아래로 |
| t3 폼 오류 | 페이지 로드 직후부터 빈 칸이 빨갛게 보이는 문제를, 사용자가 건드린 뒤에만 보이게 하고 오류 문구 추가 |
| t4 다크 모드 | OS 설정을 따르되 헤더에서 라이트·다크·시스템을 고르고 기억하기 |

Claude Code 2.1.325의 `claude -p`에 `claude-opus-5-5`를 지정하고, 사용자 설정을 빼기 위해 `--setting-sources project,local`로 돌렸다. 스킬 조건에서는 1.0의 SKILL.md를 작업 폴더의 `.claude/skills/`에 넣었고, CLI는 npm 1.0.0을 받아 썼다(`DISABLE_TELEMETRY=1`). 과제마다 조건별 3번, 총 24번이다. 결과물은 정규식으로 어떤 API가 쓰였는지 셌다. 화면이 실제로 맞게 동작하는지는 확인하지 않았다. 스크립트와 전체 결과는 `experiments/modern-web-guidance/`에 있다.

### 결과

| 패턴 | 스킬 없음(3번 중) | 스킬 켬(3번 중) |
|---|---|---|
| t1 `<dialog>`와 `showModal()` | 3 | 3 |
| t1 Cancel에 `autofocus`, `returnValue` 처리 | 3 | 3 |
| t1 `overscroll-behavior`로 뒤 페이지 스크롤 막기 | 0 | 2 |
| t2 JS로 좌표 계산(`getBoundingClientRect`) | 3 | 1 |
| t2 Popover API + CSS 앵커 포지셔닝 + `position-try` | 0 | 2 |
| t2 `interestfor`(호버·포커스로 여는 HTML 속성) | 0 | 2 |
| t3 `:user-invalid` | 0 | 3 |
| t3 `setCustomValidity`로 직접 오류 관리 | 3 | 0 |
| t4 `light-dark()` | 1 | 3 |
| t4 `data-theme` 속성이나 클래스 전환 | 3 | 0 |
| t4 라이트·다크·시스템 3단 선택(라디오 또는 select) | 0 | 3 |

t1의 결과가 먼저 눈에 띈다. Opus 5.5는 스킬 없이도 3번 모두 `<dialog>`와 `showModal()`을 썼고, `role="dialog"`나 `aria-modal`, 포커스를 가두는 코드, Esc 처리 코드를 넣지 않았다. README와 Show HN 글이 대표 사례로 든 "dialog를 `<div>`로 다시 만드는 문제"는 이 모델에서는 이미 거의 해결돼 있었다. 스킬이 더한 것은 모달 뒤 페이지가 스크롤되지 않게 하는 CSS 두 줄 정도였고, JS 추가 줄 수는 평균 27줄에서 14줄로 줄었다. Paul Irish도 "AI가 모른다고 생각했던 것 중 일부는 틀렸다"며 eval로 모델이 이미 아는 부분을 가이드에서 덜어 낸다고 했는데, t1이 그런 경우다.

차이는 최근에 들어온 기능에서 났다. t2에서 스킬 없는 실행은 3번 모두 `getBoundingClientRect`로 위치를 계산하고 이벤트 리스너로 툴팁을 열었다. 스킬을 켠 실행 중 2번은 `popover`, `interestfor`, `anchor-name`, `position-try`로 같은 일을 CSS와 HTML 속성에 맡겼다. t3은 3번 모두 `:user-invalid`로 바뀌었고, t4는 `color-scheme`과 `light-dark()`를 중심으로 테마를 바꾸는 방식으로 옮겨 갔다. 이 결과는 1.0 가이드가 앵커 포지셔닝, `:user-invalid`, `light-dark()`, 다크 모드 토글을 별도 가이드로 다루는 것과 맞는다.

### 스킬은 켜졌지만 가이드를 안 읽은 경우

스킬은 12번 모두 켜졌다. 올해 1월 Vercel이 Next.js 과제로 잰 [eval](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)에서는 "56%의 경우 스킬이 아예 호출되지 않았다". 이번 실험의 과제는 모두 웹 UI라서 스킬 설명과 정확히 맞았고, "MANDATORY"로 시작하는 설명도 효과가 있었던 것으로 보인다. 다만 과제가 섞인 실제 작업에서도 같은 비율이 나올지는 이 실험으로 알 수 없다.

12번 중 2번(t1 한 번, t2 한 번)은 검색만 하고 `retrieve`를 부르지 않았다. 검색 결과의 설명만 보고 구현으로 넘어갔다. 그중 t2 실행은 스킬 없는 실행과 똑같이 JS 좌표 계산으로 툴팁을 만들었다. Roselli가 지적한 "가이드가 쓰인다는 보장이 없다"는 문제가 이 실험에서도 6번 중 1번꼴로 나온 셈이다.

### 폴리필을 CDN에서 받아 온 코드

t2에서 스킬을 켠 실행 2번은 모두 `index.html`에 다음과 같은 코드를 넣었다.

```js
if (!("interestForElement" in HTMLButtonElement.prototype)) {
  await import("https://unpkg.com/interestfor@latest");
}
if (!CSS.supports("anchor-name: --a")) {
  import("https://unpkg.com/@oddbird/css-anchor-positioning");
}
```

가이드 기준으로 `interestfor`는 Chrome과 Edge 149(2026년 6월)만 지원하는 Limited availability 기능이고, 가이드는 기능을 감지해서 없을 때만 폴리필을 불러오라고 한다. 에이전트는 그 지시를 따랐다. 다만 가이드에는 "CDN보다 번들링을 권한다"는 문장도 있는데, 이 과제에는 번들러가 없어서 unpkg의 `@latest`를 직접 불렀다. 버전이 고정되지 않은 외부 스크립트를 페이지에 넣는 코드라서, 팀의 보안 정책에 따라서는 리뷰에서 걸러야 한다. 최신 기능을 쓰게 하는 가이드는 폴리필을 어디서 어떻게 들여올지에 대한 팀 규칙과 같이 써야 한다.

### 한국어 프롬프트

CLI 검색은 한국어 질의를 처리하지 못한다. `search "툴팁 위치"`는 빈 배열을 돌려준다(원본 저장소 이슈 #3492에서 다룬 문제다). 그래서 t1을 한국어 프롬프트로 바꿔 스킬을 켜고 2번 더 돌렸다. 두 번 모두 에이전트가 "confirmation modal dialog"라는 영어 질의로 검색했고 `dialog` 가이드를 읽었다. Claude Code에서는 한국어로 시켜도 문제가 없었지만, 사람이 CLI를 직접 쓸 때는 영어로 검색해야 한다.

### 비용과 시간

| 과제 | 비용(스킬 없음 → 켬, 평균) | 배율 | 시간(초) |
|---|---|---|---|
| t1 삭제 확인 | $0.184 → $0.242 | 1.32배 | 45 → 48 |
| t2 툴팁 | $0.244 → $0.361 | 1.48배 | 59 → 87 |
| t3 폼 오류 | $0.240 → $0.504 | 2.10배 | 52 → 93 |
| t4 다크 모드 | $0.251 → $0.455 | 1.81배 | 62 → 103 |

비용은 Claude Code가 보고한 정가 기준 `total_cost_usd`다. 늘어난 이유는 대부분 가이드를 읽은 입력 토큰이다. t3에서는 실행마다 가이드 3개(`validate-input-after-interaction`, `accessible-error-announcement`, `required-field-feedback`)를 읽었고, 캐시를 포함한 입력 토큰이 평균 17만 9천에서 33만 2천으로 늘었다. 스킬 설명 자체는 작지만, 한 번 가이드를 꺼내면 과제당 수만 토큰이 더해진다. 작은 페이지에서 과제 하나를 처리한 비용이라, 큰 코드베이스에서 여러 기능을 건드리면 차이는 더 커질 수 있다.

### 실험의 한계

과제 4개, 조건당 3번, 모델 하나다. 정규식으로 API 사용 여부만 셌고, 브라우저에서 동작이나 접근성을 채점하지 않았다. Chrome 팀의 eval은 215개 과제, 약 1,800개 단언을 Playwright로 채점해서 Claude Code(Opus 5.5)가 57%에서 88%로, Codex(GPT-6.1 Sol)가 54%에서 82%로, Antigravity(Gemini 4 Argon)가 58%에서 94%로 올랐다고 보고한다(11월 8일, README). 다만 채점 기준인 `expectations.md`를 가이드 작성자가 같이 쓰므로, 이 수치는 "가이드가 정한 방식을 얼마나 따랐는가"를 재는 성격이 강하다. 필자의 실험도 같은 한계가 있다. 앵커 포지셔닝 툴팁이 JS 좌표 계산보다 실제 사용자에게 나은지는 브라우저 분포와 폴리필 비용까지 봐야 판단할 수 있다.

## 설치와 적용

### 설치

Claude Code에서는 플러그인 마켓플레이스로 설치한다.

```sh
/plugin marketplace add GoogleChrome/modern-web-guidance
/plugin install modern-web-guidance@googlechrome
```

Claude Code 공식 플러그인 디렉터리에 올라간 버전은 11월 12일 기준 v0.0.194에 고정돼 있어서 업데이트 경고가 계속 뜬다는 이슈(#3533)가 있다. 문서는 위처럼 GitHub 마켓플레이스에서 설치하라고 안내한다. Codex는 `codex plugin marketplace add GoogleChrome/modern-web-guidance`, 여러 에이전트에 한꺼번에 넣으려면 `npx modern-web-guidance@latest install`을 쓴다.

설치 후 확인할 것은 세 가지다.

- **텔레메트리.** CLI는 설치 수, 호출한 에이전트 이름, 꺼낸 가이드 id, 에이전트가 만든 검색어를 Google에 보낸다. 사용자 프롬프트 원문은 보내지 않는다고 README에 적혀 있다. 끄려면 셸 설정에 `export DISABLE_TELEMETRY=1`을 넣는다. Paul Irish도 Show HN 글의 예시 명령에 모두 이 변수를 붙였다.
- **권한 허용 목록.** `npx -y modern-web-guidance@latest *`만 허용한다. `npx *` 전체를 허용하면 에이전트가 임의의 패키지를 실행할 수 있다.
- **네트워크.** 호출할 때마다 npm에서 최신 버전을 받는다. 샌드박스에서 네트워크가 막혀 있으면 첫 호출 전에 허용해 두거나 `npx --offline`을 쓴다.

### 어떤 프로젝트에 맞나

이득이 큰 경우는 프레임워크와 상관없이 웹 UI를 새로 만들거나 고치는 일이 잦고, 사용자 브라우저가 최신 버전 위주인 프로젝트다. 실험에서 보듯 차이는 툴팁, 폼 검증, 테마처럼 최근 2\~3년 사이 표준화된 기능에서 난다. 기존 코드베이스를 정리할 때는 `legacy-scan`으로 낡은 패턴을 찾을 수 있다. 다만 스캔 규칙은 가이드의 약 20%에만 있고, 1.0.0에서는 파일 5,000개를 넘으면 조용히 멈춘다는 이슈(#3596)가 열려 있다. 6만 4천 파일짜리 모노레포에서 5건만 찾던 것이 상한을 풀자 47건이 나왔다는 보고다.

부담이 되는 경우도 분명하다.

- **지원 브라우저가 오래된 프로젝트.** 기업 내부 시스템처럼 구형 브라우저를 지원해야 하면 기본값(Widely available + 폴백)도 맞지 않을 수 있다. 이때는 AGENTS.md에 지원 범위를 적고, 필요하면 `.mwgrc`의 `baseline`에 연도를 지정한다.
- **폴리필을 외부에서 받으면 안 되는 프로젝트.** 앞의 실험처럼 CDN `@latest`를 부르는 코드가 나올 수 있다. "폴리필은 패키지로 설치해 번들에 넣는다. CDN에서 불러오지 않는다" 같은 규칙을 AGENTS.md에 같이 적는다.
- **토큰 예산이 빠듯한 작업.** 웹 UI 과제 하나에 비용이 1.3\~2.1배 들었다. 웹 UI가 아닌 작업에서는 스킬 설명이 켜지지 않게 되어 있지만, 웹 작업이 많은 팀이라면 월 청구액에서 차이가 보일 것이다.

AGENTS.md에 넣을 브라우저 정책은 SKILL.md의 예시를 바탕으로 이렇게 쓸 수 있다.

```md
## Browser Support
- Target: Baseline Widely available, plus Safari 17.4+ on iOS.
- Newly available features are allowed only with feature detection and graceful degradation.
- Fallback code must add 20 lines or less and no new runtime dependencies.
- Install polyfills from npm and bundle them. Never load scripts from a CDN.
```

### 효과를 재는 방법

도입할지 판단하려면 자기 프로젝트에서 작게 재 보는 편이 낫다. 최근에 한 웹 UI 작업 중 5개쯤 골라, 스킬 없이 한 번, 스킬을 켜고 한 번씩 같은 프롬프트로 돌린다. 결과에서 볼 것은 세 가지다.

1. 리뷰에서 "브라우저 기능으로 대신할 수 있다"고 지적했을 코드가 줄었는가. 실험의 `analyze.py`처럼 정규식으로 API 사용을 세거나, 팀이 자주 고치는 패턴 목록으로 grep한다.
2. 지원 브라우저에서 실제로 동작하는가. 최신 기능을 쓴 코드는 Safari와 Firefox에서 폴백이 맞게 동작하는지 따로 확인해야 한다. Chrome 팀이 Playwright 채점기를 쓰는 이유이기도 하다.
3. 과제당 비용과 시간이 얼마나 늘었는가. Claude Code의 `--output-format stream-json` 결과에 있는 `total_cost_usd`와 사용량으로 비교한다.

1번이 줄지 않았는데 3번만 늘었다면, 지금 쓰는 모델이 이미 그 영역을 알고 있다는 뜻이다. 그런 팀은 스킬 대신 자주 틀리는 몇 가지만 AGENTS.md에 적는 편이 낫다.

## 팀 규칙을 같은 구조로 배포할 때

Modern Web Guidance는 사내 코딩 규칙, 디자인 시스템 사용법, 내부 API 가이드를 에이전트에게 배포하려는 팀에게도 참고가 된다. 가져올 만한 설계는 다음과 같다.

**항상 읽히는 부분과 필요할 때 읽는 부분을 나눈다.** 항상 컨텍스트에 들어가는 것은 언제 켜질지 적은 짧은 설명뿐이고, 본문은 id로 꺼낸다. 규칙이 몇 개 안 되고 거의 모든 작업에 해당한다면 Vercel eval처럼 AGENTS.md에 직접 두는 편이 낫다. Vercel은 8KB로 줄인 문서 색인을 AGENTS.md에 넣었을 때 100%, 스킬로 줬을 때 53%(명시적으로 지시하면 79%)라는 결과를 냈다. 반대로 Modern Web Guidance처럼 문서가 2MB에 이르면 AGENTS.md에 다 넣을 수 없다. 규칙 양과 해당 작업의 비율을 보고 고른다. 규칙마다 어디에 두는 게 맞는지는 [#77](/blog/77-i-have-adhd-skill/)에서, AGENTS.md를 어떤 에이전트가 어떻게 읽는지는 [#66](/blog/66-agents-md-claude-code/)에서 다뤘다.

**바뀌는 사실은 데이터에서 생성한다.** 브라우저 지원 문장을 가이드 작성자가 쓰지 않고 web-features 데이터로 채우듯, 사내 규칙에서도 지원 버전, 지원 중단 일정, API 엔드포인트 목록처럼 자주 바뀌는 값은 원본 데이터에서 빌드 때 채운다. 그래야 주 단위 갱신이 사람 손을 거치지 않는다.

**가이드마다 채점 기준을 같이 만든다.** `expectations.md`와 Playwright 채점기를 가이드와 함께 쓰고, 정답 패치에서는 100% 통과, 아무것도 안 바꾼 앱에서는 0% 통과하는지 먼저 확인한다. 그 뒤 가이드를 켠 실행과 끈 실행의 통과율 차이를 잰다. 가이드 없이도 통과하는 항목은 지우는 후보가 된다. 원본 저장소에는 가이드를 켠 실행과 끈 실행의 통과율 차이가 작은 가이드를 지울지 논의하는 이슈(#3234)도 열려 있다. Claude Code의 plugin eval로 같은 비교를 하는 방법은 [#65](/blog/65-claude-plugin-eval/)에, 모델이 바뀌어도 eval이 남는다는 이야기는 [#44](/blog/44-surviving-model-churn/)에 있다.

**프로젝트마다 다른 정책은 설정 파일로 받고 코드에서 적용한다.** `.mwgrc`처럼 프로젝트 루트의 설정 파일을 CLI가 읽어서 가이드를 거르거나 안내문을 앞에 붙이면, 같은 가이드를 여러 팀이 다른 기준으로 쓸 수 있다. 프롬프트로 "우리 팀은 Safari 16을 지원한다"고 매번 말하는 것보다 확실하다.

**작성 저장소와 배포 저장소를 나눈다.** 원본 저장소에는 채점기, 정답 패치, 평가 결과처럼 에이전트가 읽을 필요 없는 파일이 많다. 배포용 저장소에는 스킬, 가이드, 매니페스트만 두고 봇이 주기적으로 올린다. 에이전트별 매니페스트는 하나의 스킬 폴더를 가리키게 해서, 지원 에이전트를 늘릴 때 파일 하나만 추가하면 되게 한다.

**운영 주체를 문서로 남긴다.** 원본 저장소의 `GOVERNANCE.md`는 새 가이드 작성 권한을 검증된 전문가(Peer)로 제한하고, 분야별 책임자(Content ATL)가 검토와 머지를 맡게 한다. 이유는 "가이드가 AI 코딩 도구에 직접 들어가기 때문"이라고 적혀 있다. 사내 규칙도 에이전트가 그대로 따르는 이상, 누가 고칠 수 있고 누가 승인하는지 정해 두는 편이 안전하다.

## 정리

Modern Web Guidance는 웹 지식 전체를 에이전트에 넣으려 하지 않는다. 항상 읽히는 것은 약 200토큰의 스킬 설명이고, 가이드 209개는 검색과 retrieve로 필요할 때만 꺼낸다. 가이드의 호환성 문장은 web-features 데이터에서 생성되어 주 2회 갱신되고, 프로젝트별 브라우저 범위와 실험 기능 허용 여부는 `.mwgrc`를 CLI가 읽어 적용한다. 어떤 가이드를 남길지는 가이드를 켠 실행과 끈 실행을 비교하는 eval로 정한다.

필자의 실험(과제 4개, 조건별 3번, Opus 5.5)에서 `<dialog>` 확인 창은 스킬 없이도 거의 같은 코드가 나왔다. 앵커 포지셔닝 툴팁, `:user-invalid`, `light-dark()`처럼 최근 기능에서는 생성 코드가 바뀌었고, 비용은 과제당 1.3\~2.1배 늘었다. 스킬을 켜도 12번 중 2번은 가이드를 읽지 않았고, 폴리필을 CDN `@latest`에서 불러오는 코드도 나왔다. 도입하려면 AGENTS.md에 브라우저 지원 범위와 의존성 규칙을 같이 적고, 자기 프로젝트의 과제로 켠 결과와 끈 결과를 먼저 비교해 보는 것이 좋다.

이 글의 근거는 두 저장소의 코드와 커밋 이력(배포용 `4dd9683`, 11월 10일), npm CLI 1.0.0 실행 결과, 공식 발표 글, Hacker News와 GitHub 이슈, 필자의 실험이다. 실험은 브라우저 동작과 접근성을 채점하지 않았고, Chrome 팀의 eval 수치는 외부에서 재현하지 않았다.

- 저장소: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), [modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)
- 발표: [Modern Web Guidance 1.0 (Chrome for Developers)](https://developer.chrome.com/blog/modern-web-guidance-v1), [Show HN](https://news.ycombinator.com/item?id=50443812)
- 비교: [Vercel, AGENTS.md outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- 관련 글: [#91 DeepSeek Super-Agent](/blog/91-deepseek-super-agent/), [#77 i-have-adhd](/blog/77-i-have-adhd-skill/), [#66 AGENTS.md와 Claude Code](/blog/66-agents-md-claude-code/), [#65 Claude Code 플러그인 평가](/blog/65-claude-plugin-eval/), [#44 모델이 바뀌어도 남는 것](/blog/44-surviving-model-churn/)
