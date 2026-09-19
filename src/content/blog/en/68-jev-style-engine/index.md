---
title: "I built a Jev-style decision engine in 70 lines — type safety was free, accuracy and calibration were not"
summary: "Jev's training method is undisclosed, but its input/output pattern can be reproduced. I built an engine on an M1 MacBook that runs one forward pass and reads the logits of the option tokens, then compared Qwen3 from 0.6B to 8B against live Jev on the same 90 items. At 4B, English reached 98% but Korean stayed at 84%, and one decision took a second. I also recovered Jev's confidence formula from its responses. Part 2 of a series."
date: "2026-09-19T17:30:00+09:00"
tags:
  - llm
  - agent-engineering
  - jev
  - calibration
  - mlx
draft: false
---

As [part 1](/en/blog/67-jev-system-one/) laid out, only the name and the goal of Jev's training method, RLCD, are public. There is no reward function, no architecture, no paper. So there is no way to analyze "how it was built" from outside.

There is something else you can do: build what Jev does on an open model and measure where it works and where it stops. Wherever it stops is presumably the part TypeSafe is actually charging for. I built the engine with MLX on an M1 MacBook (16GB) and compared it on the same items I ran against the live Jev API in [part 3](/en/blog/69-jev-measured/).

To be clear up front, this reproduces the interface, not Jev. Larger independent efforts in the same direction exist, SemIf and NanoJev among them; this piece covers only what I built and measured myself.

## Read logits, generate nothing

The usual way to classify with an LLM is to have it generate the answer as a sentence or JSON and then parse it. Time passes while tokens come out one by one, the format can break, and the probabilities are thrown away.

Skip generation entirely and all three problems go together. Give each option a letter label (A, B, C…), put them in the prompt, run the model forward **once**, and at the position where the answer would begin, take only the logits of those label tokens and softmax them.

```python
def label_logits(self, state, instructions, options):
    ids = self._prompt_ids(state, instructions, options)   # tokens, chat template applied
    logits = self.model(mx.array(ids)[None])[0, -1, :]     # one forward pass, last position
    return logits[mx.array(self.label_ids[:len(options)])] # logits of the label tokens only

def choice(self, state, instructions, criteria):
    probs = softmax(self.label_logits(state, instructions, texts))
    best = argmax(probs)
    return {"choice": keys[best], "confidence": rescaled_confidence(probs),
            "probabilities": dict(zip(keys, probs))}
```

An answer outside the list cannot occur in this structure, because the only values read are as many logits as there are options. No JSON validation, no retries. The property Jev advertises — type errors are mathematically impossible — comes free to anyone who does it this way.

The other two types are variations on the same read. A Noul is the normalized probability of a yes label against a no label; to cancel label-position bias I run it a second time with the order swapped and average. A Score is the expected value under the level probabilities, which is also why Jev returns 1.99 rather than 2.0 for "high". All three together, the engine body is about 70 lines.

## Recovering the confidence formula from responses

Jev returns a `confidence` with every Choice and Score. [The docs](https://docs.typesafe.ai/confidence) describe it as the shape of the distribution collapsed into a number between 0 and 1, without giving the formula. To produce a value that means the same thing I needed the formula, so I sent Jev questions designed to split its answer and fitted candidates to the distributions and confidences it returned.

| Distribution Jev returned | Jev's confidence | max | top1 − top2 | 1 − entropy | (max − 1/n)/(1 − 1/n) |
|---|---|---|---|---|---|
| 0.74, 0.14, 0.11, 0.01 | 0.65 | 0.74 | 0.60 | 0.43 | **0.653** |
| 0.94, 0.06, 0, 0, 0 | 0.92 | 0.94 | 0.88 | 0.86 | **0.925** |
| 0.89, 0.11 | 0.78 | 0.89 | 0.78 | 0.50 | **0.780** |
| 0.99, 0.01, 0 | 0.99 | 0.99 | 0.98 | 0.95 | **0.985** |

Across six responses the mean absolute error is 0.003, which is two-decimal rounding. Jev's confidence is the top probability rescaled by the number of options: 0 when the distribution is uniform, 1 when it is one-hot.

```python
def rescaled_confidence(probs):
    n = len(probs)
    return (max(probs) - 1 / n) / (1 - 1 / n)
```

One practical consequence follows. With two options, a top probability of 0.89 is a confidence of 0.78. A threshold of 0.9 auto-handles a different number of cases depending on whether you apply it to the probability or to the confidence. Decide which number the rule refers to, or the same rule produces different outcomes.

## Same items, against Jev

The items are exactly those run against Jev in part 3: 45 support messages to classify into one of five categories, written in both English and Korean for 90 items, plus 6 double-negative items and 17 numeric and date items. Models are the 4-bit quantized Qwen3 family.

| Model | English intent | Korean intent | Numeric / date | Per decision |
|---|---|---|---|---|
| Qwen3-0.6B | 51% | 29% | 29% | 165ms |
| Qwen3-1.7B | 78% | 44% | 59% | 452ms |
| Qwen3-4B | 98% | 84% | 53% | 998ms |
| Qwen3-8B | 98% | 89% | 29% | 1,969ms |
| Jev (live API) | 100% | 100% | 75% | 246ms (trans-Pacific round trip included) |

0.6B is unusable: guessing among five gives 20%, and Korean came in at 29%. 1.7B falls short too, and English only approaches Jev from 4B. The engine and the prompt are identical across rows and only the model size changes, so the interface contributes nothing to accuracy. All of it comes from the model underneath.

Three things stand out.

**The Korean gap is large.** 4B scores 98% in English and 84% in Korean; 8B scores 98% and 89%. Jev was 100% in both. One caveat: I wrote the question, the option descriptions, and the message in Korean, but left the system prompt and the prompt scaffolding in English. Whether an all-Korean prompt narrows the gap is untested.

**On speed, my laptop loses.** One decision at 4B takes a second. Jev came back in 246ms including a 160ms round trip to the US west coast. Server GPUs would change this, but a sub-100ms server-side time is not what you get by simply running a small model. Jev also holds latency flat as you add questions about the same state, while my engine runs a fresh forward pass per question. Reusing the computation for the state prefix would cut that; I haven't implemented it.

**Numeric items did not improve with size.** 8B dropped to 29%. I could not tell whether that is the model or my labeling scheme — when the options are "6, 8, 10, 12, 14" and the labels are "A, B, C…", numbers and labels may be interfering. I'm leaving it open.

## Calibration is a separate job

The more important difference is the quality of the probabilities, since calibration is where Jev starts from. Over the 90 intent items I binned the probability of the chosen answer into five bands against whether it was correct, and computed ECE.

| Model | Accuracy | Mean top probability | ECE | ECE after temperature scaling |
|---|---|---|---|---|
| Qwen3-0.6B | 40% | 0.81 | 0.408 | 0.203 |
| Qwen3-1.7B | 61% | 0.84 | 0.229 | 0.092 |
| Qwen3-4B | 91% | 0.99 | 0.075 | 0.025 |
| Qwen3-8B | 93% | 0.98 | 0.067 | 0.044 |

0.6B is right four times in ten while reporting 0.81. Put a threshold on that probability and wrong answers pass with confidence. Smaller models are more overconfident, and even at 4B the ECE of 0.075 matches the 0.074 that part 1 quoted for GPT-4 after PPO.

I then added the simplest post-hoc fix: divide the logits by a single temperature to flatten the distribution. The value is fit on labeled items, cross-fitted over five folds so no item is scored with a temperature fit on itself. One parameter cut ECE to between a half and a third. The fitted temperatures ranged from 3.4 to 4.8, which is how much too sharp the raw distributions were.

The limits are clear. This calibration is fit to this item set and has to be refit when the task changes. Jev says it does not retrain per task. Calibration that holds across tasks is the actual claim of RLCD, and that is exactly what a post-hoc fix cannot imitate. With only 90 items, the ECE figures themselves carry sizable error.

## What building it taught me

The interface is free. A guarantee that answers stay inside the list, output that needs no parsing, and per-option probabilities all come from an open model and 70 lines. None of that is unique to Jev, and if you currently have an LLM generate its classifications, you can switch today.

Three things were not free. Small models aren't accurate enough, models large enough to be accurate don't return in a tenth of a second, and raw probabilities are overconfident. Fixing any of them yourself means data, training, and serving. What Jev sells at $0.042 per million tokens is best understood as those three together, and the gap was widest in Korean.

Which side to pick depends on constraints. If data cannot leave your network, if volume is high enough that a fixed cost wins, or if the task is fixed so calibration is fit once, running your own has a place, and a 4B model gets close to Jev on English classification. If tasks change often, Korean is in the mix, and response time matters, the API is the better choice for now.

This experiment is one M1, 4-bit quantization, one prompt format, and 119 items. Next on the list: reuse the state computation so extra questions stop costing latency, test whether an all-Korean prompt closes the gap, and check whether decision-specific fine-tuning of a small model improves calibration along with accuracy.
