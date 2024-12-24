'use client';

import { Mic, Paperclip, Globe, ArrowUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ChatInput({
  onSubmit,
  placeholder = "Enter your query here...",
  className
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    
    if (input.value.trim()) {
      onSubmit?.(input.value);
      input.value = '';
    }
  };

  return (
    <div className={cn("rounded-xl bg-neutral-900 p-4", className)}>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="message"
          placeholder={placeholder}
          className="bg-transparent border-none text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <hr className="my-4" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-lg"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>
          <button
            type="submit"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-lg"
          >
            <ArrowUp className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
}