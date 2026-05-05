---
title: "SEO & GEO 원샷 진단"
summary: "HTML head를 붙여넣으면 SEO와 GEO(AI 검색 최적화)를 동시에 점검하고 점수와 개선안을 제공하는 프롬프트입니다."
date: "2026-05-05T23:00:00"
tags:
  - seo
  - geo
  - audit
  - marketing
draft: false
---

## 프롬프트

```
당신은 SEO와 GEO(Generative Engine Optimization) 전문 진단 전문가입니다.

아래에 붙여넣은 HTML <head> 소스를 분석하여, 전통 SEO와 AI 검색 최적화(GEO) 양쪽을 동시에 점검하세요.

---

## 점검 항목

### SEO (전통 검색엔진)
- title 태그 (길이, 키워드 포함 여부)
- meta description (길이, 매력도)
- canonical URL
- Open Graph (og:title, og:description, og:image, og:type)
- Twitter Card
- hreflang (다국어 사이트인 경우)
- sitemap / robots 연결
- 모바일 viewport

### GEO (AI 검색엔진 인용)
- JSON-LD 구조화 데이터 (Schema.org — BlogPosting, Article, FAQPage 등)
- article:author / article:published_time
- og:locale, og:site_name (엔티티 명확성)
- article:tag (주제 분류 시그널)
- llms.txt 존재 여부 (robots.txt에서 확인 가능하면)
- 저자 크레딧 명시 여부
- 답변 인용에 적합한 구조 (Quick Answer 블록, FAQ 등)

---

## 출력 형식

### 1. 점수표

| 영역 | 점수 (0-100) | 등급 |
|------|-------------|------|
| SEO 기본 | | |
| Open Graph | | |
| 구조화 데이터 | | |
| GEO 인용 준비도 | | |
| **종합** | | |

등급: A (90+), B (70-89), C (50-69), D (50 미만)

### 2. 발견된 문제 (우선순위별)

🔴 Critical — 즉시 수정
🟡 Warning — 권장 수정
🟢 Pass — 문제없음

각 항목에 대해:
- 현재 상태
- 문제점
- 구체적 수정 코드 (복붙 가능한 HTML)

### 3. GEO 개선 제안

AI에 인용될 확률을 높이기 위한 구체적 액션 3가지를 제안하세요.

---

## 분석할 HTML <head>

[여기에 HTML <head> 소스를 붙여넣으세요]
```

## 사용 방법

1. 검사할 페이지에서 개발자 도구(F12)를 열고 `<head>` 전체를 복사합니다.
2. ChatGPT, Claude 등에 위 프롬프트를 붙여넣습니다.
3. 프롬프트 맨 아래에 복사한 HTML을 붙여넣고 전송합니다.

## 팁

- 블로그 글 페이지와 홈페이지를 각각 검사하면 더 완전한 결과를 얻습니다.
- `robots.txt`와 `sitemap.xml` 내용도 함께 붙여넣으면 GEO 분석이 더 정확해집니다.
- 경쟁사 페이지를 같은 프롬프트로 분석하면 벤치마킹이 됩니다.
- JSON-LD가 없다면 AI가 생성해주는 코드를 바로 적용할 수 있습니다.
