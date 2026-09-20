import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const apiKey = process.env.TYPESAFE_API_KEY;
if (!apiKey) throw new Error("TYPESAFE_API_KEY is required; no placeholder results will be written.");

const resultDir = join(import.meta.dirname, "../results");
const rows = JSON.parse(await readFile(join(resultDir, "dataset.json"), "utf8"));
const endpoint = process.env.TYPESAFE_API_URL ?? "https://api.typesafe.ai/v1/systemone";
const model = process.env.TYPESAFE_MODEL ?? "jev-1.13.0";
const predictions = [];

async function classify(row) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      state: { title: row.title, summary: row.summary },
      questions: {
        belongs: {
          type: "noul",
          instructions: "Is this post primarily about engineering AI agents or their harnesses, including execution loops, tools, context, memory, evaluation, safety, or coding-agent operation? Model releases, general AI commentary, search infrastructure, and developer career topics are false unless agent-system engineering is the main subject."
        }
      }
    })
  });
  if (!response.ok) throw new Error(`Jev HTTP ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const answer = body.answers?.belongs;
  const probability = answer?.noul ?? answer?.probability ?? answer?.value;
  if (typeof probability !== "number") throw new Error(`Missing Noul probability for ${row.id}`);
  return { id: row.id, actual: row.label, probability, predicted: probability >= 0.5 };
}

for (let index = 0; index < rows.length; index += 8) {
  const batch = rows.slice(index, index + 8);
  predictions.push(...await Promise.all(batch.map(classify)));
}

const tp = predictions.filter((p) => p.actual && p.predicted).length;
const tn = predictions.filter((p) => !p.actual && !p.predicted).length;
const fp = predictions.filter((p) => !p.actual && p.predicted).length;
const fn = predictions.filter((p) => p.actual && !p.predicted).length;
const report = {
  model,
  threshold: 0.5,
  datasetSize: rows.length,
  accuracy: (tp + tn) / rows.length,
  confusion: { tp, tn, fp, fn },
  predictions,
  note: "Ground truth is the repository's existing human-authored agent-engineering tag.",
};
await writeFile(join(resultDir, "jev.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
