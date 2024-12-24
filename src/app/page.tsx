"use client"
import React, { useState } from "react";
import Hero from "@/components/Hero";

import GPT from "@/components/GPT";
import Claude from "@/components/Claude";
import Perplexity from "@/components/Perplexity";
import Gemini from "@/components/Gemini";

export default function Home() {
  const [rightCollapsed, setRightCollapsed] = useState(false); 
  const openLeft = () => {
    setRightCollapsed(!rightCollapsed); 
  };

  return (
    <div
      className={`grid ${
        rightCollapsed ? "grid-cols-1" : "grid-cols-[70%,30%]"
      } bg-stone-950 min-h-screen transition-all duration-300`}
    >
      
      <div className="flex items-center justify-center">
        <Hero openLeft={openLeft} />  
      </div>

      
      {!rightCollapsed && (
        <div className="flex flex-col gap-6 p-4  items-center text-white">
          <GPT />
          <Claude />
          <Perplexity />
          <Gemini />
        
        </div>
      )}
    </div>
  );
}
