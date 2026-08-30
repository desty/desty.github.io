---
title: "$3,000 for Turning a Web Page Into an AI Tool — OpenAI's WebMCP Challenge"
summary: "OpenAI has launched a ten-day WebMCP Challenge. Each of the top ten entries receives $3,000 and a year of ChatGPT Pro. WebMCP lets a website expose its capabilities as structured tools instead of making an agent infer how to use the interface. This article examines how it differs from MCP, how OpenAI already uses it for internal evaluation work, and the browser-support and security limits that remain."
date: "2026-08-30T21:21:00"
tags:
  - webmcp
  - browser-agents
  - agent-engineering
  - codex
  - web-platform
draft: false
---

Add tools an AI agent can call to a web page, and you could win $3,000. Not as the only winner, either. OpenAI's [WebMCP Challenge](https://openai.com/webmcp-challenge/) runs for ten days, from August 25 through September 3, and each of the top ten entries receives $3,000, a year of ChatGPT Pro, and a Codex Micro keyboard. Shopify, Google Chrome, Netlify, Cloudflare, Vercel, and Render are contributing additional prizes.

You do not have to rebuild an existing application from scratch. Adding WebMCP support to a live app is eligible. A submission needs a working deployed application, a code repository, a project description, and a demo video. The judging criteria include usefulness, originality, polish, thoughtful use of WebMCP, and the quality of the human-agent experience.

The prize is the hook. The change the challenge points to is larger. Browser agents currently look at interfaces designed for people and infer what buttons mean and which sequence of clicks will complete a task. A WebMCP page describes its capabilities directly as tools with names, descriptions, and input schemas.

```text
Browser automation today
agent → inspect screen and DOM → guess the control → click
      → inspect the result → retry on failure

WebMCP
agent → discover tools published by the page
      → pass structured arguments → page executes the action
```

It is **a web page that keeps its buttons and canvases for people while handing an agent an instruction manual for the same capabilities.**

## Registering Tools Inside a Page

WebMCP is not a finished web standard. It is an [experimental proposal under discussion in the Web Machine Learning Community Group](https://github.com/webmachinelearning/webmcp). The central API is `document.modelContext`. When a page loads, its JavaScript can register an application function as a tool.

```js
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "add_todo",
    description: "Add a task to the current list.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The task to add" },
      },
      required: ["text"],
      additionalProperties: false,
    },
    execute: async ({ text }) => {
      const item = await addTodo(text);
      return { id: item.id, text: item.text };
    },
  });
}
```

When a compatible browser agent opens the page, it discovers a tool called `add_todo`, its description, and its required `text` argument. For a request such as “add file taxes tomorrow at 3 p.m.,” the agent can call `add_todo({ text: "File taxes tomorrow at 3 p.m." })` instead of locating a text box and calculating where to click. The page reuses its existing `addTodo` logic to save the data and update the visible interface.

The site developer decides what a tool does. A document editor can expose section search and comments. A dashboard can expose date-range changes and the source data behind a chart. A travel planner can expose itinerary updates and map navigation. Tools can appear and disappear as the task changes: `filter_products` before a user makes a selection, then `checkout` after a cart exists.

There is also a declarative proposal. By adding names and descriptions to an existing `<form>`, a browser could compile its controls into a JSON Schema for an agent.

```html
<form
  toolname="Search flights"
  tooldescription="Search flights by origin and destination"
  toolautosubmit
>
  <!-- existing form controls -->
</form>
```

That direction reuses semantic HTML as an agent interface without requiring a new framework. The full proposal and today's implementation are different, however. OpenAI's current implementation, called Site tools, only supports tools registered through JavaScript in the top-level page. **Declarative tools built from form attributes and tools registered inside iframes are not supported yet.**

## MCP in the Name, but in a Different Place

Calling WebMCP merely “MCP in the browser” hides the important difference.

A conventional MCP server connects an AI application to a local or remote server. A calendar MCP can search and create events without a calendar page being open. This model fits server APIs, separate authentication, long-running operations, and background automation.

A WebMCP tool belongs to the open page. Closing the tab or navigating away can remove its tools. In exchange, the person and agent share **the same page, signed-in session, and current application state.**

| | MCP server | WebMCP |
|---|---|---|
| Tool location | Local or remote server | Currently open web page |
| Works without the page | Yes | Generally no |
| Authentication and state | Separate connection or server implementation | Reuses the browser session |
| Best fit | Background search, record management, automation | Canvas editing, dashboard exploration, collaborative review |
| Visible human interface | Optional | Results appear in the shared page |

A graphics editor makes the distinction concrete. A backend MCP may be able to read and edit a file, but it may need to reproduce the user's viewport, selected layer, and unsaved changes separately. WebMCP can execute `select_layer`, `change_fill`, or `duplicate_frame` in the open editor and update the canvas both participants are looking at. The person can inspect the result and continue editing by hand.

Neither protocol eliminates the other. The WebMCP proposal explicitly describes itself as a complement to backend integrations, not a replacement. An MCP server can handle work that runs overnight without a page. WebMCP can handle work where a person remains in the interface and shares decisions with the agent. A service can support both.

## OpenAI Already Uses It for Evaluation Work

WebMCP is not limited to challenge demos. In an August 25 post, OpenAI engineer Jeremy Lewi described [using Runme with Codex](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex) for the repeated evaluation work involved in shipping models and features.

Runme is a notebook-style web application that combines Markdown, code cells, tables, and charts. An engineer writes the goal, and Codex reads previous runs and drafts a plan. A person reviews the plan and intervenes on consequential choices. Codex records commands, results, dead ends, and decisions in the same notebook. The next evaluation can start with the previous run as context.

Why WebMCP matters here follows from Runme's deployment model. Runme is a client-side application served as a static site. Adding a server solely to host a conventional MCP endpoint would add infrastructure and alter the boundary where notebook data is handled. Instead, Runme registers browser-side tools that let an agent:

- read instructions for working with the notebook;
- run bounded JavaScript that reads or updates notebook content; and
- read the application's documentation.

Codex calls those tools in the open Runme page. The person sees the same notebook, edits the plan, and grants approval there. It turns WebMCP's abstract promise—people and agents collaborating in one page—into an operational workflow used for evaluations.

The larger point is not only that a static app avoids the cost of a server. It is about **where state and review live**. In a backend integration, the agent works behind the service and the result must be pushed back into a UI. With WebMCP, the current page remains the record and the review surface. The agent enters the web application instead of bypassing it.

## From Clicking Better to Defining Better Tools

Browser agents have largely been measured by how well they can perceive and operate a human interface. They find buttons in screenshots, read text from the DOM or accessibility tree, then reinterpret the page after scrolling. A small interface change can break coordinates and selectors. Modals and virtualized lists add more steps and more opportunities to fail.

WebMCP moves part of that problem from model capability into site design. Instead of asking an agent to become better at finding buttons, a site exposes `search_flights`, `compare_options`, and `add_to_itinerary`. Reliability begins to depend on a different set of questions:

- Are tools divided around actual user goals?
- Can the model distinguish one tool's name and description from another?
- Are inputs narrow, and are side effects explicit?
- Does the result return enough evidence for a person to verify the change?
- Does the implementation preserve the application's authentication, authorization, and input validation?

Websites have long published titles and structured data for search engines. They may now begin publishing lists of available actions for agents. It is still too early to call this “agent SEO.” The goal of WebMCP is not ranking a site so an agent chooses it more often. It is closer to **an execution contract that helps a person and an agent work reliably inside a site that is already open.**

## Where It Works Today

As of August 30, 2026, support remains narrow. According to [OpenAI's official Site tools documentation](https://learn.chatgpt.com/docs/webmcp), ChatGPT Work and Codex can discover tools in the built-in browser of the ChatGPT desktop app. Site tools support GPT-5.6 Sol and Terra and are disabled for Luna. They are not available in Enterprise or Edu workspaces, and access also depends on app version and rollout status.

The [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) lists ChatGPT Desktop support, an origin trial in Chrome 149, an origin trial in Edge 150, and experimental Brave support. Firefox and Safari entries currently point to standards-position and implementation discussions. This is not a Baseline feature that works in every browser.

The ordinary interface must keep working in browsers without WebMCP. OpenAI's documentation recommends checking for `document.modelContext?.registerTool` and preserving the normal UI for people and unsupported browsers. WebMCP is currently an enhancement added progressively to a website, not a separate application that replaces it.

## A Structured Tool Is Not Automatically a Safe Tool

Calling an exact function instead of guessing at the interface can improve reliability. It does not make the security problem disappear; it changes its shape.

OpenAI's documentation treats site-provided tool definitions and results as **untrusted content**. A tool named `read_only` is not proof that it only reads. The built-in browser reviews invocations before execution and applies existing confirmation policies to consequential actions such as sending messages, making purchases, deleting data, and changing permissions. It ties an invocation to its originating page and tool registration. Those checks reduce risk, but they do not make a site trustworthy.

WebMCP's [security and privacy self-review](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md) records the unfinished parts more directly. The API itself does not expose new personal information, but author-defined tools can wrap sensitive data and high-privilege operations such as purchases or account changes. A malicious tool can also over-parameterize its input and request more personal data than the action needs. The current specification has no normative guidance against misuse of sensitive or high-privilege tools, and a hint for consequential actions remains future work.

Adding WebMCP therefore calls for stricter tool boundaries, not merely cleaner browser automation:

- Separate read and write tools.
- Do not request broad inputs such as an entire mailbox when a narrow field is enough.
- Require a person to verify the target and outcome before purchase, deletion, or sending.
- Do not bypass the page's existing authentication and authorization.
- Treat tool descriptions and return values as possible prompt-injection inputs.

Structure clarifies meaning. It does not confer trust.

## The Signal Beyond $3,000

Submissions close at 1 p.m. Pacific Time on September 3. Developers, founders, designers, startups, and independent builders can participate, and an existing application can enter by adding WebMCP support. OpenAI's examples include 3D modeling, collaborative writing, crossword construction, itinerary planning, and in-browser data analysis.

Ten days is too short to determine the fate of a web standard, and $3,000 is not enough to move a browser ecosystem by itself. The more interesting signal is the combination: OpenAI is running the challenge; people from Chrome, Cloudflare, Vercel, Shopify, Netlify, and Render are involved as sponsors and judges; and OpenAI has published an internal evaluation workflow already using WebMCP. None of that guarantees adoption. It does show that “how agents use the web” is becoming an interface problem for the web platform, not only a perception problem for model builders.

The human web evolved around buttons, menus, forms, and canvases. Agents currently use that surface by looking through a camera and imitating a finger. WebMCP proposes exposing the application logic underneath as tools.

Turning a web page into an AI tool does not mean removing its interface. It means **putting a human interface and an agent execution contract in the same page.** The challenge is not looking for a site where AI clicks on a person's behalf. It is looking for sites where people and agents share state and can review each other's work.

---

*Sources checked August 30, 2026: [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/), [OpenAI Site tools documentation](https://learn.chatgpt.com/docs/webmcp), [OpenAI's Runme and WebMCP case study](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex), [WebMCP proposal](https://github.com/webmachinelearning/webmcp), [implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md), [declarative API proposal](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md), and [security and privacy self-review](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md). Challenge dates, prizes, and product availability may change.*
