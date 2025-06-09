import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Function to clean up the AI response
function cleanResponse(text: string): string {
  if (!text) return "";
  
  // Remove <think> blocks (DeepSeek's internal reasoning)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Remove extra whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  cleaned = cleaned.trim();
  
  // Remove leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // Remove any remaining XML-like tags that might be artifacts
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  return cleaned;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  
  if (!rawBody) {
    return NextResponse.json({ error: "Request body is missing" }, { status: 400 });
  }

  let data: RequestBody;
  try {
    data = JSON.parse(rawBody);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("JSON parse error:", err.message);
    }
    return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
  }

  const prompt = data.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt field is required" }, { status: 400 });
  }

  // Check for required environment variables
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
  }

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: "You are a helpful assistant. Always format your responses in clean markdown syntax. Use headers (# ## ###), bullet points, code blocks (```), **bold**, *italic*, and other markdown formatting to make responses well-structured and readable."
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.SITE_URL || "", // Optional: Site URL for rankings
        "X-Title": process.env.SITE_NAME || "", // Optional: Site title for rankings
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      
      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          return NextResponse.json({ error: "Invalid API credentials" }, { status: 401 });
        case 429:
          return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        case 404:
          return NextResponse.json({ error: "Model not available" }, { status: 404 });
        default:
          return NextResponse.json({ error: "Failed to get response from AI model" }, { status: 500 });
      }
    }

    const chatCompletion: OpenRouterResponse = await response.json();
    
    // Check if response has the expected structure
    if (!chatCompletion.choices || !chatCompletion.choices[0] || !chatCompletion.choices[0].message) {
      console.error("Unexpected response structure:", chatCompletion);
      return NextResponse.json({ error: "Invalid response from AI model" }, { status: 500 });
    }

    // console.log("Raw AI Response:", chatCompletion.choices[0].message.content);
    
    // Clean the response
    const rawResponse = chatCompletion.choices[0].message.content || "";
    const cleanedResponse = cleanResponse(rawResponse);
    
    // console.log("Cleaned Response:", cleanedResponse);
    
    // Return only the essential response
    return NextResponse.json(
      {
        result: cleanedResponse,
        // Optional: include metadata if needed
        // model: "deepseek/deepseek-r1-0528:free",
        // timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
    
  } catch (error: unknown) {
    console.error("API Error:", error);
    
    if (error instanceof Error) {
      // Handle network errors
      if (error.message.includes('fetch')) {
        return NextResponse.json({ error: "Network error - unable to reach OpenRouter API" }, { status: 503 });
      }
    }
    
    return NextResponse.json(
      { error: "Failed to get response from AI model" },
      { status: 500 }
    );
  }
}