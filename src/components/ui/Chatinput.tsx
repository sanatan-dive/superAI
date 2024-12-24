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
      <form onSubmit={handleSubmit} className="">
        <Input
          type="text"
          name="message"
          placeholder={placeholder}
          className="bg-transparent border-none text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <hr />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Paperclip className="h-7 w-7" /> 
          </Button>
          <div className="ml-auto">
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <ArrowUp className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
