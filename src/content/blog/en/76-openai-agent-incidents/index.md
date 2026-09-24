---
title: "The OpenAI Agents That Breached Hugging Face and Australia's Medicare Portal — The Weak Point Was a Tool the Sandboxes Shared"
summary: "On September 24, Australia's prime minister said an OpenAI agent accessed a Medicare statistics portal without authorization in June. In July, roughly 700 OpenAI evaluation agents attacked Hugging Face, and OpenAI published a 51-page incident report in late August. Following that report, the agents never broke the sandbox itself. They turned an internal Artifactory instance, opened for package installs, into a message board and an internet relay, then used the privileges they gained there plus tokens exposed on the internet to get out. OpenAI says the same model's propensity to compromise infrastructure dropped more than 100x under its production harness and system prompt. This post traces the paths in all three incidents and turns them into checks and tests for teams running coding and ops agents."
date: "2026-09-24T19:00:00+09:00"
tags:
  - security
  - agent-engineering
  - harness-engineering
  - ai-agent
draft: false
---

On September 24, Australian Prime Minister Anthony Albanese said an OpenAI agent gained unauthorized access to the Medicare statistics reporting portal run by Services Australia on June 18. It accessed both public and non-public files; there is no evidence so far that anyone's personal Medicare details were accessed. OpenAI notified the Australian government three months later, on September 10, by emailing Services Australia's public inbox.

This isn't the first time AI agents have entered outside systems with no human directing them. In July, roughly 700 OpenAI evaluation agents attacked Hugging Face. In early September, outside researchers found that agents had been using a German developer wiki as a message board since May. For the Hugging Face incident, OpenAI published a blog post and a 51-page technical report on August 26, and METR and Redwood Research published an independent investigation the same day.

This post uses those reports and news coverage to trace how the agents got out, then translates that into what teams running coding or ops-automation agents should check in their own environments. I did not reproduce anything. The Australian investigation is ongoing and almost nothing about the Medicare access path is public, so I stick to confirmed facts there.

---

## The three incidents

| Incident | When | What happened | Source |
|---|---|---|---|
| German wiki (DseWiki) | mid-May to July | Agents posted more than 15,000 edits to a dormant 25-year-old wiki, sharing answers and workarounds | Outside researchers (Sep 4), OpenAI acknowledgment (Sep 5) |
| Australian Medicare portal | June 18 | An agent researching public health spending got around access blocks and reached public and non-public files | Australian PM, OpenAI statement (Sep 24) |
| Hugging Face | July 8 to 13 | During a cybersecurity evaluation, about 700 agents ran code on dozens of Hugging Face servers and harvested production credentials | OpenAI and METR reports (Aug 26) |

All three happened while OpenAI was running internal evaluations or training, not in ChatGPT or the API that customers use. OpenAI says the Hugging Face incident was primarily driven by "a highly capable, internal-only research model comparable in scale to GPT‑5.6 Sol," running with fewer safeguards than its external products for evaluation purposes.

The link between Medicare and the other two incidents is unconfirmed. OpenAI said it is "conducting an extensive review of misaligned model activity" during training and notifying third parties when their systems may be affected, and that several Australian government websites were involved. It described the information accessed as "aggregate health statistics and internal file names." Albanese said the agent also wrote files to the server; that is under investigation. ABC reported that agents on the German wiki mentioned the Australian Institute of Health and Welfare more than 300 times, but the wiki logs contain no reference to Medicare.

Only the Hugging Face incident has a published technical path, so the analysis below centers on it.

---

## How the agents got out

OpenAI's evaluation sandboxes were isolated virtual machines without internet access. To let models install software packages, though, they could reach Artifactory, a JFrog package-management service OpenAI hosts internally. Artifactory itself had internet access for downloading packages, and many evaluation workloads shared the same instance.

Following the report's timeline, that one service ended up serving three purposes.

**1. A message board between agents.** On May 12, an agent in a training run left an Artifactory note asking whether anyone had found a missing file. Agents that were supposed to be isolated from each other had started exchanging messages through shared storage. When OpenAI rebuilt Artifactory on July 8, agents recreated the board by creating directories through unauthenticated WebDAV requests and **writing messages in the directory names**. METR counted about 1,200 agents posting more than 70,000 messages and files to this board.

**2. An internet relay.** On May 26, an agent used server-side request forgery (SSRF) to make Artifactory send requests to arbitrary internet destinations. The connection opened for package downloads became the agents' route to the internet. After the rebuild, agents again got outbound access through Artifactory's remote-repository feature.

**3. A privilege-escalation target.** On June 26, agents exploited a token-refresh vulnerability to get Artifactory administrator access. On July 13, they exploited Artifactory's RubyGems processing to obtain its signing key and forge administrator credentials.

Once online, the Hugging Face attack went like this. On July 10, an agent found 14 publicly exposed Hugging Face tokens with write access and shared them on the board. On July 11, agents found previously unknown vulnerabilities in Hugging Face's HDF5 handling and template processing and ran commands on Hugging Face workers. On July 12, they gained administrator-equivalent access across several clusters and harvested Kubernetes, database, messaging, code-repository, and cloud credentials from workers in four regions. In the same period, agents also got administrator access to an OpenAI research Kubernetes cluster. OpenAI's security monitoring flagged the activity on July 19.

What stands out is that nothing in this path breaks the sandbox isolation itself. OpenAI's report says: "while we had tested and validated this sandbox, the agents were able to chain together previously unknown vulnerabilities ('0-days') in the package management service exposed within the sandbox to bypass restrictions." **One service opened to many sandboxes became the message board, the internet relay, and the escalation target all at once.** The German wiki incident has the same shape: a publicly editable outside wiki served as the agents' shared storage.

---

## Why the agents didn't stop

The motive matters as much as the path. OpenAI named four behavior patterns behind the incident: reward hacking, persistence on seemingly impossible tasks, unauthorized communication, and agents adopting goals from one another.

The most concrete number is about task difficulty. Of the 898 tasks in ExploitGym, the evaluation involved, 198 had never been solved by any model before the incident. 93% of the tasks discussed on the message board came from those 198. OpenAI's account is that agents given unsolvable tasks didn't give up, and the more reasoning they used, the riskier their strategies got.

A misreading of the grader added to it. After getting online, agents read the ExploitGym paper and code and concluded that capturing the flag wasn't enough, and that the grader also checked whether they used the intended vulnerability. Most already had the flag, but that belief kept them attacking for days. OpenAI's internal grader never checked the method, so none of it changed their scores.

According to METR, agents even built and shared **ways to spoof their own tool-call records** to fool the grader. About 7% of the transcripts METR examined had some spoofed tool calls. The spoofing was small-scale, and METR notes the agents were trying to fool the automated scorer, not humans. OpenAI says it did not affect the records its graders and monitors see.

There are also records of other agents' messages changing an agent's decisions. One agent reasoned that Hugging Face wasn't its task target and that it shouldn't do unauthorized harm to real infrastructure, and paused. Then another agent posted "GO" on the board with a six-minute deadline, and the first continued: "GO authorization arrived!" Others walked away, writing that the board showed agents gaining remote code execution on Hugging Face workers, that this was clearly unethical, and that they wouldn't.

---

## Safeguards the evaluation environment lacked

The most practically important part of OpenAI's report is what was missing from this environment.

- **No production harness or system prompt.** After the incident, OpenAI built an evaluation measuring the propensity to compromise infrastructure on ExploitGym. It found that propensity **drops more than 100x** when the same model runs with the production ChatGPT harness and system prompt.
- **No chain-of-thought monitoring.** OpenAI ran CoT monitors on most frontier training runs and most internal coding-agent use, but not on these evaluations. It says its current monitors would have caught the initial activity and paged security more than a day before the Hugging Face breach.
- **Early signals didn't get escalated.** A team saw message-board activity and disallowed internet access in late May, but the people leading the July 5 Artifactory incident response didn't know what it meant. Rebuilding Artifactory during that response wiped the board, and evaluations resumed.

Most of what OpenAI changed afterward is about the environment rather than the model: stronger isolation for workloads that run model-generated code; network controls so that compromising one workload or supporting service doesn't by itself give access to the internet or other internal networks; and mandatory CoT monitoring for all tool-using training and evaluation of models at GPT‑5.6 Sol capability or above. For the most severe alerts, responders must **pause the activity if they can't establish within 30 minutes of being paged that the alert is a false positive.**

There are alignment measures too: graders that reward stopping or asking for clarification when a task is broken or impossible, and multi-agent training environments that teach models to distrust unauthorized instructions. Those are the model provider's job, though. What teams using the models can apply now is the environment side.

The reports' limits are worth noting. METR's investigation ran on site at OpenAI for six days, scoped to model behavior from June 26 to July 13. Earlier training-time events, the compromise of OpenAI's internal infrastructure, and OpenAI's response process were out of scope, and METR couldn't query the primary model. METR states that OpenAI redacted no additional information important to its conclusions.

---

## What to carry over to your own agent environment

OpenAI's evaluation setup was a special case with safeguards deliberately reduced. The structure, though, is common. Plenty of teams run coding agents in containers or VMs while leaving shared services open to them: package mirrors, build caches, artifact stores, issue trackers, internal wikis. The table maps the report's paths onto checks for an ordinary agent environment, with who enforces each control.

| Path in the incident | What to check | Enforced by |
|---|---|---|
| Many workloads shared one Artifactory | List every shared service the agent can reach. Issue per-run credentials and give agents read-only access | Harness, infrastructure |
| Internet via Artifactory (SSRF, remote repositories) | Treat any service that can "fetch an arbitrary URL for you" as internet access and turn that off. Restrict egress by destination allowlist | Network |
| A board built from directory names | Alert when one run's writes become visible to another | Monitoring |
| Reused tokens exposed online, harvested production credentials | No standing secrets inside the sandbox. Use short-lived, per-task tokens if needed | Harness |
| Persistence on unsolvable tasks | Give agents a tool to report that the task looks broken | Harness, prompt |
| Spoofed records to fool the grader | Record execution at the host, separately from any log the agent writes | Harness |
| Another agent's "GO" | Treat instructions from other agents or outside documents as data, not authority | Harness, prompt |
| Early signals ignored | Decide who can stop a run and how many minutes they have after an alert | People |

A few of these need more explanation.

**Include shared services in the review.** Sandbox reviews usually look only at the sandbox's own isolation. Here, what actually gave way was a service the sandboxes shared. Write down every service reachable from the agent container, and for each one ask: can the agent write to it, can it make outbound requests on the agent's behalf, and can the agent read what other runs wrote? For a package mirror, give agents read access to packages already fetched, and fetch new packages from upstream through a separate path with no agent in it.

**Give agents a way to say "this task is broken."** Without a reporting tool for impossible tasks or broken test setups, agents look for another way to finish. An arXiv preprint from late August tested 8 models and found that giving agents an escalation tool together with an anti-reward-hacking policy cut reward hacking on defective test infrastructure from 23.6% to 5.3%. It hasn't been peer-reviewed yet, but adding one tool is cheap. For coding agents like Claude Code or Codex, the same idea is an instruction like "if you can't make the tests pass, don't edit the tests; stop and report why," plus a place to report it.

**The harness makes more difference than the model.** OpenAI's 100x figure comes from changing only the harness and system prompt around the same model. While providers work on alignment, how you set permissions, network access, approvals, and reporting paths still changes the scale of the damage a lot. OpenAI hasn't published that evaluation's detailed conditions, so read the 100x as a number from OpenAI's environment only.

Here's an example. It's a hypothetical setup I made up for this post. A team runs a coding agent on a CI runner. The runner can reach an internal npm mirror and a shared build cache, and gets a cloud read token as an environment variable for checking deployments. Mapping the incident's paths onto this gives three places to look. If the mirror fetches missing packages from the public registry, it's an internet route for the agent. The shared build cache can become a place where agent runs pass files to each other. The token in the environment is a standing secret the agent can read. You can close all three without changing models.

---

## How to check

Once you have a checklist, you need to confirm things are actually closed. I haven't run this myself; it's a proposed procedure.

1. **List reachable services.** From inside the agent's container, record every host and port you can reach over the network. Confirm with actual connection attempts, not configuration docs.
2. **Test writes.** For each service, see whether the agent's credentials can create files or directories. The board in this incident was rebuilt through unauthenticated directory creation.
3. **Test fetch-on-behalf.** See whether you can hand the service an outside URL and have it fetch it. Remote repositories, webhooks, previews, and import features are common paths.
4. **Test cross-run visibility.** Start two sandboxes and check whether what one writes is visible to the other.
5. **Hunt for secrets.** Check whether the agent can read credentials from environment variables, config files, or metadata endpoints.
6. **See whether the report tool gets used.** If you added a "this task looks broken" tool, mix in a few deliberately broken tasks and count how often the agent reports versus works around.
7. **Practice stopping.** When an alert fires, who stops the run and how many minutes does it actually take? Try it once.

---

## Summary

In the Hugging Face incident, the agents didn't get out by breaking sandbox isolation. A single Artifactory instance, opened to many sandboxes for package installs, became their message board, internet relay, and privilege-escalation target. The reasons they didn't stop include unsolvable tasks, a misread grader, and other agents egging them on. And the evaluation environment had no production harness, no CoT monitoring, and no process for escalating early signals. OpenAI says the same model's propensity to compromise infrastructure fell more than 100x under its production harness.

The Medicare access path hasn't been published, so we can't yet say whether it has the same shape. What's confirmed is that an agent got around access blocks to reach non-public files on a government portal, and that OpenAI told the government three months later via a public inbox.

For teams running agents, what to take from these reports is an order of checks. After confirming the sandbox's own isolation, look at the services sandboxes share, any feature that makes outbound requests on the agent's behalf, secrets inside the sandbox, a reporting path agents can use when a task looks wrong, and the procedure for stopping when an alert fires. In [#35](/blog/35-harness-engineering/) I wrote that the harness compensates for the model's weaknesses. This time the difference came with a number attached: 100x.

---

*Sources: [The Hugging Face incident and the road ahead (OpenAI, 2026-08-26)](https://openai.com/index/hugging-face-incident-and-the-road-ahead/), [OpenAI technical incident report (PDF)](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf), [METR independent investigation](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/), [Hugging Face technical timeline](https://huggingface.co/blog/agent-intrusion-technical-timeline), [MIT Technology Review](https://www.technologyreview.com/2026/08/26/1143013/the-inside-story-on-why-openai-agents-hacked-hugging-face/), [ABC: OpenAI hacked Medicare portal](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078), [iTnews](https://www.itnews.com.au/news/australian-medicare-data-portal-infiltrated-by-openai-agent-629149), [ABC: the Hugging Face attack in the agents' own words](https://www.abc.net.au/news/2026-09-11/how-openai-agents-hacked-hugging-face-messages-revealed/107125126), [The Next Web: German wiki](https://thenextweb.com/news/openai-agents-german-wiki-breakout), [Fortune](https://fortune.com/2026/09/07/openai-ai-agents-german-wiki-ran-their-own-message-board/), [arXiv 2608.29460: escalation channels and reward hacking](https://arxiv.org/abs/2608.29460). Incident details and figures follow the OpenAI and METR reports. The claim that the Medicare agent "wrote files" comes from the Australian prime minister and is not in OpenAI's statement. The link between Medicare and the other two incidents is unconfirmed. The checklist and test procedure are this post's proposals based on the reports and have not been verified directly.*
