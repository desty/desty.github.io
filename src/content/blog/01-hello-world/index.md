---
title: "Hello World"
summary: "첫 번째 포스트. 코드 블럭, 다이어그램, 콜아웃 테스트."
date: "2026-03-29"
tags:
  - blog
  - test
---

# Hello World

첫 번째 포스트입니다. 이 블로그는 Obsidian에서 작성하고 GitHub Pages로 배포됩니다.

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

## Table

| Feature | Supported |
|---------|-----------|
| Code Highlight | multi-language |
| MDX | components in markdown |
| Dark Mode | auto toggle |
| Search | full-text |
| LaTeX | $E = mc^2$ |
