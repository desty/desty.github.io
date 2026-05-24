---
title: "AI와 함께 버그바운티 첫 리포트까지 — 바이브코딩으로 해킹하기"
summary: "버그바운티를 한 번도 해본 적 없는 상태에서, AI와 대화하며 하루 만에 첫 취약점을 발견하고 리포트를 제출한 경험을 공유한다. 코드는 한 줄도 직접 쓰지 않았다."
date: "2026-05-24T18:00:00"
tags:
  - bug-bounty
  - vibe-coding
  - security
  - ai-agent
  - race-condition
---

보안 전문가가 아니다. 개발은 하지만 해킹은 해본 적 없다. 그런데 AI 코딩 도구를 쓰다 보니 문득 생각이 들었다 — "이걸로 버그바운티를 할 수 있지 않을까?"

처음에는 자동화 시스템부터 만들려고 했다. 하지만 곧 생각을 고쳤다. **먼저 수동으로 해보고, 노하우가 쌓이면 그때 시스템화하자.** 이게 맞는 순서였다.

---

## 바이브코딩이란

바이브코딩(Vibe Coding)은 AI와 자연어로 대화하면서 코드를 만드는 방식이다. 내가 한 것도 정확히 이거다:

- "SAML 테스트 스크립트 만들어줘" → AI가 코드 작성 + 실행
- "결과 분석해줘" → AI가 응답 분석 + 다음 테스트 제안
- "환불 API에 race condition 테스트 코드 짜줘" → AI가 PoC 작성

**전통적 의미의 코드를 직접 타이핑하지 않았다.** 방향만 정하고, AI에게 실행을 맡겼다. 프롬프트 엔지니어링도 아니고, 그냥 한국어로 자연스럽게 대화했다.

---

## Day 1: 환경 셋업부터 취약점 발견까지

### 1단계: 타겟 결정

버그바운티 플랫폼에 가입하고, 프로모션이 걸린 프로그램을 찾았다. 한 핀테크 회사가 SAML 2.0 기능을 새로 출시하면서 보너스 보상을 걸어둔 상태였다.

AI에게 프로그램 전체 내용을 분석시켰다. 테스트해야 할 항목, 보상 구조, 주의사항을 모두 정리된 문서로 받았다.

### 2단계: SAML 테스트 환경 구축

SAML SSO 테스트를 위해 필요한 것:
- **Okta Developer** (무료 IdP)
- **mitmproxy** (HTTP 프록시)
- **Burp Suite** (처음에 시도했지만 Cloudflare에 막힘)

여기서 첫 번째 난관. Burp Suite의 내장 브라우저도, 일반 브라우저도 Cloudflare가 차단했다. Python requests로 직접 보내는 것도 403.

**해결:** mitmproxy를 쓰고, Firefox에 CA 인증서를 설치해서 HTTPS 트래픽을 가로채는 방식으로 전환. AI가 mitmproxy addon 스크립트를 작성해서, 브라우저의 SSO 로그인 과정에서 SAMLResponse를 실시간으로 변조하는 구조를 만들었다.

```
[Firefox] → [mitmproxy (SAML 변조)] → [대상 서버]
                    ↑
          Python addon이 SAMLResponse를
          가로채서 공격 페이로드로 교체
```

이 접근이 핵심이었다. Cloudflare는 브라우저를 통과시키니까, 프록시 레벨에서 페이로드만 바꾸면 WAF를 우회할 수 있다.

### 3단계: SAML 공격 10종 테스트

AI가 mitmproxy addon 스크립트를 2개 만들었다:

**saml_intercept.py** — 기본 SAML 공격 7종:
- Assertion Replay (재사용 공격)
- InResponseTo 제거/변조
- RelayState Open Redirect
- XXE Injection
- NameID 스푸핑 (이메일 변조)
- 서명 제거

**saml_xsw.py** — XSW(XML Signature Wrapping) 공격 8종:
- XSW1~8: 서명된 assertion 옆에 악성 assertion을 다양한 위치에 삽입

테스트 방식이 특이했다. 스크립트의 `TEST_MODE`를 바꾸고 mitmproxy를 재시작한 뒤, Firefox에서 SSO 로그인만 반복하면 됐다. 매 로그인마다 다른 공격이 자동 적용됐다.

```python
# mitmproxy addon — SSO 콜백을 가로채서 SAMLResponse 변조
class XSWInterceptor:
    def request(self, flow):
        if "/sso/callback" in flow.request.pretty_url:
            xml = decode(saml_response)
            evil_assertion = make_evil_assertion(xml)
            modified_xml = inject_xsw(xml, evil_assertion)
            flow.request.set_text(encode(modified_xml))
```

**결과: 15개 테스트 중 14개 차단.** 대상의 SAML 구현은 꽤 단단했다. XSW8만 302 응답을 받았지만 실제 계정 탈취로 이어지지는 않았다.

### 4단계: 방향 전환 — API 테스트

SAML이 견고하다는 걸 확인한 후, 프로그램이 직접 "이런 버그를 찾아달라"고 명시한 영역으로 전환했다:

> *"Race condition in critical business logic activities — For example, passing multiple refunds"*

AI에게 API 클라이언트를 만들게 했다. API 서명(HMAC-SHA256) 구현, 인증 헤더 생성, 테스트 자동화까지 하나의 Python 스크립트로.

```python
# API 서명 생성
to_sign = http_method + url_path + salt + timestamp + access_key + secret_key + body
signature = base64(hmac_sha256(secret_key, to_sign))
```

### 5단계: Race Condition 발견

$100 결제를 생성하고, $10 부분 환불 요청 20개를 Python threading으로 동시에 전송했다.

```python
# 20개 스레드에서 동시에 같은 환불 요청 전송
threads = [Thread(target=refund, args=(payment_id, 10)) for _ in range(20)]
for t in threads: t.start()
for t in threads: t.join()
```

**결과:**

```
Successful refunds: 3
Failed refunds: 17
Total refunded: $30
>>> Expected: 1 refund of $10, Got: 3 refunds = $30
```

**1개만 성공해야 할 환불이 3개 성공했다.** 2차 테스트에서도 2개 성공으로 재현됐다. 서버가 동시 요청에 대해 적절한 락(lock)을 걸지 않아서 같은 환불이 중복 처리되는 전형적인 race condition.

---

## 기술 상세: Race Condition이 왜 위험한가

### 공격 시나리오

1. 정상 거래: 고객이 $100 결제
2. 악의적 환불: API 키를 가진 내부자가 $10 환불을 동시에 100개 전송
3. 결과: 10~30개의 환불이 성공 → $100~$300 환불 (원래 결제액 초과 가능)

### 근본 원인

```
Thread 1: 환불 가능한지 확인 (잔액 $100 ≥ $10) → OK
Thread 2: 환불 가능한지 확인 (잔액 $100 ≥ $10) → OK  ← 아직 Thread 1 미반영
Thread 3: 환불 가능한지 확인 (잔액 $100 ≥ $10) → OK  ← 아직 Thread 1,2 미반영
Thread 1: 환불 실행 → 잔액 $90
Thread 2: 환불 실행 → 잔액 $80  ← 이미 체크를 통과했으므로 실행됨
Thread 3: 환불 실행 → 잔액 $70  ← 동일
```

확인(check)과 실행(execute) 사이에 다른 스레드가 끼어드는 **TOCTOU(Time-of-Check to Time-of-Use)** 문제다.

### 해결 방법

```sql
-- 올바른 구현
BEGIN TRANSACTION;
SELECT balance FROM payments WHERE id = ? FOR UPDATE;  -- 락 획득
IF balance >= refund_amount THEN
    UPDATE payments SET balance = balance - refund_amount;
    INSERT INTO refunds (...);
END IF;
COMMIT;  -- 락 해제
```

---

## 도구 스택

| 도구 | 용도 | 비용 |
|------|------|------|
| AI 코딩 도구 | 스크립트 작성, 분석, 리포트 | 유료 |
| mitmproxy | HTTPS 프록시, SAML 페이로드 변조 | 무료 |
| Burp Suite CE | HTTP 프록시 (CF에 막혀서 보조용) | 무료 |
| Okta Developer | SAML IdP (테스트용) | 무료 |
| Python + requests | API 테스트, Race Condition PoC | 무료 |
| Firefox | 브라우저 (프록시 설정 독립적) | 무료 |

---

## 바이브코딩으로 버그바운티 — 실제로 느낀 점

### 좋았던 점

**속도.** 환경 셋업부터 취약점 발견까지 하루. SAML 스펙을 공부하고, XSW 공격을 이해하고, API 서명을 구현하는 걸 전부 직접 했으면 일주일은 걸렸을 것이다.

**진입 장벽 제거.** SAML이 뭔지, XSW가 뭔지 사전 지식이 없었다. AI가 공격 원리를 설명하면서 동시에 공격 코드를 만들어줬다. 배우면서 실행하는 게 동시에 됐다.

**반복 작업 제거.** SAML 테스트 15번을 매번 수동으로 XML 편집하고 base64 인코딩하고 전송하는 건 사람이 할 일이 아니다. mitmproxy addon으로 자동화된 덕분에 "로그인만 반복"하면 됐다.

### 아쉬웠던 점

**Cloudflare 우회에 시간을 많이 썼다.** Burp Suite → mitmproxy 전환, 인증서 설치, Firefox 설정 등 환경 문제가 실제 테스트보다 더 오래 걸렸다. 실전에서는 이 부분을 미리 세팅해두는 게 중요하다.

**AI도 모르는 건 모른다.** 대시보드의 SSO 버튼이 어디 있는지, 가입 시 어떤 필드가 있는지 같은 건 직접 눈으로 확인해야 했다. AI는 웹 앱의 실시간 UI를 볼 수 없다.

### 핵심 교훈

> **AI는 도구를 만들어주고, 사람은 방향을 정한다.**

AI에게 "버그 찾아줘"라고 하면 아무것도 못 한다. 하지만 "환불 API에 race condition이 있는지 테스트하는 스크립트를 만들어줘"라고 하면 5분 안에 PoC가 나온다.

결국 중요한 건:
1. **어디를 볼지** 결정하는 판단력 (프로그램이 뭘 찾고 있는지 읽기)
2. **뭘 시도할지** 선택하는 전략 (SAML이 막히면 API로 전환)
3. **결과를 해석하는** 능력 (3개 환불 성공이 왜 문제인지 아는 것)

이 세 가지는 AI가 대신해주지 않는다.

---

## 결과

| 항목 | 내용 |
|------|------|
| 소요 시간 | 약 4시간 |
| 테스트한 취약점 | 15종 (SAML 10 + API 5) |
| 발견한 취약점 | Race Condition (환불 중복 처리) |
| 심각도 | High (P2) |
| 상태 | 리포트 제출 완료, 심사 중 |

---

## 시작하려는 분들에게

1. **시스템부터 만들지 마라.** 먼저 손으로 해보고, 성공 패턴이 생기면 그때 자동화해라.
2. **프로그램의 "자주 발견되는 취약점"을 읽어라.** 대상이 race condition을 직접 언급했다. 이건 사실상 힌트다.
3. **AI를 쓰되, 방향은 직접 잡아라.** AI는 코드를 쓰고 분석하는 도구지, 전략을 세우는 주체가 아니다.
4. **환경 셋업에 좌절하지 마라.** Cloudflare, 인증서, 프록시 설정 — 이런 게 실제 해킹보다 더 귀찮다. 하지만 한 번 해두면 다음부터는 빠르다.

---

*이 글에서 사용된 모든 테스트는 버그바운티 프로그램의 스코프 내에서, Sandbox 환경에서만 수행되었습니다.*
