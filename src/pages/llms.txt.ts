import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { filterByLang, stripLangFromSlug } from "@lib/i18n"

export const GET: APIRoute = async () => {
  const byDate = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()

  const blog = filterByLang(await getCollection("blog"), "ko").sort(byDate)
  const guides = filterByLang(await getCollection("guides"), "ko").sort(byDate)
  const projects = filterByLang(await getCollection("projects"), "ko").sort(byDate)
  const study = filterByLang(await getCollection("study"), "ko").sort(byDate)
  const prompts = filterByLang(await getCollection("prompts"), "ko").sort(byDate)

  const site = import.meta.env.SITE

  const section = (
    title: string,
    base: string,
    entries: { id: string; data: { title: string; summary: string } }[]
  ) =>
    entries.length
      ? [
          `## ${title}`,
          ``,
          ...entries.map(
            (e) => `- [${e.data.title}](${site}/${base}/${stripLangFromSlug(e.id)}/): ${e.data.summary}`
          ),
          ``,
        ]
      : []

  const lines = [
    `# ${SITE.TITLE}`,
    ``,
    `> ${SITE.DESCRIPTION}`,
    ``,
    ...section("Blog", "blog", blog),
    ...section("Guides", "guides", guides),
    ...section("Projects", "projects", projects),
    ...section("Study", "study", study),
    ...section("Prompts", "prompts", prompts),
    `## Optional`,
    ``,
    `- [Full content](${site}/llms-full.txt)`,
    ``,
  ]

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
