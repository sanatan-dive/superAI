import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY; // Make sure this is set in .env.local
  const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const defaultSiteTitle = process.env.NEXT_PUBLIC_SITE_NAME || 'SuperAI';

  try {
    const body = await req.json();
    const { content } = body; // Only destructure content from request body

    console.log("content", content);

    // Validate input
    if (!content) {
      return NextResponse.json(
        { error: "Content is required in the request body." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured." },
        { status: 500 }
      );
    }

    // Validate API key format (basic check for OpenRouter)
    if (!apiKey.startsWith('sk-or-')) {
      return NextResponse.json(
        { error: "Invalid OpenRouter API key format." },
        { status: 500 }
      );
    }

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": defaultSiteUrl,
      "X-Title": defaultSiteTitle,
    };

    // Make request to OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "mistralai/devstral-small:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Provide responses in markdown format when appropriate. Use proper markdown syntax for headers, lists, code blocks, links, and other formatting to make your responses well-structured and readable."
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);

      // Handle specific OpenRouter API errors
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

      if (response.status === 402) {
        return NextResponse.json(
          { error: "Insufficient quota. Please check your OpenRouter account." },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || "Failed to get response from OpenRouter" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // console.log("Full OpenRouter Response:", data);

    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "No response content received from OpenRouter" },
        { status: 500 }
      );
    }

    console.log("OpenRouter Response:", result);
    return NextResponse.json({ result });

  } catch (err: any) {
    console.error("Error in OpenRouter API request:", err.message || err);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}