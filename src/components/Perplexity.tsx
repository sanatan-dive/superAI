"use client";
import { animate, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";


export default function Perplexity() {
  return (
    <Card>
      <CardSkeletonContainer>
        <Skeleton />
        
      </CardSkeletonContainer>
      <CardTitle>Perplexity</CardTitle>
      <CardDescription>
        Generating response...
      </CardDescription>
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
      // @ts-ignore
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);
  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        
        
        <Container className="circle-3">
          <PerplexityLogo className="h-8 w-8 rounded-full dark:text-white" />
        </Container>
      
      </div>

     
        <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
         
        
      </div>
    </div>
  );
};
const Sparkles = () => {
  const randomMove = () => Math.random() * 2 - 1;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 2 + 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block bg-black dark:bg-white"
        ></motion.span>
      ))}
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
          "max-w-md w-full mx-auto p-3 rounded-md border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gradient-to-b from-stone-800  to-stone-950 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group",
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
  
  
  

  export const PerplexityLogo = ({ className }: { className?: string }) => {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        fill="none"
      >
        <rect width="100" height="100" fill="#1A1A1A" />
        <path
          d="M50 15L35 30H50L65 30L50 15ZM35 30L25 40H40L50 30H35ZM65 30L75 40H60L50 30H65ZM25 40L15 50H35L40 45H25ZM75 40L85 50H65L60 45H75ZM15 50L25 60H40L35 55H15ZM85 50L75 60H60L65 55H85ZM25 60L35 70H50L40 60H25ZM75 60L65 70H50L60 60H75ZM35 70L50 85L65 70H50L35 70Z"
          stroke="#00B5B8"
          strokeWidth="3"
        />
      </svg>
    );
  };
   
  
  



