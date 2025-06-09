"use client";
import React, { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Gemini from "@/components/Gemini";
import DeepSeek from "@/components/Deepseek";
import { useUser, useClerk } from "@clerk/nextjs";
import GPT from "@/components/GPT";
import Claude from "@/components/Claude";


export default function Home() {
  const [rightCollapsed, setRightCollapsed] = useState(true); // Start with right panel closed
  const [message, setMessage] = useState<string>(''); // Message to be sent to AI models
  const [hasSubmittedMessage, setHasSubmittedMessage] = useState<boolean>(false); // Track if any message has been submitted
  // const [isLoading, setIsLoading] = useState<boolean>(false); // Prevent re-submit while loading
  
  // Changed to array to store responses from multiple AI models
  const [responses, setResponses] = useState<{model: string, response: string}[]>([]);
  const [mistralSummary, setMistralSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [ultimateResponse, setUltimateResponse] = useState<string>(''); // Store the ultimate AI response
  console.log("responses", responses);
  
  const { user } = useUser();
  const { openSignIn } = useClerk();

  // Auto-trigger Mistral API when both responses are received
  useEffect(() => {
    const hasDeepSeek = responses.some(r => r.model === 'deepseek');
    const hasGemini = responses.some(r => r.model === 'gemini');
    
    if (hasDeepSeek && hasGemini && !isSummarizing && !mistralSummary) {
      handleSummarizeWithMistral();
    }
  }, [responses, isSummarizing, mistralSummary]);

  // Toggle right panel manually
  const toggleRightPanel = () => {
    setRightCollapsed(!rightCollapsed);
  };

  // Handle message submission
  const handleMessageSubmit = (inputValue: string) => {
    if (!inputValue.trim()) return; // Don't submit empty messages
    if (!user) {
      openSignIn(); // Open sign-in dialog if user is not signed in
      return;
    }

    setMessage(inputValue);
    setHasSubmittedMessage(true); // Mark that a message has been submitted
    setRightCollapsed(false); // Open right panel when message is submitted
    // Clear previous responses when new message is submitted
    setResponses([]);
    setMistralSummary('');
    setUltimateResponse('');
    console.log("Message submitted:", inputValue);
  };

  // Reset function to clear everything and close right panel
  const handleReset = () => {
    setMessage('');
    setHasSubmittedMessage(false);
    setRightCollapsed(true);
    setResponses([]); // Clear responses array
    setMistralSummary(''); // Clear Mistral summary
    setUltimateResponse(''); // Clear ultimate response
    setIsSummarizing(false);
  };

  // Handler for DeepSeek responses
  const handleDeepSeekResponse = (response: string) => {
    setResponses(prev => {
      // Remove any existing DeepSeek response and add the new one
      const filtered = prev.filter(r => r.model !== 'deepseek');
      return [...filtered, { model: 'deepseek', response }];
    });
  };

  // Handler for Gemini responses
  const handleGeminiResponse = (response: string) => {
    setResponses(prev => {
      // Remove any existing Gemini response and add the new one
      const filtered = prev.filter(r => r.model !== 'gemini');
      return [...filtered, { model: 'gemini', response }];
    });
  };

  // Handler for GPT responses
  const handleGPTResponse = (response: string) => {
    setResponses(prev => {
      // Remove any existing GPT response and add the new one
      const filtered = prev.filter(r => r.model !== 'gpt');
      return [...filtered, { model: 'gpt', response }];
    });
  };

  // Handler for Claude responses
  const handleClaudeResponse = (response: string) => {
    setResponses(prev => {
      // Remove any existing Claude response and add the new one
      const filtered = prev.filter(r => r.model !== 'claude');
      return [...filtered, { model: 'claude', response }];
    });
  };

  // Function to call Mistral API for summarization
  const handleSummarizeWithMistral = async () => {
    if (responses.length === 0) {
      console.log('No responses to summarize');
      return;
    }

    setIsSummarizing(true);
    setMistralSummary('');

    try {
      const response = await fetch('/api/mistral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          responses: responses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get summary');
      }

      const data = await response.json();
      setMistralSummary(data.summary);
      setUltimateResponse(data.summary); // Set the ultimate response for Hero
      console.log('Mistral summary received:', data);

    } catch (error) {
      console.error('Error calling Mistral API:', error);
      const errorMessage = `Error: ${error.message}`;
      setMistralSummary(errorMessage);
      setUltimateResponse(errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  };

 

  return (
    <div className="bg-stone-950 max-h-screen overflow-hidden">
      <div
        className={`grid transition-all relative duration-500 ease-in-out min-h-screen ${
          rightCollapsed ? "grid-cols-1" : "grid-cols-[70%,30%]"
        }`}
      >
        {/* Left Panel - Hero Component */}
        <div 
          className={`flex items-center justify-center transition-all duration-500 ease-in-out overflow-hidden ${
            rightCollapsed ? 'translate-x-0' : 'translate-x-0'
          }`}
        >
          <Hero 
            openLeft={toggleRightPanel}
            onSubmit={handleMessageSubmit}
            onReset={handleReset}
            ultimateResponse={ultimateResponse} // Pass the ultimate response
            isProcessing={isSummarizing} // Pass processing state
            userId={user?.id || ""} conversationId={""}          />
        </div>

        {/* Right Panel - AI Responses */}
        <div 
          className={`
            relative top-0 right-0 max-h-screen bg-stone-950 z-40
            transition-all duration-500 ease-in-out overflow-scroll
            ${rightCollapsed 
              ? 'w-0 opacity-0 translate-x-full' 
              : 'w-[30vw] opacity-100 translate-x-0'
            }
            ${hasSubmittedMessage ? 'pointer-events-auto' : ''}
          `}
        >
          {/* Panel Content */}
          <div 
            className={`
              h-full flex flex-col gap-6 p-4 items-center text-white
              transition-all duration-300 delay-200 ease-in-out
              ${rightCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}
          >
           

            {/* AI Components with staggered animations */}
            <div 
              className={`
                w-full flex flex-col gap-5
                transition-all duration-300 delay-400 ease-in-out
                ${rightCollapsed ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
              `}
            >
               <div 
                className={`
                  transition-all duration-300 delay-500 ease-in-out
                  ${rightCollapsed ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
                `}
              >
                <DeepSeek message={message} onResponseChange={handleDeepSeekResponse}/>
              </div>

               <div 
                className={`
                  transition-all duration-300 delay-500 ease-in-out
                  ${rightCollapsed ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
                `}
              >
                <Gemini message={message} onResponseChange={handleGeminiResponse} />
              </div>
            
              
               <div 
                className={`
                  transition-all duration-300 delay-500 ease-in-out 
                  ${rightCollapsed ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
                `}
              >
                <Claude message={message} onResponseChange={handleClaudeResponse} />
              </div> 
              
              <div 
                className={`
                  transition-all duration-300 delay-500 ease-in-out 
                  ${rightCollapsed ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
                `}
              >
                <GPT message={message} onResponseChange={handleGPTResponse} />
              </div>
             
            </div>

            {/* Mistral Processing Status */}
            {isSummarizing && (
              <div className="w-full mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-blue-300 text-sm">Processing ultimate response...</span>
                </div>
              </div>
            )}

            {/* Show Mistral Summary Status */}
            {mistralSummary && (
              <div className="w-full mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="text-green-300 text-sm">
                  ✓ Ultimate response generated and sent to chat
                </div>
              </div>
            )}

           
          </div>

          {/* Panel Background Overlay */}
          <div 
            className={`
              absolute inset-0 bg-gradient-to-l from-stone-900/50 to-transparent -z-10
              transition-opacity duration-500 ease-in-out
              ${rightCollapsed ? 'opacity-0' : 'opacity-100'}
            `}
          />
        </div>

        {/* Backdrop blur effect when panel is open */}
        {!rightCollapsed && hasSubmittedMessage && (
          <div 
            className="fixed inset-0 bg-black/10  z-30 transition-all duration-500 ease-in-out"
            onClick={toggleRightPanel}
          />
        )}
      </div>

      {/* Show a hint when no message has been submitted */}
      {rightCollapsed && !hasSubmittedMessage && (
        <div 
          className={`
            fixed bottom-4 right-4 text-stone-400 text-sm
            transition-all duration-300 ease-in-out
            ${rightCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
          `}
        >
          Submit a message to see AI responses →
        </div>
      )}
    </div>
  );
}