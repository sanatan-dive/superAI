import React, { useState } from "react";
import ChatInput from "./ui/Chatinput";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface HeroProps {
  openLeft: () => void;
}

function Hero({ openLeft }: HeroProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const handleToggle = () => {
    setRightCollapsed(!rightCollapsed);
    openLeft();  
  };

  return (
    <div className="h-screen w-full p-4">
      <div className="relative h-full w-full flex flex-col items-center justify-between border-stone-700 border rounded-xl bg-gradient-to-b from-stone-900 to-black text-white">
        <div className="absolute m-4 top-0 right-0">
          <button
            className="w-12 h-12 bg-stone-800 items-center justify-center flex border-stone-700 border rounded-md"
            onClick={handleToggle}
          >
            {rightCollapsed ? (
              <ArrowLeft className="w-5 h-5 text-white" />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to SuperAI</h1>
            <p className="text-lg sm:text-xl text-gray-400">
              Your one-stop solution for all AI models.
            </p>
          </div>
        </div>

        <div className="w-full max-w-5xl px-4 mb-8">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}

export default Hero;
