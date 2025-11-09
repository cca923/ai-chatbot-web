'use client';

import { create } from 'zustand';

import { API_URL } from '@/constants';
import {
  type AssistantMessage,
  type ChatMessage,
  type Source,
  type UserMessage,
} from '@/lib/types';

interface ChatMessagesState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  eventSource: EventSource | null;
  isClosing: boolean;
  updateMessage: (
    id: string,
    updater: (msg: AssistantMessage) => AssistantMessage
  ) => void;
  startStream: (query: string) => void;
  stopStream: () => void;
}

export const useChatStore = create<ChatMessagesState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  eventSource: null,
  isClosing: false,
  updateMessage: (id, updater) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id && msg.role === 'assistant'
          ? updater(msg as AssistantMessage)
          : msg
      ),
    }));
  },
  startStream: (query: string) => {
    // 1. Clear any previous errors and stop any existing stream
    if (get().eventSource) {
      console.warn('Stream already in progress. Stopping previous.');
      get().stopStream(); // Stop the old stream
    }
    // Reset state for the new stream
    set({ isLoading: true, error: null, isClosing: false });

    // 2. Add the User's message to the messages
    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
    };

    // 3. Add a new, empty Assistant message to the messages
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: AssistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      traceStep: 'Planning...',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
    }));

    // 4. Create and connect the EventSource
    const newUrl = `${API_URL}/api/chat/ask?query=${encodeURIComponent(query)}`;
    const es = new EventSource(newUrl);
    set({ eventSource: es });

    // 5. Define SSE event listeners
    es.onopen = () => {
      set({ isLoading: true });
    };

    es.addEventListener('trace', (event: MessageEvent) => {
      get().updateMessage(assistantMessageId, (msg) => ({
        ...msg,
        traceStep: event.data,
      }));
    });

    es.addEventListener('sources', (event: MessageEvent) => {
      try {
        const newSources: Source[] = JSON.parse(event.data);
        get().updateMessage(assistantMessageId, (msg) => ({
          ...msg,
          sources: newSources,
        }));
      } catch (e) {
        console.error('Failed to parse sources JSON:', e);
      }
    });

    es.addEventListener('chunk', (event: MessageEvent) => {
      // When the first chunk arrives, the "Reading" trace is done.
      const chunkText = event.data === 'None' ? '' : event.data;
      get().updateMessage(assistantMessageId, (msg) => ({
        ...msg,
        traceStep: null,
        content: msg.content + chunkText,
      }));
    });

    es.addEventListener('error', (event: MessageEvent) => {
      if (get().isClosing) return;

      const errorData = event.data || 'An undefined error occurred.';
      console.error('SSE stream error:', errorData);
      set({ error: errorData });

      get().updateMessage(assistantMessageId, (msg) => ({
        ...msg,
        content: msg.content + `\n\n[Error] ${errorData}`,
        traceStep: null,
      }));
    });

    es.addEventListener('done', () => {
      get().updateMessage(assistantMessageId, (msg) => ({
        ...msg,
        traceStep: null,
      }));
      get().stopStream(); // Prevent auto-reconnect
    });

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
      set({ eventSource: null, isLoading: false });
    }
  },
}));
