"use client";
import { animate } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
          <code className="bg-neutral-700 px-1 py-0.5 rounded text-xs text-neutral-200 font-mono">
            {children}
          </code>
        ) : (
          <code className="block bg-neutral-800 p-3 rounded-lg text-sm text-neutral-200 font-mono overflow-x-auto">
            {children}
          </code>
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

const ApiKeyInput = ({ onApiKeySave }: { onApiKeySave: (apiKey: string) => void }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      // Note: In a real app, you'd use localStorage here
      localStorage.setItem('openai_api_key', apiKey.trim());
      onApiKeySave(apiKey.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card className="max-w-md">
      <CardSkeletonContainer>
        <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
          <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
            <Container>
              <OpenAILogo className="h-8 w-8 dark:text-white" />
            </Container>
          </div>
        </div>
      </CardSkeletonContainer>
      
      <CardTitle>Enter Your OpenAI API Key</CardTitle>
      
      <div className="space-y-3 mt-3">
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-neutral-200 text-sm focus:outline-none focus:border-blue-400 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm py-2 px-4 rounded-md transition-colors"
        >
          Save API Key
        </button>
        
        <div className="text-xs absolute top-0 text-neutral-400 space-y-1">
          <p>🔒 Your API key is stored locally in your browser only.</p>
        </div>
      </div>
    </Card>
  );
};

interface GPTProps {
  message: string;
  onResponseChange?: (response: string) => void;
}

export default function GPT({ message, onResponseChange }: GPTProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Check for existing API key on component mount
  useEffect(() => {
    // Note: In a real app, you'd use localStorage here
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Handle API key save
  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  // Handle clearing API key
  const handleClearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey(null);
    setResponse(null);
  };

  useEffect(() => {
    if (message.trim() && apiKey) {
      setLoading(true);
      setResponse("");
      setShowMore(false);
      
      const fetchData = async () => {
        try {
          const result = await fetch('/api/gpt', {
            method: 'POST',
            body: JSON.stringify({ 
              content: message,
              apiKey: apiKey // Send API key from frontend
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!result.ok) {
            const errorData = await result.json();
            throw new Error(errorData.error || 'Failed to get response');
          }
          
          const data = await result.json();
          const responseText = data.result || 'No response received';
          setResponse(responseText);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange(responseText);
        } catch (error) {
          console.error('Error fetching response:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setResponse(`Error: ${errorMessage}`);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange("");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [message, apiKey, onResponseChange]);

  const handleCopy = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const getFirstLine = (text: string) => {
    if (!text) return "";
    const firstSentence = text.split(/[.?]/)[0];
    return firstSentence.length > 100 ? text.substring(0, 100) + "..." : firstSentence + ".";
  };

  const formatResponse = (text: string) => {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((paragraph, index) => {
      if (paragraph.includes('\n-') || paragraph.includes('\n•') || /\n\d+\./.test(paragraph)) {
        const lines = paragraph.split('\n');
        const title = lines[0];
        const items = lines.slice(1).filter(line => line.trim());
        
        return (
          <div key={index} className="mb-4">
            {title && <p className="font-medium mb-2 text-neutral-200">{title}</p>}
            <ul className="space-y-1 ml-4">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-neutral-300 text-sm leading-relaxed">
                  {item.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        return (
          <div key={index} className="mb-4">
            <MarkdownRenderer content={paragraph} />
          </div>
        );
      }
    });
  };

  // Show API key input if no API key is saved
  if (!apiKey) {
    return <ApiKeyInput onApiKeySave={handleApiKeySave} />;
  }

  return (
    <Card className={showMore ? "max-w-2xl" : "max-w-md"}>
      {!showMore ? (
        <>
          <CardSkeletonContainer>
            <Skeleton />
          </CardSkeletonContainer>
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>ChatGPT</span>
              <button
                onClick={handleClearApiKey}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Change API Key
              </button>
            </div>
          </CardTitle>
          <CardDescription>
            {loading ? (
              "Generating response..."
            ) : response ? (
              <div className="space-y-2">
                <span>{getFirstLine(response)}</span>
                <button
                  onClick={() => setShowMore(true)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium underline block"
                >
                  Show more
                </button>
              </div>
            ) : (
              "Waiting for response..."
            )}
          </CardDescription>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>ChatGPT Response</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1 rounded border border-neutral-600 hover:border-neutral-500"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setShowMore(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1 rounded border border-neutral-600 hover:border-neutral-500"
              >
                Collapse
              </button>
              <button
                onClick={handleClearApiKey}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-600 hover:border-red-500"
              >
                Change Key
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {response ? formatResponse(response) : "No response available"}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </Card>
  );
}

const Skeleton = () => {
  const scale = [1, 1.1, 1];
  const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
  const sequence = [
    [
      ".circle-1",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-2",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-3",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-4",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
  ];

  useEffect(() => {
    animate(sequence, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        <Container className="circle-3">
          <OpenAILogo className="h-8 w-8 dark:text-white" />
        </Container>
      </div>
      <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10"></div>
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "max-w-md w-full mx-auto p-3 rounded-md border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gradient-to-b from-stone-800 to-stone-950 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};
  
export const CardSkeletonContainer = ({
  className,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showGradient = true,
}: {
  className?: string;
  children: React.ReactNode;
  showGradient?: boolean;
}) => {
  return (
    <div
      className={cn(
        "h-[6rem] md:h-[8rem] rounded-md z-40 overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};

const Container = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        `h-10 w-10 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
    shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
    `,
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-neutral-200 dark:text-white py-1",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        "text-xs font-normal text-neutral-300 dark:text-neutral-400 max-w-md",
        className
      )}
    >
      {children}
    </p>
  );
};

export const OpenAILogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Zm-10.61 14.71c-1.412 0-2.505-.428-3.46-1.215.043-.023.119-.064.168-.094l5.65-3.22a.911.911 0 0 0 .464-.793v-7.86l2.389 1.36a.087.087 0 0 1 .046.065v6.508c0 2.952-2.491 5.248-5.257 5.248ZM4.062 21.354a5.17 5.17 0 0 1-.635-3.516c.042.025.115.07.168.1l5.65 3.22a.928.928 0 0 0 .928 0l6.898-3.93v2.72a.083.083 0 0 1-.034.072l-5.711 3.255a5.386 5.386 0 0 1-4.035.522 5.315 5.315 0 0 1-3.23-2.443ZM2.573 9.184a5.283 5.283 0 0 1 2.768-2.301V13.515a.895.895 0 0 0 .464.793l6.897 3.93-2.388 1.36a.087.087 0 0 1-.08.008L4.52 16.349a5.262 5.262 0 0 1-2.475-3.185 5.192 5.192 0 0 1 .527-3.98Zm19.623 4.506-6.898-3.93 2.388-1.36a.087.087 0 0 1 .08-.008l5.713 3.255a5.28 5.28 0 0 1 2.054 2.118 5.19 5.19 0 0 1-.488 5.608 5.314 5.314 0 0 1-2.39 1.742v-6.633a.896.896 0 0 0-.459-.792Zm2.377-3.533a7.973 7.973 0 0 0-.168-.099l-5.65-3.22a.93.93 0 0 0-.928 0l-6.898 3.93V8.046a.083.083 0 0 1 .034-.072l5.712-3.251a5.375 5.375 0 0 1 5.698.241 5.262 5.262 0 0 1 1.865 2.28c.39.92.506 1.93.335 2.913ZM9.631 15.009l-2.39-1.36a.083.083 0 0 1-.046-.065V7.075c.001-.997.29-1.973.832-2.814a5.297 5.297 0 0 1 2.231-1.935 5.382 5.382 0 0 1 5.659.72 4.89 4.89 0 0 0-.168.093l-5.65 3.22a.913.913 0 0 0-.465.793l-.003 7.857Zm1.297-2.76L14 10.5l3.072 1.75v3.5L14 17.499l-3.072-1.75v-3.5Z"
        fill="currentColor"
      ></path>
    </svg>
  );
};