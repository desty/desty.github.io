import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import YAML from "yaml";

const repoRoot = resolve(import.meta.dirname, "../../..");
const blogRoot = join(repoRoot, "src/content/blog/ko");
const outDir = join(import.meta.dirname, "../results");
const reviews = JSON.parse(await readFile(join(import.meta.dirname, "../reviewed-labels.json"), "utf8"));
const rows = [];

for (const slug of (await readdir(blogRoot)).sort()) {
  const file = join(blogRoot, slug, "index.md");
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch {
    continue;
  }
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) continue;
  const data = YAML.parse(frontmatter[1]);
  if (!data?.title || !data?.summary || !Array.isArray(data.tags)) continue;
  const tagLabel = data.tags.includes("agent-engineering");
  const review = reviews[slug];
  rows.push({
    id: slug,
    title: data.title,
    summary: data.summary,
    text: `${data.title}\n${data.summary}`,
    label: review?.label ?? tagLabel,
    labelSource: review ? "manual-review" : "existing-tag",
    originalTagLabel: tagLabel,
  });
}

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "dataset.json"), `${JSON.stringify(rows, null, 2)}\n`);
console.log(JSON.stringify({
  rows: rows.length,
  positive: rows.filter((row) => row.label).length,
  negative: rows.filter((row) => !row.label).length,
  manuallyReviewed: rows.filter((row) => row.labelSource === "manual-review").length,
}));
