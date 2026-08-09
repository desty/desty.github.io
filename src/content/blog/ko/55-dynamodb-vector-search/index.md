---
title: "벡터 DB를 따로 둘 이유가 또 하나 사라졌다 — DynamoDB 네이티브 벡터 검색이 지운 건 파이프라인이다"
summary: "8월 5일, AWS가 DynamoDB 네이티브 벡터 검색을 프리뷰 없이 바로 GA로 내놨다. 임베딩을 운영 데이터 옆에 그대로 저장하고 SearchVectors API 하나로 유사도 검색을 하는 구조다. 지금까지 공식 답이었던 zero-ETL OpenSearch 체인은 서비스 다섯 개짜리였고, ScyllaDB는 석 달 전 정확히 그 지점을 조롱하며 선공을 날렸다. 이번 GA로 사람들이 정말 원했던 게 뭐였는지가 분명해진다 — 더 좋은 ANN이 아니라, 하나 덜 운영하는 것. 발표문의 'any scale'에 붙는 조건(SearchSchema 파티션 키 = 비용 설계), 에이전트 메모리 유스케이스의 함정(eventually consistent, FGAC 미지원), 온디맨드 전용·등호 필터만·페이지네이션 없음 같은 발표문에 없는 제약, 그리고 S3 Vectors·OpenSearch·Postgres 사이의 선택 기준까지 정리했다."
date: "2026-08-09T18:00:00"
tags:
  - vector-database
  - rag
  - retrieval
  - agent-memory
  - aws
  - serverless
draft: false
---

[#41](/blog/41-pgcontext/)에서 "벡터 DB를 따로 둘 이유가 사라지고 있다"고 썼을 때, 그 문장의 주어는 Postgres였다. 8월 5일, AWS가 같은 문장을 서버리스 NoSQL 쪽에서 마저 썼다. [DynamoDB가 네이티브 벡터 검색을 GA로 발표](https://aws.amazon.com/blogs/aws/amazon-dynamodb-now-supports-real-time-vector-search-at-any-scale/)한 것이다 — 프리뷰 단계 없이 바로, 모든 상용 리전과 GovCloud(US)에서 동시에. 임베딩을 운영 데이터와 같은 테이블에 저장하고 별도 벡터 스토어로 복제하지 않은 채 그 자리에서 유사도 검색을 한다. AWS가 내세우는 수치는 한 자릿수 밀리초 레이턴시에 99% 이상의 리콜, 수조 개 벡터까지의 스케일이다.

발표 수치는 늘 그렇듯 마케팅과 사실의 경계에 있다. 이 글에서 하고 싶은 건 두 가지다. 하나는 이 발표가 어떤 수요에 대한 응답인지 읽는 것 — 결론부터 말하면 사람들이 원한 건 검색 기능이 아니라 파이프라인의 삭제다. 다른 하나는 발표문에 없는 조건과 함정을 문서에서 긁어모으는 것. "any scale"에는 조건이 붙어 있고 그 조건이 곧 비용 설계다.

---

## 무엇이 나왔나 — 새 타입도, 새 서비스도 아니다

설계가 보수적이라는 점부터 눈에 띈다. 벡터를 위한 새 데이터 타입이 없다. 임베딩은 기존 **List of Numbers로** `PutItem` 하면 되고 인덱스 내부에서는 f32 정밀도로 보관된다. 인덱스 정의도 새 API가 아니라 기존 `CreateTable`/`UpdateTable`에 `VectorIndexes` 파라미터가 추가된 형태다. 이미 있는 테이블에 인덱스를 얹으면 백필은 무료로 돌아간다.

새로 생긴 건 읽기 쪽이다. 벡터 인덱스는 `Query`도 `Scan`도 PartiQL도 받지 않고 전용 **`SearchVectors` API로만** 읽는다. 쿼리 벡터와 TopK(최대 100), 선택적 필터 조건을 주면 유사도 점수로 정렬된 결과가 돌아온다. 스펙 상한은 4,096차원, 테이블당 벡터 인덱스 5개. 거리 함수는 COSINE·DOT_PRODUCT·EUCLIDEAN 세 가지인데 **생성 후에는 바꿀 수 없다.** 인덱스가 내부적으로 어떤 알고리즘을 쓰는지는 공개하지 않았다 — 문서는 근사 최근접 이웃(ANN)이라고만 말한다.

```python
# 인덱스 정의 — 기존 CreateTable에 파라미터 하나
dynamodb.create_table(
    ...,
    VectorIndexes=[{
        "IndexName": "MemoryIndex",
        "VectorAttribute": {"AttributeName": "embedding"},
        "Dimensions": 1024,
        "DistanceFunction": "COSINE",
        "Projection": {"ProjectionType": "ALL"},
    }],
)

# 검색 — 전용 API
response = dynamodb.search_vectors(
    TableName="AgentMemories",
    IndexName="MemoryIndex",
    SearchVector=query_embedding,
    TopK=5,
)
```

임베딩 생성은 알아서 할 일이다. Bedrock의 Titan·Cohere든 외부 모델이든, 벡터를 만들어 오는 쪽은 사용자 몫이고 DynamoDB는 저장과 검색만 맡는다. 이 분업 자체는 pgvector와 같다.

## 다들 지우고 싶었던 건 파이프라인이다

지금까지의 공식 답을 떠올려 보면 이 발표가 무엇에 답한 건지 보인다. 2024년에 AWS가 내놓은 답은 [zero-ETL OpenSearch 통합](https://aws.amazon.com/blogs/database/vector-search-for-amazon-dynamodb-with-zero-etl-for-amazon-opensearch-service/)이었다. DynamoDB의 변경을 Streams로 잡고, S3 export로 초기 스냅숏을 뜨고, OpenSearch Ingestion 파이프라인으로 흘려 OpenSearch에서 검색한다. "zero-ETL"이라는 이름과 달리 관리 대상 서비스가 다섯 개다. 과금 지점도 다섯 곳, 장애 지점도 다섯 곳이다. 거기에 운영 데이터와 벡터 인덱스 사이에는 항상 복제 지연이 있다.

이 체인을 정면으로 조롱한 게 ScyllaDB다. [5월 5일, DynamoDB 호환 API인 Alternator에 네이티브 벡터 검색을 먼저 넣으면서](https://www.scylladb.com/2026/05/05/native-vector-search-dynamodb/) "AWS에서 벡터 검색을 하려면 서비스 여러 개를 쪼개진 API로 엮어야 한다"는 걸 마케팅 포인트로 삼았다. 석 달 뒤 AWS가 그 공격 지점을 정확히 지웠다. 호환 API 진영이 본가를 먼저 치고, 본가가 따라잡는 순서 — DynamoDB API가 하나의 표준이 됐다는 방증이기도 하다.

수요 쪽 데이터도 있다. Futurum이 인용한 설문에서 데이터 전문가의 **33.4%가** RAG와 에이전트용 임베딩 관리의 장기 전략으로 별도 벡터 DB가 아니라 in-database 엔진을 꼽았다. [#41](/blog/41-pgcontext/)에서 Postgres 쪽을 보며 내린 결론과 같은 그림이다. DB를 하나 더 운영하는 부담, 두 저장소 사이의 동기화, 어긋났을 때의 디버깅 — 사람들이 지우고 싶었던 건 이것들이지, ANN 알고리즘의 마지막 몇 퍼센트 리콜이 아니다. 기본 벡터 저장·검색이 운영 DB의 내장 기능으로 커모디티화될수록, Pinecone류 전문 벡터 DB는 고급 검색 기능과 멀티모달, 컴플라이언스 쪽으로 올라가서 먹고살아야 한다.

## "any scale"의 조건 — 파티션 키 설계가 곧 비용 설계다

발표문이 말하지 않는 본론은 **SearchSchema에** 있다. 벡터 인덱스에는 선택적으로 벡터 인덱스 파티션 키를 정의할 수 있다. `Category`나 `Country`, 에이전트 메모리라면 `AgentId` 같은 저·중 카디널리티 속성이다. 이걸 정의하면 같은 키 값의 벡터가 같이 저장되고 검색은 그 파티션 안에서만 돈다. 대신 모든 `SearchVectors` 호출에 그 키 값을 필수로 넣어야 한다.

정의하지 않으면? 매 검색이 인덱스 전체를 상대한다. 그리고 여기서 요금 구조와 만난다. 벡터 검색 과금은 요청 횟수가 아니라 **검색이 처리한 바이트** 기준이다. 인덱스가 커질수록 검색 하나하나가 더 많은 데이터를 훑고 레이턴시와 비용이 같이 오른다. 거꾸로 파티션 키를 잘 고르면 데이터가 늘어도 각 검색의 스코프는 일정하다. "any scale"은 이 설계를 해냈을 때의 얘기다. GSI의 핫 파티션을 피하려고 파티션 키를 고민하던 그 규율이, 벡터 인덱스에서는 비용 곡선의 기울기를 정하는 문제로 돌아온 셈이다.

필터도 절반만 왔다. SearchSchema에 INLINE_FILTER 속성을 프로젝션해 두면 스토리지 레이어에서 검색 중에 필터링해 주는데, 지원 연산자가 **등호(=) 하나뿐이다.** 범위·부등호·IN은 아직 없다. [#41](/blog/41-pgcontext/)에서 "벡터 검색의 마지막 남은 문제는 필터"라고 썼는데, DynamoDB도 그 마지막 문제 앞에서는 첫걸음이다.

일관성도 짚어야 한다. 벡터 인덱스는 기본 테이블 쓰기에 비동기로 따라붙는 **eventually consistent 구조다.** 글로벌 테이블에서는 다중 리전 강한 일관성(MRSC) 테이블이어도 벡터 복제·인덱싱은 비동기다. 방금 쓴 항목이 다음 검색에 바로 나온다고 가정하면 안 된다.

## 에이전트 메모리 — AWS가 직접 이름을 불렀다

유스케이스 목록에서 눈여겨볼 건 순서다. 공지 첫머리에 온 게 **agentic memory에** 대한 시맨틱 검색이다. 세션 간 대화 임베딩을 저장해 에이전트가 맥락을 이어가게 한다는, 정확히 [#50](/blog/50-tencentdb-agent-memory/)에서 다룬 그 층이다. 에이전트의 운영 상태(지금 뭘 하고 있나)와 기억(뭘 겪었나)이 같은 테이블, 같은 밀리초 접근 범위에 있게 된다는 건 에이전트 아키텍처에서 실질적인 변화다. Futurum은 이걸 passive storage에서 **active storage로의** 전환이라고 이름 붙였다 — 에이전트가 추론에 쓰는 참조 데이터와 읽고 쓰는 행동 데이터가 분리된 시스템에 있는 것 자체가 위험이라는 프레임이다.

다만 이 유스케이스에 이번 GA를 그대로 얹으려면 두 구멍을 알고 시작해야 한다. 첫째는 방금 말한 일관성 — 에이전트가 방금 적은 기억을 같은 턴에서 검색으로 되찾는 패턴은 보장되지 않는다. 둘째가 더 뼈아프다. `SearchVectors`는 **세밀한 접근 제어(FGAC)를 지원하지 않는다.** 여러 에이전트의 기억을 한 테이블에 두고 IAM 조건으로 파티션을 갈라 격리하는, DynamoDB에서 익숙한 그 패턴이 벡터 검색에는 안 통한다는 뜻이다. 에이전트라는 비인간 주체가 운영 DB에 직접 읽고 쓰는 시대의 접근 제어가 다음 숙제가 될 거라는 분석가들의 지적과 그대로 겹치는 구멍이다. [#50](/blog/50-tencentdb-agent-memory/)의 결론 — 검색이 커모디티가 될수록 남는 문제는 거버넌스다 — 가 이번 GA로 오히려 선명해졌다. 검색·저장 층은 이제 관리형 인프라가 됐고, 누가 쓰고 어떤 버전이 유효하고 어느 에이전트에 장착되나는 여전히 위층의 일이다.

## 실전 — 쓸 것인가, 뭘 조심할 것인가

요금은 세 축이고 전부 기본 테이블과 별도 계량이다.

| 항목 | 단가 | 비고 |
|---|---|---|
| 벡터 쓰기 | GB당 $0.52 | 연산당 최소 1KB, 프로젝션된 속성 포함 |
| 벡터 검색 | 처리량 GB당 $0.002 | 최소 1KB, 훑은 데이터 기준 |
| 인덱스 스토리지 | GB·월당 $0.25 | 기본 테이블과 같은 수준 |

감을 잡기 위한 산수. 1,024차원 f32 벡터 하나가 약 4KB니까, 벡터 100만 개면 인덱스가 대략 4GB다. 스토리지 월 $1, 초기 적재 쓰기 $2 수준 — 이 규모에서는 사실상 공짜다. 요금 페이지의 예시는 초당 10회 쓰기(월 99GB)에 쓰기 요금 월 $51.42다. 변수는 검색 쪽이다. 처리 바이트 과금이라 파티션 없이 큰 인덱스를 계속 때리면 여기가 주 비용이 되고 그 곡선의 기울기를 정하는 게 위에서 말한 파티션 키 설계다.

발표문에 없는 제약을 모아 두면 이렇다.

- **온디맨드 전용.** 프로비저닝드 모드 테이블에는 못 만든다 — 벡터 인덱스를 쓰려면 온디맨드로 전환부터.
- **페이지네이션이 없다.** `SearchVectors` 응답은 16MB 상한이고 이어 받기가 안 된다. ALL 프로젝션에 큰 아이템, 높은 TopK 조합이면 상한에 닿는다. 프로젝션을 좁히거나 TopK를 줄여야 한다.
- **생성 후 불변인 게 많다.** 거리 함수, 차원 수, INCLUDE 프로젝션 목록 전부 재생성 없이는 못 바꾼다. 임베딩 모델을 갈아타면 인덱스도 다시 만든다고 생각해야 한다.
- **DAX 미지원, PartiQL 미지원, FGAC 미지원.** `SearchVectors`는 DAX를 우회해 직접 호출해야 한다.
- **프로젝션이 응답 범위를 정한다.** 인덱스에 프로젝션하지 않은 속성은 검색 결과에 실려 오지 않는다. 검색 후 `GetItem`을 한 번 더 하든가, 처음부터 프로젝션에 넣든가.

선택 기준은 워크로드 위치로 갈리는 게 맞다. **운영 데이터가 이미 DynamoDB에 있으면** 이번 GA가 기본 후보다 — 파이프라인 하나가 통째로 사라진다. **콜드하고 거대하고 싸야 하면** S3 Vectors가 그 자리고, **BM25·하이브리드 검색·집계 같은 검색 기능 자체가 필요하면** 여전히 OpenSearch다. **Postgres 진영이라면** 이 글 전체가 [#41](/blog/41-pgcontext/)의 데자뷔였을 것이다 — 같은 수렴이 진영별로 한 번씩 일어나고 있을 뿐이다. 반대로 리콜 마지막 몇 퍼센트를 튜닝 노브로 짜내야 하거나 범위 필터가 필수인 워크로드라면, 등호 필터만 있고 알고리즘 노브가 없는 이번 물건은 아직 답이 아니다.

## 남는 것

- 벡터 DB 통합의 서사가 진영별로 반복되고 있다. Postgres에서 pgvector가 했던 일을 DynamoDB가 서버리스 NoSQL에서 했다. 수요의 정체는 매번 같다 — 하나 덜 운영하는 것.
- "any scale"은 조건부다. 검색 과금이 처리 바이트 기준이라 벡터 인덱스 파티션 키 설계가 곧 비용 설계고 파티션 없는 인덱스는 자랄수록 검색이 비싸진다. DynamoDB의 오래된 규율이 벡터에도 그대로 적용된다.
- 필터는 여전히 마지막 문제다. 등호 하나로 시작한 인라인 필터는 pgvector가 걸었던 길의 첫 칸이고 범위·IN이 오기 전까지 필터 무거운 워크로드는 이 물건의 바깥에 있다.
- 에이전트 메모리 유스케이스는 이름은 얻었지만 두 구멍이 있다. 방금 쓴 기억이 바로 검색되지 않고(eventually consistent), 에이전트별 격리를 IAM으로 못 가른다(FGAC 미지원). 검색은 커모디티가 됐고 거버넌스는 여전히 당신 몫이다.
- 호환 API 진영의 선공이 본가를 움직였다. ScyllaDB가 5월에 찌른 지점을 AWS가 8월에 지웠다 — DynamoDB API가 벤더 중립 표준처럼 움직이기 시작했다는 신호로 읽어도 된다.

프리뷰 없이 바로 GA, 전 리전 동시 출시라는 이례적인 속도는 AWS가 이 수요의 크기를 어떻게 보고 있는지를 말해 준다. 벡터 검색은 이제 기능 경쟁이 아니라 기본값 경쟁이다 — 당신의 운영 데이터가 어디 있든, 그 옆자리에 벡터 인덱스가 딸려 오는 시대. 따로 세운 벡터 DB가 설 자리는 그만큼 좁아졌고 앞으로 더 좁아질 것이다.

---

*참고: [Amazon DynamoDB now supports real-time vector search at any scale](https://aws.amazon.com/blogs/aws/amazon-dynamodb-now-supports-real-time-vector-search-at-any-scale/) (AWS News Blog, 2026-08-05), [Build semantic search with native vector support in Amazon DynamoDB](https://aws.amazon.com/blogs/database/build-semantic-search-with-native-vector-support-in-amazon-dynamodb/) (AWS Database Blog), [Using vector indexes in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/VectorSearch.html)·[Requirements and limitations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/VectorSearch.Requirements.html) (개발자 가이드 — 제약·일관성·SearchSchema는 문서 기준), [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/), [Native Vector Search for the DynamoDB API](https://www.scylladb.com/2026/05/05/native-vector-search-dynamodb/) (ScyllaDB, 2026-05-05), [Active Storage Takes Over](https://futurumgroup.com/insights/active-storage-takes-over-aws-dynamodb-adds-native-vector-search-for-agentic-ai/) (Futurum). 성능 수치(한 자릿수 ms·99%+ 리콜)는 AWS 자가 발표이며 독립 벤치마크는 아직 없다. Postgres 쪽 같은 서사는 [#41](/blog/41-pgcontext/), 에이전트 메모리 거버넌스는 [#50](/blog/50-tencentdb-agent-memory/) 참고.*
