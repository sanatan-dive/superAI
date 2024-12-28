import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apikey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    if (!apikey) {
      throw new Error("Missing RapidAPI key. Set NEXT_PUBLIC_RAPIDAPI_KEY in environment variables.");
    }

    const body = await req.json();

    const { content } = body; 
    console.log("content", content);

    if (!content) {
      return NextResponse.json(
        { error: "Content is required in the request body." },
        { status: 400 }
      );
    }

    // Axios POST request
    const response = await axios.post(
      "https://chatgpt-42.p.rapidapi.com/chatbotapi",
      {
        bot_id: "OEXJ8qFp5E5AwRwymfPts90vrHnmr8yZgNE171101852010w2S0bCtN3THp448W7kDSfyTf3OpW5TUVefz",
        messages: [{ role: "user", content }],
        user_id: "",
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
        model: "gpt 3.5",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
          "x-rapidapi-key": apikey,
        },
      }
    );
    console.log(response.data);
    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Error in chatbot API request:", err.message || err);

    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
