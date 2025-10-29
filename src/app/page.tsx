"use client";
import { useState } from "react";

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string>(
    "No request sent yet."
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePing = async () => {
    setIsLoading(true);
    setApiResponse("Waiting for response...");

    try {
      const response = await fetch("http://localhost:8000/v1/ping");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(JSON.stringify(data));
    } catch (error: any) {
      setApiResponse(`Error: ${error.message}`);
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">D1-D2 Ping Test</h1>
      <p className="text-lg mb-4">
        Click the button to ping the FastAPI backend.
      </p>

      <button
        onClick={handlePing}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Pinging..." : "Ping Backend (/v1/ping)"}
      </button>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800">API Response:</h2>
        <pre className="text-gray-600 mt-2 whitespace-pre-wrap break-all">
          {apiResponse}
        </pre>
      </div>
    </main>
  );
}
