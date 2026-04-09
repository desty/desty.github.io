import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@consts"

export const GET: APIRoute = async () => {
  const blog = await getCollection("blog")
  const guides = await getCollection("guides")

  blog.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
  guides.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  const site = import.meta.env.SITE

  const lines = [
    `# ${SITE.TITLE}`,
    ``,
    `> ${SITE.DESCRIPTION}`,
    ``,
    `## Blog`,
    ``,
    ...blog.map(
      (post) => `- [${post.data.title}](${site}/blog/${post.slug}/): ${post.data.summary}`
    ),
    ``,
    `## Guides`,
    ``,
    ...guides.map(
      (guide) => `- [${guide.data.title}](${site}/guides/${guide.slug}/): ${guide.data.summary}`
    ),
    ``,
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
