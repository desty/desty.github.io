---
title: "Harvey Just Runs Claude Underneath — What 'Domain-Specific Models Win' Actually Means"
summary: "One of 2026's refrains is that the general-purpose LLM hype is over and domain specialization wins. Yet crack open the champions of domain AI — Harvey (legal), Sierra (customer service) — and what's running underneath is plain Claude or GPT. So what got specialized? As frontier models got better, the value of specializing model weights dropped, and the moat moved one layer up — to domain data, workflow integration, codified procedures, feedback loops. What post #26 argued on the human side, we meet again on the model side."
date: "2026-06-25T10:00:00"
tags:
  - domain-specific-models
  - vertical-ai
  - fine-tuning
  - rag
  - llm
draft: false
---

A line goes around a lot in 2026: "The general-purpose LLM hype is over. Domain specialization wins now." The evidence trailing it is that a small 7–13B model, fine-tuned once, beats a giant generalist on a specific domain task. [Cogent went so far as to title it "the end of the general-purpose LLM hype."](https://cogentinfo.com/resources/domain-specific-language-models-dslms-the-end-of-the-general-purpose-llm-hype-in-2026)

But something's off. Crack open the companies called the champions of domain AI — Harvey in legal, Sierra in customer service, Hippocratic in healthcare — and what runs underneath isn't a homegrown specialized model; it's plain Claude or GPT. So what exactly got "specialized"? Follow that question and you find that "specialized models win" is only half true.

## Frontier models closed the gap

Two years ago the logic of fine-tuning was simple. The general model doesn't know domain jargon, hallucinates on expert questions, and can't reach internal knowledge. So tame a model of our own on our data.

The trouble is that general models got too good in the meantime. Long context, native tool use, structured output, instruction-following — [most of the gaps that pushed people toward fine-tuning were closed by 2026](https://bigdataboutique.com/blog/fine-tuning-llms-when-rag-isnt-enough). Prompting plus retrieval (RAG) now covers a far wider surface than before. So the once-heated "RAG or fine-tuning" debate is mostly noise now.

The practical sequence has gotten clear, too. **Prompt → RAG → fine-tune → distill.** Try from the top, drop a level only when the one above fails. Even the highest-ROI fine-tuning is a thin LoRA adapter on a strong base model, not a model rebuilt from scratch. One line sums it up: *put volatile knowledge in retrieval, put only stable behavior in fine-tuning.* That's how far the value of specializing weights has fallen.

## So the moat moved one layer up

Then what are Harvey and Sierra winning with? Not the model. The things stacked on top of it.

Sierra hit [$100M ARR in seven quarters](https://www.capitaly.vc/blog/sunday-data-vertical-ai-comp-sheet-feb-2026), and Harvey handles legal documents across 59 countries. Their value comes from three layers — domain data, the tools wired to that data, and the workflow. Sierra and Harvey may run Claude or GPT underneath, but the industry datasets, deep integrations, and codified standard operating procedures layered on top took tens of thousands of hours to build. The model is an API anyone can call; the surroundings aren't.

That's why [vertical AI is eating vertical SaaS](https://www.buildmvpfast.com/blog/vertical-ai-eating-horizontal-saas-2026). The places a general chatbot can't go aren't blocked because the model is dumb; they're blocked because it doesn't know that industry's exception handling, regulations, and data connections. None of that is something a model provider can ship as a feature.

## The "data moat" myth

Still, one more caution. "Pile up proprietary data and that's the moat" is itself close to a myth. [One critique notes](https://www.unique.ai/en/blog/the-myth-of-the-data-moat-in-vertical-ai) that Harvey and several other vertical AI players haven't yet proven a defensible data moat. Hoarding data isn't enough.

Real defensibility comes not from the volume of data but from whether that data is embedded in a workflow. Do you know the customer's flow, pains, and needs deeply; is it integrated into five of the product's workflows; does a feedback loop run where every use makes the next result better? Do you have a 12-month data advantage? Only when you can answer those does a moat exist. Data is just the raw material; the moat is how you weave it into the work.

## So where is the center of gravity for "domain-specific"?

Put it together and "domain specialization wins" holds — with the caveat that the center of gravity of specialization moved from model weights to everything around them. Which knowledge goes in retrieval and which behavior in fine-tuning, how domain data gets embedded into which workflow, who verifies the result and how. Differentiation now comes from this design.

It doesn't mean small specialized models beating giant generalists have vanished. When you must enforce an output format consistently across thousands of edge cases, or need behavior constraints prompting can't guarantee, fine-tuning is still valid. It's just become one part of the whole picture, no longer the place that decides the match on its own.

## People and models, the same spot

This picture pairs exactly with [what I wrote before in "In AI Coding, What Gained Value Is Domain Expertise."](/blog/26-domain-expertise) There it was the human side — once coding stopped being the barrier, what separated success wasn't coding skill but the domain expertise to know the problem. Here it's the model side — once model capability became common, what decides the match isn't model weights but domain data and workflow.

The same thing happens on both sides. What becomes common (coding skill, model capability) isn't the moat; what doesn't (a person who knows the domain, data embedded in the domain) is. The more general capability levels up, the more value accrues to whoever knows one area deeply. The race over who builds the better model had, somewhere along the way, turned into a race over who knows the domain better.
