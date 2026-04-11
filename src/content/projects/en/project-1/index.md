---
title: "desty.github.io"
summary: "A developer blog & portfolio built on Astro Sphere. Features dark mode, meteor animations, Mermaid diagrams, and code highlighting."
date: "2026-03-29T00:00:00"
tags:
  - astro
  - tailwindcss
  - typescript
  - github-pages
demoUrl: "https://desty.github.io"
repoUrl: "https://github.com/desty/desty.github.io"
---

## Overview

A developer blog and portfolio site. The previous Jekyll blog was completely replaced with the Astro Sphere theme.

## Architecture

```mermaid
graph LR
    A[Obsidian] -->|write markdown| B[src/content]
    B -->|git push| C[GitHub v4 branch]
    C -->|GitHub Actions| D[Astro Build]
    D -->|deploy| E[GitHub Pages]
```

## Tech Stack

| Category | Tech |
|----------|------|
| Framework | Astro |
| Styling | Tailwind CSS |
| Language | TypeScript |
| UI | Solid.js (search) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Diagram | Mermaid |
| Content | Markdown / MDX |

## Features

- **Dark/Light Mode** -- Toggle + system preference detection
- **Meteor Animations** -- Stars and meteor effects on the dark mode background
- **Code Highlighting** -- Multi-language support with copy button
- **Mermaid Diagrams** -- Flowcharts, sequence diagrams, class diagrams, and more
- **Full-text Search** -- Unified search across blog posts and projects
- **Auto Deploy** -- Build and deploy via GitHub Actions on push to the v4 branch
- **SEO** -- Automatic generation of sitemap, RSS, Open Graph, and robots.txt
- **Responsive** -- Mobile, tablet, and desktop

## Deploy Flow

```mermaid
sequenceDiagram
    participant D as Developer
    participant O as Obsidian
    participant G as GitHub
    participant A as Actions
    participant P as Pages

    D->>O: Write / Edit markdown
    O->>G: git push (v4 branch)
    G->>A: Trigger workflow
    A->>A: npm install & astro build
    A->>P: Upload & deploy artifact
    P-->>D: Live at desty.github.io
```

## Project Structure

```
src/
├── components/     # Astro & Solid.js components
├── content/
│   ├── blog/       # Blog posts (markdown)
│   ├── projects/   # Projects (markdown)
│   ├── work/       # Work experience (markdown)
│   └── legal/      # Legal pages (markdown)
├── layouts/        # Page layouts
├── pages/          # Routing
├── styles/         # Global CSS
└── consts.ts       # Site configuration
```

## Setup History

1. Deleted the entire legacy Jekyll blog (2016~)
2. Tried Quartz 4 -- abandoned due to design limitations
3. Applied the Astro Sphere theme
4. Customized site metadata and social links
5. Set up the GitHub Actions deployment pipeline
6. Added Mermaid diagram support
