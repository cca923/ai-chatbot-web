'use client';

import { create } from 'zustand';

import { API_URL } from '@/constants';
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
      get().stopStream(); // Stop the old stream
    }
    // Reset state for the new stream
    set({ isLoading: true, error: null, isClosing: false });

    // 2. Add the User's message to the history
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
    };

    // 3. Add a new, empty Assistant message to the history
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
    const newUrl = `${API_URL}/api/chat/ask?query=${encodeURIComponent(query)}`;
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
      try {
        console.log('Sources event:', event.data);
        const newSources: Source[] = JSON.parse(event.data);
        updateAssistantMessage((msg) => ({ ...msg, sources: newSources }));
      } catch (e) {
        console.error('Failed to parse sources JSON:', e);
      }
    });

    es.addEventListener('chunk', (event: MessageEvent) => {
      // When the first chunk arrives, the "Reading" trace is done.
      updateAssistantMessage((msg) => ({ ...msg, traceStep: null }));

      const chunkText = event.data === 'None' ? '' : event.data;
      updateAssistantMessage((msg) => ({
        ...msg,
        content: msg.content + chunkText,
      }));
    });

    es.addEventListener('error', (event: MessageEvent) => {
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
        traceStep: null, // Stop trace on error
      }));
    });

    es.addEventListener('done', (event: MessageEvent) => {
      console.log('Done event received:', event.data);
      updateAssistantMessage((msg) => ({ ...msg, traceStep: null })); // Final trace clear
      get().stopStream(); // Prevent auto-reconnect
      console.log("Stream closed cleanly by 'done' event.");
    });

    // Handles NETWORK errors (e.g., server down, CORS)
    es.onerror = (err) => {
      if (get().isClosing) {
        console.log('Stream intentionally closed.');
        return;
      }

      console.error('EventSource network failed:', err);

      set({
        isLoading: false,
        error: 'Stream connection failed (Network).',
        isClosing: true, // Prevent infinite loops
      });
      es.close(); // Prevent auto-reconnect
      set({ eventSource: null });
    };
  },

  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      if (!get().isClosing) {
        set({ isClosing: true });
      }
      es.close();
      console.log('SSE connection closed by client.');
      set({ eventSource: null, isLoading: false });
    }
  },
}));
