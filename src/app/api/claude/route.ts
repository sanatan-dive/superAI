import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  apiKey: string; // API key from frontend
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { prompt, apiKey } = body;

    // Validate that API key is provided
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('sk-ant-api03-')) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      );
    }

    console.log("prompt", prompt);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey, // Use API key from frontend
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific API errors
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your Claude API key." },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      throw new Error(`Claude API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}