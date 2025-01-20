import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error("Claude API key is not set in environment variables.");
    }

    const body = await req.json() as RequestBody;
    const { prompt } = body;
    console.log("prompt", prompt);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
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