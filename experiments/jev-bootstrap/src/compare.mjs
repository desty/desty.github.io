import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const resultDir = join(import.meta.dirname, "../results");
const dataset = JSON.parse(await readFile(join(resultDir, "dataset.json"), "utf8"));
const prior = JSON.parse(await readFile(join(resultDir, "jev.json"), "utf8"));
const labels = new Map(dataset.map((row) => [row.id, row.label]));

function evaluate(threshold) {
  const rows = prior.predictions.map((prediction) => ({
    ...prediction,
    actual: labels.get(prediction.id),
    predicted: prediction.probability >= threshold,
  }));
  const tp = rows.filter((row) => row.actual && row.predicted).length;
  const tn = rows.filter((row) => !row.actual && !row.predicted).length;
  const fp = rows.filter((row) => !row.actual && row.predicted).length;
  const fn = rows.filter((row) => row.actual && !row.predicted).length;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  return {
    threshold,
    accuracy: (tp + tn) / rows.length,
    balancedAccuracy: ((tp / (tp + fn || 1)) + (tn / (tn + fp || 1))) / 2,
    precision,
    recall,
    f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0,
    confusion: { tp, tn, fp, fn },
    errors: rows.filter((row) => row.actual !== row.predicted).map(({ id, actual, probability }) => ({ id, actual, probability })),
  };
}

const report = {
  model: prior.model,
  datasetSize: dataset.length,
  manualReviews: dataset.filter((row) => row.labelSource === "manual-review").length,
  thresholdSweep: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map(evaluate),
  note: "Probabilities come from one live Jev run. Metrics were recomputed after manual adjudication without calling the model again.",
};
await writeFile(join(resultDir, "comparison.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
