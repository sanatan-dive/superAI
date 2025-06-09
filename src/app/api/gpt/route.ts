import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, apiKey } = body;
    
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
        { error: "API key is required in the request body." },
        { status: 400 }
      );
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key format." },
        { status: 400 }
      );
    }

    // Make request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      console.error("OpenAI API Error:", errorData);
      
      // Handle specific OpenAI API errors
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your OpenAI API key." },
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
          { error: "Insufficient quota. Please check your OpenAI account." },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || "Failed to get response from OpenAI" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "No response content received from OpenAI" },
        { status: 500 }
      );
    }

    console.log("OpenAI Response:", result);
    
    return NextResponse.json({ result });

  } catch (err: any) {
    console.error("Error in GPT API request:", err.message || err);
    
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}