import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { filterByLang } from "@lib/i18n"

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

export const GET: APIRoute = async () => {
  const byDate = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()

  const blog = filterByLang(await getCollection("blog"), "ko").sort(byDate)
  const guides = filterByLang(await getCollection("guides"), "ko").sort(byDate)
  const projects = filterByLang(await getCollection("projects"), "ko").sort(byDate)
  const study = filterByLang(await getCollection("study"), "ko").sort(byDate)
  const prompts = filterByLang(await getCollection("prompts"), "ko").sort(byDate)

  const sections: string[] = [
    `# ${SITE.TITLE}`,
    ``,
    `> ${SITE.DESCRIPTION}`,
    ``,
  ]

  const pushSection = (
    title: string,
    entries: { data: { title: string; date: Date; tags: string[] }; body?: string }[]
  ) => {
    if (!entries.length) return
    sections.push(`---`, ``, `## ${title}`, ``)
    for (const entry of entries) {
      sections.push(
        `### ${entry.data.title}`,
        ``,
        `Date: ${formatDate(entry.data.date)}`,
        `Tags: ${entry.data.tags.join(", ")}`,
        ``,
        entry.body ?? "",
        ``,
        `---`,
        ``,
      )
    }
  }

  pushSection("Blog", blog)
  pushSection("Guides", guides)
  pushSection("Projects", projects)
  pushSection("Study", study)
  pushSection("Prompts", prompts)

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
