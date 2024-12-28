'use client';

import { Paperclip, ArrowUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from 'react';

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

  return (
    <div className={cn("rounded-xl bg-neutral-900 p-4", className)}>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="message"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="bg-transparent border-none text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <hr className="my-4" />
        <div className="flex justify-between items-center">
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
