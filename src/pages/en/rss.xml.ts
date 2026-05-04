import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { filterByLang, stripLangFromSlug } from "@lib/i18n"

type Context = {
  site: string
}

export async function GET(context: Context) {
	const posts = await getCollection("blog")
  const projects = await getCollection("projects")

  const items = [...filterByLang(posts, "en"), ...filterByLang(projects, "en")]

  items.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  return rss({
    title: SITE.TITLE,
    description: "Developer desty's blog & portfolio.",
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.date,
      link: `/en/${item.collection}/${stripLangFromSlug(item.id)}/`,
    })),
  })
}
