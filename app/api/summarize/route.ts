import { NextResponse, NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();

  try {

    const prompt = `
      You are an AI meeting assistant. Summarize this Google Meet transcript clearly.
      Include:
      - Key discussion points
      - Important decisions
      - Action items
      Transcript:
      ${transcript}
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const summary = result.text;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
