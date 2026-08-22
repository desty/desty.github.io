---
title: "OpenSandbox 코드 분석: AI 에이전트의 실행 환경을 어떻게 통일했나"
summary: "OpenSandbox 저장소를 받아 API 명세부터 FastAPI 서버, execd, Docker·Kubernetes 런타임, 네트워크 제어와 Credential Vault까지 살펴봤다. 단순히 컨테이너를 띄우는 도구라기보다, 서로 다른 실행 환경을 하나의 API로 다루기 위한 기반에 가깝다. 코드가 실제로 어떻게 나뉘어 있는지, 보안 기능은 어디까지 제공하는지, 도입 전에 확인할 제약은 무엇인지 정리했다."
date: "2026-08-22T11:00:00"
tags:
  - agent-engineering
  - ai-infrastructure
  - sandbox
  - kubernetes
  - open-source
draft: false
---

AI 에이전트가 코드를 실행하게 하려면 먼저 안전한 실행 환경이 필요하다. 개발 단계에서는 Docker 컨테이너 하나로 시작할 수 있지만, 운영으로 넘어가면 고려할 것이 금세 늘어난다. 컨테이너 생성과 종료, 명령 실행, 파일 전송, 포트 연결, 자원 제한, 네트워크 통제, 비밀 정보 관리, 로그 수집을 함께 다뤄야 한다. 여러 에이전트를 동시에 돌리면 대기 시간과 유휴 자원 문제도 생긴다.

[OpenSandbox](https://github.com/opensandbox-group/OpenSandbox)는 이 일을 한데 묶은 오픈소스 프로젝트다. Python·JavaScript/TypeScript·Java/Kotlin·C#/.NET·Go SDK를 제공하고, 로컬 Docker와 Kubernetes를 모두 지원한다. CLI와 MCP 서버도 포함돼 있다.

저장소를 직접 받아 2026년 8월 21일의 `6b2023e` 커밋을 기준으로 살펴봤다. Python FastAPI 서버와 Go로 작성한 실행·네트워크 구성요소, Kubernetes 오퍼레이터, 네 개의 OpenAPI 명세가 한 저장소에 들어 있다. 소스와 명세 파일은 단순 합산으로 33만 줄이 넘고, 파일명 기준 테스트 파일은 460개였다. 2025년 12월에 만들어진 뒤 8개월 만에 GitHub 스타 14,547개와 포크 1,285개를 모은 이유도 어느 정도 짐작할 수 있었다.

처음에는 Docker를 편하게 호출하는 SDK에 가까울 것이라 예상했다. 코드를 따라가 보니 중심은 다른 데 있었다. OpenSandbox는 **Docker와 Kubernetes의 차이를 공통 API 뒤로 숨기고, 에이전트가 실행 환경을 같은 방식으로 다루게 하는 기반**을 만들고 있었다.

---

## 전체 구조

구성은 크게 세 부분으로 나뉜다.

```text
에이전트 / SDK / CLI / MCP
          │
          ▼
Lifecycle API ── FastAPI 서버 ── Docker 또는 Kubernetes
          │                              │
          └── 실행 주소 조회 ────────────┘
                                         ▼
                          execd + 사용자 작업 + egress
```

사용자는 SDK, CLI 또는 MCP를 통해 샌드박스를 만들고 명령과 파일 작업을 요청한다. 이 요청은 FastAPI로 작성된 생명주기 서버가 받는다. 서버는 설정에 따라 Docker나 Kubernetes에 실제 실행 환경을 만든다.

샌드박스 안에서는 `execd`라는 Go 데몬이 동작한다. 명령 실행, 백그라운드 로그, SSE 스트리밍, PTY 연결, 파일 조작, 자원 지표, Jupyter 기반 코드 실행을 맡는다. 외부 통신을 제한해야 할 때는 egress 사이드카가 추가되고, Kubernetes 환경에서는 ingress가 외부 요청을 샌드박스의 특정 포트로 전달한다.

여기서 눈에 띈 부분은 `execd`를 넣는 방식이다. 사용자가 OpenSandbox 전용 이미지를 만들 필요가 없다. `python:3.12` 같은 일반 이미지도 그대로 쓸 수 있다. Docker에서는 서버가 실행 시점에 `execd` 바이너리와 시작 스크립트를 넣는다. Kubernetes에서는 init container가 바이너리를 `emptyDir`에 복사하고, 이를 사용자 컨테이너에 마운트한다.

덕분에 샌드박스용 기능을 이미지마다 미리 설치하지 않아도 된다. 실행 환경을 준비하는 책임과 사용자가 돌릴 이미지를 분리한 셈이다.

## Docker와 Kubernetes를 같은 API로 다루는 방법

FastAPI 서버의 라우터는 Docker나 Kubernetes를 직접 호출하지 않는다. `SandboxService`라는 공통 인터페이스에 요청을 넘기고, 설정의 `runtime.type`에 따라 `DockerSandboxService` 또는 `KubernetesSandboxService`가 선택된다.

공개 API의 기준은 `specs/` 아래 네 개의 OpenAPI 문서다.

| 명세 | 주요 기능 |
|---|---|
| `sandbox-lifecycle.yml` | 생성·조회·삭제·일시정지·재개·만료 시간·접속 주소·스냅샷 |
| `execd-api.yaml` | 명령·세션·코드·파일·디렉터리·자원 지표·격리 실행 |
| `egress-api.yaml` | 외부 통신 정책·Credential Vault |
| `diagnostic-api.yml` | 샌드박스 로그·이벤트 진단 |

SDK에는 이 명세에서 생성한 코드와 별도로 작성한 코드가 함께 들어 있다. 일반적인 요청과 응답은 생성 코드가 처리하고, 스트리밍이나 재시도, 오류 변환처럼 언어별로 손봐야 하는 부분은 별도 어댑터가 맡는다.

API에서는 자원 제한, 볼륨, 네트워크 정책, 접속 주소를 공통 개념으로 표현한다. 실제 구현은 실행 환경에 따라 달라진다. 예를 들어 `pvc` 볼륨은 Docker에서는 named volume으로, Kubernetes에서는 PersistentVolumeClaim으로 처리된다. 서비스 접속 주소도 Docker의 host port, Kubernetes ingress 주소, OpenSandbox 서버의 프록시 주소 중 하나가 될 수 있다. SDK를 쓰는 쪽에서는 같은 `get_endpoint()` 호출로 주소와 필요한 인증 헤더를 받는다.

이 구조의 장점은 로컬 개발 환경과 운영 환경의 차이를 에이전트 코드에서 줄일 수 있다는 것이다. Docker와 Kubernetes가 완전히 같은 기능을 제공하는 것은 아니지만, 샌드박스 생성과 실행에 필요한 기본 흐름은 같은 API로 유지된다.

## 명령 실행보다 어려운 것은 권한 관리다

에이전트가 실제 작업을 하려면 인터넷 접속이 필요한 경우가 많다. GitHub에서 코드를 받고, 패키지를 설치하고, 모델 API를 호출해야 한다. 여기서 API 키를 환경 변수로 넣으면 샌드박스 안의 프로세스가 원문을 읽을 수 있다. 프롬프트 인젝션이나 악성 코드가 있다면 키를 출력하거나 다른 곳으로 전송할 수도 있다.

OpenSandbox의 [Credential Vault](https://open-sandbox.ai/guides/credential-vault)는 실제 비밀 값을 egress 사이드카에 보관한다. 샌드박스 안에는 가짜 값이나 빈 값을 넣고, 외부 요청이 미리 정한 호스트·경로·메서드와 일치할 때만 프록시가 실제 인증 헤더를 추가한다. 경로나 쿼리, 요청 본문에 키가 필요한 API를 위해 자리표시자를 바꾸는 기능도 있다. 반환값과 응답 헤더에 비밀 값이 포함되면 가리는 처리도 들어 있다.

이 방식이라면 에이전트는 인증된 요청을 보낼 수 있지만 실제 키를 직접 읽을 수는 없다. 작업 환경을 폐기하더라도 비밀 정보를 같은 공간에 남기지 않을 수 있다는 점이 중요하다.

외부 통신 정책은 도메인 단위 allow/deny 규칙과 nftables를 함께 사용한다. Kubernetes에서는 `NET_ADMIN` 권한을 사용자 컨테이너에서 빼고 egress 사이드카에만 부여한다. 샌드박스가 접근할 수 있는 목적지와 그 목적지에서 사용할 수 있는 자격증명을 함께 제한하려는 설계다.

다만 Credential Vault는 일반적인 비밀 관리 시스템을 대체하지 않는다. 문서에서도 HashiCorp Vault나 클라우드 Secret Manager를 대신하는 기능이 아니라, 이미 보관된 자격증명을 샌드박스의 외부 요청에 제한적으로 연결하는 기능이라고 설명한다.

## 여러 샌드박스를 운영하기 위한 기능

Docker 컨테이너 하나만 실행할 때는 생명주기 서버가 다소 크게 느껴질 수 있다. 평가나 강화학습처럼 같은 작업을 수백·수천 번 반복하면 상황이 달라진다. 매 작업에 깨끗한 환경이 필요하고, 생성 시간과 유휴 비용, 실패한 작업의 회수, 만료 시간, 상태 보존을 관리해야 한다.

Kubernetes 쪽에는 이를 위한 `BatchSandbox`, `Pool`, `SandboxSnapshot` CRD가 있다. `Pool`은 미리 실행 환경을 준비해 두었다가 요청이 오면 할당한다. `BatchSandbox`는 여러 복제본과 평가·학습 형태의 작업 실행을 관리한다.

일시정지와 재개 방식도 흥미롭다. 지원되는 단일 replica 환경에서는 Pod를 계속 얼려 두지 않고 root filesystem을 OCI 이미지로 저장한 뒤 계산 자원을 해제한다. 다시 시작할 때는 같은 sandbox ID를 유지한 채 저장된 이미지로 작업 환경을 만든다. 메모리 상태나 열린 소켓까지 보존하는 방식은 아니지만, 파일 상태는 남기고 CPU·GPU 비용은 줄이려는 선택이다.

SDK 쪽에는 클라이언트 풀도 있다. 정해진 동시성 안에서 빈 샌드박스를 계속 보충하고, 프로세스가 재시작되더라도 생성 중이던 자원을 정리할 수 있도록 소유권과 상태를 관리한다. OpenSandbox가 단순 실행 API를 넘어, 짧게 쓰고 버리는 계산 자원을 배정하고 회수하는 문제까지 다루고 있음을 보여준다.

## 보안 기능을 사용할 때 확인할 점

기능 목록만 보면 격리와 네트워크 통제가 기본으로 완성돼 있을 것처럼 보이지만, 실제 보안 수준은 배포 설정에 달려 있다.

기본 런타임은 runc다. 위험한 Linux capability를 여러 개 제거하고 Docker의 기본 seccomp 설정을 사용하지만, VM 수준의 격리는 아니다. gVisor, Kata Containers, Firecracker도 지원하나 운영자가 서버 설정과 Kubernetes RuntimeClass를 별도로 준비해야 한다. 신뢰할 수 없는 사용자가 함께 쓰는 환경이라면 기본 설정만으로 충분하다고 보기 어렵다.

네트워크 정책에도 단계가 있다. DNS 필터만 쓰면 IP 주소를 직접 호출하거나 DoH·DoT를 사용하는 우회가 가능하다. `dns+nft` 모드는 네트워크 계층까지 막지만 gVisor의 netstack과는 호환되지 않는다. Istio나 Envoy 같은 서비스 메시가 같은 네트워크 공간에서 트래픽을 가로채는 구성도 현재 함께 사용할 수 없다. Credential Vault는 투명 HTTPS MITM 경로에 의존하며, 추가 포트 처리에는 아직 실험적 기능이 포함돼 있다.

Docker와 Kubernetes의 지원 범위도 조금씩 다르다. 공개 snapshot API는 현재 Docker 구현이 중심이다. Kubernetes의 일시정지와 재개는 컨트롤러 내부의 별도 rootfs snapshot 절차를 쓴다. 미리 만들어 둔 Pool Pod에는 요청마다 egress 사이드카를 새로 넣을 수 없어서 `poolRef`와 요청별 `networkPolicy`를 동시에 사용할 수 없다.

버전 관리도 도입 전에 살펴야 한다. 8월 21일 기준 릴리스에는 egress 1.1.7, execd 1.0.22, Helm chart 0.2.2, Python SDK 0.1.15가 각각 존재한다. 저장소의 OSEP-0016도 현재 19개가 넘는 배포 대상을 따로 버전 관리하고 있으며 “OpenSandbox 전체 버전”은 없다고 설명한다. 이를 하나로 묶는 릴리스 방식은 아직 초안 단계다. 운영 환경에서는 검증한 구성요소의 버전과 컨테이너 이미지 digest를 함께 고정하는 편이 안전하다.

감사 기록도 아직 남은 과제다. 로그, request ID, OpenTelemetry 지표는 제공하지만, 어느 에이전트가 어떤 권한으로 명령·파일·네트워크 작업을 수행했는지 한곳에 보존하는 통합 audit trail은 로드맵의 계획 항목으로 남아 있다.

## 어떤 경우에 적합할까

신뢰할 수 있는 코드 몇 줄을 한 프로세스에서 실행하려는 목적이라면 Docker API나 subprocess가 훨씬 단순하다. OpenSandbox 서버와 실행 데몬, 네트워크 사이드카까지 운영할 필요는 없다.

반대로 다음과 같은 요구가 함께 있다면 검토할 만하다.

- 서로 다른 에이전트 프레임워크가 같은 실행 환경을 사용해야 한다.
- 개발용 Docker에서 운영용 Kubernetes로 옮겨도 SDK 호출 방식을 유지하고 싶다.
- 명령뿐 아니라 파일, PTY, 브라우저, 데스크톱, 외부 공개 포트를 같은 생명주기로 관리해야 한다.
- 대량 평가나 강화학습 작업에서 사전 준비, 만료 시간, 일시정지·재개, 실패 회수가 필요하다.
- API 키를 샌드박스에 직접 넣지 않고 목적지별로 제한해 사용해야 한다.
- 관리형 서비스보다 Apache-2.0 기반의 자체 운영 환경이 필요하다.

도입 여부를 판단할 때는 SDK 사용법보다 운영 조건을 먼저 확인하는 것이 좋다. 어떤 격리 런타임을 사용할지, 외부 통신은 어느 수준까지 막을지, 빠른 할당을 위한 Pool과 요청별 네트워크 정책 중 무엇이 더 중요한지, 서로 다른 구성요소의 버전을 어떻게 함께 검증할지를 정해야 한다.

## 정리

OpenSandbox를 살펴보기 전에는 컨테이너 생성과 명령 실행을 감싼 SDK 정도로 생각했다. 실제 코드는 샌드박스의 수명과 명령, 파일, 포트, 자원, 네트워크, 자격증명을 공통 API로 묶는 데 더 많은 비중을 두고 있었다.

특히 일반 컨테이너 이미지에 `execd`를 실행 시점에 넣는 방식, Docker와 Kubernetes 구현을 `SandboxService` 뒤로 나눈 구조, 자격증명을 샌드박스 밖에서 요청 단위로 주입하는 Credential Vault가 잘 맞물린다. 실행 환경을 바꿀 때 에이전트 코드까지 다시 짜지 않도록 하기 위한 구성이다.

아직 안정된 단일 v1 제품으로 보기는 어렵다. 런타임마다 지원 범위가 다르고, 보안 수준은 운영 설정에 크게 좌우되며, 구성요소의 버전도 따로 움직인다. 그럼에도 에이전트마다 실행 인프라를 별도로 만드는 대신 공통 API를 두려는 접근은 충분히 참고할 만하다. 모델과 에이전트 프레임워크가 자주 바뀌는 만큼, 그 아래의 실행 환경은 독립적으로 관리할 필요가 있기 때문이다.

---

*참고: [OpenSandbox 저장소](https://github.com/opensandbox-group/OpenSandbox) (스타·포크·생성일은 2026-08-22 GitHub API 조회, 코드 분석은 2026-08-21 `6b2023e` 커밋 기준), [아키텍처 문서](https://open-sandbox.ai/architecture/), [Sandbox Lifecycle 명세](https://github.com/opensandbox-group/OpenSandbox/blob/main/specs/sandbox-lifecycle.yml), [execd 명세](https://github.com/opensandbox-group/OpenSandbox/blob/main/specs/execd-api.yaml), [네트워크 격리](https://open-sandbox.ai/architecture/network-isolation), [Credential Vault](https://open-sandbox.ai/guides/credential-vault), [Secure Container Runtime](https://open-sandbox.ai/guides/secure-container), [OSEP 목록](https://github.com/opensandbox-group/OpenSandbox/tree/main/oseps), [로드맵](https://github.com/opensandbox-group/OpenSandbox/blob/main/ROADMAP.md), [릴리스](https://github.com/opensandbox-group/OpenSandbox/releases). 줄 수는 저장소의 Python·Go·TypeScript·Java·C#·YAML 파일을 디렉터리별 단순 합산한 값으로 생성 코드가 포함되며, 규모를 보여주기 위한 수치이지 수작업 코드량 추정치는 아니다.*
