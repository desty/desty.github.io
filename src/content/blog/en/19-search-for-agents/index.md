---
title: "Search Isn't for Humans Anymore — The Real User Microsoft's Web IQ Reveals"
summary: "Microsoft shipped Web IQ. Instead of ten links for a human to read, it returns 'evidence passages' an AI agent can drop straight into its reasoning. Exa, Perplexity, Brave, Anthropic, Google — everyone is heading the same way. After 30 years of pointing at humans, search is starting to treat agents as its user. This post traces the structure of that shift, and the human-web feedback loop breaking as its cost."
date: "2026-06-11T10:00:00"
tags:
  - ai
  - ai-agent
  - search
  - rag
  - geo
  - agent-engineering
draft: false
---

In June, Microsoft announced **Web IQ** — a new set of APIs built on top of Bing's search technology. One line of the intro says it all: this isn't search for humans, it's **search for AI agents**. It doesn't return ten blue links. It returns **passages and structured evidence objects** a model can feed directly into its reasoning. ([Bing blog](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ))

Let me stop here and ask one question. **Why would a search giant abandon the human-facing interface it spent 30 years refining, and start treating agents as its user?** Where [earlier posts](/en/blog/05-geo-seo/) covered the *producer's* angle — "make content that gets cited by AI" — this one looks at where the **search infrastructure** producing those citations is headed. I'm not here to nitpick Microsoft's spec. If this announcement is a signal flare, the point is to read **what demand it's pointing at**.

---

## 1. Who has search been for, all these years?

Ten blue links. That was a design for **human eyes, human clicks, human ads**. You scanned the results, clicked the one you liked, that click became traffic, that traffic became ads, and that became the SEO industry. Every pixel of the search results page existed for "where will the human click next."

But the entity issuing the query is changing. More and more search comes not from humans but from **agents reasoning in multiple steps**. Agentic RAG doesn't search once and stop. It splits the question, searches, and searches again when that's not enough — **iterative, multi-hop retrieval** ([arXiv 2501.09136, agentic RAG survey](https://arxiv.org/html/2501.09136v3)). This user doesn't click blue links. It doesn't even "read" pages. What it needs is a fact fragment it can slot straight into its reasoning.

> **Update (2026-06-07):** This loop has a missing question — *when does it stop?* Google recently added a [Sufficient Context Agent](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/) to Gemini Enterprise: an agent that decides whether to search again or stop based on whether *the context gathered so far is enough to answer*. The underlying research ([Sufficient Context, ICLR 2025](https://arxiv.org/abs/2411.06037)) found something uncomfortable — adding context makes the model overconfident, so it **loses the ability to abstain when it doesn't know** (Claude 3.5 Sonnet's abstention rate drops 84%→52% with RAG). The real hard problem in agentic RAG isn't "how to search again" but "how to know when it's enough, and abstain when it isn't." I unpack this in full in [#34](/blog/34-sufficient-context/).

When the user changes, the interface changes. That's the one-sentence thesis of this post. **The user of search is shifting from human to agent, and the search engine is being redesigned around that new user.**

---

## 2. What makes agent search different — dissecting Web IQ

Web IQ differs from human-facing Bing in three places.

- **The unit of return is a passage, not a page.** Instead of a list of document URLs, it returns passages and structured evidence objects. No clicking, reading, and summarizing required — it's already in a form the model can reason over.
- **Retrieval is semantic, not keyword.** It extends **DiskANN**, Microsoft's large-scale approximate-nearest-neighbor technology, using open embedding models to select and rank semantically close passages. ([Bing blog](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ))
- **Latency is a variable in the reasoning loop, not a UX detail.** To a human, 0.3s and 0.5s of search feel the same. But to an agent searching 5 or 10 times in a multi-hop loop, latency **compounds** with the number of steps. So Web IQ treats speed as a first-class design goal.

> **Be honest — don't take the marketing numbers at face value**
> Web IQ claims "sub-165ms P95 latency, nearly 2.5× faster than the next best alternative." But this is a **Microsoft internal benchmark**, and who the "next best alternative" is — and how it was measured — isn't disclosed. As of the June 2026 announcement it's also **pre-GA**, with pricing, Azure integration, and exact access model unconfirmed. "2.5× faster" should only be cited as *Microsoft's claim*.

The point isn't the numbers, it's the **design intent**. Passage return, semantic retrieval, latency optimization — all three are choices for "evidence a model will reason over," not "a page a human will read."

---

## 3. Why passages, specifically — the economics of agent search

Returning passages to an agent isn't a courtesy, it's **economics**.

In multi-step reasoning, tokens and latency accumulate with the number of steps. Stuff a whole page (tens of thousands of tokens) into context from a single search, and it gets re-read and re-billed every step. The retrieved context itself becomes a primary cost driver ([Stevens, "The Hidden Economics of AI Agents"](https://online.stevens.edu/blog/hidden-economics-ai-agents-token-costs-latency/)). That's why the literature digs into compressing tokens at the retrieval stage. The agentic RAG framework TeaRAG, for instance, reports cutting output tokens by **59–61%** (though still a [preprint](https://arxiv.org/html/2511.05385v1)). Returning passages instead of pages is shaving that cost curve down at the retrieval stage, up front.

This is where [Headroom, which I cracked open last month](/en/blog/18-headroom/), surfaces as the exact mirror image. Headroom **compresses context after it has reached (or is about to reach) the model**. Web IQ **retrieves only dense passages in the first place**. One wrings out the water that came in; the other pours less to begin with. Both are two sides of the same pain — "agents eat too many tokens." In an era where tokens are a line item on the invoice, even the search engine has started competing on "how few tokens can I give the same answer with."

> One caution. During research I ran into impressive figures like "retrieve only minimal fragments → cut per-step tokens 95% and total cost 70%, run the reasoning loop 2–20× more." But the evidence collapsed under verification, so I **deliberately left it out**. Token-savings narratives are as exaggerated as they are seductive.

---

## 4. Everyone is heading that way — the competitive landscape

Web IQ isn't alone. "Agent search" is already a crowded market, split into two camps.

**(A) Standalone search APIs** — the developer controls the LLM directly and just receives refined grounding data.

- **Exa** — embedding-based neural search. Its `/contents` returns cleaned text, highlights, and summaries for the LLM instead of a page.
- **Brave Search API** — about the only one with a **large independent index** outside Big Tech. Its "LLM Context" endpoint returns query-optimized snippets and markdown, token-efficiently ([Brave blog](https://brave.com/blog/most-powerful-search-api-for-ai/)).
- **Tavily / Linkup / You.com** — search + extraction in one call. Linkup **claims SOTA** on a factual-accuracy benchmark (SimpleQA) ([Linkup blog](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa), *flagged as a vendor's own benchmark*).
- **Jina AI Reader** — not search, but prefix any URL with `r.jina.ai/` and it cleans the page into LLM-friendly markdown.

**(B) Search/grounding built into the LLM** — search, read, and cite happen automatically inside the model's reasoning loop.

- **Anthropic web search** — built into the Messages API. **Citations are always on**, and the cited text (`cited_text`) isn't billed as tokens. Pricing is **$10 per 1,000 searches** + standard token costs ([Anthropic docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-search-tool)).
- **OpenAI web search** (Responses API) — inline url_citation by default. Standard is $10 per 1,000 calls, but the **non-reasoning preview costs $25 and in exchange doesn't bill search-content tokens** ([OpenAI pricing](https://developers.openai.com/api/docs/pricing)). A neat illustration of the billing fork: "bundle search tokens into a flat fee, or charge them separately."
- **Gemini grounding** (Google Search) — bolts Google Search directly onto Gemini. The unit price is **$14 per 1,000 queries on Gemini 3, $35 on Gemini 2.x** ([Google pricing](https://ai.google.dev/gemini-api/docs/pricing)). A good contrast showing built-in grounding running pricier than standalone search APIs ($5–7/1k).

It converges sharply on three axes — **return content passages not links / citations built in / token efficiency and latency**. The very fact that everyone is heading to the same place is evidence this isn't one company's bet but a **directional shift across the whole market**. Within it, Web IQ's position is clear — not a scraping-based upstart index, but **the decades-old Bing index**, with **robots and publisher-choice compliance** held up as a differentiator.

---

## 5. The cost: the human-web feedback loop is breaking

Here's the shadow side of the shift. The more search points at agents, the more **the old bargain — humans visiting pages — breaks.**

The web ran for 30 years on a simple promise. In exchange for crawling your content, the search engine **sent humans back** to your site via its results. Traffic became ads, and ads funded the content. But AI search builds the answer *for* you, and people no longer click the sources.

Cloudflare's telemetry puts numbers on the crack ([Cloudflare](https://blog.cloudflare.com/crawlers-click-ai-bots-training/)).

- As of July 2025, **~79% of AI-bot crawls were for training**; search grounding was just 17%.
- The crawl-to-referral (visits sent back) ratios are dire. **Anthropic 38,065:1, Perplexity 195:1.** They take the content but send almost no humans back.

The publisher-side damage is being measured too. After Google AI Overviews rolled out, **news-site referrals fell 15%**, and one analysis estimates **publisher referral traffic dropped about 25%** ([Digiday](https://digiday.com/media/google-ai-overviews-linked-to-25-drop-in-publisher-referral-traffic-new-data-shows/)). And blocking crawlers doesn't fix it — there's data that citations continue even when you block ([ppc.land](https://ppc.land/blocking-ai-crawlers-doesnt-stop-citations-new-data-shows-why/)). This is one step further along from the ["ecosystem where clicks vanish" I covered in post #04](/en/blog/04-ai-content-ecosystem/).

It's in exactly this context that Web IQ's front-and-center pitch of **robots compliance, publisher choice, and IETF standards participation** reads as meaningful. The [IETF AIPREF working group](https://datatracker.ietf.org/doc/charter-ietf-aipref/) building standards to express AI preferences is actually active, and Microsoft has a foot in it. It's an attempt to **patch the broken loop with governance**.

> ⚖️ For balance. This picture comes with caveats too. (1) The publisher-harm data leans heavily on **a single source, Cloudflare**. (2) Cloudflare's accusation that "Perplexity uses stealth crawlers to evade robots" is **a single-party claim the other side has rebutted**. (3) IETF AIPREF is still only a means to *express* preferences — its **enforcement is undecided**. There's still no way to stop someone who refuses to honor robots.txt.

---

## 6. So what should we do

**If you make content** — push one step beyond [GEO](/en/blog/05-geo-seo/). Write not for "page one of search" but in a form that's **easy to cite as a passage**: clear facts, structured paragraphs, explicit sourcing — so it still makes sense when an agent lifts a single paragraph without reading the whole thing. At the same time, **actively exercise your choice** via robots and AIPREF. Blocking isn't a cure-all, but if you don't express a preference you don't even get a seat at the table.

**If you build agents** — don't treat search as "plug in one tool." Search is a **core design variable in the reasoning loop that spends a budget of tokens and latency** ([post #14: The War Outside the Model](/en/blog/14-agent-engineering/)). Which API returns passages, how it handles citations, how it bills tokens — these directly decide your agent's cost and accuracy. Whether it gives citation tokens free like Anthropic, or bundles them into a flat fee like OpenAI — this is no longer a detail.

---

## Closing

I started by reading one page of a Web IQ announcement, but the image that lingers is beyond the announcement.

**After 30 years of pointing at humans, search has started treating agents as its user.** Blue links become evidence passages, clicks become tokens, SEO becomes GEO. That everyone — from Exa to Google — is moving the same way is the proof the shift is real.

But when the user changes, **the entire incentive structure that fed that user wobbles.** If humans don't visit pages, the reason to make those pages shrinks too. The good web an agent reads is, in the end, made by humans. That Web IQ reached for robots and IETF may be more than PR, then — it's the largest search player conceding that for agent search to last, someone has to protect **the reason humans keep making the web.**

The search box looks the same, but the thing reading beyond it is no longer a person. The writing we publish and the tools we build now have to keep that new reader in mind.

---

## References

- [Announcing Microsoft Web IQ (Bing blog)](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ) — primary announcement. Note the perf figures are self-benchmarked and pre-GA.
- [Microsoft releases Web IQ (Search Engine Land)](https://searchengineland.com/microsoft-releases-web-iq-powered-by-bing-but-designed-for-how-ai-agents-search-479194) · [Search Engine Journal](https://www.searchenginejournal.com/microsoft-web-iq-gives-ai-agents-bing-grounding-apis/577736/)
- [The crawl-to-click gap (Cloudflare)](https://blog.cloudflare.com/crawlers-click-ai-bots-training/) — crawl-to-referral ratios, the 79%-training stat
- [Google AI Overviews & publisher traffic (Digiday)](https://digiday.com/media/google-ai-overviews-linked-to-25-drop-in-publisher-referral-traffic-new-data-shows/) · [Blocking doesn't stop citations (ppc.land)](https://ppc.land/blocking-ai-crawlers-doesnt-stop-citations-new-data-shows-why/)
- [IETF AIPREF Working Group](https://datatracker.ietf.org/doc/charter-ietf-aipref/) — standards for expressing AI preferences
- Search APIs: [Anthropic web search](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-search-tool) · [OpenAI pricing](https://developers.openai.com/api/docs/pricing) · [Gemini grounding pricing](https://ai.google.dev/gemini-api/docs/pricing) · [Brave Search API](https://brave.com/blog/most-powerful-search-api-for-ai/) · [Linkup SimpleQA](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa)
- Sufficient context: [Unlocking dependable responses (Google Research, 2026)](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/) · [Sufficient Context: A New Lens on RAG (ICLR 2025)](https://arxiv.org/abs/2411.06037)
- Related: [GEO — Content Cited by AI](/en/blog/05-geo-seo/) · [The AI Content Ecosystem](/en/blog/04-ai-content-ecosystem/) · [Headroom, Saving AI's Tokens](/en/blog/18-headroom/) · [The War Outside the Model](/en/blog/14-agent-engineering/)
