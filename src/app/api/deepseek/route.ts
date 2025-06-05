import { InferenceClient } from "@huggingface/inference";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
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

  const client = new InferenceClient(process.env.HF_TOKEN);

  try {
    const chatCompletion = await client.chatCompletion({
      provider: "novita",
      model: "deepseek-ai/DeepSeek-R1",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Provide direct, clear responses without showing your reasoning process or internal thoughts."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      parameters: {
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
      }
    });

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
        // model: "deepseek-ai/DeepSeek-R1",
        // timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("API Error:", error);
    
    if (error instanceof Error) {
      // Return specific error messages for debugging
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json({ error: "Invalid API credentials" }, { status: 401 });
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json({ error: "Model not available" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to get response from AI model" },
      { status: 500 }
    );
  }
}