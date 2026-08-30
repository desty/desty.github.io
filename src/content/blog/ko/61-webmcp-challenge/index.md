---
title: "웹페이지를 AI 도구로 바꾸면 3천 달러 — OpenAI WebMCP 챌린지"
summary: "OpenAI가 10일짜리 WebMCP 챌린지를 열었다. 상위 10개 제출작에는 각각 3천 달러와 ChatGPT Pro 1년 이용권이 주어진다. WebMCP는 에이전트가 화면을 보고 버튼을 추측하는 대신, 웹페이지가 자신의 기능을 구조화된 도구로 직접 제공하게 한다. 기존 MCP와 무엇이 다른지, OpenAI가 내부 평가 작업에 어떻게 쓰고 있는지, 아직 남은 브라우저 지원과 보안 한계까지 살펴봤다."
date: "2026-08-30T21:21:00"
tags:
  - webmcp
  - browser-agents
  - agent-engineering
  - codex
  - web-platform
draft: false
---

웹페이지에 AI가 호출할 수 있는 도구를 붙이면 3천 달러를 받을 수 있다. 한 팀만이 아니다. OpenAI는 8월 25일부터 9월 3일까지 열흘 동안 진행하는 [WebMCP 챌린지](https://openai.com/ko-KR/webmcp-challenge/)를 열고, 상위 10개 제출작에 각각 3천 달러와 ChatGPT Pro 1년 이용권, Codex Micro 키보드를 주기로 했다. Shopify, Google Chrome, Netlify, Cloudflare, Vercel, Render도 추가 상품을 보탠다.

기존 앱을 WebMCP용으로 처음부터 다시 만들 필요도 없다. 이미 운영 중인 웹앱에 WebMCP 지원만 추가해도 제출할 수 있다. 실제로 작동하는 라이브 앱, 코드 저장소, 설명과 데모 영상을 준비하면 된다. 심사 기준에는 유용성·독창성·완성도와 함께 “WebMCP의 사려 깊은 활용”과 사람-에이전트 경험의 품질이 들어간다.

상금이 입구라면, 챌린지가 요구하는 변화는 더 크다. 지금 브라우저 에이전트는 사람용 화면을 보고 버튼의 의미와 클릭 순서를 추측한다. WebMCP를 지원하는 페이지는 자신이 할 수 있는 일을 이름·설명·입력 스키마가 있는 도구로 직접 알려준다.

```text
지금의 브라우저 자동화
에이전트 → 화면·DOM 관찰 → 버튼 추측 → 클릭 → 결과 확인 → 실패하면 재시도

WebMCP
에이전트 → 페이지가 공개한 도구 발견 → 구조화된 인자 전달 → 페이지가 실행
```

**사람에게는 버튼과 캔버스를 그대로 보여주고, 에이전트에게는 같은 기능의 사용 설명서를 함께 건네는 웹**이다.

## 웹페이지 안에 도구를 등록한다

WebMCP는 아직 완성된 웹 표준이 아니라 [Web Machine Learning Community Group에서 논의 중인 실험적 제안](https://github.com/webmachinelearning/webmcp)이다. 핵심 API는 `document.modelContext`다. 페이지가 로드될 때 JavaScript 함수 하나를 도구로 등록할 수 있다.

```js
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "add_todo",
    description: "현재 목록에 할 일을 추가한다.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "추가할 할 일" },
      },
      required: ["text"],
      additionalProperties: false,
    },
    execute: async ({ text }) => {
      const item = await addTodo(text);
      return { id: item.id, text: item.text };
    },
  });
}
```

호환되는 브라우저 에이전트가 이 페이지를 열면 `add_todo`라는 이름과 설명, `text`라는 필수 입력을 발견한다. “내일 오후 3시에 세금 신고하기를 추가해줘”라는 요청을 받았을 때 화면에서 입력창을 찾고 좌표를 계산하는 대신 `add_todo({ text: "내일 오후 3시에 세금 신고하기" })`를 호출한다. 페이지는 이미 쓰고 있던 `addTodo` 로직으로 데이터를 저장하고 화면도 함께 갱신한다.

도구가 하는 일은 페이지 개발자가 정한다. 문서 편집기는 섹션 검색과 댓글 추가를, 대시보드는 날짜 범위 변경과 차트 원본 데이터 조회를, 여행 계획 앱은 일정 추가와 지도 이동을 노출할 수 있다. 작업 단계가 바뀌면 도구를 동적으로 등록하거나 해제할 수도 있다. 사용자가 상품을 고르기 전에는 `filter_products`만 보이다가, 장바구니가 생긴 뒤 `checkout`이 나타나는 식이다.

별도의 선언형 제안도 있다. 기존 `<form>`에 도구 이름과 설명을 붙이면 브라우저가 입력 필드를 JSON Schema로 변환하는 방식이다.

```html
<form
  toolname="Search flights"
  tooldescription="출발지와 도착지로 항공편을 검색한다"
  toolautosubmit
>
  <!-- 기존 입력 필드 -->
</form>
```

새 프레임워크를 들이지 않고 시맨틱 HTML을 에이전트용 인터페이스로 재사용하려는 방향이다. 다만 제안서 전체와 지금 쓸 수 있는 기능은 다르다. OpenAI의 현재 구현인 Site tools는 JavaScript로 최상위 페이지에 등록한 도구만 지원하며, **폼 속성을 쓰는 선언형 API와 iframe 안의 도구는 아직 지원하지 않는다.**

## MCP와 이름은 같지만 자리가 다르다

WebMCP를 “브라우저에서 쓰는 MCP”라고만 설명하면 중요한 차이가 사라진다.

일반적인 MCP 서버는 에이전트 애플리케이션과 로컬 또는 원격 서버를 연결한다. 캘린더 MCP는 웹페이지가 열려 있지 않아도 일정을 검색하고 만들 수 있다. 서버 측 API, 인증, 장시간 작업과 백그라운드 자동화에 맞는다.

WebMCP 도구는 열린 페이지에 속한다. 페이지가 닫히거나 다른 주소로 이동하면 등록된 도구도 사라질 수 있다. 대신 사람과 에이전트가 **같은 화면, 같은 로그인 세션, 같은 현재 상태**를 공유한다.

| 구분 | MCP 서버 | WebMCP |
|---|---|---|
| 도구가 있는 곳 | 로컬·원격 서버 | 현재 열린 웹페이지 |
| 페이지가 없어도 실행 | 가능 | 기본적으로 불가능 |
| 인증과 상태 | 별도 연결·서버 구현 필요 | 현재 브라우저 세션 재사용 |
| 잘 맞는 작업 | 백그라운드 검색·레코드 관리·자동화 | 캔버스 편집·대시보드 탐색·공동 검토 |
| 사람에게 보이는 화면 | 없어도 됨 | 같은 페이지에서 결과 확인 |

그래픽 편집기를 생각하면 차이가 선명하다. 백엔드 MCP는 파일을 읽고 수정할 수 있지만, 사용자가 확대해 보고 있는 영역과 선택한 레이어, 아직 저장하지 않은 변경 상태까지 별도로 복제해야 할 수 있다. WebMCP는 열린 편집기에서 `select_layer`, `change_fill`, `duplicate_frame` 같은 도구를 실행하고 같은 캔버스를 갱신한다. 사람은 결과를 본 뒤 다시 손으로 조정할 수 있다.

둘 중 하나가 다른 하나를 없애는 관계는 아니다. WebMCP 제안서도 백엔드 통합의 대체가 아니라 보완이라고 명시한다. 페이지 없이 밤새 처리할 일은 MCP 서버가, 사람이 화면을 보며 함께 결정할 일은 WebMCP가 맡을 수 있다. 한 서비스가 둘을 모두 제공할 수도 있다.

## OpenAI 내부에서는 이미 평가 작업에 쓴다

챌린지용 데모만 있는 것도 아니다. OpenAI 엔지니어 Jeremy Lewi는 8월 25일 공개한 [Runme 사용기](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex)에서 모델과 기능을 출시하기 전에 반복하는 평가 작업을 Codex에 맡기는 흐름을 설명했다.

Runme는 Markdown, 코드 셀, 표와 차트를 한 문서에 담는 노트북형 웹앱이다. 엔지니어가 목표를 적으면 Codex가 이전 실행을 읽고 계획을 작성한다. 사람은 계획을 승인하고 중요한 선택에 개입하며, Codex는 실행한 명령·결과·막힌 경로와 판단을 같은 노트북에 남긴다. 다음 평가에서는 지난 기록이 다시 컨텍스트가 된다.

이 사례에서 WebMCP가 필요한 이유는 Runme의 배포 구조에 있다. Runme는 정적 웹사이트로 제공되는 클라이언트 애플리케이션이다. 전통적인 MCP 엔드포인트를 열기 위해 서버를 하나 추가하면 운영할 인프라가 생기고, 노트북 데이터가 처리되는 경계도 달라진다. Runme는 대신 브라우저에서 세 종류의 도구를 등록한다.

- 노트북 작업 지시 읽기
- 노트북을 읽거나 고치는 제한된 JavaScript 실행
- 애플리케이션 문서 읽기

Codex는 열린 Runme 페이지에서 그 도구를 호출한다. 사람은 같은 노트북을 보고 계획을 고치거나 승인을 내린다. WebMCP가 주장하는 “사람과 에이전트가 같은 페이지에서 협업한다”는 문장이 실제 운영 작업으로 이어진 사례다.

여기서 얻을 수 있는 더 큰 힌트는 서버 비용 절감보다 **상태의 주도권**이다. 백엔드 통합에서는 에이전트가 서비스 뒤에서 일하고 결과를 UI로 다시 밀어 넣어야 한다. WebMCP에서는 현재 페이지가 작업의 기록과 검토 화면으로 남는다. 에이전트가 웹을 우회하지 않고 웹 안으로 들어온다.

## 버튼을 잘 누르는 경쟁에서 도구를 잘 정의하는 경쟁으로

브라우저 에이전트는 지금까지 화면을 얼마나 잘 읽고 조작하는지로 평가받았다. 스크린샷에서 버튼을 찾고, DOM이나 접근성 트리에서 텍스트를 읽고, 스크롤 뒤 바뀐 화면을 다시 해석한다. 사람용 인터페이스가 조금만 바뀌어도 좌표와 선택자가 깨지고, 모달이나 가상 스크롤이 끼면 단계 수가 늘어난다.

WebMCP가 있으면 이 문제의 일부가 모델 능력에서 사이트 설계로 이동한다. 에이전트가 버튼을 더 잘 찾게 만드는 대신 사이트가 `search_flights`, `compare_options`, `add_to_itinerary`를 공개한다. 결과의 신뢰성은 화면 인식 성능만이 아니라 다음 질문에 달리게 된다.

- 도구를 사용자의 실제 목표 단위로 나눴는가
- 이름과 설명이 다른 도구와 구분되는가
- 입력 범위를 좁히고 부작용을 명시했는가
- 실행 결과를 사람이 확인할 충분한 정보를 돌려주는가
- 기존 인증·권한·입력 검증을 그대로 지키는가

웹사이트가 검색엔진에 제목과 구조화 데이터를 제공해 온 것처럼, 앞으로는 에이전트에게 수행 가능한 행동의 목록을 제공할 수 있다. 다만 이를 “에이전트 SEO”라고 부르기에는 이르다. WebMCP의 목표는 에이전트가 사이트를 더 자주 선택하게 만드는 순위 최적화가 아니라, **이미 열린 사이트에서 사람과 에이전트가 안정적으로 같은 일을 하게 만드는 실행 계약**에 가깝다.

## 지금은 어디서 작동하나

2026년 8월 30일 기준 구현 범위는 아직 좁다. [OpenAI 공식 Site tools 문서](https://learn.chatgpt.com/docs/webmcp)에 따르면 ChatGPT 데스크톱 앱의 내장 브라우저에서 ChatGPT Work와 Codex가 페이지의 도구를 발견하고 사용할 수 있다. GPT-5.6 Sol과 Terra를 지원하고 Luna에서는 비활성화돼 있으며, Enterprise와 Edu 워크스페이스에는 제공되지 않는다. 최신 앱 버전과 계정별 롤아웃 상태에도 영향을 받는다.

[WebMCP 구현 현황](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)에는 ChatGPT Desktop 지원 외에 Chrome 149 Origin Trial, Edge 150 Origin Trial, Brave의 실험 지원이 기록돼 있다. Firefox와 Safari는 표준 입장과 구현 논의 링크만 올라와 있다. 어느 브라우저에서나 바로 쓸 수 있는 Baseline 기능으로 보면 안 된다.

호환되지 않는 브라우저에서는 기존 UI가 계속 작동해야 한다. 공식 문서도 `document.modelContext?.registerTool` 존재 여부를 확인하고, WebMCP를 지원하지 않는 사람과 브라우저를 위해 정상 인터페이스를 유지하라고 안내한다. 지금의 WebMCP는 웹사이트를 대체하는 별도 앱이 아니라 점진적으로 붙이는 기능이다.

## 구조화된 도구가 안전한 도구는 아니다

화면을 추측하지 않고 정확한 함수를 호출하면 안정성은 높아진다. 그렇다고 보안 문제가 사라지지는 않는다. 공격 표면의 모양이 달라진다.

OpenAI 문서는 사이트가 제공하는 도구 정의와 결과를 **신뢰할 수 없는 콘텐츠**로 취급한다. `read_only`라고 이름 붙였다고 실제로 읽기만 한다는 보장은 없다. ChatGPT 내장 브라우저는 호출 전 안전 검토를 하고, 메시지 전송·구매·삭제·권한 변경 같은 중요한 작업에는 기존 확인 정책을 적용한다. 호출을 원래 페이지와 등록 도구에 연결해 기록하지만, 이 절차가 사이트 자체를 신뢰할 수 있게 만드는 것은 아니다.

WebMCP의 [보안·개인정보 자체 검토](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)는 더 미완성인 부분을 적어 둔다. API 자체가 개인정보를 새로 노출하지는 않지만, 사이트가 만든 도구는 민감한 데이터나 구매·계정 변경 같은 고권한 작업을 감쌀 수 있다. 악성 도구가 필요 이상의 입력값을 요구해 개인정보를 빼내는 문제도 있다. 현재 명세에는 민감하거나 고권한인 도구의 오용을 막는 규범적 지침이 없으며, 중대한 작업임을 표시하는 힌트도 향후 과제로 남아 있다.

따라서 WebMCP를 붙일 때는 클릭 자동화보다 더 엄격하게 도구 경계를 봐야 한다.

- 읽기와 쓰기 도구를 분리한다.
- 이메일 본문 전체처럼 불필요하게 넓은 입력을 요구하지 않는다.
- 구매·삭제·전송은 실행 전에 사람이 대상과 결과를 확인하게 한다.
- 페이지의 기존 인증·인가를 우회하지 않는다.
- 도구 설명과 반환값도 프롬프트 인젝션 입력이 될 수 있다고 가정한다.

구조화는 의미를 명확하게 만들 뿐, 신뢰를 자동으로 부여하지 않는다.

## 3천 달러보다 큰 신호

WebMCP 챌린지의 제출 마감은 9월 3일 오후 1시(태평양 시간), 한국 시간으로 9월 4일 오전 5시다. 개발자·창업자·디자이너·스타트업·독립 빌더가 참여할 수 있고, 새 앱뿐 아니라 기존 앱에 지원을 추가해도 된다. 3D 모델링, 협업 글쓰기, 십자말풀이, 여행 계획, 브라우저 내 데이터 분석 같은 예시도 공개돼 있다.

열흘은 웹 표준의 성패를 판단하기에는 짧고, 상금 3천 달러는 브라우저 생태계를 움직일 규모가 아니다. 중요한 신호는 OpenAI가 챌린지를 열고, Chrome·Cloudflare·Vercel·Shopify·Netlify·Render 관계자들이 후원과 심사에 모였으며, 동시에 내부 평가 워크플로에서 실제 WebMCP 사례를 공개했다는 조합이다. 이것이 곧 표준 채택을 보장하지는 않지만, “에이전트가 웹을 어떻게 써야 하는가”가 모델 회사만의 문제가 아니라 웹 플랫폼의 인터페이스 문제로 이동하고 있음을 보여준다.

사람용 웹은 버튼, 메뉴, 폼과 캔버스로 발전했다. 에이전트는 지금 그 표면을 카메라로 보고 손가락을 흉내 내며 사용한다. WebMCP는 표면 아래에 이미 있는 애플리케이션 로직을 도구로 꺼내겠다는 제안이다.

웹페이지를 AI 도구로 바꾼다는 말은 화면을 없앤다는 뜻이 아니다. **같은 페이지에 사람을 위한 인터페이스와 에이전트를 위한 실행 계약을 함께 두는 것**이다. 이번 챌린지가 찾는 것은 AI가 대신 클릭하는 사이트가 아니라, 사람과 AI가 같은 상태를 보고 서로의 작업을 검토할 수 있는 사이트다.

---

*참고: [OpenAI WebMCP 챌린지](https://openai.com/ko-KR/webmcp-challenge/), [OpenAI Site tools 문서](https://learn.chatgpt.com/docs/webmcp), [OpenAI의 Runme·WebMCP 사용기](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex), [WebMCP 제안서](https://github.com/webmachinelearning/webmcp), [구현 현황](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md), [선언형 API 제안](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md), [보안·개인정보 자체 검토](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)를 2026년 8월 30일 확인했다. 챌린지 일정·상품과 제품 지원 범위는 변경될 수 있다.*
