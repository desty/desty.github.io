import type { Lang } from "./i18n"

const ui: Record<string, Record<Lang, string>> = {
  // Hero
  "hero.greeting": { ko: "안녕하세요,", en: "Hello," },
  "hero.subtitle": { ko: "개발자 desty의 블로그 & 포트폴리오", en: "Developer desty's blog & portfolio" },
  "hero.blog": { ko: "블로그 보기", en: "Read Blog" },
  "hero.work": { ko: "경력 보기", en: "View Work" },

  // About
  "about.intro1": { ko: "<b><i>개발자</i></b>입니다. 만들고 부수는 걸 좋아합니다.", en: "I'm a <b><i>developer</i></b>. I love building and breaking things." },
  "about.intro2": { ko: "도전적인 프로젝트와 문제 해결에서 동기를 얻으며, 깔끔한 코드와 좋은 사용자 경험을 만드는 데 관심이 많습니다.", en: "Motivated by challenging projects and problem-solving, with a passion for clean code and great user experiences." },

  // Section headers
  "section.recentPosts": { ko: "최근 글", en: "Recent Posts" },
  "section.recentProjects": { ko: "최근 프로젝트", en: "Recent Projects" },
  "section.techStack": { ko: "사이트 기술 스택", en: "Site Tech Stack" },
  "section.solidjs": { ko: "반응성과 상태 관리는", en: "Reactivity and state management powered by" },
  "section.contact": { ko: "연락하기", en: "Contact" },
  "section.contactDesc": { ko: "이메일이나 소셜 미디어로 연락해주세요.", en: "Reach out via email or social media." },
  "nav.viewAll": { ko: "전체 보기", en: "View All" },

  // Footer
  "footer.backToTop": { ko: "맨 위로", en: "Back to top" },
  "footer.status": { ko: "정상 운영 중", en: "All systems operational" },

  // Article
  "article.backBlog": { ko: "글 목록으로", en: "Back to posts" },
  "article.backGuides": { ko: "가이드 목록으로", en: "Back to guides" },
  "article.backProjects": { ko: "프로젝트 목록으로", en: "Back to projects" },
  "article.viewGuide": { ko: "가이드 보기", en: "View Guide" },
  "article.viewDemo": { ko: "데모 보기", en: "View Demo" },
  "article.viewRepo": { ko: "저장소 보기", en: "View Repo" },
  "article.prev": { ko: "이전 글", en: "Previous" },
  "article.next": { ko: "다음 글", en: "Next" },

  // Page descriptions
  "site.description": { ko: "개발자 desty의 블로그 & 포트폴리오.", en: "Developer desty's blog & portfolio." },
  "page.work.title": { ko: "Work", en: "Work" },
  "page.work.desc": { ko: "경력 사항입니다.", en: "Work experience." },
  "page.blog.title": { ko: "Blog", en: "Blog" },
  "page.blog.desc": { ko: "개발과 기술에 대한 글을 씁니다.", en: "Writing about development and technology." },
  "page.projects.title": { ko: "Projects", en: "Projects" },
  "page.projects.desc": { ko: "최근 진행한 프로젝트입니다.", en: "Recent projects." },
  "page.guides.title": { ko: "Guides", en: "Guides" },
  "page.guides.desc": { ko: "직접 작성한 기술 가이드입니다.", en: "Technical guides I've written." },
  "page.search.title": { ko: "Search", en: "Search" },
  "page.search.desc": { ko: "키워드로 글과 프로젝트를 검색합니다.", en: "Search posts and projects by keyword." },

  // Search
  "search.placeholder": { ko: "무엇을 찾고 있나요?", en: "What are you looking for?" },
  "search.found": { ko: "개의 결과를 찾았습니다", en: "results found for" },
  "search.searchIn": { ko: "검색", en: "Search" },

  // ArrowCard
  "card.post": { ko: "post", en: "post" },
  "card.project": { ko: "project", en: "project" },
}

export function t(key: string, lang: Lang): string {
  return ui[key]?.[lang] ?? ui[key]?.ko ?? key
}
