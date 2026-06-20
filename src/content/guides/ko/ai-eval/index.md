---
title: "AI Eval / 평가 파이프라인 가이드"
summary: "측정할 수 없으면 개선할 수 없다. 3계층 평가 아키텍처, LLM-as-Judge 편향과 완화, 평가 도구 지형, 안티패턴."
date: "2026-06-20T11:02:00"
tags:
  - eval
  - llm-as-judge
  - testing
  - observability
  - ai-quality
  - guide
guideUrl: "https://desty.github.io/ai-eval-guide/"
repoUrl: "https://github.com/desty/ai-eval-guide"
---

LLM 시스템은 측정 없이 개선할 수 없습니다. 왜 기능보다 평가를 먼저 세워야 하는지, 자동 지표→LLM-as-Judge→사람으로 이어지는 3계층 평가 아키텍처, LLM-as-Judge의 4가지 편향(position·verbosity·self-preference·과신)과 완화법, 도구 지형(DeepEval·Ragas·Langfuse·Phoenix·Braintrust), 그리고 안티패턴 5가지를 정리했습니다.
