---
title: "MCP & Tool 설계 가이드"
summary: "Model Context Protocol의 3가지 프리미티브와 동작 원리부터, 모델이 헤매지 않는 Tool을 만드는 설계 10원칙과 흔한 안티패턴까지."
date: "2026-06-20T10:00:00"
tags:
  - mcp
  - tool-design
  - ai-agent
  - function-calling
  - json-rpc
  - guide
guideUrl: "https://desty.github.io/mcp-guide/"
repoUrl: "https://github.com/desty/mcp-guide"
---

MCP가 왜 "AI를 위한 USB-C"인지, Tools·Resources·Prompts 세 프리미티브를 어떻게 구분하는지, JSON-RPC·전송 방식·OAuth 2.1로 어떻게 동작하는지 정리했습니다. 핵심은 소비자가 사람이 아니라 모델이라는 전제 위에서 Tool을 설계하는 10가지 원칙과, 대부분의 서버가 넘어지는 6가지 안티패턴입니다.
