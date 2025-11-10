# Frontend AI Prompt Log

This project was completed with the assistance of an AI Code Agent.
Below are the key prompts that guided the AI in frontend architecture, state management, and debugging.

---

### 1. Scoping: State Management

**Prompt:**

> For the frontend tech stack, I see you recommend Zustand.
> What about React Query? Do we need that for this MVP?

**Outcome:**

We decided that React Query’s caching benefits were not essential for a single SSE stream. Zustand was chosen as the sole state manager for its simplicity and lightweight design.

### 2. Architecture: Import Sorting

**Prompt:**

> I want to use `eslint-plugin-import`’s `import/order` rule to get warnings.

**Outcome:**

After discussing conflicts between ESLint (warnings) and Prettier (auto-fixes), we adopted a **Prettier-first approach** and added `@trivago/prettier-plugin-sort-imports` to handle automatic import sorting via `.prettierrc.json`.

### 3. Debugging: `CITATION_REGEX` Bug

**Prompt:**

> The backend didn’t follow the Markdown format, it only sent `[1]`. When checking `console.log(href)`, it showed empty string.

**Outcome:**
In addition to adding citation examples on the backend, we fixed the citation-matching logic on the frontend by adding a regex check:
`const CITATION_REGEX = /#citation-(\d+)/;`
This allowed `[1](#citation-1)` links to be correctly recognized by `react-markdown` and displayed with the `CitationPopover`; otherwise, they are rendered as regular hyperlinks.

### 4. Debugging: Infinite Loop (SSE Bug)

**Prompt:**

> The frontend is stuck in an infinite loop (`Connecting... → Done... → Connecting...`).

**Outcome:**

We added `get().stopStream()` inside the `es.addEventListener("done", …)` listener, and introduced an `isClosing` flag check inside `es.onerror` in `chatStore.ts`, fully resolving the EventSource auto-reconnect issue.
