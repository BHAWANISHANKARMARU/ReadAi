import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const { transcript } = await request.json();

  if (!transcript) {
    return NextResponse.json({ message: 'Transcript is required' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Summarize the following meeting transcript:\n\n${transcript}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ message: 'Error generating summary' }, { status: 500 });
  }
}
