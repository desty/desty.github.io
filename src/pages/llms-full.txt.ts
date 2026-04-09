import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@consts"

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

export const GET: APIRoute = async () => {
  const blog = await getCollection("blog")
  const guides = await getCollection("guides")

  blog.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
  guides.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  const sections: string[] = [
    `# ${SITE.TITLE}`,
    ``,
    `> ${SITE.DESCRIPTION}`,
    ``,
  ]

  if (blog.length > 0) {
    sections.push(`---`, ``, `## Blog`, ``)
    for (const post of blog) {
      sections.push(
        `### ${post.data.title}`,
        ``,
        `Date: ${formatDate(post.data.date)}`,
        `Tags: ${post.data.tags.join(", ")}`,
        ``,
        post.body ?? "",
        ``,
        `---`,
        ``,
      )
    }
  }

  if (guides.length > 0) {
    sections.push(`## Guides`, ``)
    for (const guide of guides) {
      sections.push(
        `### ${guide.data.title}`,
        ``,
        `Date: ${formatDate(guide.data.date)}`,
        `Tags: ${guide.data.tags.join(", ")}`,
        ``,
        guide.body ?? "",
        ``,
        `---`,
        ``,
      )
    }
  }

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
