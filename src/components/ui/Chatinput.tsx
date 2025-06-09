'use client';
import {  ArrowUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ChatInput({
  onSubmit,
  placeholder = "Enter your query here...",
  className
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("rounded-xl bg-neutral-900 p-4 border border-neutral-800", className)}>
      {/* User Button Section */}
      <div className="flex justify-end mb-3">
        <UserButton />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-3">
          {/* Input Container */}
          <div className="flex-1 relative">
            <Input
              type="text"
              name="message"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-4 py-3 text-base"
              autoComplete="off"
            />
            {/* Divider line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
           

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                inputValue.trim()
                  ? "text-white  hover:bg-stone-700 shadow-lg"
                  : "text-zinc-500 bg-zinc-800 cursor-not-allowed"
              )}
              title="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}