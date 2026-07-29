---
title: "After 25 Years, the Ontology Meets Its Rightful User — Agents, and Fabric IQ"
summary: "In late July, a learning web app called Ontology Playground from Microsoft made the rounds. It looks like a toy, but the direction it points is interesting. When the Semantic Web designed ontologies in 2001, the intended end user was the intelligent agent. That vision failed because it demanded humans annotate meaning by hand — and once LLMs solved the 'reading' problem, the bottleneck moved to the absence of meaning. Now Palantir, Snowflake, dbt, Databricks, and Microsoft are all moving at once to greet the rightful user who arrived 25 years late. This post covers the numbers behind text-to-SQL collapsing to 17% in the enterprise, what Fabric IQ Ontology actually is and where it's constrained, and the criteria plus a starting ladder for deciding whether you actually need an ontology."
date: "2026-08-07T10:00:00"
tags:
  - ontology
  - semantic-layer
  - knowledge-graph
  - ai-agent
  - agent-engineering
draft: false
---

In late July, a site called [Ontology Playground](https://github.com/microsoft/Ontology-Playground) made the rounds. It's an open-source web app under the Microsoft org, and what it does is unusual: explore ontologies as graphs, build your own in a visual editor, learn through quizzed courses. A static site with zero backend, MIT licensed, 2.3k stars. In short, **an ontology playground.**

It looks like a toy, but the direction the toy points is interesting. In [#43](/blog/43-graph-engineering/) I covered the second branch of graph engineering — the knowledge graph that holds what a system knows. It turns out the next chapter of that branch has already moved into a product war. The battlefield is a word 25 years old: **the ontology.** This post's thesis is one sentence. The ontology is not a new technology but **one that has only now met its rightful user.** And this cycle, the real cost has moved from building the ontology to keeping it true.

---

## The rightful user has finally arrived

Reread Tim Berners-Lee's 2001 Scientific American piece, ["The Semantic Web"](https://www.scientificamerican.com/article/the-semantic-web/), and an unexpected fact jumps out. The intended end user of that vision — encoding meaning into the web with RDF and OWL — was never the human reader. It was **"intelligent agents" that would carry out complex tasks on our behalf.** Ontologies were designed for agents from day one. They were just built 25 years early.

Why it failed is also clear in hindsight. Sean Falconer — who did a PhD on the Semantic Web and now works on AI at Confluent — put it this way in [a retrospective last year](https://seanfalconer.medium.com/from-ontologies-to-agents-the-semantic-webs-quiet-rebirth-dc109199b608): the design "required the millions of people writing web pages to manually create, annotate, and agree upon these intricate structures." Instead of teaching machines to read, it asked humans to write in the machine's language — and that didn't scale. Machine learning won by the opposite route: learning statistically from unstructured chaos.

But once LLMs solved the "reading" side, the bottleneck moved. Models can now read any table schema. The problem is that **schemas carry no meaning.** Whether the revenue column is pre-tax or post-tax, whether an "active customer" means last order within 30 days or 90, which key joins Orders to Shipments in the way the business means when it says "delayed delivery" — the schema doesn't say. That tacit knowledge has lived in human analysts' heads, and agents don't get access to those heads.

The gap is quantified. Frontier models that scored 91.2% on the academic Spider 1.0 benchmark collapsed to **17–21% on [Spider 2.0](https://arxiv.org/abs/2411.07763)** (ICLR 2025), built from real enterprise data-warehouse workflows. The numbers run the other way too: in [dbt's 2026 benchmark](https://docs.getdbt.com/blog/semantic-layer-vs-text-to-sql-2026), adding a semantic layer lifts the same model from 90.0% to 98.2% (vendor-run benchmark, caveat noted). What matters more is the quality of the failures — semantic-layer failures show up as "cannot answer," while text-to-SQL failures over bare schemas show up as **confidently wrong numbers.** In an era where agents act on those numbers, the latter is far more expensive.

---

## The whole field moved at once — Palantir's 20 years and the 2026 convergence

The longest-standing player here is Palantir. The priority date on its "dynamic ontology" patent is **2006** — twenty years of using this word as a product concept — and Foundry's ontology includes not just Objects and Links but **Actions: executable operations with permissions and audit attached.** Their long-standing claim is that it's not a data model but a layer that represents decisions on top of a digital twin of the organization. When the agent era arrived, that claim suddenly became foresight. [Forbes ran a piece titled "Agentic AI Is Here. Palantir's Been Ready For 20 Years"](https://www.forbes.com/sites/greatspeculations/2026/04/02/agentic-ai-is-here-palantirs-been-ready-for-20-years/), and Q4 2025 US commercial revenue hit $507M, up 137% year over year. Korea isn't outside this current either — [LG CNS signed a strategic partnership with Palantir in March](https://www.lg.co.kr/media/release/29938) and stood up a dedicated organization for it.

And over the past year, the data-platform camp moved in the same direction all at once. Snowflake pushed Semantic Views and in September 2025 launched the **Open Semantic Interchange (OSI)** — a vendor-neutral exchange standard for semantic models — gathering some 30 partners including dbt, Salesforce (Tableau), and Cube. dbt open-sourced its semantic-layer engine MetricFlow under Apache 2.0 in October. Databricks added Business Semantics to Unity Catalog and took it GA in April. If LookML's BI-era demand was metric definitions in one place, the demand this time is **the business meaning agents will read,** in one place. Analyst Sanjeev Mohan's prediction that "ontology will dominate 2026 architectural discussions" doesn't sound like hype on this terrain.

Microsoft's entry is **Fabric IQ,** announced at Ignite 2025. It's the business-data member of the "IQ" family of four — alongside Work IQ (M365 work context), Foundry IQ (document and knowledge grounding), and Web IQ — and its centerpiece item is the ontology (preview).

---

## Microsoft's answer — what Fabric IQ Ontology actually is

Per [the official docs](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview), you define the enterprise vocabulary as entity types (Customer), properties (name, email), and relationships (Customer *places* Order), then **bind** those definitions to real data in OneLake — lakehouse tables, real-time streams, Power BI semantic models. From the bound definitions a queryable instance graph is built, and queries route automatically to the right engine (GQL for graph, KQL for time series). The consumption paths are the point: not just Fabric's own data agent, but **an MCP endpoint** through which Azure AI Foundry agents — and, per the roadmap, agents outside the Microsoft ecosystem — can use the ontology as grounding. On top sits Activator-backed rules: conditions and actions defined **on business entities** rather than raw tables — "if freezer temperature crosses the threshold, proactively notify the customers on that shipment."

The onboarding design is clever. It **auto-generates an ontology from Power BI semantic models already in production** — tables become entity types, columns become properties and bindings, model relationships become relationship types. To the adoption barrier that "ontologies don't build themselves" (Constellation Research's Michael Ni), Microsoft's answer is "we'll extract one from the semantic model you already built."

The constraints, stated plainly. As of July 2026 the ontology item is still in preview (other parts of the workload reportedly went GA at Build 2026), and semantic-model binding **supports only Direct Lake mode.** Practitioner Teo Lachev's [pointed first-look review](https://prologika.com/first-look-at-fabric-iq-the-good-the-bad-and-the-ugly/) argues this excludes the vast majority of existing Import/DirectQuery models, and criticizes the OneLake-centric pull for external data. There's a known issue where the Decimal type isn't supported and returns all nulls (fatal for money columns), and upstream data changes require a manual refresh. And the analysts' shared warning — **"the more an enterprise builds on this semantic layer, the harder it becomes to move that logic elsewhere"** (Moor Insights' Robert Kramer). For an ontology to be a durable asset it has to be portable, and the key to that is an exchange standard like OSI. Microsoft is not on OSI's founding member list.

---

## What the playground really is — built by Copilot, supervised by a human

Back to the playground. Crack open the repo and this is not an official product-team release. Of 390 commits, 77% were written by one person — **Alvaro Videla of Microsoft Zurich,** former RabbitMQ core developer and co-author of *RabbitMQ in Action* — starting as a personal MVP in late January and moving into the microsoft org in February. The app footer's credit line sums up the project's identity: **"Built with GitHub Copilot · Supervised by videlalvaro."** The builder is Copilot; the human is the supervisor.

The way this AI-assisted development is run is as interesting as the app itself. AI-generated courses carry a `reviewStatus: under-human-review` marker, and the UI surfaces a "not yet human-reviewed" badge to users. The AI is forbidden from inventing people's names — a skill file pins it to a CSV of 250 approved fictitious names. Meanwhile, despite a convention file that says "update the docs with the code," the README still claims 9 courses while the actual count is 13 courses and 61 articles. Where AI-development governance holds and where it leaks — it's all in one repo.

As a learning ladder, the content is well designed. The highlight is the IQ Lab: a progressive exercise that **grows a retail supply-chain ontology from 3 entities (Customer, Order, Product) to 15 across 7 steps,** with each step's diff highlighted on the graph. Given that ontology education usually drifts into philosophy lectures, this one design choice — start small and watch it grow — justifies the site. There's an honest streak, too: the "natural language query lab" contains **no LLM at all.** It's 281 lines of deterministic string matching, and every answer carries the disclaimer that "in a real deployment, this would query the data platform." A rare demo that tells you it's a demo.

---

## In practice: decide whether you need one, then start small

A boom is not a boarding call. The skepticism has concrete numbers. By one survey, production adoption of knowledge graphs went from 26% in 2024 to 27% by late 2025 — **essentially flat.** Semantic-steward maintenance runs about one FTE per 50–100 entity types, and two-thirds of abandoned enterprise knowledge-graph projects cited lack of in-house expertise as the top failure cause. Scarier than the build is **ontology drift** — the organization and reality keep changing while the ontology quietly stops matching them. It's the same disease as [#43](/blog/43-graph-engineering/)'s "a graph that only ever grows is a liability, not an asset." The maintenance problem Clay Shirky flagged twenty years ago in "Ontology is Overrated" did not disappear because LLMs arrived.

So the order matters. If #43's qualifying question for knowledge graphs was "does my workload actually contain questions vectors can't answer," the ontology's qualifying question is this: **"do questions that schemas alone can't answer actually reach my agents?"** Concretely — do two teams compute the same metric differently, so meetings dissolve into reconciling numbers? Do agents (or new hires) have to ask a human what a column means? Are your term definitions scattered across a wiki, a YAML file, and someone's head? If none of these, not yet.

If they do, start small. **Concepts are cheapest at the playground** — an hour through Ontology Playground's IQ Lab gives you a feel for entities, relationships, and bindings, with no install and no account. The first real artifact is a mini-ontology of your own domain. Exactly as the IQ Lab demonstrates, start under 15 core entities and grow only when real questions demand it. Draw the company-wide ontology on day one and you join the failure statistics above ("start with a departmental quick win" is also [Directions on Microsoft's advice to CIOs](https://www.directionsonmicrosoft.com/cio-talk-microsoft-gets-iq/)). Tools you don't need to buy. If your organization runs Fabric, auto-generating from Power BI semantic models and then reviewing is the shortest path. Otherwise, exposing an existing layer like dbt's semantic layer to your agents comes first. Either way, don't keep your definitions only in one platform's format — once OSI lands, portability becomes leverage.

---

## What to watch

In [#44](/blog/44-surviving-model-churn/) I sorted assets into "the model is rented, the eval is owned." The ontology is squarely in the **owned column.** No frontier model can figure out on your behalf what "active customer" means at your company, and once written down it survives every model migration. But unlike evals, an ontology rots when neglected — start one without an owner who can absorb the drift, and what you inherit is a liability.

Two things to watch. First, **the standards war** — if OSI becomes a real exchange standard, "which platform holds the ontology" stops being lock-in and becomes a choice, and the contest shifts from storage to tooling and agent-integration quality. The tension between Microsoft opening MCP endpoints and not appearing on the OSI member list lives exactly here. Second, **who keeps the ontology true** — 25 years ago this failed because there was no one to do that work; this time the difference is that LLMs are being deployed as the assistant that drafts the ontology and detects the drift. Whether that assistance turns one FTE into a tenth of one will decide whether this reunion, this time, actually happens.

Twenty-five years ago the Semantic Web failed by asking humans to write in the machine's language. Now the machine has learned ours. What remains is to write down, once, the language of your own company.
