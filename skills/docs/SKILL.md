---
name: docs
description: >
  Fetches and uses up-to-date library documentation directly from official sources — no MCP, no third-party server.
  Use this skill when the user invokes /docs, asks how to use a specific library or framework feature,
  wants to see documentation for a function/concept, or asks "how does X work in Y".
  Prioritizes the llms.txt standard (concise, LLM-optimized doc files) then falls back to WebSearch + WebFetch.
  Works for any library: React, NestJS, Vite, Prisma, TanStack Query, Zod, Orval, Tailwind, Vitest, etc.
  Trigger on: "/docs react hooks", "show me nestjs guard docs", "how to use zod transform",
  "what's the prisma API for findMany", "how do I configure vite aliases", "comment utiliser X dans Y".
compatibility:
  tools:
    - Agent
    - WebFetch
    - WebSearch
---

# Docs Skill

Fetch official library documentation and answer questions about it, without any third-party MCP server.
Documentation fetching is delegated to the **DocsExplorer** subagent, which isolates the raw doc content
from the main conversation context and returns only the relevant summary.

---

## Step 1 — Parse the request

Extract from the user's message:
- **library**: the name of the library or framework (e.g. `nestjs`, `zod`, `react`, `prisma`)
- **topic**: the specific feature or concept to look up (optional, e.g. `guards`, `transform`, `hooks`, `findMany`)

If the library is ambiguous, infer from the current project context (e.g. if the conversation is about a NestJS project, default to NestJS).

---

## Step 2 — Spawn DocsExplorer agent(s)

Delegate the fetch to the **DocsExplorer** agent using the Agent tool:

```
subagent_type: DocsExplorer
prompt: "library: <library>\ntopic: <topic>"
```

**If multiple libraries or topics are needed** (e.g. from a Step 0 in another skill), spawn all agents **in parallel** in a single message — one agent per library/topic pair.

The agent returns a summary of max 50 lines. It never returns the full raw doc file.

---

## Step 3 — Answer the user

Using the summary returned by DocsExplorer:
- **Lead with code** — show the TypeScript/JavaScript example from the summary first
- **Then explain** — brief explanation of key concepts, parameters, options
- **Cite the source** — include the `SOURCE:` URL returned by the agent

If multiple agents were spawned, merge their results into a single coherent answer.

---

## What this skill does NOT do

- No third-party MCP server or external service
- No local caching (always fetches fresh)
- No multi-page crawl (DocsExplorer does a single targeted fetch)
