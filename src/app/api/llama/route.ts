import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { prompt } = body;

    console.log("Received prompt:", prompt);

    // Validate that prompt is provided
    if (!prompt) {
      console.error("No prompt provided");
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    console.log("Making request to OpenRouter API...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.YOUR_SITE_NAME || "AI Chat App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.3-8b-instruct:free",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    console.log("OpenRouter API response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenRouter API error:", error);
      
      // Handle specific API errors
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your OpenRouter API key." },
          { status: 401 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      throw new Error(`OpenRouter API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log("OpenRouter API response data:", data);
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}