'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sidebar as SidebarIcon,
  User,
  Bot,
  Copy,
  Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInput from './ui/Chatinput';
import Sidebar from '@/components/ui/sidebar';
import { chatApi, saveUserMessageAndResponses } from '@/lib/api-client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

interface HeroProps {
  openLeft: () => void;
  onSubmit: (message: string) => void;
  onReset?: () => void;
  ultimateResponse?: string;
  isProcessing?: boolean;
  userId: string;
  conversationId: string;
  aiResponses?: { modelName: string; output: string }[];
}

// Copy Button Component
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-md hover:bg-stone-700 transition-colors text-gray-400 hover:text-gray-200"
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

// Markdown Renderer Component
const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <h1 className="text-xl font-bold text-neutral-100 mb-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg font-semibold text-neutral-200 mb-2">{children}</h2>,
      h3: ({ children }) => <h3 className="text-md font-medium text-neutral-200 mb-2">{children}</h3>,
      p: ({ children }) => <p className="mb-4 text-neutral-300 text-sm leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc ml-6 space-y-1 mb-4">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ml-6 space-y-1 mb-4">{children}</ol>,
      li: ({ children }) => <li className="text-neutral-300 text-sm leading-relaxed">{children}</li>,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      code: ({ inline, children }) =>
        inline ? (
          <code className="bg-neutral-700 px-2 py-1 rounded text-xs text-neutral-200 font-mono">
            {children}
          </code>
        ) : (
          <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-neutral-200 font-mono overflow-x-auto mb-4">
            <code>{children}</code>
          </pre>
        ),
      pre: ({ children }) => <div className="mb-4">{children}</div>,
      strong: ({ children }) => <strong className="font-semibold text-neutral-200">{children}</strong>,
      em: ({ children }) => <em className="italic text-neutral-200">{children}</em>,
      a: ({ href, children }) => (
        <a
          href={href}
          className="text-blue-400 hover:text-blue-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-neutral-600 pl-4 my-4 text-neutral-400 italic">
          {children}
        </blockquote>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

// Typing Animation Component
const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-4">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
    <span className="text-sm text-gray-400">SuperAI is thinking...</span>
  </div>
);

function Hero({ 
  openLeft, 
  onSubmit, 
  ultimateResponse, 
  userId, 
  conversationId,
  aiResponses 
}: HeroProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentLoadingMessageId, setCurrentLoadingMessageId] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const result = await chatApi.getPrompts(conversationId, userId);
        if (result.success && result.data) {
          const loadedMessages: Message[] = [];
          
          result.data.forEach(prompt => {
            // Add user message
            loadedMessages.push({
              id: `user-${prompt.id}`,
              text: prompt.content,
              isUser: true,
              timestamp: new Date(prompt.createdAt)
            });

            // Add AI response
            const responseText = prompt.finalAnswer || 
              (prompt.responses.length > 0 ? prompt.responses[prompt.responses.length - 1].output : '');
            
            if (responseText) {
              loadedMessages.push({
                id: `ai-${prompt.id}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(prompt.createdAt)
              });
            }
          });

          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    if (userId && conversationId) {
      loadMessages();
    }
  }, [userId, conversationId]);

  // Handle ultimate response
  useEffect(() => {
    if (ultimateResponse && currentLoadingMessageId && pendingUserMessage) {
      // Replace loading message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === currentLoadingMessageId 
            ? { ...msg, text: ultimateResponse, isLoading: false }
            : msg
        )
      );

      // Save to database
      const saveData = async () => {
        try {
          const responses = aiResponses || [];
          const ultimateResponseData = {
            modelName: 'Ultimate AI',
            output: ultimateResponse
          };
          
          if (!responses.some(r => r.output === ultimateResponse)) {
            responses.push(ultimateResponseData);
          }

          await saveUserMessageAndResponses(
            userId,
            conversationId,
            pendingUserMessage,
            responses,
            ultimateResponse
          );
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      };

      saveData();
      
      // Clear pending states
      setCurrentLoadingMessageId(null);
      setPendingUserMessage('');
    }
  }, [ultimateResponse, currentLoadingMessageId, pendingUserMessage, aiResponses, userId, conversationId]);

  const handleToggle = () => {
    setRightCollapsed(!rightCollapsed);
    openLeft();
  };

  const handleFormSubmit = (inputValue: string) => {
    if (!inputValue.trim()) return;

    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    // Store pending user message
    setPendingUserMessage(inputValue);

    // Add user message and loading AI message
    const userMessage: Message = {
      id: userMessageId,
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setCurrentLoadingMessageId(aiMessageId);

    // Call parent onSubmit
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-700">
          <div className="flex items-center space-x-4">
            <button
              className="hover:cursor-pointer hover:opacity-80 p-2 hover:bg-stone-800 rounded-md transition-colors"
              onClick={openSidebar}
            >
              <SidebarIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">SuperAI Chat</h2>
          </div>
          
          <button
            className="w-10 h-10 bg-stone-800 items-center justify-center flex border-stone-700 border rounded-md hover:bg-stone-700 transition-colors"
            onClick={handleToggle}
          >
            {rightCollapsed ? (
              <ArrowLeft className="w-4 h-4 text-white" />
            ) : (
              <ArrowRight className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Welcome Screen - Show only when no messages */}
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 ">
                  Welcome to SuperAI
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 mb-8">
                  Your one stop solution for all AI model.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700">
                    <h3 className="font-semibold text-white mb-2">Ask Questions</h3>
                    <p className="text-sm text-gray-400">Get answers on any topic with AI-powered insights</p>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700">
                    <h3 className="font-semibold text-white mb-2"> Code & Debug</h3>
                    <p className="text-sm text-gray-400">Write, review, and debug code in multiple languages</p>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700">
                    <h3 className="font-semibold text-white mb-2"> Create Content</h3>
                    <p className="text-sm text-gray-400">Generate text, summaries, and creative content</p>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700">
                    <h3 className="font-semibold text-white mb-2"> Analyze Data</h3>
                    <p className="text-sm text-gray-400">Process and analyze information intelligently</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Messages Container */
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`group relative ${
                      message.isUser 
                        ? 'bg-transparent' 
                        : index % 2 === 1 ? 'bg-stone-800/30' : 'bg-transparent'
                    } border-b border-stone-800/50`}
                  >
                    <div className="flex items-start space-x-4 p-6">
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.isUser 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {message.isUser ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-sm text-gray-300">
                            {message.isUser ? 'You' : 'SuperAI'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {message.isLoading ? (
                          <TypingIndicator />
                        ) : (
                          <div className="prose prose-invert max-w-none">
                            {message.isUser ? (
                              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {message.text}
                              </p>
                            ) : (
                              <MarkdownRenderer content={message.text} />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!message.isUser && !message.isLoading && (
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyButton content={message.text} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
        
        {/* Input Box */}
        <div className="border-t border-stone-700 p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput 
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;