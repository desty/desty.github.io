import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  site: "https://desty.github.io",
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "ko",
        locales: { ko: "ko", en: "en" },
      },
    }),
    solidJs(),
  ],
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
})