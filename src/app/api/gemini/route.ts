import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string; // The prompt text submitted from the form
}

// Function to clean up the AI response and ensure proper markdown formatting
function cleanAndFormatResponse(text: string): string {
  if (!text) return "";
  
  // Remove any unwanted characters or artifacts
  let cleaned = text.trim();
  
  // Ensure proper spacing around headers
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
  
  // Ensure proper spacing around code blocks
  cleaned = cleaned.replace(/```(\w+)?\n/g, '```$1\n');
  cleaned = cleaned.replace(/\n```/g, '\n```');
  
  // Clean up excessive newlines but preserve markdown structure
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  
  // Ensure bullet points are properly formatted
  cleaned = cleaned.replace(/^\s*[\-\*\+]\s+/gm, '- ');
  
  // Ensure numbered lists are properly formatted
  cleaned = cleaned.replace(/^\s*(\d+)\.\s+/gm, '$1. ');
  
  return cleaned;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY; // Gemini API Key
    if (!geminiApiKey) {
      console.error("Gemini API key is not set");
      return NextResponse.json(
        { error: "Server configuration error - API key missing" },
        { status: 500 }
      );
    }

    // Parse the request body
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Request body is missing" }, { status: 400 });
    }
    
    console.log("Raw body:", rawBody);

    let data: RequestBody;
    try {
      data = JSON.parse(rawBody);
    } catch (err) {
      console.error("JSON parse error:", err);
      return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }

    const prompt = data.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt field is required" }, { status: 400 });
    }

    // Initialize the generative AI client for Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Enhanced prompt with markdown formatting instructions
    const enhancedPrompt = `Please provide a well-structured response using proper markdown formatting. Use:
- Headers (# ## ###) for sections
- **bold** and *italic* text for emphasis
- Bullet points and numbered lists where appropriate
- Code blocks with \`\`\` for code examples
- Proper paragraph spacing

User's question: ${prompt}`;

    // Use correct model names - try in order of preference
    const availableModels = [
      "gemini-1.5-flash", // Latest and fastest
      "gemini-1.5-pro",   // More capable
      "gemini-pro",       // Fallback
    ];

    let responseText = "";
    let modelUsed = "";

    for (const modelName of availableModels) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        });
        
        const result = await model.generateContent(enhancedPrompt);
        const response = result.response;
        
        // Extract text immediately and store it
        responseText = response.text() || "No content generated.";
        modelUsed = modelName;
        
        // console.log(`Successfully used model: ${modelName}`);
        // console.log("Raw Response:", responseText);
        break;
        
      } catch (modelError) {
        console.error(`Error with model ${modelName}:`, modelError);
        // If this is the last model, throw the error
        if (modelName === availableModels[availableModels.length - 1]) {
          throw modelError;
        }
        // Continue to next model
        continue;
      }
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "All models failed to generate response" },
        { status: 500 }
      );
    }

    // Clean the response text
    const cleanedResponse = cleanAndFormatResponse(responseText);
    // console.log("Cleaned Response:", cleanedResponse);

    // Store the response in a way that can be accessed later
    const responseData = {
      result: cleanedResponse,
      raw_result: responseText, // Keep the raw response for debugging
      model_used: modelUsed,
      timestamp: new Date().toISOString()
    };

    console.log("Final response data:", responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Handle specific Google AI errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      const message = (error as any).message || "Unknown Google AI error";
      
      switch (status) {
        case 400:
          return NextResponse.json({ error: "Invalid request to Gemini API" }, { status: 400 });
        case 401:
          return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        case 403:
          return NextResponse.json({ error: "API access forbidden" }, { status: 403 });
        case 404:
          return NextResponse.json({ error: "Model not found" }, { status: 404 });
        case 429:
          return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        default:
          return NextResponse.json({ error: `Gemini API error: ${message}` }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}