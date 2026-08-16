---
title: "xAI의 24시간 AI 팀원 Grok Bot — 편한 이유와 위험한 이유가 같다"
summary: "8월 11일, xAI가 상주형 AI 팀원 Grok Bot을 베타로 내놨다. 슬로건은 'Bots have their own computer'인데 문서를 열면 다르게 적혀 있다 — 컴퓨터는 계정당 한 대고, 모든 봇이 파일·브라우저 세션·CLI 크리덴셜을 공유하며, 봇 간 분리를 보안 경계로 쓰지 말라고 공식 문서가 직접 말한다. 이 상주 설계가 파는 가치(로그인 한 번, 셋업 반복 없음, 누적되는 컨텍스트)와 만들어내는 위험(신뢰불가 입력 + 크리덴셜 상주 + 외부 통신)은 같은 곳에서 나온다. 같은 카테고리의 Claude Cowork·Claude Code, ChatGPT Work·Codex가 상태와 격리를 어떻게 다르게 설계했는지 비교하고, 공식 보안 문서에 '프롬프트 인젝션'이라는 단어가 한 번도 안 나온다는 사실, 그리고 그래도 써 보겠다면 지켜야 할 수칙까지 정리했다."
date: "2026-08-16T14:00:00"
tags:
  - agent-engineering
  - ai-agent
  - multi-agent
  - security
  - productivity
draft: false
---

8월 11일, xAI가 [Grok Bot](https://x.ai/news/introducing-grok-bot)을 얼리 베타로 공개했다. 동료에게 하듯 메시지로 일을 시키면 클라우드에서 24시간 돌아가는 AI 팀원이라는 제품이다. 슬로건은 "Bots have their own computer" — 봇들이 자기 컴퓨터를 갖고 있다는 얘기다.

그런데 [공식 문서](https://docs.x.ai/grok-bot/overview)를 열면 첫머리부터 다르게 적혀 있다. "All of your Bots use the same persistent cloud computer." 컴퓨터는 봇마다 한 대가 아니라 계정당 한 대고 모든 봇이 그 위에서 파일과 브라우저 세션과 로그인을 공유한다. [보안 문서](https://docs.x.ai/grok-bot/approvals-security-and-privacy)는 여기에 못을 박는다 — **"Do not use separate Bots as a security boundary."**

이 글에서 하려는 건 두 가지다. 하나는 이 상주 설계가 뭘 팔고 뭘 포기했는지 문서 기준으로 읽는 것. 다른 하나는 같은 카테고리에 이미 나와 있는 Anthropic·OpenAI 쪽 제품(Claude Cowork와 Claude Code, ChatGPT Work와 Codex)이 같은 문제를 어떻게 다르게 설계했는지 비교하는 것이다.

---

## 무엇이 나왔나 — 메시지로 일을 시키는 상주 에이전트

제품의 뼈대는 컴퓨터 사용, 시연 학습, 루틴, 봇 간 협업 네 가지다.

우선 **컴퓨터 사용(computer use)**. 봇이 클라우드 컴퓨터에서 브라우저와 데스크톱 앱을 사람처럼 조작한다. 문서는 커넥터(API·MCP)가 있으면 그쪽을 먼저 쓰라고 권하지만 이 제품의 셀링 포인트는 반대쪽이다 — API가 없는 툴, 화면밖에 없는 사내 시스템에서도 일이 된다는 것.

여기에 **시연 학습이** 붙는다. "Teach a task" 기능으로 브라우저 워크플로우를 말로 설명하는 대신 한 번 해 보이면 봇이 그걸 스킬 초안으로 만든다. 스킬에는 언제 쓰는지부터 필요한 입력과 접근 권한, 작업 순서, 결과 검증법, 반환할 것, 승인이 필요한 지점까지 담긴다. 만들어진 스킬은 **루틴으로** 묶어 정시("평일 아침 8시")나 이벤트(Slack 메시지, GitHub 알림)에 걸어 자동 실행한다. 마지막이 **봇 간 협업이다.** 봇끼리 스레드에서 메시지를 주고받고, 그룹챗에 넣어두면 자기들끼리 일을 나누고 소유권을 넘긴다. xAI 내부에서는 chief of staff 봇 하나가 위에서 조율하고 영역별 전문 봇을 아래에 두는 식으로 쓴다고 한다.

가용성은 macOS·Windows 데스크톱과 iOS다. 단품 판매 없이 SuperGrok Heavy와 Cursor Ultra(월 $200), Cursor Teams Premium(월 $120/시트) 구독에 번들로 들어가고 엔터프라이즈는 대기열이다. Cursor 플랜이 끼어 있는 게 의아할 수 있는데 배경이 있다 — SpaceX가 2월에 xAI를 흡수해 "SpaceXAI"가 됐고, 6월에 Cursor(Anysphere)를 600억 달러에 인수한다고 발표했고, 그 인수가 이 글을 쓰기 전날인 8월 14일에 완료됐다. Grok Bot 로그인도 "Sign in with Cursor"다. 구동 모델은 발표문에 명시가 없다. 같은 주에 나온 Grok 4.6이 얹힌 것으로 알려져 있다.

## "자기 컴퓨터"의 실체 — 계정당 한 대, 화면만 봇마다

상주 컴퓨터의 장점은 분명하다. 로그인을 한 번 하면 다음 작업부터는 안 해도 된다. 파일과 브라우저 상태가 남아 있으니 봇 사이에 일을 넘길 때 셋업을 반복하지 않는다. 문서 표현으로는 "Context compounds instead of resetting to a fresh environment on every task". 태스크 단위로 새 환경을 받는 기존 에이전트 제품들과 가장 크게 갈라지는 부분이고 솔직히 써 보고 싶어지는 대목이기도 하다.

로그인 방식도 문서에 구체적으로 나온다. 비밀번호·패스키·2단계 인증·CAPTCHA·결제 확인은 봇이 하지 않는다. 사용자가 원격 화면을 넘겨받아(take control) 막힌 단계만 직접 처리하고 봇에게 계속하라고 말한다. 채팅에 비밀번호나 일회용 코드를 붙여넣지 말라는 경고도 있다. 즉 봇이 크리덴셜 문자열을 받는 게 아니라 사용자가 만들어 준 **로그인된 세션을** 물려받는다.

문제는 그 세션이 어디까지 공유되느냐다. 문서 그대로 옮기면 이렇다. 컴퓨터는 계정 단위로 격리되고 봇 단위가 아니다("isolated to your account, not to an individual Bot"). 브라우저 쿠키와 로그인 세션은 공유된다. 파일은 모든 봇에게 보인다. CLI에 넣은 크리덴셜은 봇 전체가 쓸 수 있다. 봇마다 화면은 따로 받지만 문서는 거기에 선을 긋는다 — "The screens are separate work surfaces, **not separate security boundaries**." 영업 봇에게 준 CRM 로그인과 경리 봇에게 준 은행 세션이 같은 컴퓨터에 놓인다. 봇을 역할별로 나누는 건 업무 조직화지 권한 분리가 아니라는 걸 xAI 문서 스스로 말하고 있다.

## Cowork·Work·Codex — 같은 문제, 다른 설계

이 카테고리 자체는 Grok Bot이 처음 연 게 아니다. Anthropic이 1월 12일 [Claude Cowork](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/)를 내놨다. Claude Code와 같은 기반으로 만든 비개발자용 업무 에이전트로, 보도로는 Claude Code를 시켜 10일 만에 만들었다고 한다. 데스크톱 앱에서 로컬 폴더 접근 권한을 주고 일을 시키는 방식으로 시작했고 7월에 웹·모바일로 확장되면서(Max 전용) 노트북을 덮어도 클라우드에서 작업이 이어지게 됐다. OpenAI는 7월 9일 GPT-5.6과 함께 [ChatGPT Work](https://www.forbes.com/sites/madhulika-pathak/2026/07/09/openai-debuts-chatgpt-work-workplace-ai-agent-with-gpt-56/)를 내놨다. 연결된 앱에서 정보를 모아 몇 시간짜리 일을 단계로 나눠 해내는 에이전트로, Codex 기술이 안에 들어 있다. 팀용으로는 4월에 나온 workspace agents가 있다 — 커스텀 GPT의 후속으로, 사용자가 로그오프해도 클라우드에서 돌고 Slack 채널에 팀원처럼 들어간다.

기능 축만 놓고 보면 세 회사는 거의 수렴했다. 시연 학습은 OpenAI에도 있고(Mac 앱·Codex의 Record & Replay — 워크플로우를 보여주면 재사용 가능한 스킬로 변환) 스케줄 실행과 백그라운드 클라우드 실행은 셋 다 있다. Cowork 확장 때 Anthropic이 공개한 사용 데이터를 보면 이 카테고리가 어디로 가는지 읽힌다. 60만 조직 120만 세션에서 소프트웨어 개발은 8.7%뿐이었다. 업무 프로세스 33.4%, 콘텐츠 작성 16.4%. 코딩 에이전트를 만들던 회사들이 전부 사무 에이전트를 팔기 시작했고 수요도 실제로 거기에 있다.

갈라지는 축은 상태와 격리다. 에이전트가 일을 이어서 하려면 상태가 남아 있어야 하고, 상태가 남으면 위험도 남는다. 이 문제에 세 회사가 다른 답을 냈다.

| 축 | Grok Bot (xAI) | Claude (Anthropic) | OpenAI |
|---|---|---|---|
| 실행 환경 | 계정당 상주 컴퓨터 1대, 전 봇 공유 | 세션마다 격리된 클라우드 VM (Claude Code on the web) | Codex cloud는 태스크마다 새 컨테이너 (12시간 캐시) |
| 로그인·크리덴셜 | 세션·쿠키·CLI 크리덴셜이 봇 전체에 상주 | 크리덴셜 프록시 — 토큰을 VM 안에 직접 넣지 않음 | cloud browser만 로그인 세션 유지, takeover 중 스크린샷 차단 |
| 시연 학습 | Teach a task → 스킬 | Skills (파일 기반, 사용자 작성) | Record & Replay → 스킬 |
| 스케줄 | 루틴 (정시·이벤트) | Routines (cron·GitHub 이벤트) | Scheduled Tasks (시간당 1회 수준 캡) |
| 에이전트 간 협업 | 봇끼리 그룹챗·소유권 이전 | Agent Teams (실험 단계) | 대응물 확인 안 됨 |
| 타깃 | 비개발자 팀원 (영업·운영·경영지원) | Cowork 비개발자 / Claude Code 개발자 | Work 개인 / workspace agents 팀 |

표에서 두 칸이 눈에 띈다. 하나는 격리 칸이다. Grok Bot만 한 대에 전부 올리고, 나머지 둘은 실행 환경을 태스크·세션 단위로 자르고 크리덴셜을 환경 밖에 둔다. OpenAI의 cloud browser가 로그인 세션을 유지하는 게 그나마 비슷한 지점인데 거기도 사이트 단위 접근 허가와 구매·제출 같은 액션별 확인이 겹겹이 있다. 다른 하나는 협업 칸이다. 확인된 범위에서 이건 Grok Bot 고유 기능이다. 그리고 두 칸은 사실 하나의 설계 결정이다. 격리를 포기했기 때문에 봇 사이에 파일과 세션을 그대로 넘기는 핸드오프가 싸고 매끄럽다.

## 보안 문서에 없는 단어

에이전트 보안에서 최악의 조합으로 꼽히는 세 요소가 있다. 신뢰할 수 없는 입력 처리, 민감한 크리덴셜 접근, 외부로 나가는 통신. 셋이 한 에이전트에 모이면 악성 웹페이지나 메일 한 통이 에이전트를 조종해 데이터를 빼돌릴 통로가 생긴다(Simon Willison이 lethal trifecta라고 이름 붙인 조합이다). Grok Bot은 셋 다 제품 사양으로 갖고 있다. 신뢰불가 입력은 웹과 인박스를 읽는 업무 그 자체로, 크리덴셜은 상주하는 로그인 세션으로, 외부 통신은 메시지 발송 기능으로 들어와 있다.

그래서 공식 보안 문서를 열어봤는데 **"prompt injection"이라는 단어가 한 번도 나오지 않는다.** 문서의 위험 프레이밍은 승인과 크리덴셜 위생이 전부다. 메시지 발송·콘텐츠 게시·구매와 이체·데이터 삭제·권한 변경·프로덕션 변경·약관 동의는 승인 뒤에 두고, 민감한 임시 파일은 작업이 끝나면 지우고, 다 쓴 커넥터는 권한을 회수하라고 한다. 방향 자체는 맞는 말인데 전부 사용자가 할 일이고, 악성 입력이 봇을 조종하는 시나리오에 대한 완화책은 문서에 없다. 승인의 한계도 문서가 직접 인정한다 — "An approval controls the proposed action. It does not reverse work already completed."

경쟁사 문서와 나란히 놓으면 공백이 더 잘 보인다. OpenAI는 프롬프트 인젝션 전용 문서를 여러 편 운영하고 비즈니스 플랜에 Lockdown Mode를 기본 적용하기 시작했다. Anthropic은 Claude Code 클라우드 세션의 VM 격리·네트워크 접근 제어·크리덴셜 프록시를 보안 문서에 명시한다. xAI에 이게 남 얘기가 아닌 게, X 위의 Grok은 이미 모스 부호로 위장한 인젝션에 속아 한 사용자가 AI 지갑에서 15만 달러를 빼 간 [사고 이력](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet)이 있다. 그때는 지갑 하나였지만 이번 제품에는 계정의 모든 로그인이 놓여 있다.

성능 쪽도 검증할 길이 없다. 출시 자료의 근거는 데모와 내부 증언("검토를 내가 안 해도 되니 2~3배 효율적")뿐이고, 성공률·인간 개입률·대표 태스크셋 같은 수치는 공개된 게 없다. 봇이 뭘 했는지 돌아보는 감사 로그는 예고만 있고 아직 없다.

## 쓸 거면 이렇게

그래도 이 제품이 여는 영역은 실재한다. API가 없고 화면밖에 없는 툴로 돌아가는 반복 사무 워크플로우 — 지금까지 자동화 사각지대였던 곳이다. 시험해 볼 거라면 판단 기준과 수칙을 이렇게 잡는 게 좋겠다.

**맡길 일 고르기.** 잘못돼도 되돌릴 수 있는 일, 결과를 사람이 검수하고 내보내는 일부터. 문서의 승인 목록(발송·게시·결제·삭제)은 출발점으로 삼되 거기서 멈추면 안 된다 — 승인은 롤백이 아니라는 문서 문구를 기준으로 잡을 것.

**격리는 계정 단위로 직접 만들기.** 봇 간 격리가 없으니 민감도가 다른 업무는 계정을 분리하는 수밖에 없다. 봇 전체가 공유해도 되는 권한만 이 계정에 준다는 원칙으로 시작하고, 은행·결제·프로덕션 접근은 아예 이 컴퓨터에 올리지 않는다.

**크리덴셜은 takeover로만.** 문서가 시키는 대로 채팅에 비밀번호를 치지 말고, 로그인이 필요하면 화면을 넘겨받아 직접 한다. 그리고 정기적으로 다 쓴 커넥터 권한을 회수한다. 이건 xAI가 대신 해 주지 않는다.

**개발 작업은 이쪽으로 가져오지 않기.** 코드 작업은 격리 VM과 크리덴셜 프록시, 감사 로깅이 있는 Claude Code·Codex 쪽이 설계상 맞다. Grok Bot의 자리는 그 도구들이 못 닿는 GUI 전용 업무다.

카테고리 전체로 보면, [#39](/blog/39-ide-to-ade/)에서 봤던 "에이전트를 쓰는 사람의 하루를 제품화한다"는 흐름이 개발 밖으로 번진 게 올해 상반기다. 1월 Cowork, 7월 Work, 8월 Grok Bot — 코딩 에이전트를 만들던 세 회사가 반년 사이에 전부 사무직 팀원을 팔기 시작했다. 기능은 이미 비슷하니 다음 분기점은 신뢰다. [#50](/blog/50-tencentdb-agent-memory/)에서 에이전트 메모리의 남은 숙제가 거버넌스라고 썼는데 상주형 팀원의 남은 숙제도 정확히 같다. 상태를 쌓는 능력은 다 만들었고, 그 상태에 경계를 긋는 일이 남았다.

---

*참고: [Introducing Grok Bot](https://x.ai/news/introducing-grok-bot) (xAI, 2026-08-11), [Grok Bot docs — Overview](https://docs.x.ai/grok-bot/overview)·[Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)·[Approvals, security and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)·[Skills, routines and automations](https://docs.x.ai/grok-bot/skills-routines-and-automations) (인용문은 게재 시점 문서 기준), [Claude Cowork expands to mobile and web](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/) (TechCrunch, 2026-07-07), [OpenAI debuts ChatGPT Work](https://www.forbes.com/sites/madhulika-pathak/2026/07/09/openai-debuts-chatgpt-work-workplace-ai-agent-with-gpt-56/) (Forbes, 2026-07-09), [Codex cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment)·[Cloud browser](https://learn.chatgpt.com/docs/browser)·[Record & Replay](https://learn.chatgpt.com/docs/extend/record-and-replay) (OpenAI 문서), [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)·[Security](https://code.claude.com/docs/en/security) (Anthropic 문서), [SpaceX Completes $60 Billion Cursor Acquisition](https://www.bloomberg.com/news/articles/2026-08-14/spacex-completes-its-60-billion-cursor-acquisition) (Bloomberg, 2026-08-14), [How Grok got prompt injected](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet) (Giskard). Grok Bot의 효율 증언은 xAI 출시 자료 내 익명 사용자 인용이며 독립 검증이 없다. Cowork 사용 비중(8.7% 등)은 Anthropic 자체 공개 데이터다. IDE에서 ADE로 넘어가는 흐름은 [#39](/blog/39-ide-to-ade/), 에이전트 메모리 거버넌스는 [#50](/blog/50-tencentdb-agent-memory/) 참고.*
