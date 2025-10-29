import { create } from "zustand";

// Define the shape of the store's state
interface ChatState {
  messages: string[]; // An array to hold all incoming SSE messages
  isLoading: boolean;
  error: string | null;
  eventSource: EventSource | null; // Hold the EventSource instance
  startStream: () => void;
  stopStream: () => void;
}

// Create the store
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  eventSource: null,

  startStream: () => {
    // Prevent multiple streams
    if (get().eventSource) {
      console.warn("Stream already in progress.");
      return;
    }

    set({ isLoading: true, error: null, messages: [] });

    const newUrl = "http://localhost:8000/api/chat/ask";
    console.log(`Connecting to SSE at: ${newUrl}`);

    const es = new EventSource(newUrl);
    set({ eventSource: es });

    // Handle 'open' event
    es.onopen = () => {
      console.log("SSE connection opened.");
      set({ isLoading: true });
    };

    // Handle 'message' event
    es.onmessage = (event) => {
      // Add the new message to the existing array in the state
      const newMessage = event.data;
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    };

    // Handle 'error' event
    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      set({ isLoading: false, error: "Stream connection failed." });
      es.close(); // Close the connection on error
      set({ eventSource: null });
    };
  },

  stopStream: () => {
    const es = get().eventSource;
    if (es) {
      es.close(); // Manually close the connection
      console.log("SSE connection closed by user.");
      set({ eventSource: null, isLoading: false });
    }
  },
}));
