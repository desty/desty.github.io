import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "desty",
  DESCRIPTION: "개발자 desty의 블로그 & 포트폴리오.",
  AUTHOR: "desty",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "경력 사항입니다.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "개발과 기술에 대한 글을 씁니다.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "최근 진행한 프로젝트입니다.",
}

// Guides Page
export const GUIDES: Page = {
  TITLE: "Guides",
  DESCRIPTION: "직접 작성한 기술 가이드입니다.",
}

// Study Page
export const STUDY: Page = {
  TITLE: "Study",
  DESCRIPTION: "직접 공부하고 정리한 스터디 노트입니다.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "키워드로 글과 프로젝트를 검색합니다.",
}

// Links
export const LINKS: Links = [
  {
    TEXT: "Home",
    HREF: "/",
  },
  {
    TEXT: "Blog",
    HREF: "/blog",
  },
  {
    TEXT: "Projects",
    HREF: "/projects",
  },
  {
    TEXT: "Guides",
    HREF: "/guides",
  },
  {
    TEXT: "Study",
    HREF: "/study",
  },
]

// Socials
export const SOCIALS: Socials = [
  {
    NAME: "Github",
    ICON: "github",
    TEXT: "desty",
    HREF: "https://github.com/desty"
  },
  {
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "desty",
    HREF: "https://www.linkedin.com/in/desty"
  },
]

