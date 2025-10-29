import { create } from "zustand";

interface ChatState {
  messages: string[];
  isLoading: boolean;
  error: string | null;
  eventSource: EventSource | null;
  isClosing: boolean;
  startStream: (query: string) => void;
  stopStream: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  eventSource: null,
  isClosing: false,

  startStream: (query: string) => {
    if (get().eventSource) {
      console.warn("Stream already in progress.");
      return;
    }

    if (!query || query.trim() === "") {
      set({ error: "Please enter a question." });
      return;
    }

    // 1. Reset all states for the new stream
    set({ isLoading: true, error: null, messages: [], isClosing: false });
    const newUrl = `http://localhost:8000/api/chat/ask?query=${encodeURIComponent(
      query
    )}`;
    console.log(`Connecting to SSE at: ${newUrl}`);

    const es = new EventSource(newUrl);
    set({ eventSource: es });

    es.onopen = () => {
      console.log("SSE connection opened.");
      set({ isLoading: true });
    };

    // 1. Listen for 'trace' event
    es.addEventListener("trace", (event: MessageEvent) => {
      console.log("Trace event:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Trace] ${event.data}`],
      }));
    });

    // 2. Listen for 'chunk' event (for D8 AnswerCard)
    es.addEventListener("chunk", (event: MessageEvent) => {
      // We use a small trick to append chars to the last message
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.startsWith("[Chunk] ")) {
          // If the last message starts with [Chunk], append text
          const updatedMessage = lastMessage + event.data;
          return {
            messages: [...state.messages.slice(0, -1), updatedMessage],
          };
        } else {
          // Otherwise, start a new [Chunk] message
          return {
            messages: [...state.messages, `[Chunk] ${event.data}`],
          };
        }
      });
    });

    // 3. Listen for 'error' event (errors actively sent by backend logic)
    es.addEventListener("error", (event: MessageEvent) => {
      // If we are already in the process of closing, ignore this event.
      // This prevents the 'undefined' error message.
      if (get().isClosing) {
        console.log("Ignoring custom error event during close.");
        return;
      }

      // Check if data exists
      const errorData = event.data || "An undefined error occurred.";
      console.error("SSE stream error:", errorData);
      set((state) => ({
        messages: [...state.messages, `[Error] ${errorData}`],
      }));
      set({ error: errorData });
    });

    // 4. Listen for 'done' event (stream finished successfully)
    es.addEventListener("done", (event: MessageEvent) => {
      console.log("Done event received:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Done] ${event.data}`],
      }));

      // We no longer call stopStream() here.
      // We just set the flag and wait for the "server" to hang up.
      set({ isLoading: false, isClosing: true });
    });

    // 5. 'onerror' (handles network-level errors, or a "clean" close)
    es.onerror = (err) => {
      const { isClosing, eventSource } = get(); // Get state once

      // This block handles the "clean" close from the server.
      if (isClosing) {
        console.log("Stream closed cleanly by server.");
        if (eventSource) {
          eventSource.close(); // *Explicitly* close to prevent reconnect
        }
        set({ eventSource: null, isClosing: false }); // Final cleanup
        return;
      }

      // If it's an "unexpected" network error
      console.error("EventSource network failed:", err);
      if (eventSource) {
        set({ isLoading: false, error: "Stream connection failed (Network)." });
        eventSource.close(); // Force close
        set({ eventSource: null });
      }
    };
  },

  // 'stopStream' is now only for the "Stop" button
  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      set({ isClosing: true }); // *First* set the flag
      es.close(); // *Then* close the connection
      console.log("SSE connection closed by user button.");
      set({ eventSource: null, isLoading: false });
    }
  },
}));
