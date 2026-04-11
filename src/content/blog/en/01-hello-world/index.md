---
title: "Hello World"
summary: "First post. Testing code blocks, Mermaid diagrams, and tables."
date: "2026-03-29T00:00:00"
tags:
  - blog
  - test
---

This is the first post. Here I'm testing the features supported by this blog.

## Code Block

```typescript
const greet = (name: string): string => {
  return `Hello, ${name}!`
}

console.log(greet("world"))
```

```python
def fibonacci(n: int) -> list[int]:
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]

print(fibonacci(10))
```

## Mermaid Diagram

```mermaid
graph TD
    A[Write Post] --> B{Format?}
    B -->|Markdown| C[.md file]
    B -->|MDX| D[.mdx file]
    C --> E[Git Push]
    D --> E
    E --> F[Auto Deploy]
```

```mermaid
sequenceDiagram
    Reader->>Blog: Visit page
    Blog->>CDN: Request assets
    CDN-->>Blog: Static HTML/CSS/JS
    Blog-->>Reader: Rendered page
```

## Table

| Feature | Status |
|---------|--------|
| Code Highlight | multi-language |
| Mermaid | flowchart, sequence |
| Dark Mode | auto toggle |
| Search | full-text |
| MDX | components in markdown |
| LaTeX | $E = mc^2$ |
