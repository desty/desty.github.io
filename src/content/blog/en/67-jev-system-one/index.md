---
title: '"Why have superhuman chat models not led to AGI?" — the decision model a ChatGPT co-inventor spent two years building'
summary: "Diogo Almeida, who helped build RLHF at OpenAI, spent two years on a model that produces no prose at all: only choices and probabilities. The starting point is on record in the GPT-4 technical report, where post-training pushed calibration error from 0.007 to 0.074. What people built in four days, whether the open-source rumor is true, and how to try it now. Part 1 of a series."
date: "2026-09-19T17:00:00+09:00"
tags:
  - llm
  - agent-engineering
  - jev
  - calibration
draft: false
---

A model released on 15 September 2026 filled developer timelines within four days. It is [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), from TypeSafe AI. Vercel says that within 24 hours of landing on AI Gateway, Jev reached more than twice as many paid teams as any previous model launch, and [called it the fastest-adopted model in the gateway's history](https://vercel.com/blog/ai-gateway-jev-model-launch). TechCrunch [reported](https://techcrunch.com/2026/09/18/a-new-kind-of-ai-model-from-a-chatgpt-inventor-is-thrilling-developers/) that demand briefly left the company unable to serve users. Repositories that drive browsers, review code, and make trading calls with Jev appeared on GitHub within a day or two.

And yet this model cannot write a sentence. It doesn't chat and it doesn't code. You hand it a situation, a question, and the allowed answers, and it returns which one it picked along with a probability for each.

This is the first piece in a series on Jev. It covers who built it and why, what people made in four days, which of the circulating claims hold up, and how to try it today. [Part 2](/en/blog/68-jev-style-engine/) builds the same mechanism on open models, and [part 3](/en/blog/69-jev-measured/) reports what I measured with an API key.

## The question its maker asked

TypeSafe AI co-founder Diogo Almeida is a former OpenAI researcher, introduced by the company and the press as a co-inventor of RLHF and ChatGPT. His [launch-day post on X](https://x.com/CompleteSkeptic/status/2099925682726002904) opens: "After co-inventing ChatGPT, I kept asking myself: why have superhuman chat models not led to AGI?" He then describes two years in stealth building a new way to train models and a new type of model.

The TechCrunch interview puts it more bluntly. "We have lightning in a bottle, and yet it is not useful." "The problem is we are optimizing for human language." Computers speak a different language, the argument goes, and a model polished for conversation is a poor fit for work inside software. The company left stealth with a $40M seed led by DCVC at a [$200M valuation](https://www.businesswire.com/news/home/20260915525333/en/TypeSafe-AI-Emerges-From-Stealth-With-$40M-in-Funding-With-New-Model-for-Composable-AI); the other co-founders are Erik Gafni and Sasha Sheng.

## The record of RLHF breaking probabilities

There is public evidence behind that concern. Section 5 of the [GPT-4 technical report](https://arxiv.org/abs/2303.08774) says the pre-trained model is highly calibrated — its predicted confidence in an answer generally matches the probability of being correct — and that calibration is reduced after post-training. Figure 8 prints the numbers: expected calibration error of 0.007 for the pre-trained model and 0.074 after PPO. Ten times worse.

| | ECE | Meaning |
|---|---|---|
| Pre-trained GPT-4 | 0.007 | An answer held at 80% confidence is right about 80% of the time |
| GPT-4 after PPO | 0.074 | Confidence and accuracy drift apart |

Why this blocks automation is simple. A model that is right 95% of the time still sends everything back to a human if it cannot tell you which 5% it got wrong. A rule like "auto-handle above 0.9, escalate the rest" only works when the probabilities mean something. Train a model to produce answers people prefer and it learns to sound sure rather than show hesitation, and the probabilities lose their meaning along the way.

That is the context for the name TypeSafe gave its training method, RLCD — Reinforcement Learning for Calibrated Decisions: optimize for calibrated probabilities rather than human preference. A line has to be drawn here, though. The reward function, the training data, and the architecture are undisclosed, and there is no paper. What is public is the name and the goal.

## What Jev does

You send Jev state and a set of questions rather than a prompt. There are three question types: Choice picks one from a fixed list, Score places something on ordered levels, and Noul gives the probability that a statement is true. Ask one support message whether it is about billing, what its tone is, and how urgent it is, and all three answers come back with probabilities in one call.

The options don't live inside the model. Your program builds the candidates at call time: the legal moves in this chess position, the clickable elements on this screen, the teams registered in this helpdesk. Jev assigns probabilities to the list it was given and picks one, and an answer outside that list structurally cannot occur. When the job changes, you change the input, not the model.

Input costs $0.042 per million tokens and output is free. Input is text only; images are not supported yet. The company says it is 20x to 200x faster and 40x to 400x cheaper than LLMs on comparable work, figures that come from its own evaluation. There are outside reports too: per TechCrunch, Vercel saw results 5 to 18 times faster than OpenAI's Luna, and Bryo AI found Jev 10 to 20 times cheaper than Gemini for email classification.

## What got built in four days

I checked these repositories on GitHub myself. Star counts are as of 19 September.

| Repository | Stars | What it does |
|---|---|---|
| [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | 6,189 | Browser agent where Jev picks the element to act on and a small LLM is used only to type text |
| [jarrodwatts/jev-trader](https://github.com/jarrodwatts/jev-trader) | 945 | One trade decision per block; dry-run by default |
| [awlevin/typesafe-computer-use](https://github.com/awlevin/typesafe-computer-use) | 336 | OCR the screen, pick the next click with Jev, on a Mac; about $0.0002 a step by its own account |
| [devagrawal09/jev-review](https://github.com/devagrawal09/jev-review) | 287 | Staged code review that structures correctness, safety, and compatibility risk |
| [droidrun/mobile-jev](https://github.com/droidrun/mobile-jev) | 168 | Mobile agent operating a real Android device |
| [gargpratyush/jev-router](https://github.com/gargpratyush/jev-router) | 159 | Routes each Claude Code turn to a cheap or a strong model |

They share one structure. Code always produces the candidates: the browser agent extracts actionable elements from the DOM, the computer-use build pulls text off the screen with OCR, the router holds the list of available models. Jev picks one, and code executes the pick. An LLM used to sit in that slot, and you waited seconds to choose a single click. At a tenth of a second and a small fraction of a cent per judgment, calling for a judgment at every step becomes a reasonable design. The model is named after Jevons Paradox for that reason: make judgment cheap and people will use far more of it.

## Is it true that it was open-sourced?

No. Jev is a hosted API with closed weights, and no self-hosting path has been announced.

The rumor has a source. Several independent projects reproduce the same input/output pattern on open models. [SemIf](https://github.com/TheoLeeCJ/SemIf) (1,674 stars, originally named OpenJev) reads option logits directly from an untrained open model. [NanoJev](https://github.com/TianyuCodings/NanoJev) (513 stars) trains decision heads on a 0.6B model and publishes both the model and the data. [jevlike](https://github.com/vinnylarouge/jevlike) (918 stars) trains its own as well. All three state they are unaffiliated with TypeSafe. Jev was not released; projects imitating Jev's interface were.

How far that imitation gets is something you can find out by building one. [Part 2](/en/blog/68-jev-style-engine/) does it in about 70 lines and compares it to Jev on the same items.

## Trying it now

The path is short. This is the order I followed.

1. Request early access at [typesafe.ai](https://typesafe.ai), then create an API key in the console once approved.
2. Call it over HTTP. SDKs exist for Python (`pip install typesafe-sdk`) and JavaScript.

```bash
curl -X POST https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "state": "I was charged twice. Please help ASAP.",
    "model": "jev-latest",
    "questions": {
      "billing": {"type": "noul", "instructions": "Is this about billing?"},
      "tone": {"type": "choice", "instructions": "What is the tone?",
               "criteria": {"calm": null, "angry": null, "neutral": null}}
    }
  }'
```

3. If you'd rather not wait, [Vercel AI Gateway](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway) serves it under the model name `typesafe-ai/jev`.
4. To have a coding agent build with it, install TypeSafe's skill: in Claude Code, `claude plugin marketplace add typesafe-ai/skills` then `claude plugin install typesafe@typesafe-ai`; elsewhere, `npx skills add typesafe-ai/skills --skill typesafe-ai`. The skill's own docs warn that agents aren't good at writing these questions and that you should expect to edit them together.

One point worth stating: you don't install Jev inside Codex or Claude Code. Your program calls the Jev API, and your program carries out the next action based on the judgment that comes back.

The cost is easy to reason about. In part 3, a short situation plus one question came to about 360 input tokens. A thousand judgments a day is roughly 11 million tokens a month, under 50 cents. Ten thousand a day stays under $5. Unless you resend a long document on every call, cost is unlikely to be the constraint.

## What is confirmed and what isn't

Confirmed so far: the interface and the price are public and anyone with a key can call it. The guarantee that output never leaves the declared options follows from the structure, so it is true. Outside users report speed and cost well below LLMs.

Not confirmed: what RLCD actually is. The "20x to 200x faster" figures were measured by the company on its own workflows, and the reference labels in that evaluation are the averaged answers of two other LLMs, which is not an independent ground truth. "No hallucinations" holds for form only. Picking the wrong option from inside the list remains possible, and the company's own docs include [an example](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook) where the same request sent 15 times returned probabilities from 0.43 to 0.53. That example recommends leaving 0.30 through 0.70 for human review.

Judgment getting cheap and fast is one claim; judgment being right is another, and it has to be checked separately. [Part 3](/en/blog/69-jev-measured/) does that check.
