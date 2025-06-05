// app/api/conversations/route.ts (or /api/conversations.ts if using pages dir)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, content, responses, finalAnswer } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!content || !Array.isArray(responses)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const prompt = await prisma.prompt.create({
      data: {
        content,
        finalAnswer: finalAnswer || null,
        userId,
        responses: {
          create: responses.map((r: { modelName: string; output: string }) => ({
            modelName: r.modelName,
            output: r.output,
          })),
        },
      },
    });

    return NextResponse.json({ message: "Conversation saved", prompt }, { status: 201 });
  } catch (error) {
    console.error("[SAVE_CONVERSATION_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET method: For fetching user conversations, now userId must be passed as a query param or header
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const prompts = await prisma.prompt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { responses: true },
    });

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (error) {
    console.error("[SAVE_CONVERSATION_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
