'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import ChatInput from './ui/Chatinput';
import Sidebar from '@/components/ui/sidebar';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface HeroProps {
  openLeft: () => void;
  onSubmit: (message: string) => void;
  onReset?: () => void;
  ultimateResponse?: string; // Ultimate AI response from Mistral
  isProcessing?: boolean; // Whether Mistral is processing
}

function Hero({ openLeft, onSubmit, ultimateResponse, isProcessing }: HeroProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to handle ultimate response
  useEffect(() => {
    if (ultimateResponse && !isProcessing) {
      // Remove any existing AI response loading state
      setIsLoading(false);
      
      // Add the ultimate AI response
      const aiResponse: Message = {
        id: (Date.now()).toString(),
        text: ultimateResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => {
        // Remove any existing AI responses and add the ultimate one
        const userMessages = prev.filter(msg => msg.isUser);
        return [...userMessages, aiResponse];
      });
    }
  }, [ultimateResponse, isProcessing]);

  // Effect to handle processing state
  useEffect(() => {
    if (isProcessing) {
      setIsLoading(true);
    }
  }, [isProcessing]);

  const handleToggle = () => {
    setRightCollapsed(!rightCollapsed);
    openLeft();
  };

  const handleFormSubmit = (inputValue: string) => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true); // Start loading state for AI response

    // Call the parent onSubmit
    onSubmit(inputValue);
  };

  const openSidebar = () => setLeftSidebarOpen(true);
  const closeSidebar = () => setLeftSidebarOpen(false);

  return (
    <div className="h-screen w-full p-4">
      {/* Sidebar Component */}
      <Sidebar leftSidebarOpen={leftSidebarOpen} closeSidebar={closeSidebar} />
      
      {/* Main Content */}
      <div className="relative h-full w-full flex flex-col border-stone-700 border rounded-xl bg-gradient-to-b from-stone-900 to-black text-white">
        {/* Left toggle */}
        <div className="hover:cursor-pointer hover:opacity-80 absolute m-4 top-0 left-0 z-10">
          <SidebarIcon className="w-6 h-6" onClick={openSidebar} />
        </div>
        
        {/* Right toggle */}
        <div className="absolute m-4 top-0 right-0">
          <button
            className="w-12 h-12 bg-stone-800 items-center justify-center flex border-stone-700 border rounded-md hover:bg-stone-700 transition-colors"
            onClick={handleToggle}
          >
            {rightCollapsed ? (
              <ArrowLeft className="w-5 h-5 text-white" />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Center Welcome Text - Fade out when messages exist */}
          <div className={`flex-1 flex items-center justify-center transition-opacity duration-500 ${
            messages.length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Welcome to SuperAI
              </h1>
              <p className="text-lg sm:text-xl text-gray-400">
                Your one-stop solution for all AI models.
              </p>
            </div>
          </div>
          
          {/* Messages Container */}
          {messages.length > 0 && (
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-5xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.isUser
                          ? 'bg-gradient-to-b from-stone-500 to-stone-600 text-white ml-auto'
                          : 'bg-stone-800 text-gray-100 mr-auto border border-stone-700'
                      }`}
                    >
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator for AI response */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-stone-800 border border-stone-700 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {isProcessing ? 'Creating ultimate AI response...' : 'AI is thinking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Input Box */}
        <div className="w-full max-w-5xl mx-auto px-4 pb-8">
          <ChatInput onSubmit={handleFormSubmit} />
        </div>
      </div>
    </div>
  );
}

export default Hero;