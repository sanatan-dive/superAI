import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";



interface RequestBody {
  prompt: string; // The prompt text submitted from the form
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY; // Gemini API Key

    if (!geminiApiKey) {
      throw new Error("Gemini API key is not set in environment variables.");
    }

    // Initialize the generative AI client for Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Parse the request body
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Request body is missing" }, { status: 400 });
    }
    console.log(rawBody);
    let data: RequestBody;
    try {
      data = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }

    const prompt = data.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt field is required" }, { status: 400 });
    }

    // Generate the response using Gemini
    let genAIResult;
    try {
      genAIResult = await model.generateContent(prompt);
    } catch (err) {
      return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
    }

    const summary = genAIResult?.response?.text?.() || "No content generated.";
    return NextResponse.json({ summary });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
