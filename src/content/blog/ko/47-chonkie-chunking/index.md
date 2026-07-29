---
title: "청킹 라이브러리는 어쩌다 YC까지 갔나 — 팔린 것은 똑똑함이 아니라 가벼움이었다"
summary: "RAG 튜토리얼에서 한 줄로 지나가는 전처리 잡일, 청킹. 그 한 단계만 파는 라이브러리가 월 119만 다운로드를 받고 YC를 통과해 회사가 됐다. 흥미로운 건 그 다음이다. '33배 빠름'은 최하위 경쟁자 대비였고 1위와는 1.06배, '100GB/s'는 토큰 세기를 포기한 숫자였으며, 창업자 스스로 HN에서 '완벽한 분할은 검색 품질을 거의 못 움직인다'고 인정했다. 그런데도 다운로드는 계속 늘었다. 시맨틱 청킹이 단순 recursive를 못 이긴다는 실증 연구가 쌓이는 지형에서 사람들이 진짜 산 것은 무엇이었는지, long context 시대에 청킹이 살아남은 이유, 청커 11종에서 뭘 골라야 하는지, 그리고 회사가 피벗해도 라이브러리가 남는 오픈소스의 결말까지 해부했다."
date: "2026-08-13T10:00:00"
tags:
  - rag
  - retrieval
  - chunking
  - open-source
  - context-engineering
draft: false
---

RAG 튜토리얼에서 청킹은 한 줄짜리 단계다. 문서를 512토큰씩 자른다, 끝. 파이프라인 도식에서 가장 하찮은 취급을 받는 전처리 잡일인데, 그 잡일 하나만 파는 라이브러리가 PyPI에서 **월 119만 다운로드를** 받고, 만든 두 사람은 Y Combinator를 통과해 회사를 차렸다. 하마 마스코트를 단 [Chonkie](https://github.com/feyninc/chonkie)다.

이 글은 이 라이브러리의 코드 리뷰가 아니다. 잡일이 회사가 될 만큼의 수요가 어디서 왔는지에 대한 해부다. 미리 말해두면 결론이 좀 뒤틀려 있다 — **속도와 똑똑함을 앞세워 유명해진 도구인데, 실제로 팔린 것은 속도도 똑똑함도 아니었다.** 그리고 그 사실을 창업자가 제일 잘 안다.

---

## 3주 만에 1,700스타 — 수요는 이미 있었다

2024년 11월, 당시 커리어 초입의 ML 엔지니어 Bhavnick Minhas가 [Show HN에 올린 개인 프로젝트](https://news.ycombinator.com/item?id=42100819)가 시작이다. 동기는 본문 첫 줄에 있다. "RAG 애플리케이션 만들 때마다 청킹 코드를 다시 쓰는 데 지쳐서 만들었다. 기존 라이브러리는 너무 비대하거나(80MB+) 너무 기본만 있거나, 중간이 없었다." 스타는 3주 만에 1,700개를 넘겼다.

이후는 오픈소스가 회사가 되는 전형적 코스다. 어릴 적 친구이자 전 Google 엔지니어인 Shreyash Nigam이 합류해 2025년 6월 [YC X25 배치로 Launch HN](https://news.ycombinator.com/item?id=44225930)에 다시 섰고 시드 50만 달러를 받았다. 2026년 7월 현재 스타 4,600개(2025년 초 repo 이관으로 계보가 한 번 리셋된 뒤의 수치다), [PyPI 월 다운로드는 2026년 2월 38만에서 7월 119만으로](https://pypistats.org/packages/chonkie) 반년 새 세 배가 됐다.

수요의 방증은 경쟁자 쪽에도 있다. LangChain은 text splitter를 일찌감치 `langchain-text-splitters`라는 독립 패키지로 분리했고, 1.0 시대에 레거시 코드가 `langchain-classic`으로 밀려나는 구조조정 속에서도 이 패키지만은 살아남았다. 프레임워크 진영 스스로 청킹이 본체에서 떼어낼 수 있는 부품이라는 걸 인정한 셈이다. Chonkie는 그 부품을 단품으로 만들어 팔았다. 기본 설치 15MiB로 [LangChain(80MiB)의 5분의 1, LlamaIndex(171MiB)의 10분의 1이고](https://github.com/feyninc/chonkie/blob/main/BENCHMARKS.md) 기본 기능은 외부 의존성이 없다. 80MB 프레임워크를 통째로 끌고 오기 싫다는 마음, 그게 첫 번째 수요였다.

## 속도 숫자의 실체 — 33배, 100GB/s, 1TB/s

README의 자랑은 속도다. 토큰 청킹이 **"가장 느린 대안보다 33배"** 빠르다고 적혀 있는데 이 문구는 조건을 같이 읽어야 한다. [자체 벤치마크](https://github.com/feyninc/chonkie/blob/main/BENCHMARKS.md) 기준 Paul Graham 에세이 데이터셋에서 LlamaIndex가 272ms, Chonkie가 8.18ms — 여기서 33배가 나온다. 그런데 같은 표에서 LangChain은 8.68ms다. 선두 대비로는 **1.06배,** 사실상 동급이다. 첫 바이럴 당시 HN에서도 "2위 대비 개선은 1.06배뿐"이라는 지적과 벤치마크에서 자기 라이브러리만 워밍업을 거쳤다는 시비가 나왔다. README가 "slowest alternative"라고 정직하게 써놓은 것이 그나마의 방어다.

더 화려한 숫자는 2026년에 나왔다. 1월에 v1.5.2로 추가된 FastChunker는 SIMD 가속으로 **"100GB/s 이상"을** 내세우고, 그 기반이 된 Rust 라이브러리 [chunk](https://github.com/feyninc/chunk)의 README는 "영문 위키피디아 전체를 120ms에 청킹", 최대 **1TB/s의 "semantic" 청킹을** 주장한다. 이 semantic에는 따옴표가 붙어 있다 — 임베딩 기반 의미 분할이 아니라 "문장부호라는 의미 경계에서 자른다"는 말장난에 가깝다. [FastChunker 문서를](https://docs.chonkie.ai/oss/chunkers/fast-chunker) 읽으면 실체가 명확한데, 토큰을 아예 세지 않고 바이트 크기 기준으로 구분자를 스캔하는 방식이라 반환되는 청크의 `token_count`는 항상 0이다. 속도의 비밀은 알고리즘에 있지 않다. **토큰 계산이라는 작업 자체를 빼버렸다.**

Bhavnick이 이 최적화 과정을 정리한 블로그 ["So, you want to chunk really fast?"](https://minha.sh/posts/so,-you-want-to-chunk-really-fast)가 2026년 1월 HN 프런트에 다시 올랐을 때, 논쟁은 정확히 이 지점에서 붙었다. 한 댓글이 암달의 법칙으로 계산을 끝냈다 — 아주 빠른 임베더가 초당 1.6GB를 처리하니 청킹과는 **두 자릿수 차이고** "청킹은 병목이 아니다." 청킹은 대개 일회성 작업이라 지연에 민감하지도 않다는 지적도 따라붙었다. 창업자 Shreyash의 답변이 흥미롭다. 반박 대신 절반의 수긍이 돌아왔다. "인제스천할 파일 수가 커지면 청킹 속도가 병목이 되긴 한다" — 즉 이 속도가 의미를 갖는 자리는 대량 코퍼스의 초기 적재나 주기적 재인덱싱으로 좁혀진다는 걸, 보통의 RAG 구축과는 거리가 있다는 걸 만든 쪽도 인정한다.

## 창업자의 실토와 연구의 합의 — 똑똑한 청킹은 밥값을 못 한다

같은 스레드에서 Shreyash는 더 중요한 문장을 남겼다. **"우리 경험상 검색 정확도는 대부분 임베딩 품질이 결정한다. 완벽한 분할은 바늘을 크게 움직이지 못한다."** 청킹 회사 창업자가 청킹의 효용 한계를 실토한 셈인데, 이 문장은 실증 연구의 합의와 정확히 겹친다.

이 분야의 표준 인용인 [Chroma의 청킹 전략 평가](https://www.trychroma.com/research/evaluating-chunking)(2024년 7월)부터 보면, 전략 간 recall 차이는 **최대 9%p다.** 무시할 크기는 아니다 — 특히 OpenAI 예제 코드의 기본값(800토큰, 오버랩 400)은 유의미하게 열세로 나와, "기본값을 아무 데서나 베끼면 손해"라는 교훈은 실재한다. 하지만 방향을 보면, 이기는 쪽은 줄곧 싼 쪽이었다. ["시맨틱 청킹은 연산 비용값을 하는가?"라는 논문](https://arxiv.org/abs/2410.13070)(NAACL 2025 Findings)은 세 가지 과제에서 시맨틱 청킹의 비용이 일관된 성능 이득으로 정당화되지 않고 고정 크기 청커가 오히려 자주 우세하다고 답했다. [2026년 2월의 한 벤치마크는](https://www.firecrawl.dev/blog/best-chunking-strategies-rag) 학술 논문 50편에서 recursive 512토큰이 정확도 69%로 1위, 시맨틱 청킹은 평균 43토큰짜리 파편을 만들어내며 54%에 그쳤다고 보고했다. [2026년 5월](https://arxiv.org/abs/2606.00881)과 [7월의 후속 연구들도](https://arxiv.org/abs/2607.01852) 같은 방향을 재확인했다. 2026년 실무 가이드들의 컨센서스는 그래서 싱겁다. **recursive 400–512토큰에 오버랩 10–20%,** 이게 기본값이다.

그럼 "똑똑함"은 어디로 갔나. 임베딩 모델 안으로 들어갔다. 청크가 문서 전체 맥락을 잃는 문제를 청커 대신 인코딩 단계에서 푸는 계보 — Jina의 [late chunking](https://arxiv.org/abs/2409.04701), 청크마다 LLM으로 문서 맥락을 붙여 검색 실패율을 49% 줄인 Anthropic의 [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval), 그리고 그 보정을 모델 레벨로 흡수했다고 주장하는 Voyage의 [voyage-context-3까지](https://blog.voyageai.com/2025/07/23/voyage-context-3/). 문서를 어떻게 자를지 고민하는 대신, 자른 조각이 맥락을 기억하게 만드는 쪽으로 연구가 이동했다.

이 지형 위에 Chonkie의 제품 구성을 놓으면 앞뒤가 맞는다. 청커 11종 중 6종(Token·Fast·Sentence·Recursive·Code·Table)은 로컬 연산만으로 돌고, SemanticChunker의 기본 임베딩조차 API를 부르지 않는 로컬 정적 모델이다. LLM을 부르는 agentic 청커(Slumber)도 있지만 기본값이 아니다. **팔리는 물건은 "더 똑똑한 청킹"이 아니라 "잘 튜닝된 단순한 청킹을 가볍고 빠르게"라는 걸,** 만드는 쪽이 알고 설계했다.

## long context는 청킹을 죽이지 못했다

남은 반론은 하나다. 컨텍스트 윈도우가 100만 토큰인 시대에 자르는 일 자체가 무의미해지지 않나. 절반은 맞다. Anthropic은 contextual retrieval 글에서 **20만 토큰(약 500쪽) 이하 지식베이스는 RAG 없이 통째로 프롬프트에 넣으라고** 권고했고, 작은 코퍼스에서 이건 이미 관행이다.

그런데 그 선을 넘는 순간 청킹은 다른 이름으로 돌아온다. 2026년 초의 한 연구는 검색 단위가 2,500토큰 부근을 넘으면 품질이 급락하는 **context cliff를** 보고했다 — 넣을 수 있다는 것과 모델이 소화한다는 것은 다르다. 그 간극은 [#46](/blog/46-is-graphrag-needed/)에서 숫자로 확인했다. 검색이 근거의 83.5%를 가져와도 모델은 47.9%만 쓰고, 컨텍스트 뒤쪽에 놓인 근거는 죽는다. 검색 단위를 어떻게 설계하느냐가 곧 컨텍스트 배치 설계라면, 청킹은 그 순간 전처리 잡일에서 컨텍스트 엔지니어링의 입구로 자리를 옮긴다.

에이전트 검색 시대의 재편도 청킹을 지우지는 않는다. 강등시킬 뿐이다. LlamaIndex의 2025년 5월 글 ["RAG는 죽었다, 에이전트 검색 만세"가](https://www.llamaindex.ai/blog/rag-is-dead-long-live-agentic-retrieval) 선언한 죽음은 single-shot top-k 청크 검색이지 청킹이 아니다 — 에이전트가 청크 검색·메타데이터 검색·파일 통째 읽기를 라우팅하는 구조에서 청크는 여러 검색 단위 중 하나로 내려앉되 여전히 기본값이다. [RAGFlow의 2025년 결산은](https://ragflow.io/blog/rag-review-2025-from-rag-to-context) 한 걸음 더 나가서, 작은 청크로 정밀하게 찾고(Search) 큰 청크로 맥락을 조립하는(Retrieve) 이중 granularity 분리를 업계의 방향으로 짚었다. 어느 쪽이든 "무엇을 검색 단위로 삼을 것인가"라는 설계 문제는 남고, 오히려 격상됐다.

## 실전: 청커 11종에서 뭘 골라야 하나

Chonkie의 실용적 가치는 이 11종을 한 인터페이스로 갈아끼우며 실험할 수 있다는 데 있다. 비용 구조로 묶으면 선택지가 명확해진다.

| 비용 계층 | 청커 | 특기 사항 |
|---|---|---|
| 로컬 연산만 | Token, Sentence, Recursive, Table | 기본값 후보. Recursive가 사실상의 표준 |
| 로컬 연산만 (특수) | Fast, Code | Fast는 `token_count`를 계산하지 않음(항상 0), Code는 AST 기반·100+ 언어 |
| 로컬 모델 추론 | Semantic, Late, Neural | 임베딩·BERT 추론 비용. Semantic 기본 모델은 API 호출 없는 정적 임베딩 |
| API 호출 | Slumber(LLM), TeraflopAI(외부 API) | 문서량에 비례해 과금. eval로 증명 후에만 |

권장 순서는 연구 합의를 그대로 따르면 된다.

**1. 기본값은 recursive 512, 오버랩 10–20%.** 여기서 시작하지 않을 이유가 실증적으로 없다. Chonkie에서는 언어별 레시피를 불러 시작한다.

```python
from chonkie import RecursiveChunker

chunker = RecursiveChunker.from_recipe("markdown", lang="ko")
chunks = chunker("...문서...")
```

README의 "56개 언어 지원"의 실체가 이 레시피다 — 언어를 이해하는 알고리즘 같은 건 없고, 언어별 구분자·분할 규칙 세트를 Hugging Face 데이터셋으로 관리한다. 한국어 문서라면 마침표 기반 기본 구분자가 놓치는 종결어미 경계가 있으니, 레시피 결과물을 눈으로 확인하고 시작하는 게 안전하다. 한국어 검색 품질의 더 큰 변수는 [#42](/blog/42-korean-embeddings/)에서 본 임베딩 쪽이다.

**2. 코드베이스는 CodeChunker.** 함수·클래스 경계를 AST로 자르는 것은 고정 크기보다 명백히 낫다고 말할 수 있는 드문 사례다.

**3. 대량 인제스천에만 FastChunker.** 수백 GB 코퍼스의 초기 적재나 주기적 재인덱싱이라는, 창업자 스스로 인정한 그 조건에서만 의미가 있다. 토큰 수를 반환하지 않으므로 토큰 예산 로직과는 못 섞는다.

**4. 시맨틱 계열은 eval에서 이긴 다음에.** [#34](/blog/34-sufficient-context/)에서 정리한 대로 retrieval 실패와 생성 실패를 분리 계측하고 청킹이 병목이라는 증거가 나왔을 때 recursive 대비 A/B로 올린다. 순서를 뒤집으면 — 비싼 청커부터 켜면 — 연구들이 반복 확인한 "비용은 확실하고 이득은 불확실한" 지출이 된다.

**5. 적재까지 한 줄이 필요하면 Pipeline.** 벡터 DB 10종(Chroma·Qdrant·Weaviate·Milvus·pgvector·Pinecone·Elasticsearch·MongoDB·Turbopuffer·LanceDB)에 handshake로 바로 꽂힌다.

```python
from chonkie import Pipeline

docs = (Pipeline()
    .fetch_from("file", dir="./knowledge_base", ext=[".txt", ".md"])
    .chunk_with("recursive", chunk_size=512)
    .refine_with("overlap", context_size=100)
    .store_in("qdrant", collection_name="knowledge", url="http://localhost:6333")
    .run())
```

파이썬 밖에서 쓰거나 팀 공용 서비스로 세우려면 `docker compose up` 한 번으로 셀프호스트 REST API가 뜬다. 인증도 과금도 없고 데이터가 인프라 밖으로 안 나간다.

## 회사는 피벗했고, 라이브러리는 남았다

마지막 조각은 회사 쪽이다. 2026년 7월 현재 chonkie.ai는 usefeyn.com으로 리다이렉트되고 [YC 프로필도 Feyn](https://www.ycombinator.com/companies/feyn) — "고객 데이터로 커스텀 모델을 학습해준다"는 회사로 바뀌어 있다. 법인은 Chonkie, Inc. 그대로인데 간판과 주력 사업이 바뀌었다. 청킹 클라우드의 공개 가격표는 끝내 등장하지 않았다.

Launch HN에서 "오픈소스로 어떻게 돈 버냐"는 질문에 창업자들은 매니지드 ETL을 답했지만 결과적으로 시장이 준 답은 달랐다. **청킹은 다운로드를 열지만 지갑은 열지 못한다.** 월 119만 다운로드짜리 단품 유틸리티라는 위치가 사랑의 이유이자 수익화의 한계였고, 돈은 청킹 위층(커스텀 모델)에 있었다. v1.7.0에서 벤치마크 표의 단골 패배자였던 LlamaIndex 진영의 경량 파서 LiteParse를 전처리 단계로 통합한 것도 같은 맥락에서 읽힌다 — 단품 대 프레임워크의 대결 구도는 마케팅이고 실제 생태계는 서로의 부품을 가져다 쓰는 관계다.

쓰는 입장에서 정리하면 이렇다. 라이브러리 자체는 MIT이고 2026년에만 11번 릴리스될 만큼 유지보수가 활발하며, 로컬 온리로 돌릴 수 있어 종속 리스크가 작다. 다만 주력 사업이 옮겨간 회사의 오픈소스라는 사실은 적어둘 만하다 — 지금의 릴리스 속도가 유지된다는 보장은 어디에도 없다.

## 자르기 전에 물을 것

청킹에 연산이든 API든 돈을 태우기 전에 물을 것은 세 개다. 코퍼스가 20만 토큰을 넘는가 — 안 넘으면 자르지 말고 통째로 넣는다. 넘는다면, retrieval 실패와 생성 실패를 갈라 재봤을 때 청킹이 병목이라는 증거가 있는가. 있다면, 비싼 청커가 recursive 512를 내 eval에서 실제로 이겼는가.

셋을 통과하는 경우는 드물고, 그래서 대부분의 답은 "recursive 512에 오버랩 15%"로 수렴한다. Chonkie의 정직한 효용은 화려한 숫자가 아니라 여기 있다 — **어차피 단순한 그 작업을, 80MB 프레임워크 없이 505KB짜리 wheel로, 언어별 레시피와 함께 하게 해준다는 것.** [#46](/blog/46-is-graphrag-needed/)의 질문이 "가져온 근거나 제대로 쓰고 있는가"였다면 이번 질문은 그 앞 단계다. 자르는 데 쓰는 돈이 밥값을 하는가. 두 질문 모두, 더 정교한 도구를 사기 전에 지금 있는 것부터 계측하라는 같은 방향을 가리킨다.
