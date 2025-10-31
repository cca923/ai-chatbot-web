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

    // 2. Listen for 'sources' event
    // This event is sent *before* the 'chunk' events
    es.addEventListener("sources", (event: MessageEvent) => {
      console.log("Sources event:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Sources] ${event.data}`],
      }));
    });

    // 3. Listen for 'chunk' event
    es.addEventListener("chunk", (event: MessageEvent) => {
      // Append text to the last message
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.startsWith("[Answer] ")) {
          const updatedMessage = lastMessage + event.data;
          return {
            messages: [...state.messages.slice(0, -1), updatedMessage],
          };
        } else {
          // Start a new [Answer] message
          return {
            messages: [...state.messages, `[Answer] ${event.data}`],
          };
        }
      });
    });

    // 4. Listen for 'error' event
    es.addEventListener("error", (event: MessageEvent) => {
      if (get().isClosing) {
        console.log("Ignoring custom error event during close.");
        return;
      }
      const errorData = event.data || "An undefined error occurred.";
      console.error("SSE stream error:", errorData);
      set((state) => ({
        messages: [...state.messages, `[Error] ${errorData}`],
      }));
      set({ error: errorData });
    });

    // 5. Listen for 'done' event
    es.addEventListener("done", (event: MessageEvent) => {
      console.log("Done event received:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Done] ${event.data}`],
      }));
      set({ isLoading: false, isClosing: true });
    });

    // 6. 'onerror' (handles network-level errors)
    es.onerror = (err) => {
      const { isClosing, eventSource } = get();

      if (isClosing) {
        console.log("Stream closed cleanly by server.");
        if (eventSource) {
          eventSource.close();
        }
        set({ eventSource: null, isClosing: false });
        return;
      }

      console.error("EventSource network failed:", err);
      if (eventSource) {
        set({ isLoading: false, error: "Stream connection failed (Network)." });
        eventSource.close();
        set({ eventSource: null });
      }
    };
  },

  // 'stopStream' is for the user button
  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      set({ isClosing: true });
      es.close();
      console.log("SSE connection closed by user button.");
      set({ eventSource: null, isLoading: false });
    }
  },
}));
