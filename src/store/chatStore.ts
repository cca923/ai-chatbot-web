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

    // --- We will now listen to SPECIFIC events ---
    // 1. Listen for 'search' event
    es.addEventListener("search", (event: MessageEvent) => {
      console.log("Search event:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Search] ${event.data}`],
      }));
    });

    // 2. Listen for 'sources' event
    es.addEventListener("sources", (event: MessageEvent) => {
      console.log("Sources event:", event.data);
      // In D8, we'll save this to a new 'sources' state
      set((state) => ({
        messages: [...state.messages, `[Sources] ${event.data}`],
      }));
    });

    // 3. Listen for 'content' event
    es.addEventListener("content", (event: MessageEvent) => {
      console.log("Content event:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Content] ${event.data}`],
      }));
    });

    // 4. Listen for 'error' event
    es.addEventListener("error", (event: MessageEvent) => {
      console.error("SSE stream error:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Error] ${event.data}`],
      }));
      // We set the error state, but DON'T close the connection,
      // as the server might send more info.
      set({ error: event.data || "An error occurred in the stream." });
    });

    // 5. Listen for our custom 'done' event
    es.addEventListener("done", (event: MessageEvent) => {
      console.log("Done event received:", event.data);
      set((state) => ({
        messages: [...state.messages, `[Done] ${event.data}`],
      }));

      // We cleanly close the connection from the CLIENT side
      get().stopStream();
    });

    // This 'onerror' handles network-level failures
    es.onerror = (err) => {
      // If we are intentionally closing the stream, just return.
      if (get().isClosing) {
        return;
      }

      console.error("EventSource network failed:", err); // This now only logs real errors

      // Only set error if the stream wasn't closed cleanly
      if (get().eventSource) {
        set({ isLoading: false, error: "Stream connection failed (Network)." });
        es.close();
        set({ eventSource: null });
      }
    };
  },

  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      set({ isClosing: true });
      es.close();
      console.log("SSE connection closed by client.");
      set({ eventSource: null, isLoading: false });
    }
  },
}));
