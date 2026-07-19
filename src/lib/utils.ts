import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, lang: string = "ko") {
  const locale = lang === "en" ? "en-US" : "ko-KR"
  return Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date)
}

export function readingTime(html: string, lang: string = "ko") {
  const textOnly = html.replace(/<[^>]+>/g, "")
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed()
  return lang === "en" ? `${readingTimeMinutes} min read` : `${readingTimeMinutes}분 소요`
}


const MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

// summary 속 마크다운 링크를 순수 텍스트로 — meta description·카드·RSS용
export function stripMdLinks(text: string): string {
  return text.replace(MD_LINK, "$1")
}

// summary 속 마크다운 링크를 <a>로 — 글 상단 요약 표시용
export function mdLinksToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  return escaped.replace(MD_LINK, '<a href="$2" class="underline underline-offset-2 hover:text-black hover:dark:text-white transition-colors duration-300 ease-in-out">$1</a>')
}

export function truncateText(str: string, maxLength: number): string {
  const ellipsis = '…';

  if (str.length <= maxLength) return str;

  const trimmed = str.trimEnd();
  if (trimmed.length <= maxLength) return trimmed;

  const cutoff = maxLength - ellipsis.length;
  let sliced = str.slice(0, cutoff).trimEnd();

  return sliced + ellipsis;
}