# Insight AI - Frontend UI

This is the frontend UI for the **Insight AI** search assistant. It's built with **Next.js**, **Zustand**, and **shadcn/ui** to create a Perplexity-like experience, featuring real-time streaming, source citation, and a conversational interface.

You can check the [Live Demo](https://ai-chatbot-web-nine.vercel.app) here.

---

# System Architecture

## Key Technologies

- Server-Sent Events (SSE): Uses the native browser `EventSource` API to receive a continuous stream of named events from the backend in real time.

## Project Structure

```
ai-chatbot-web/
├── app/                     # Next.js App Router directory
│   ├── page.tsx             # Main chat page component
│   └── layout.tsx           # Root layout (metadata, font, globals.css)
├── components/              # Custom React components
│   ├── ui/                  # shadcn/ui components
│   ├── ChatMessages.tsx     # Renders the auto-scrolling message list
│   ├── AssistantMessage.tsx # AI message container
│   ├── AnswerCard.tsx       # Streams and renders Markdown answers
│   ├── CitationPopover.tsx  # Displays clickable citation popovers
│   ├── SourcesCard.tsx      # Renders horizontal source card list
│   ├── TraceBar.tsx         # Shows AI’s current processing step
│   └── UserMessage.tsx      # User’s message bubble
├── lib/
│   ├── constants.ts
│   └── types.ts
├── store/
│   └── chatStore.ts         # Global Zustand store managing chat and SSE
├── .env.local               # Local environment variables
├── package.json             # Project dependencies
└── README.md                # This file
```

---

# Core Features

## Chat Stream Management

The frontend manages the entire chat lifecycle through a **Zustand** store that synchronizes messages, connection state, and real-time SSE updates.
The flow below illustrates how the frontend interacts with the backend and UI during a single chat session.

| Step                       | Description                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. User Input**          | The user submits a query from `page.tsx`. `startStream(query)` is triggered from the Zustand store.                                                                                                                                                 |
| **2. Initialize Messages** | A new `UserMessage` and an empty `AssistantMessage` are created and appended to the `messages` array.                                                                                                                                               |
| **3. Connect to SSE**      | The store opens an `EventSource` connection to `/api/chat/ask?query=...`, starting a live stream with the backend.                                                                                                                                  |
| **4. Receive Events**      | The store listens for named SSE events:<br>• `trace` → updates AI progress in **TraceBar**<br>• `sources` → updates **SourcesCard**<br>• `chunk` → streams Markdown text into **AnswerCard**<br>• `error` / `done` → finalizes or stops the stream. |
| **5. Update UI**           | React components subscribe to Zustand. Whenever `messages`, `sources`, or `content` update, the UI re-renders automatically.                                                                                                                        |
| **6. Stop Stream**         | When the stream completes or an error occurs, `stopStream()` closes the `EventSource` and resets loading states to prevent reconnect loops.                                                                                                         |

---

# Setup Instructions

## Step 1. Install dependencies

```
npm install
```

## Step 2. Set up environment variables

Create a `.env.local` file and specify your backend API URL:

```
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Step 3. Start the local server

The server will run on http://localhost:3000.

```
npm run dev
```
