# AI Chat Template — AI Elements + Vercel AI SDK v6

Templates for building AI chat interfaces using AI Elements components and Vercel AI SDK v6.

> **Before using these templates**, fetch the latest docs:
> - `https://ai-sdk.dev/docs` — Vercel AI SDK v6 useChat, DefaultChatTransport
> - `https://elements.ai-sdk.dev/docs` — AI Elements component registry

---

## Critical: Vercel AI SDK v6 Breaking Changes

This skill requires AI SDK v6. The API changed significantly from v5. **Do not use v5 patterns.**

| Feature | v5 (WRONG) | v6 (CORRECT) |
|:--------|:-----------|:-------------|
| Transport | `useChat({ api: '/api/...' })` | `useChat({ transport: new DefaultChatTransport({ api: '/api/...' }) })` |
| Loading state | `isLoading` | `status === 'streaming' \| status === 'submitted'` |
| Send message | `append({ role: 'user', content: '...' })` or `handleSubmit` | `sendMessage({ text: '...' })` |
| Read content | `message.content` (string) | `message.parts` (array) |
| Status values | boolean | `"submitted" \| "streaming" \| "ready" \| "error"` |

---

## 1. Install AI Elements

```bash
# Option A — dedicated CLI
npx ai-elements@latest

# Option B — via shadcn registry
npx shadcn@latest add https://elements.ai-sdk.dev/[component-name]
```

Components are installed as **source files** into `src/components/ai-elements/`. You own and can customise them. Do not rebuild them from scratch.

---

## 2. Chat Page (`src/app/chat/page.tsx`)

This is a Server Component wrapper — the actual chat UI is a Client Component.

```tsx
// src/app/chat/page.tsx
import type { Metadata } from 'next'
import { ChatInterface } from '@/components/chat/chat-interface'

export const metadata: Metadata = {
  title: 'Chat — My App',
}

export default function ChatPage() {
  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col">
      <ChatInterface />
    </main>
  )
}
```

---

## 3. Chat Interface Client Component (`src/components/chat/chat-interface.tsx`)

```tsx
// src/components/chat/chat-interface.tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Conversation } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { PromptInput } from '@/components/ai-elements/prompt-input'
import { StreamingMessage } from './streaming-message'

export function ChatInterface() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/v1/chat' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable conversation area */}
      <Conversation className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center max-w-sm">
              Ask a question to get started.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} role={message.role}>
            <MessageContent>
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return <StreamingMessage key={i} content={part.text} />
                }
                // Tool call parts — show reasoning steps
                if (part.type === 'tool-invocation') {
                  return (
                    <div key={i} className="text-xs text-muted-foreground italic">
                      Using tool: {part.toolName}…
                    </div>
                  )
                }
                return null
              })}
            </MessageContent>
          </Message>
        ))}

        {/* Streaming indicator */}
        {status === 'submitted' && (
          <div
            aria-live="polite"
            aria-label="Agent is thinking"
            className="flex items-center gap-2 text-muted-foreground text-sm"
          >
            <span className="animate-pulse">●</span>
            <span>Thinking…</span>
          </div>
        )}
      </Conversation>

      {/* Input area */}
      <div className="border-t border-border px-4 py-4">
        <PromptInput
          onSubmit={(text) => sendMessage({ text })}
          disabled={isStreaming}
          placeholder="Ask anything…"
          aria-label="Chat input"
        />
      </div>
    </div>
  )
}
```

---

## 4. Streaming Markdown Renderer (`src/components/chat/streaming-message.tsx`)

Use Streamdown for rendering markdown. It is streaming-aware and handles incremental token rendering.

```tsx
// src/components/chat/streaming-message.tsx
'use client'

import Streamdown from 'streamdown'
import { CodeBlock } from '@streamdown/code'
import { MathBlock } from '@streamdown/math'
import { MermaidBlock } from '@streamdown/mermaid'

interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <Streamdown
      content={content}
      components={{
        code: CodeBlock,
        math: MathBlock,
        mermaid: MermaidBlock,
      }}
      // SECURITY: sanitize agent output to prevent XSS
      sanitize={true}
      className="prose prose-sm max-w-none text-foreground"
    />
  )
}
```

**Security note:** Always set `sanitize={true}` when rendering LLM output. Agent responses may contain malicious HTML injected via prompt.

---

## 5. AI Elements — Compound Component Patterns

AI Elements use a compound component pattern with React Context. Compose sub-components rather than passing config props.

```tsx
// Conversation scroll container with stick-to-bottom
import {
  Conversation,
  ConversationScrollAnchor,
} from '@/components/ai-elements/conversation'

// Role-based message bubbles
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
} from '@/components/ai-elements/message'

// Auto-resize textarea with submit/stop
import {
  PromptInput,
  PromptInputAction,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

// Chain-of-thought collapsible reasoning steps
import {
  ChainOfThought,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
```

**Rule:** Use AI Elements for ALL AI chat interfaces. Never build a custom chat/message/input UI from scratch.

---

## 6. Advanced: Chain-of-Thought Display

Show collapsible reasoning steps from the agent.

```tsx
// src/components/chat/reasoning-steps.tsx
'use client'

import { ChainOfThought, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought'

interface ReasoningStepsProps {
  parts: Array<{ type: string; toolName?: string; state?: string }>
}

export function ReasoningSteps({ parts }: ReasoningStepsProps) {
  const toolParts = parts.filter((p) => p.type === 'tool-invocation')
  if (toolParts.length === 0) return null

  return (
    <ChainOfThought defaultOpen={false} label="Reasoning steps">
      {toolParts.map((part, i) => (
        <ChainOfThoughtStep
          key={i}
          status={part.state === 'result' ? 'complete' : 'loading'}
          label={part.toolName ?? 'Tool call'}
        />
      ))}
    </ChainOfThought>
  )
}
```

---

## 7. Status Indicator

```tsx
// src/components/chat/status-badge.tsx
'use client'

interface StatusBadgeProps {
  status: 'submitted' | 'streaming' | 'ready' | 'error'
}

const statusConfig = {
  submitted: { label: 'Thinking…', color: 'text-accent' },
  streaming: { label: 'Responding…', color: 'text-primary' },
  ready: { label: 'Ready', color: 'text-muted-foreground' },
  error: { label: 'Error', color: 'text-destructive' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      aria-live="polite"
      aria-label={`Chat status: ${config.label}`}
      className={`text-xs font-medium uppercase tracking-wide ${config.color}`}
    >
      {status !== 'ready' && config.label}
    </span>
  )
}
```

---

## 8. package.json Dependencies (AI Chat)

```json
{
  "dependencies": {
    "ai": "^6.0.97",
    "@ai-sdk/react": "^3.0.96",
    "streamdown": "^2.3.0",
    "@streamdown/code": "^2.3.0",
    "@streamdown/math": "^2.3.0",
    "@streamdown/mermaid": "^2.3.0"
  }
}
```

Install AI Elements separately via the CLI after other deps are set up.

---

## 9. Backend SSE Protocol

The backend must stream responses using the **Vercel AI SDK UI Message Stream Protocol (v1)**. For reference, the stream format expected:

```
Content-Type: text/plain; charset=utf-8
x-vercel-ai-ui-message-stream: v1

data: {"type":"message-start","id":"msg_1"}

data: {"type":"text-delta","id":"txt_1","delta":"Hello"}

data: {"type":"text-delta","id":"txt_1","delta":" world"}

data: {"type":"message-end","id":"msg_1"}

```

The frontend SDK parses this automatically. Do **not** write a custom stream decoder on the frontend side.
