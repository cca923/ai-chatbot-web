"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";

export default function Home() {
  const { messages, isLoading, error, startStream, stopStream } =
    useChatStore();
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && query.trim() !== "") {
      startStream(query);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 md:p-24">
      <h1 className="text-4xl font-bold mb-8">D4: Real Search & Scrape</h1>

      <div className="flex w-full max-w-2xl mb-8 gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={() => startStream(query)}
          disabled={isLoading || query.trim() === ""}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
        <button
          onClick={stopStream}
          disabled={!isLoading}
          className="px-5 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 disabled:bg-gray-400"
        >
          Stop
        </button>
      </div>

      {error && (
        <div className="text-red-500 font-semibold mb-4">Error: {error}</div>
      )}

      <div className="mt-4 p-6 bg-gray-900 text-gray-100 rounded-lg w-full max-w-2xl h-96 overflow-y-auto font-mono">
        <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">
          SSE Message Log:
        </h2>

        {messages.map((msg, index) => (
          <div key={index} className="text-sm mb-2">
            <span className="text-gray-500 mr-2">{`[${index}]:`}</span>
            <pre className="text-green-400 whitespace-pre-wrap break-all">
              {msg}
            </pre>
          </div>
        ))}

        {messages.length === 0 && !isLoading && (
          <div className="text-gray-500">
            Enter a question and click Ask to start...
          </div>
        )}
        {isLoading && messages.length === 0 && (
          <div className="text-gray-500">Connecting to stream...</div>
        )}
      </div>
    </main>
  );
}
