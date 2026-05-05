---
title: "SEO & GEO One-Shot Audit"
summary: "Paste your HTML head and get a combined SEO + GEO (AI search optimization) audit with scores and actionable fixes."
date: "2026-05-05T23:00:00"
tags:
  - seo
  - geo
  - audit
  - marketing
draft: false
---

## Prompt

```
You are an expert SEO and GEO (Generative Engine Optimization) auditor.

Analyze the HTML <head> source pasted below and audit it for both traditional SEO and AI search optimization (GEO) simultaneously.

---

## Audit Checklist

### SEO (Traditional Search Engines)
- title tag (length, keyword inclusion)
- meta description (length, appeal)
- canonical URL
- Open Graph (og:title, og:description, og:image, og:type)
- Twitter Card
- hreflang (if multilingual)
- sitemap / robots linkage
- mobile viewport

### GEO (AI Search Engine Citation)
- JSON-LD structured data (Schema.org — BlogPosting, Article, FAQPage, etc.)
- article:author / article:published_time
- og:locale, og:site_name (entity clarity)
- article:tag (topic classification signal)
- llms.txt presence (check robots.txt if available)
- Author credit visibility
- Citation-ready structure (Quick Answer block, FAQ, etc.)

---

## Output Format

### 1. Scorecard

| Area | Score (0-100) | Grade |
|------|--------------|-------|
| SEO Basics | | |
| Open Graph | | |
| Structured Data | | |
| GEO Citation Readiness | | |
| **Overall** | | |

Grades: A (90+), B (70-89), C (50-69), D (below 50)

### 2. Issues Found (by priority)

🔴 Critical — fix immediately
🟡 Warning — recommended fix
🟢 Pass — no issues

For each item:
- Current state
- Problem
- Specific fix code (copy-paste ready HTML)

### 3. GEO Improvement Suggestions

Suggest 3 specific actions to increase the probability of being cited by AI engines.

---

## HTML <head> to analyze

[Paste your HTML <head> source here]
```

## How to Use

1. Open DevTools (F12) on the page you want to audit and copy the entire `<head>`.
2. Paste the prompt above into ChatGPT, Claude, or any AI chatbot.
3. Paste the copied HTML at the bottom of the prompt and send.

## Tips

- Audit both a blog post page and your homepage for a complete picture.
- Including your `robots.txt` and `sitemap.xml` content makes the GEO analysis more accurate.
- Run the same prompt on competitor pages for benchmarking.
- If JSON-LD is missing, the AI-generated code can be applied directly.
