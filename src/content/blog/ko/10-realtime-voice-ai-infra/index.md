---
title: "OpenAI의 실시간 음성 AI 인프라에서 배우는 것들"
summary: "9억 사용자에게 저지연 음성 AI를 제공하기 위해 OpenAI가 WebRTC를 어떻게 재설계했는지 분석하고, 유사한 시스템을 만드는 개발자가 가져갈 수 있는 실전 인사이트를 정리한다."
date: "2026-05-05T18:00:00"
tags:
  - webrtc
  - voice-ai
  - infrastructure
  - real-time
  - openai
---

OpenAI가 최근 공개한 [Delivering Low-Latency Voice AI at Scale](https://openai.com/index/delivering-low-latency-voice-ai-at-scale/) 글이 흥미롭다. 9억 명 이상의 주간 활성 사용자에게 실시간 음성 대화를 제공하기 위해 WebRTC 인프라를 어떻게 설계했는지를 다루는 글인데, 단순한 "우리 이렇게 잘 만들었어요" 자랑이 아니라 **아키텍처 선택의 이유**를 꽤 솔직하게 풀어놓았다.

비슷한 실시간 음성 시스템을 만들거나 고민하는 개발자라면 가져갈 게 많다.

---

## 핵심 아키텍처: SFU 대신 Relay + Transceiver

일반적으로 WebRTC 기반 미디어 서버를 만들면 SFU(Selective Forwarding Unit)를 떠올린다. 화상회의처럼 다자간 통화에 최적화된 구조다.

OpenAI는 이걸 쓰지 않았다. 이유는 단순하다 — **음성 AI는 1:1 세션**이기 때문이다.

```
[사용자] ←→ [Global Relay] ←→ [Transceiver] ←→ [AI 모델]
```

- **Transceiver**: 1:1 세션 전용. WebRTC 종단점 역할을 하며, AI 모델과 직접 통신한다.
- **Global Relay**: 전 세계에 분산 배치된 경량 패킷 전달기. 프로토콜을 해석하지 않고 패킷만 포워딩한다.

SFU의 다자간 라우팅 복잡성을 걷어내고, 1:1에 맞는 단순한 구조를 택한 것이다.

### 개발자 인사이트

> **문제에 맞는 도구를 골라라.** "업계 표준"이라는 이유로 SFU를 쓰면, 1:1 음성 시나리오에서는 불필요한 복잡성만 떠안게 된다. 세션 구조가 단순하면 인프라도 단순해야 한다.

---

## ICE ufrag에 라우팅 정보 심기

WebRTC 연결 설정 과정에서 ICE(Interactive Connectivity Establishment)가 사용하는 `ufrag`(username fragment)에 라우팅 메타데이터를 포함시켰다. 이게 왜 영리한가?

- 클라이언트가 보내는 **첫 번째 패킷**에 이미 라우팅 정보가 들어 있다.
- 별도의 시그널링 서버 조회 없이 Global Relay가 바로 올바른 Transceiver로 패킷을 전달할 수 있다.
- 연결 설정에 걸리는 왕복(RTT)을 줄인다.

### 개발자 인사이트

> **기존 프로토콜의 여백을 활용하라.** 새로운 프로토콜을 만들거나 별도 채널을 추가하지 않고, 이미 있는 필드에 정보를 실어 보내는 접근이다. WebRTC 표준을 깨지 않으면서 라우팅을 최적화한 좋은 사례다.

---

## Kubernetes에서의 UDP 포트 문제

전통적인 WebRTC 서버는 세션마다 하나의 UDP 포트를 노출한다. 이게 베어메탈이면 괜찮지만, Kubernetes 환경에서는 골치가 아프다.

- `hostPort` 매핑이 노드당 포트 수를 제한한다.
- 포트 범위를 넓히면 보안 표면이 커진다.
- 수천 개의 동시 세션을 처리하려면 포트 관리 자체가 운영 부담이 된다.

OpenAI의 해법: **Global Relay가 소수의 공개 포트만 노출하고, 내부적으로 ufrag 기반 라우팅**으로 올바른 Transceiver에 전달한다.

### 개발자 인사이트

> **인프라 환경이 아키텍처를 결정할 수 있다.** "이론적으로 맞는 구조"가 Kubernetes 위에서 운영할 수 없다면 의미 없다. 특히 UDP 기반 프로토콜을 K8s에 올릴 때는 포트 전략을 초기부터 설계해야 한다. 나중에 바꾸면 비용이 크다.

---

## Go로 작성한 경량 Relay

Global Relay는 Go로 작성되었고, 핵심 특징은 **프로토콜 종료를 하지 않는다**는 것이다.

- DTLS/SRTP를 해석하지 않는다. 패킷을 까보지 않고 그대로 전달만 한다.
- 덕분에 하나의 relay가 수만 개의 세션을 처리할 수 있다.
- CPU 부하는 암호화 처리를 하는 Transceiver에 집중되고, Relay는 네트워크 I/O에만 집중한다.

Go 생태계에서는 [Pion](https://github.com/pion/webrtc)이라는 WebRTC 라이브러리가 사실상 표준인데, OpenAI도 이를 활용한 것으로 보인다. Pion 개발자 본인이 이 사례 공개를 환영하는 반응을 보였다.

### 개발자 인사이트

> **역할을 분리하고, 각 컴포넌트의 책임을 최소화하라.** Relay는 라우팅만, Transceiver는 미디어 처리만. 이 분리 덕분에 Relay를 전 세계에 싸게 배포하고 독립적으로 스케일링할 수 있다.

Go + Pion 조합은 실시간 미디어 서버를 만들 때 검증된 선택지다. 러닝커브도 적당하고, 프로덕션 레퍼런스가 이제 충분하다.

---

## 지연 시간보다 중요한 것: 턴 관리

여기서부터는 OpenAI 글의 범위를 넘어서, 커뮤니티 피드백에서 나온 이야기다. 실제로 실시간 음성 AI를 쓰는 사용자들이 느끼는 문제는 네트워크 지연이 아니었다.

**"생각이 아직 끝나지 않았는데 AI가 먼저 말하기 시작한다."**

- 응답이 빠르면 빠를수록 좋을 것 같지만, 사용자에게는 **"내 말을 끊는 AI"**로 느껴질 수 있다.
- "음...", "그러니까..." 같은 필러를 넣어 시간을 벌게 되는 아이러니.
- VAD(Voice Activity Detection)가 묵음을 감지해 턴을 넘기는 방식이 단순하기 때문이다.

[Pipecat](https://github.com/pipecat-ai/pipecat)이라는 오픈소스 프로젝트가 이 문제를 다루고 있다. Smart Turn VAD 모델을 제공하는데, 단순 묵음 감지가 아니라 **발화 의도의 완결성**을 판단하려는 시도다.

### 개발자 인사이트

> **네트워크 레이턴시를 줄이는 건 필요조건이지 충분조건이 아니다.** 음성 AI의 UX는 결국 턴 관리에서 결정된다. 인프라를 다 만들고 나서 "어, 근데 대화가 자연스럽지 않네?"가 되면 늦다. 턴 관리 전략은 인프라 설계와 병행해야 한다.

---

## 실전 체크리스트

음성 AI 또는 실시간 미디어 시스템을 만들 때 이 글에서 가져갈 질문들:

| 질문 | OpenAI의 선택 |
|------|--------------|
| 세션 구조가 1:1인가, N:N인가? | 1:1 → SFU 대신 Transceiver |
| 패킷 라우팅에 별도 서비스가 필요한가? | ICE ufrag에 메타데이터 포함 |
| K8s 위에서 UDP를 어떻게 관리할 것인가? | Relay가 소수 포트 노출, 내부 라우팅 |
| 미디어 처리와 패킷 전달을 분리할 수 있는가? | Relay(전달만) + Transceiver(처리) |
| 장애 시 세션 복구는 어떻게 할 것인가? | (공개되지 않음 — 직접 설계 필요) |
| 턴 관리를 어떤 레이어에서 할 것인가? | (인프라 글에서는 다루지 않음) |

마지막 두 항목이 비어 있다. OpenAI가 공개하지 않은 부분이기도 하고, 실제로 만들어보면 여기서 가장 많이 고민하게 되는 부분이기도 하다.

---

## 참고 자료

- [OpenAI: Delivering Low-Latency Voice AI at Scale](https://openai.com/index/delivering-low-latency-voice-ai-at-scale/)
- [Pion WebRTC (Go)](https://github.com/pion/webrtc) — Go 기반 WebRTC 라이브러리
- [WebRTC for the Curious](https://webrtcforthecurious.com/) — Pion 팀이 만드는 WebRTC 학습 자료
- [Pipecat](https://github.com/pipecat-ai/pipecat) — 음성 AI 파이프라인 프레임워크, Smart Turn VAD 포함
- [GeekNews 토론](https://news.hada.io/topic?id=29168) — 한국어 커뮤니티 반응과 의견
