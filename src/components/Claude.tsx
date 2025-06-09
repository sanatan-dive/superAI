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
      // Store in localStorage
      localStorage.setItem('claude_api_key', apiKey.trim());
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
              <ClaudeLogo className="h-8 w-8 rounded-full dark:text-white" />
            </Container>
          </div>
        </div>
      </CardSkeletonContainer>
      
      <CardTitle>Enter Your Claude API Key</CardTitle>
      
      <div className="space-y-3 mt-3">
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="sk-ant-api03-..."
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

interface ClaudeProps {
  message: string;
  onResponseChange?: (response: string) => void;
}

export default function Claude({ message, onResponseChange }: ClaudeProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Check for existing API key on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('claude_api_key');
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
    localStorage.removeItem('claude_api_key');
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
          const result = await fetch('/api/claude', {
            method: 'POST',
            body: JSON.stringify({ 
              prompt: message,
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
          const responseText = data.content?.[0]?.text || data.result || 'No response received';
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
              <span>Claude</span>
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
            <CardTitle>Claude Response</CardTitle>
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
      // @ts-ignore
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        <Container className="circle-3">
          <ClaudeLogo className="h-8 w-8 rounded-full dark:text-white" />
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

export const ClaudeLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
      viewBox="0 0 512 512"
      className={className}
    >
      <rect fill="#CC9B7A" width="512" height="512" rx="104.187" ry="105.042" />
      <path
        fill="#1F1F1E"
        fillRule="nonzero"
        d="M318.663 149.787h-43.368l78.952 212.423 43.368.004-78.952-212.427zm-125.326 0l-78.952 212.427h44.255l15.932-44.608 82.846-.004 16.107 44.612h44.255l-79.126-212.427h-45.317zm-4.251 128.341l26.91-74.701 27.083 74.701h-53.993z"
      />
    </svg>
  );
};