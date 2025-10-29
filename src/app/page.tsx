"use client";

import { useChatStore } from "@/store/chatStore"; // Import our new store
import { useEffect } from "react";

export default function Home() {
  // Get state and actions from the store
  const { messages, isLoading, error, startStream, stopStream } =
    useChatStore();

  // Clean up the stream when the component unmounts
  useEffect(() => {
    // This is a React cleanup function.
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">D3: SSE Ping-Pong Test</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={startStream}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          Start Stream (Simplified URL)
        </button>
        <button
          onClick={stopStream}
          disabled={!isLoading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 disabled:bg-gray-400"
        >
          Stop Stream
        </button>
      </div>

      {/* Status Indicators */}
      {isLoading && (
        <div className="text-green-500 font-semibold">Stream is active...</div>
      )}
      {error && (
        <div className="text-red-500 font-semibold">Error: {error}</div>
      )}

      {/* Message Display Area */}
      <div className="mt-8 p-6 bg-gray-900 text-gray-100 rounded-lg w-full max-w-2xl h-96 overflow-y-auto font-mono">
        <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">
          SSE Message Log:
        </h2>
        {/* We map over the messages array from the store */}
        {messages.map((msg, index) => (
          <div key={index} className="text-sm">
            <span className="text-gray-500 mr-2">{`[${index}]:`}</span>
            <span className="text-green-400">{msg}</span>
          </div>
        ))}
        {/* Show a placeholder if no messages yet */}
        {messages.length === 0 && !isLoading && (
          <div className="text-gray-500">
            Click &quot;Start Stream&quot; to connect...
          </div>
        )}
      </div>
    </main>
  );
}
