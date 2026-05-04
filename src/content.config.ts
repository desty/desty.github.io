import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/work" }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
})

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/blog" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    demoUrl: z.string().optional(),
    repoUrl: z.string().optional(),
  }),
})

const guides = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/guides" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    guideUrl: z.string(),
    repoUrl: z.string().optional(),
  }),
})

const study = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/study" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    studyUrl: z.string(),
    repoUrl: z.string().optional(),
  }),
})

const prompts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/prompts" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
})

const legal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/legal" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})

export const collections = { work, blog, projects, guides, study, prompts, legal }
