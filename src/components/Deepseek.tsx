"use client";
import { animate } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface DeepSeekProps {
  message: string;
  onResponseChange?: (response: string) => void;
}
// Add this import at the top

// Replace the formatMarkdown function and the rendering section with this:

const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    // className="prose prose-sm prose-invert max-w-none"
    components={{
      // Custom styling for different elements
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


export default function DeepSeek({ message, onResponseChange }: DeepSeekProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (message.trim()) {
      setLoading(true);
      setResponse("");
      setShowMore(false); // Reset show more when new message comes
      const fetchData = async () => {
        try {
          const result = await fetch('/api/deepseek', {
            method: 'POST',
            body: JSON.stringify({ prompt: message }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data = await result.json();
          setResponse(data.result);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange(data.result);
        } catch (error) {
          console.error('Error fetching response:', error);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange("");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [message]);

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
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph contains bullet points or numbered lists
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
          <p key={index} className="mb-4 text-neutral-300 text-sm leading-relaxed">
            <MarkdownRenderer content={response} />
          </p>
        );
      }
    });
  };

  return (
    <Card className={showMore ? "max-w-2xl" : "max-w-md"}>
      {!showMore ? (
        <>
          <CardSkeletonContainer>
            <Skeleton />
          </CardSkeletonContainer>
          <CardTitle>DeepSeek</CardTitle>
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
                  Show More
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
            <CardTitle>DeepSeek Response</CardTitle>
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
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {response ? formatResponse(response) : "No response available"}
            </div>
          </div>
        </div>
      )}
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
      // @ts-expect-error
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        <Container className="circle-3">
          <DeepseekLogo className="h-8 w-8 rounded-full dark:text-white" />
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
    </div>
  );
};

export const CardSkeletonContainer = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
  showGradient?: boolean;
}) => {
  return (
    <div
      className={cn(
        "h-[6rem] md:h-[8rem] rounded-md z-40 overflow-hidden",
        className
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

export const DeepseekLogo = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/deepseek-color.svg"
      alt="deepseek"
      width={32}
      height={32}
      className={className}
    />
  );
};