---
title: "The Real Problem in RAG Isn't 'Search Again' — It's Knowing When to Abstain: Sufficient Context, Now Shipped by Google"
summary: "Hand a model retrieved documents and you'd expect it to get more honest. Measurements say the opposite — given context, models get overconfident and lose the ability to say 'I don't know' (Claude 3.5 Sonnet's abstention rate: 84% → 52%). The ICLR 2025 paper Sufficient Context cut through this by asking 'is it sufficient?' instead of 'is it relevant?', and 13 months later Google productized it as the stop signal in Gemini Enterprise's agent loop (up to +34% factuality). It fills the missing brake in [#19](/blog/19-search-for-agents/)'s search loop and adds a missing axis to [#32](/blog/32-ai-eval/)'s evals. Here's the mechanism, plus a hands-on recipe for adding abstention to your own RAG."
date: "2026-07-19T14:00:00"
tags:
  - rag
  - agentic-rag
  - sufficient-context
  - hallucination
  - ai-eval
draft: false
---

In [blog #19](/blog/19-search-for-agents/) on agentic search, I left one question hanging. In a loop that searches, finds the results lacking, and searches again — **when do you stop?** The short update I attached back then pointed at Google's Sufficient Context work, and since then the topic has outgrown a single paragraph. On June 5, Google formally built the ICLR 2025 paper [into Gemini Enterprise's agent loop](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/).

So this time, let's take it apart from the beginning. The conclusion up front: **the real problem in agentic RAG isn't "how to search again" — it's "knowing whether you have enough, and abstaining when you don't."** Everyone already retries retrieval. The hard part is knowing when to stop and when to keep quiet.

---

## The RAG paradox: hand over documents, and humility goes first

An ideal model does exactly two things: answers what it knows, and says "I don't know" for the rest (abstention). That expectation is why we bolt RAG on in the first place. Give it documents, and hallucinations should turn into correct answers, or at worst abstentions.

But what [the paper](https://arxiv.org/abs/2411.06037) actually measured moves in the opposite direction.

| Model | Metric | Change |
|---|---|---|
| Claude 3.5 Sonnet | Abstention rate | **84.1% without RAG → 52% with RAG** |
| GPT-4o | Abstention rate | 34.4% → 31.2% |
| Gemma | Wrong-answer rate | **10.2% → 66.1%** when context is insufficient |

Once context lands in its hands, the model gains confidence first. "I received documents that look relevant, so I should answer," even when those documents fall short. So at the very moment RAG reduces hallucination, **it also erodes the ability to stay silent when the model doesn't know.** It's telling that Claude, originally the most cautious, collapsed the hardest.

The worse news: better retrieval doesn't make this go away. Retrieval and rerankers are technology for fetching *relevant* things — they guarantee nothing about *sufficient* things. That gap is the next section's subject.

---

## relevant ≠ sufficient — a new knife for cutting the problem

The paper's contribution isn't a grand architecture; it's one definition. **Context is sufficient when it alone lets you construct a definitive answer to the question.** Relevance asks "is this about the same topic as the question?" Sufficiency asks "does this actually answer it?"

The two diverge constantly. For a multi-hop question like "who is the spouse of the lead actor in film X," a document about film X is clearly relevant and even gives you the lead actor. But the spouse isn't in it — **relevant, yet insufficient.** Swap in the best reranker you can find and this distinction still won't appear. Rerankers measure relevance; that's what they're for.

What makes the split powerful is that **you can judge it before generating.** No answer labels, no generated output needed. Put the question and the context side by side and ask: "does this yield a definitive answer?" As we'll see, this exact property is what turns it into a stop signal for agent loops.

One more counterintuitive finding from the paper: models get answers right surprisingly often even when the context is insufficient — answering from prior knowledge baked into their parameters. And conversely, they sometimes get it wrong with fully sufficient context. In other words, **retrieval quality and final correctness are far more decoupled than you'd think.** One more reason you can't judge a RAG system on retrieval metrics like recall@k alone.

---

## How do you measure 'sufficient'? — an LLM-as-Judge for inputs

A definition alone is half the job; you have to be able to run the judgment. The paper's answer is surprisingly modest: **a prompt for Gemini 1.5 Pro with chain-of-thought and a single example (an autorater).** Against a 115-question gold set it hit **about 93% accuracy,** beating fine-tuned judge models (FLAMe/PaLM 24B) and NLI models (TRUE-NLI) with nothing but a prompt. The prompt is [public](https://github.com/hljoren/sufficientcontext).

You've probably noticed: this is a special case of the [LLM-as-Judge from #32](/blog/32-ai-eval/). But with one decisive difference: the thing being judged is **the input, not the output.** A judge that evaluates generated answers arrives after you've already paid the generation cost and latency. A judge that screens the context **intervenes before generation.** It doesn't grade wrong answers; it filters out the conditions that produce them.

---

## Measuring isn't deciding — how to actually abstain

Now that you have a sufficiency signal, don't wire "insufficient = abstain" directly. As we saw, models sometimes answer correctly from prior knowledge despite insufficient context — that rule would kill answers that were going to be right.

The paper's selective generation handles this. It combines two signals.

1. **The model's self-assessed confidence:** self-reports like P(True) or P(Correct), "is your answer right?"
2. **The sufficiency label:** the autorater's verdict on whether the context is enough

Tie the two together with **logistic regression,** then pick a threshold on the coverage–accuracy curve to decide abstention. Nothing fancy, and no ground-truth answer labels required. This simple combination alone raised **the fraction of correct answers among attempted questions by 2–10%** across Gemini, GPT, and Gemma.

The point is that each signal patches the other's blind spot. Confidence alone gets fooled by overconfidence (the paradox above); sufficiency alone throws away answers the prior would have gotten right. Overlap them and you can excise just the true danger zone — "context is lacking *and* the model isn't sure."

---

## Thirteen months later: the paper became the brake in an agent loop

A paper posted to arXiv in November 2024 went through ICLR 2025 and, on June 5, 2026, entered public preview as [Agentic RAG in Gemini Enterprise Agent Platform](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/). Research to product in 13 months. The structure is multi-agent. An Orchestrator directs, a Planner decomposes the question, a Query Rewriter reworks search queries, a RAG Agent fetches. And in the middle of it all sits the **Sufficient Context Agent.** Google itself calls it "the most critical part," and its job is exactly one thing: actually read the retrieved chunks and judge "does this answer the question?" If not, it **generates feedback on what's missing** to trigger another retrieval round; once it's sufficient, generation proceeds.

This is precisely the stop condition that was missing from [#19](/blog/19-search-for-agents/)'s iterative search loop. Stopping on "how many times have we looped" — an iteration cap — is arbitrary: wasteful on easy questions, inadequate on hard ones. Stopping on "is it sufficient yet" loops exactly as much as each question needs. The numbers follow.

- Up to **+34% accuracy** over standard RAG on factuality datasets
- **90.1% answer accuracy** on FramesQA (824 questions, 2,676 PDFs) in the cross-corpus setting — a figure that includes routing to the right source among multiple corpora
- All while keeping latency **within 3% on average** of the single-corpus configuration

For the cost of inserting one judgment call, that return is the numeric case for why "intervene before generation" pays.

---

## Hands-on: 4 steps to add abstention to your RAG

This isn't a pitch to buy Google's product. The mechanism is fully public and ports to any RAG pipeline.

**1) Insert a sufficiency check before generation.** Start with a single prompt. You can lift [the paper's published prompt](https://github.com/hljoren/sufficientcontext) as-is. The judgment is shorter and cheaper than generation, so a budget-tier model is enough. Google's "within 3% latency" benchmark gives you the budget argument.

**2) The first response to 'insufficient' is reinforcement, not abstention.** On an insufficient verdict, rewrite the query and search again first; abstain only when the gap still won't close. That's exactly the order of Google's loop: the Sufficient Context Agent works first as a feedback generator that points out the missing piece, not as an abstain button.

**3) Make the abstention decision from two signals: sufficiency + confidence.** Logistic regression is enough, and no answer labels are needed. Pick the threshold from your own domain's coverage–accuracy trade-off. In legal, medical, or finance where wrong answers are expensive, sell coverage to buy accuracy; for internal wiki search, the reverse.

**4) Add sufficiency as an axis in your evals.** Split your wrong answers into two kinds: **retrieval failures** (answered despite insufficient context) and **generation failures** (wrong despite sufficient context). The former means fixing search, chunking, and source coverage; the latter means fixing prompts and models. Without this label the two blur into one lump and you end up fixing the wrong thing. It's one more axis on [#32's three-tier evaluation](/blog/32-ai-eval/), with the full methodology in the [AI Eval guide](https://desty.github.io/ai-eval-guide/).

Also worth drawing the line on where you need this. In domains where factuality is the product — internal knowledge bases, legal, medical, compliance — these 4 steps are close to mandatory. For brainstorming or creative assistance, an abstaining RAG is overkill. No need to install brakes where being wrong is cheap.

---

## What people actually wanted

Think about why this paper became the face of an enterprise product in 13 months, and you see demand more than technology. What enterprises wanted from RAG was never "a system that answers more." It was **"a system you can trust."** In demos, RAG always looked plausible. What blocked adoption wasn't the 95% of plausible right answers — it was the 5% of plausible wrong ones, and in front of the legal team, that 5% was everything.

Sufficient Context is the engineering answer to that 5%: not making the model smarter, but **building the conditions for saying "I don't know" into the system.** That Google put this front and center in Gemini Enterprise also means "an AI that says I don't know" is now a product that sells.

As a series, it connects like this: [#19](/blog/19-search-for-agents/) was how an agent **finds things,** [#32](/blog/32-ai-eval/) was how you **measure whether it did well,** and this post is the junction between them — **how to know whether what you found is enough to answer from.** You need all three for trustworthy agentic RAG. For the foundations, see the [complete RAG guide](https://desty.github.io/rag-guide/); to work through it as a curriculum, see [study §5.6 Sufficient Context](https://desty.github.io/study-ai-assistant-engineering/part3/13-advanced-rag/).

---

*References: [Sufficient Context: A New Lens on RAG (ICLR 2025)](https://arxiv.org/abs/2411.06037), [Deeper insights into RAG: the role of sufficient context (Google Research)](https://research.google/blog/deeper-insights-into-retrieval-augmented-generation-the-role-of-sufficient-context/), [Unlocking dependable responses with Gemini Enterprise Agent Platform's Agentic RAG (Google Research, 2026-06-05)](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/), [official code & prompts (GitHub)](https://github.com/hljoren/sufficientcontext), [Google Research Adds Agentic RAG to Gemini Enterprise (MarkTechPost)](https://www.marktechpost.com/2026/06/08/google-research-adds-agentic-rag-to-gemini-enterprise-agent-platform-with-a-sufficient-context-agent-for-multi-hop-queries/), [Why enterprise RAG systems fail (VentureBeat)](https://venturebeat.com/ai/why-enterprise-rag-systems-fail-google-study-introduces-sufficient-context-solution). Figures are public numbers from the paper and Google announcements as of 2026-07-19.*
