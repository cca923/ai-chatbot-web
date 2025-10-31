'use client';

import { create } from 'zustand';

import {
  type AssistantMessage,
  type ChatMessage,
  type Source,
} from '@/lib/types';

interface ChatHistoryState {
  history: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  eventSource: EventSource | null;
  isClosing: boolean;

  startStream: (query: string) => void;
  stopStream: () => void;
}

export const useChatStore = create<ChatHistoryState>((set, get) => ({
  history: [],
  isLoading: false,
  error: null,
  eventSource: null,
  isClosing: false,

  startStream: (query: string) => {
    // 1. Clear any previous errors and stop any existing stream
    if (get().eventSource) {
      console.warn('Stream already in progress. Stopping previous.');
      get().stopStream();
    }
    set({ isLoading: true, error: null, isClosing: false });

    // 2. Add the User's message to the history
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
    };

    // 3. Add a new, empty Assistant message to the history
    // We use a temporary ID to update it during the stream
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      traceStep: 'Phase 1: Planning...',
    };

    // Update the history state with both new messages
    set((state) => ({
      history: [...state.history, userMessage, assistantMessage],
    }));

    // 4. Create and connect the EventSource
    const newUrl = `http://localhost:8000/api/chat/ask?query=${encodeURIComponent(
      query
    )}`;
    console.log(`Connecting to SSE at: ${newUrl}`);
    const es = new EventSource(newUrl);
    set({ eventSource: es });

    // 5. Define SSE event listeners
    es.onopen = () => {
      console.log('SSE connection opened.');
      set({ isLoading: true });
    };

    // Helper function to update the *last* assistant message in the history
    const updateAssistantMessage = (
      updater: (msg: AssistantMessage) => AssistantMessage
    ) => {
      set((state) => ({
        history: state.history.map((msg) =>
          msg.id === assistantMessageId && msg.role === 'assistant'
            ? updater(msg)
            : msg
        ),
      }));
    };

    es.addEventListener('trace', (event: MessageEvent) => {
      console.log('Trace event:', event.data);
      updateAssistantMessage((msg) => ({ ...msg, traceStep: event.data }));
    });

    es.addEventListener('sources', (event: MessageEvent) => {
      console.log('Sources event:', event.data);
      const newSources: Source[] = JSON.parse(event.data);
      updateAssistantMessage((msg) => ({ ...msg, sources: newSources }));
    });

    es.addEventListener('chunk', (event: MessageEvent) => {
      const chunkText = event.data === 'None' ? '' : event.data;
      console.log('Chunk event:', chunkText);
      updateAssistantMessage((msg) => ({
        ...msg,
        content: msg.content + chunkText,
      }));
    });

    es.addEventListener('error', (event: MessageEvent) => {
      // Don't log an error if we're just closing
      if (get().isClosing) {
        return;
      }
      const errorData = event.data
        ? event.data
        : 'An undefined error occurred.';
      console.error('SSE stream error:', errorData);
      set({ error: errorData });
      updateAssistantMessage((msg) => ({
        ...msg,
        content: msg.content + `\n\n[Error] ${errorData}`,
      }));
    });

    es.addEventListener('done', (event: MessageEvent) => {
      console.log('Done event received:', event.data);
      // 'done' means the trace is complete
      updateAssistantMessage((msg) => ({ ...msg, traceStep: null }));

      // We MUST call stopStream to prevent auto-reconnect
      get().stopStream();
      console.log("Stream closed cleanly by 'done' event.");
    });

    es.onerror = (err) => {
      // If we are intentionally closing, just log it and return.
      if (get().isClosing) {
        console.log('Stream intentionally closed.');
        return;
      }

      // This is a REAL network error
      console.error('EventSource network failed:', err);
      // We must set isClosing here to prevent an infinite loop
      set({
        isLoading: false,
        error: 'Stream connection failed (Network).',
        isClosing: true,
      });
      es.close();
      set({ eventSource: null });
    };
  },

  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      if (!get().isClosing) {
        set({ isClosing: true }); // Mark as intentionally closing
      }
      es.close();
      console.log('SSE connection closed by client.');
      set({ eventSource: null, isLoading: false }); // We are no longer loading
    }
  },
}));
