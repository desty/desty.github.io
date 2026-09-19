---
title: "I ran Jev with an API key — move the arithmetic into code and 29/36 becomes 36/36"
summary: "Measurements from calling TypeSafe AI's Jev directly. Ten questions cost the same latency as one, and server-side time was about 90ms. Counting and date intervals were exact, but judgments that derive a deadline and compare it to today broke down, and a fully refunded order was approved at 0.8 probability. Once code computed the dates and the balance, all 36 cases were right. Korean matched English on accuracy with lower confidence. Part 3 of a series."
date: "2026-09-19T15:00:00+09:00"
tags:
  - agent-engineering
  - llm
  - harness-engineering
  - classification
  - jev
draft: false
---

Agents and workflows are full of model calls that never needed prose. Decide whether a ticket is about a refund. Judge whether a tool call is dangerous. Pick the relevant items out of thirty search hits. Check whether a reply is safe to send. The answer is one enum value or one number between 0 and 1, and to get it you call a model that writes sentences. You wait seconds for it, your JSON parsing breaks now and then, and — worst of all — you never learn how sure the model was. The log holds the string `"refund"`, with no way to tell a 0.98 call from a 0.51 one.

[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), released by TypeSafe AI on 15 September 2026, targets exactly those calls. Who built it, why, and how people reacted is in [part 1](/en/blog/67-jev-system-one/); building the same mechanism on open models is in [part 2](/en/blog/68-jev-style-engine/), and attaching it to real tasks is in [part 4](/en/blog/70-jev-four-builds/). The demo that traveled is Doom: [The Register reports](https://www.theregister.com/ai-and-ml/2026/09/16/typesafe-ai-debuts-model-for-machines-that-plays-doom/) the same decision taking 8.566 seconds on GPT-5.6 Terra and 0.114 seconds on Jev.

This piece is a record of running that model with an API key. Every figure below comes from calling `jev-1.13.0` over the HTTP API on 19 September 2026, over a kept-alive connection unless stated otherwise. It is one machine, so read the differences between rows rather than the absolute numbers, and it is not a side-by-side benchmark against other models. Ground truth was either computed in code or checked twice. One label I first wrote by hand was wrong, and the one in error was me, not Jev.

## Three answers, no sentences

You don't send Jev a prompt. You send state plus a set of questions, and there are only three question types.

| Type | What it does | What comes back |
|---|---|---|
| Choice | Pick one option from a fixed list | The option, the full probability distribution, confidence |
| Score | Place something on ordered levels | A score, the level legend, the distribution, confidence |
| Noul | Probability that a statement is true | One value between 0 and 1 |

Asking all three about one support message returns this:

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "billing": { "type": "noul", "noul": 0.99 },
    "tone": { "type": "choice", "choice": "angry", "confidence": 1.0,
              "probabilities": { "calm": 0.0, "neutral": 0.0, "angry": 1.0 } },
    "urgency": { "type": "score", "score": 1.99, "confidence": 0.99,
                 "legend": { "0": "low", "1": "medium", "2": "high" },
                 "probabilities": { "0": 0.0, "1": 0.01, "2": 0.99 } }
  },
  "usage": { "input_tokens": 369, "output_tokens": 72 }
}
```

Note the score of 1.99. It is a probability-weighted position on your levels, so it rarely lands on an integer, and a 0.5 between two levels means the model split between them rather than choosing a middle value.

## Ten questions cost what one costs

The docs say that for questions over the same state, asking one more is close to free. I called the same ticket twelve times at each question count.

| Questions | Median | p10 | p90 | Input tokens | Output tokens |
|---|---|---|---|---|---|
| 1 | 246ms | 228ms | 293ms | 362 | 20 |
| 3 | 276ms | 225ms | 296ms | 394 | 53 |
| 5 | 258ms | 208ms | 305ms | 425 | 85 |
| 10 | 263ms | 213ms | 297ms | 599 | 189 |

Ten times the questions, the same latency. Input tokens do grow, from 362 to 599, because the question text is part of the input. Not free, but at $0.042 per million tokens it rounds to free.

What that 246ms is made of matters more. Opening a fresh connection to the same endpoint takes 160 to 210ms just for the TCP handshake. TypeSafe serves from the US west coast, and that round trip is the floor. Subtract it from the 246ms and server-side work is around 80ms. The response headers confirm it: `x-envoy-upstream-service-time` read 92, in line with the 70ms lower bound the company publishes. A cold call, connection included, took 0.60 to 0.73 seconds.

The practical consequence is clear for anyone calling from outside North America. However fast the model is, the round trip sets your floor. Designs that split questions across several calls lose badly; batch every question about the same state into one request, and treat connection reuse as mandatory rather than an optimization.

Growing the state doesn't change much either. I buried the same ticket inside unrelated filler and varied the size, six calls each.

| Input tokens | Median | p90 |
|---|---|---|
| 568 | 266ms | 286ms |
| 2,484 | 257ms | 296ms |
| 8,872 | 300ms | 541ms |
| 21,644 | 422ms | 562ms |

It still worked at 32,290 tokens, and a Noul asking whether the customer threatened not to renew held at 0.98 regardless of size. The documented warning that irrelevant detail lowers accuracy did not reproduce here.

## How far the "bad at numbers" warning goes

The [jaggedness doc](https://docs.typesafe.ai/model-jaggedness/jev-1.13) lists nine weaknesses and tells you to keep arithmetic, counting, and date math in code. I wrote 17 items with unambiguous answers and asked each three times.

| Kind | Items | Accuracy |
|---|---|---|
| Counting | blue items, backend engineers | 100% |
| Arithmetic | failed requests, invoice total | 100% |
| Date arithmetic | days between dates, incident duration | 100% |
| Comparing stated dates | which came first, most recent event | 100% |
| Threshold comparison | more than ten, more than half | 73% |
| Derived date vs today | has it expired, is it overdue | 25% |

Counting and arithmetic did better than the warning suggests. It summed `$120.00 + $45.50 + $89.25 + $15.00` to $269.75, put 44 days between 2025-01-15 and 2025-02-28, and measured 21:40 to 02:15 the next day as 4h 35m.

The failures cluster somewhere specific. Of four items that require deriving a date and comparing it to today, three were wrong. Asked whether a trial that started 2025-01-31 and runs 45 days had expired as of 2025-03-10, it said yes; the end date is 2025-03-17. Asked whether a net-30 invoice issued 2025-07-20 was overdue as of 2025-08-12, it said yes; it was due 2025-08-19. Threshold comparison wobbled the same way. A Choice asking how many blue items there are returns 12 at confidence 0.89, while a Noul asking whether there are more than ten, over the same state, returned 0.49, 0.51, 0.53. It knows the count and cannot compare the count to a bound.

This is where the model's character shows. The five missed items averaged 0.33 confidence; the twelve correct ones averaged 0.88. On these items it signalled when it didn't know. Put a floor at 0.6 and all five errors are caught, every one of the eleven auto-handled items is right, and exactly one item that would have been correct goes to a human too. That does not always hold, though. The next experiment produced an error made with confidence.

One caveat on those numbers: a Noul has no confidence field. For Nouls I derived it as how far the probability sits from 0.5, which is the confidence formula recovered in [part 2](/en/blog/68-jev-style-engine/) applied to two options.

One documented warning failed to reproduce. Splitting a proposition into a positive and a negative Noul is supposed to give probabilities that don't sum to 1 — the doc's example sums to 1.19. Across five propositions I saw sums between 0.99 and 1.06. They drift, but not nearly that far. Keeping the rule of never comparing probabilities across question types is still the safe habit.

## Move the arithmetic into code and 29/36 becomes 36/36

To see how that weakness shows up in a real decision, I wrote a fictional refund policy. Approval requires all four conditions: the customer is requesting a refund now, the order was delivered 30 days ago or less (exactly 30 is allowed), the item is unopened, and the amount paid minus completed refunds is greater than zero. I built 12 cases including the boundaries and computed the ground truth in code from the same conditions rather than labeling by hand. Each case was called three times.

The input came in three forms.

| Input | Correct |
|---|---|
| Raw order, payment, and refund records; ask for the final decision | 29/36 |
| Ask the four conditions as separate Nouls; combine them in code | 30/36 |
| Code computes days elapsed and balance, puts them in the state; ask for the final decision | 36/36 |

With raw records, three cases failed. The order at exactly 30 days was denied all three times, and the order at 31 days was approved once in three. In both, the approval probability sat between 0.48 and 0.50 with confidence of 0.03 and 0.01. That is a coin flip, and a threshold sends it to a person.

The third is the problem. An order paid at 129,900 KRW with 69,900 and 60,000 already refunded has a balance of zero and must be denied. Jev approved it all three times, at probabilities of 0.73, 0.81, and 0.72 — a confidence around 0.5. A gate at 0.6 barely catches it; a gate at 0.5 lets it through. Confident errors do happen.

Splitting the question was not the fix. Asking the four conditions separately and combining them in code scored 30/36, nearly unchanged: when the model gets a subtraction wrong, it gets it wrong in the smaller question too. What changed the result was moving the computation into code. With days elapsed and balance computed and passed in as facts — "within 30-day window: yes, refundable balance: 0 KRW" — all 36 were right and confidence rose to 0.99 or higher.

That gives the division of labor. Anything code can compute exactly, such as date differences and sums of money, code computes. Only what requires reading meaning, such as whether the customer is requesting a refund or just asking how refunds work, goes to Jev. In this experiment "just tell me how refunds work" and "if the replacement doesn't arrive by Friday I'll ask for a refund then" were classified correctly under all three input forms.

## In Korean, accuracy holds and confidence doesn't

The docs say English is most accurate and CJK is supported, with no numbers. So I measured. I wrote 45 support messages, each in English and Korean with the same meaning, and asked for one of five categories: 25 straightforward items plus 20 harder ones where the intent is implied or the text is colloquial and typo-laden. Three runs per item per language, 270 calls.

| | Accuracy | Mean confidence | Median |
|---|---|---|---|
| English | 100% | 0.9948 | 1.0 |
| Korean | 100% | 0.9750 | 1.0 |

Accuracy was identical. Indirect phrasings and messy colloquial text were classified correctly in both languages, as were six items built on double negatives.

The distributions differ. Pairing each item across languages, Korean confidence was lower on 17 of 45, equal on 23, and higher on 5. The widest gap ran from 0.997 in English to 0.617 in Korean.

That matters because of thresholds.

| Gate | English passes | Korean passes | Extra escalations |
|---|---|---|---|
| 0.80 | 100% | 98% | 1 |
| 0.90 | 100% | 96% | 2 |
| 0.95 | 98% | 84% | 6 |
| 0.99 | 80% | 69% | 5 |

Set automatic handling at 0.95 and 44 of 45 English messages clear it against 38 in Korean. The answers were equally correct; six more cases reach a person. A Korean-language product cannot inherit thresholds tuned on English traffic — they have to be set on Korean data.

## Low confidence doesn't always mean uncertainty

One result is easy to misread. On a ticket that mixed a billing problem with an SSO outage, asking which team should take it first returned confidence around 0.33 every time, and the answer flipped on one or two runs out of eight. Growing the state didn't change it, so irrelevant detail wasn't the cause.

The reason is simple: that ticket genuinely belongs to two teams, and the model split the probability. The docs say as much — several acceptable alternatives can spread a distribution, and that is not the same as being wrong. A rule that escalates every low-confidence answer treats "I don't know" and "both are right" identically. Separating them means looking at the distribution: 0.33 on one option with the rest spread evenly is a different situation from 0.45 on each of two.

## Once you have a probability, the branch belongs in code

Dropping Jev into an LLM's slot gains little on its own. The change comes from separating the judgment from the action. The answer tells you what; the confidence tells you whether to act on it now. The [official pattern](https://docs.typesafe.ai/patterns/confidence-routing) uses phone banking as the example.

```python
if action.confidence < 0.6:
    route_to_support_agent(account_id)          # genuine uncertainty
elif action.choice == "check_balance":
    read_balance(account_id)                    # cheap to get wrong
elif action.choice == "approve_transfer":
    if action.confidence > 0.85:
        approve_transfer(account_id)            # risky, so demand more
    else:
        ask_user_to_confirm(account_id)
```

The threshold scales with the stakes. A wrong balance means the caller hears one wrong number. A wrong transfer moves money. An LLM classifier makes this hard to express, because how much the model hesitated never reaches the output. In the numeric battery above, a set of questions answered at 75% became 100% on the auto-handled portion with a single threshold. As the refund experiment shows, a threshold does not catch every error, so it has to go together with moving computation into code.

The same shape drives guardrails. The [guardrail cookbook](https://docs.typesafe.ai/cookbooks/llm_guardrails) builds an input battery and an output battery — jailbreak attempts, harmful requests, medical advice, self-harm signals, overall severity — evaluates each in a single call, then routes the probabilities through two thresholds into pass, review, block, or a crisis path. The sample values are around 0.35 to review and 0.70 to 0.85 to act. The design choice that matters is the separation: the model measures hazard, the application decides where to draw the line.

There is already a harness integration. LangChain shipped `langchain-typesafe` with two middlewares: one routes a request to a fast or a powerful model, the other classifies a tool call and blocks the dangerous ones before execution.

```python
from langchain_typesafe import Noul, TypeSafeClassifier

classifier = TypeSafeClassifier()
response = classifier.invoke(
    state="The deploy failed twice and customers are seeing 500s.",
    questions={"urgent": Noul(instructions="Does this need attention now?")},
)
```

Blocking tool calls lands on the distinction from [harness engineering](/en/blog/35-harness-engineering/): move repeated judgments out of the prompt and into host code that enforces them. What kept that slot empty was cost and latency — an extra model call in front of every tool call adds seconds and cents per turn. The model is named after Jevons Paradox, and that is the bet: make judgment cheap and people will call for far more of it. Outside North America, budget the 160ms round trip on every one of those calls.

Set expectations lower for function calling. The [cookbook's approach](https://docs.typesafe.ai/cookbooks/function_calling) maps function names and closed-set arguments to questions. Free text, numbers, and dates are never asked about and fall back to defaults. Overall confidence is the *minimum* across arguments, not the average, since one wrong argument spoils the call.

## What to change in a setup you already run

If you already classify and judge with an LLM, this is a reasonable order to try.

1. **Pick candidates.** Calls whose output is one enum or one number in [0, 1] and whose state fits in 32k tokens. Routing, relevance, guardrails, and re-ranking qualify. Anything that computes a value and compares it to a bound — deadlines, expiry, balances — belongs in code: compute it and put the result in the state. That single change took the refund experiment from 29/36 to 36/36.
2. **Record a baseline.** Current model and prompt, accuracy, latency, cost per call, and how often a human intervened. If you have no labels, build about 200 first.
3. **Rewrite as questions.** Don't translate the prompt; choose between Choice, Score, and Noul first. Batch every question about the same state into one call. Add an `other` option wherever inputs can fall outside your list.
4. **Set thresholds on your own data.** Measure accuracy per confidence band, then split the bands into automatic and human-reviewed. Set them per language if you serve more than one: equal accuracy with different distributions produces different outcomes at the same gate.
5. **Separate the reasons for low confidence.** Read the distribution to tell genuine uncertainty from several answers being acceptable. In the second case, splitting the question is the better fix.
6. **Write the rollback condition first.** How far accuracy may drop against the baseline before you go back, and how much extra human review counts as failure.

Cost is not the obstacle. The largest test above was 24 calls and 200,000 input tokens, billed at $0.0085. Everything I ran for this piece together came to a few cents.

If you use Claude Code, TypeSafe publishes an [agent skill](https://docs.typesafe.ai/agent-skill) through a marketplace.

```bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
```

The skill docs are honest about their own limits: agents aren't good at writing these questions, so expect to edit them collaboratively.

## Where this lands

Running it changed two of my conclusions. The "bad at numbers" warning is narrower than it reads: counting, arithmetic, and date intervals were fine, and what broke was computing a value and comparing it to a bound or to today, sometimes with confidence. Moving that step into code made every case right. The second is Korean. Accuracy matched English, but the distributions are flatter, so thresholds tuned on English quietly push more Korean traffic to humans.

The limits are real too. Anything that has to be written still goes to an LLM, state caps at 32k tokens, and calling from outside North America puts a 160ms round trip under every judgment. And the headline "40x to 200x faster and up to 444x cheaper" comes entirely from the vendor's own workflow evals; I did not run a matched comparison against other models either. Before you migrate on those numbers, measure a baseline on your own task.
