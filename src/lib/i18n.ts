export const languages = { ko: "한국어", en: "English" } as const
export type Lang = keyof typeof languages
export const defaultLang: Lang = "ko"

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/")
  if (lang in languages) return lang as Lang
  return defaultLang
}

export function localizedPath(lang: Lang, path: string): string {
  const stripped = path.replace(/^\/(ko|en)\//, "/")
  if (lang === defaultLang) return stripped
  return `/${lang}${stripped}`
}

export function getAlternateUrl(currentUrl: URL): { lang: Lang; href: string } {
  const currentLang = getLangFromUrl(currentUrl)
  const targetLang = currentLang === "ko" ? "en" : "ko"
  return {
    lang: targetLang,
    href: localizedPath(targetLang, currentUrl.pathname),
  }
}

export function filterByLang<T extends { slug: string }>(
  entries: T[],
  lang: Lang
): T[] {
  const prefix = `${lang}/`
  return entries.filter((e) => e.slug.startsWith(prefix))
}

export function stripLangFromSlug(slug: string): string {
  return slug.replace(/^(ko|en)\//, "")
}
