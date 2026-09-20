import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const resultDir = join(import.meta.dirname, "../results");
const rows = JSON.parse(await readFile(join(resultDir, "dataset.json"), "utf8"));

function grams(text) {
  const normalized = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const counts = new Map();
  for (let size = 2; size <= 5; size++) {
    for (let i = 0; i <= normalized.length - size; i++) {
      const gram = normalized.slice(i, i + size);
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
  }
  return counts;
}

function train(items) {
  const byClass = [new Map(), new Map()];
  const totals = [0, 0];
  const classCounts = [0, 0];
  const vocab = new Set();
  for (const row of items) {
    const cls = row.label ? 1 : 0;
    classCounts[cls]++;
    for (const [gram, count] of grams(row.text)) {
      vocab.add(gram);
      byClass[cls].set(gram, (byClass[cls].get(gram) ?? 0) + count);
      totals[cls] += count;
    }
  }
  return { byClass, totals, classCounts, vocabSize: vocab.size, size: items.length };
}

function probability(model, text) {
  const features = grams(text);
  const scores = [0, 1].map((cls) => {
    let score = Math.log((model.classCounts[cls] + 1) / (model.size + 2));
    const denominator = model.totals[cls] + model.vocabSize;
    for (const [gram, count] of features) {
      score += count * Math.log(((model.byClass[cls].get(gram) ?? 0) + 1) / denominator);
    }
    return score;
  });
  const max = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - max));
  return exp[1] / (exp[0] + exp[1]);
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function metrics(predictions) {
  const tp = predictions.filter((p) => p.actual && p.predicted).length;
  const tn = predictions.filter((p) => !p.actual && !p.predicted).length;
  const fp = predictions.filter((p) => !p.actual && p.predicted).length;
  const fn = predictions.filter((p) => p.actual && !p.predicted).length;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  return {
    accuracy: (tp + tn) / predictions.length,
    balancedAccuracy: ((tp / (tp + fn || 1)) + (tn / (tn + fp || 1))) / 2,
    precision,
    recall,
    f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0,
    confusion: { tp, tn, fp, fn },
  };
}

const sizes = [8, 16, 24, 32, 40, 48];
const repeats = 100;
const learningCurve = [];
for (const size of sizes.filter((value) => value < rows.length)) {
  const runs = [];
  for (let seed = 1; seed <= repeats; seed++) {
    const random = seeded(seed);
    const positives = shuffle(rows.filter((row) => row.label), random);
    const negatives = shuffle(rows.filter((row) => !row.label), random);
    const positiveCount = Math.max(1, Math.min(positives.length - 1, Math.round(size * positives.length / rows.length)));
    const negativeCount = Math.max(1, Math.min(negatives.length - 1, size - positiveCount));
    const training = [...positives.slice(0, positiveCount), ...negatives.slice(0, negativeCount)];
    const trainingIds = new Set(training.map((row) => row.id));
    const test = rows.filter((row) => !trainingIds.has(row.id));
    const model = train(training);
    const predictions = test.map((row) => {
      const p = probability(model, row.text);
      return { id: row.id, actual: row.label, predicted: p >= 0.5, probability: p };
    });
    runs.push(metrics(predictions));
  }
  const fields = ["accuracy", "balancedAccuracy", "f1"];
  const summary = Object.fromEntries(fields.map((field) => {
    const values = runs.map((run) => run[field]).sort((a, b) => a - b);
    return [field, {
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      p10: values[Math.floor(values.length * 0.1)],
      p90: values[Math.floor(values.length * 0.9)],
    }];
  }));
  learningCurve.push({ requestedTrainingSize: size, repeats, ...summary });
}

const leaveOneOut = rows.map((row) => {
  const model = train(rows.filter((candidate) => candidate.id !== row.id));
  const p = probability(model, row.text);
  return { id: row.id, actual: row.label, predicted: p >= 0.5, probability: p };
});

const report = {
  task: "Predict whether a Korean blog title and summary carries the human-authored agent-engineering tag.",
  datasetSize: rows.length,
  positives: rows.filter((row) => row.label).length,
  negatives: rows.filter((row) => !row.label).length,
  method: "Character 2-5 gram multinomial Naive Bayes with Laplace smoothing.",
  caveats: [
    "The tag is an editorial label, not an objective fact.",
    "Older posts may apply the taxonomy inconsistently.",
    "Training and test examples come from one author and one site.",
  ],
  leaveOneOut: metrics(leaveOneOut),
  learningCurve,
  errors: leaveOneOut.filter((row) => row.actual !== row.predicted),
};

await writeFile(join(resultDir, "local.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
