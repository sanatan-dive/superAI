"use client";
import React, { useState, useEffect, useCallback } from "react";
import Hero from "@/components/Hero";
import Gemini from "@/components/Gemini";
import GPT from "@/components/GPT";
import Claude from "@/components/Claude";
import Perplexity from "@/components/Perplexity";

export default function Home() {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [message, setMessage] = useState<string>(''); // Message to be sent to AI models
  const [response, setResponse] = useState<string | null>(null); // Response from AI models
  const [isLoading, setIsLoading] = useState<boolean>(false); // Prevent re-submit while loading

  const openLeft = () => {
    setRightCollapsed(!rightCollapsed);
  };

  // Handle message submission
  const handleMessageSubmit = (inputValue: string) => {
    setMessage(inputValue); // Set the message from Hero component
    setResponse(null); // Clear previous response before sending a new one
    console.log("Message submitted:", inputValue);
  };

  // Handle the response after AI model processes the request
  const handleResponse = useCallback((responseData: string) => {
    setResponse(responseData); // Set the response from AI model
    setIsLoading(false); // Stop the loading state once we have the response
    console.log("Response received:", responseData);
  }, []);

  // Automatically submit the message to Gemini when message is updated
  useEffect(() => {
    if (isLoading || !message) return; // Prevent submitting if already loading or message is empty

    if (message) {
      setIsLoading(true); // Set loading state to true
      console.log("Submitting message to Gemini API:", message);

      // Call the Gemini API here (assuming Gemini component handles this)
    }
  }, [message, isLoading]); // This will trigger when the message changes

  return (
    <div
      className={`grid ${
        rightCollapsed ? "grid-cols-1" : "grid-cols-[70%,30%]"
      } bg-stone-950 min-h-screen transition-all duration-300`}
    >
      <div className="flex items-center justify-center">
        <Hero openLeft={openLeft} onSubmit={handleMessageSubmit} />
      </div>

      {!rightCollapsed && (
        <div className="flex flex-col gap-6 p-4 items-center text-white">
            <Perplexity />
          {/* <Claude message={message} setResponse={handleResponse} response={response} /> */}
          <GPT message={message} setResponse={handleResponse} response={response} />
          <Gemini message={message} setResponse={handleResponse} response={response} /> 
        </div>
      )}
    </div>
  );
}
