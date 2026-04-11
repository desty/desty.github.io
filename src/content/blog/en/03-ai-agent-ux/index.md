---
title: "Where Should UI/UX Go in the Age of AI Agents?"
summary: "The era of pressing a button and getting a result is ending. When AI acts on your behalf, how do you design the experience? From expectation setting and explainability to control negotiation and graceful failure — six critical points for practitioners."
date: "2026-04-05T12:00:00"
tags:
  - ai
  - ux
  - ai-agent
  - product-design
---

The era of pressing a button and getting a result is ending. Now users say "do this for me," and the AI figures things out and takes action on its own. The problem lies in the gap. You can't tell what the AI is doing, you can't understand why it produced a particular result, and you can't see when to step in.

If traditional UI/UX was about designing "the experience of a user operating a system," then UI/UX in the age of AI agents must design **"the experience a user has when the system acts on their behalf."** It's a fundamentally different game.

Google's PAIR (People + AI Research) guidebook breaks this challenge into six chapters: defining user needs, mental models, explainability and trust, data collection and evaluation, feedback and control, and errors and graceful failure. Using that structure as a backbone, I've organized the key considerations for designing AI services, with real-world examples along the way.

---

## 1. Define "What Problem It Solves" Before "What It Can Do"

There's a trap that engineering teams fall into all too easily. "Our model can do this too, so let's add it." Capability-driven thinking. But users aren't here to be impressed by AI's abilities. They came to solve their problems.

Grammarly is a good example. It started as a simple spell checker, but when it adopted AI, it redefined what success meant entirely. Instead of "how many typos did it catch," they created a new metric: the **Effective Communication Score (ECS)**. It's an industry-first communication effectiveness metric that measures accuracy, clarity, inclusiveness, and brand consistency. They redefined success as "how satisfied users are with their own message."

In 2025, they went a step further by launching an AI Agent. Originality checking, audience reaction prediction, credible source recommendations — it's evolving toward supporting the entire context of writing.

**Key takeaways:**
- Can you describe the "real problem" your AI solves in a single sentence?
- Is your success metric model accuracy, or user goal completion rate?
- If you removed the AI features, would the service still stand on its own? If so, AI isn't core yet.

---

## 2. Expectation Setting Comes Before Feature Design

First impressions of an AI service determine expectations. If users expect the AI to be an "all-knowing problem solver," even small mistakes cause disappointment. If they see it as an "assistant tool," the same mistakes become acceptable. This isn't a technology problem — it's a framing problem.

Karrot (a Korean marketplace app) nailed this with its AI writing feature. Upload photos and the AI identifies the brand, color, size, even the number of card slots, then auto-generates the product name, category, condition, and description. It even separates multiple items from a single photo into individual listings. The key is that all results are presented as **editable drafts**. The mental model is clear: "The AI writes a draft, you finish it."

On the other hand, Apple Intelligence's notification summary feature offers a lesson in expectation-setting failure. The feature summarized multiple lock screen notifications into a single line using AI, but it misrepresented news content, showing factually incorrect information. Apple ended up pausing notification summaries for news and entertainment apps, and modified the feature to display AI-generated summary text in *italics*. A clear case showing that **AI-generated content must always be visually distinguishable from human-created content**.

**Key takeaways:**
- Does your onboarding explicitly communicate the AI's role and limitations?
- Is AI-generated content visually distinguishable from original content?
- Can users tell what the AI is doing while it's working?
- "AI can make mistakes" isn't just a disclaimer — it's the starting point for trust design.

---

## 3. Open the Black Box — Explainability Is Trust

The same recommendation feels completely different when presented as "90% match" versus "a suspenseful show similar to the Korean dramas you've enjoyed."

Netflix is moving in this direction. They're transitioning from match-score-based recommendations to qualitative tag-based ones. A dedicated team of 30 manages over 3,000 tags, displaying mood tags like "slick," "gritty," "romantic," and "soapy" on content cards. A single adjective can be more powerful than a single number.

Perplexity AI pushed search result explainability to the extreme. Answers include inline numbered citations, with a source panel showing titles, site names, and favicons. Hover for a preview, click to go to the original. They created a new paradigm: not "a list of search results" but "a synthesized answer with evidence."

Users don't want to blindly trust the AI's conclusions — they want **the basis to judge whether they can trust it**. What matters here isn't the volume of explanation but its quality. A single line that helps the user's decision-making is worth more than a technically perfect explanation.

**Key takeaways:**
- Are you attaching a "why?" to your AI's recommendations and decisions?
- Which form of explanation — source, rationale, or confidence level — fits your service best?
- Is too much explanation actually creating cognitive overload?

---

## 4. Hand Back the Wheel — Control Should Be Negotiable

The greatest value of AI agents is automation. But the greatest anxiety also comes from automation. "Why did it do it this way?", "That's not what I wanted," "How do I make it stop?"

Just as autonomous driving has Levels 1 through 5, AI agents need a spectrum of delegation levels.

| Level | Description | Example |
|---|---|---|
| **Level 1** | Show me options, I'll pick | YouTube "Not interested" button |
| **Level 2** | Pick for me, but confirm before acting | Gemini conversation satisfaction rating |
| **Level 3** | Handle it, just tell me the result | Gmail smart categorization |
| **Level 4** | Handle it, only tell me if something's wrong | Tesla Autopilot |

The key is that **users should be able to change the level whenever they want**. The industry is starting to call this the shift "from Conversational UI to Delegative UI" — moving from a chat interface that passively waits for prompts to a delegation interface where AI plans, executes, and iterates on its own. The most critical factor in this transition is whether users can directly adjust the depth of delegation.

**Key takeaways:**
- Can users stop or undo the AI's automatic actions?
- Is there a UI that lets users adjust the delegation level themselves?
- Does the AI go through checkpoints before making important decisions?

---

## 5. Turn Errors Into Conversations

Traditional UI error: "Invalid input."
AI Agent error: "There are no flights to Busan on that date. Want me to check the day before or after?"

This difference defines the quality of the user experience.

When location services are turned off, Siri doesn't say "Unable to determine current location" — instead, it says "If you turn on location services, I can find restaurants for you." When Gemini declines a copyright-related request, it doesn't just say "Generation failed" — it explains the specific safety mechanism that was triggered.

The formula for **graceful failure** is simple:
**Reason for failure + alternative suggestion + prompt for next action**

**Key takeaways:**
- Do your error messages end with "can't do that," or continue with "try this instead"?
- When the AI hits something it can't handle, does the user feel stuck or find a way around?
- Are you communicating failure reasons in language the user can understand?

---

## 6. Show the Evolution — Transparency in Data Usage

AI services should improve over time. But if users don't perceive the change, all that's left is distrust: "Why are you taking my data?"

Tesla's FSD (Full Self-Driving) trains its models on real-world driving data collected from over 6 million vehicles. Improved models are deployed to vehicles via OTA updates every few weeks. The November 2025 update included improvements to urban intersection judgment, lane change trajectory optimization, and low-light object recognition. Users directly experience their car getting smarter over time. It's a structure where the reason for data collection and its results are communicated simultaneously.

Most AI services, on the other hand, leave users with just one line — "We collect data to improve our service" — without ever showing what form that improvement takes. If users can't see the value of providing their data, distrust is inevitable.

**Key takeaways:**
- Are you explaining how user data contributes to service improvement?
- When the model gets updated, are you telling users "what changed"?
- Is the reward for providing data coming back as "a better experience"?

---

## In the End, It Comes Down to One Question

> "Are we so busy trying to prove AI's perfection that we're filling in every blank the user should occupy?"

UI/UX in the age of AI agents isn't a showcase for technology. It's about designing **the space for users to tame a powerful tool in their own way**.

| What to rethink | Old mindset | New mindset |
|---|---|---|
| Definition of success | Model accuracy | User goal completion rate |
| First impression design | Feature showcase | Expectation calibration |
| Building trust | Flaunt performance | Process transparency |
| User's role | Passive recipient | Active orchestrator |
| Error handling | Error messages | Alternative negotiation |
| Data usage | Collection and training | Transparent evolution sharing |

Technology will keep advancing, but building trust on top of that technology is still the maker's job. Rather than grand innovations, start placing the small touches that make users feel "this AI is on my side" — one at a time.
