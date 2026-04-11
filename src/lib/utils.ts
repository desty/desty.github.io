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


export function truncateText(str: string, maxLength: number): string {
  const ellipsis = '…';

  if (str.length <= maxLength) return str;

  const trimmed = str.trimEnd();
  if (trimmed.length <= maxLength) return trimmed;

  const cutoff = maxLength - ellipsis.length;
  let sliced = str.slice(0, cutoff).trimEnd();

  return sliced + ellipsis;
}