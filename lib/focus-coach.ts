/*
lib/focus-coach.ts

Purpose:
- Generates micro-help when user is stuck on a task
- Uses Gemini to break down tasks into smaller steps
*/

import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function generateMicroHelp(input: {
  taskText: string;
  taskMinutes: number;
  goalText?: string;
}): Promise<{
  smallerStep: string;
  threeMinuteVersion: string;
}> {
  const genAI = getGenAI();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You are a focus coach helping someone who feels stuck on a task.

Task they're working on: "${input.taskText}"
Estimated time: ${input.taskMinutes} minutes
${input.goalText ? `Their overall goal: ${input.goalText}` : ""}

The user clicked "I'm stuck" and needs help breaking this down.

Generate TWO helpful responses in JSON format:
1. "smallerStep" - A much smaller, more manageable first step they can take right now (should be 5-10 minutes max)
2. "threeMinuteVersion" - An ultra-minimal 3-minute version of the task that still moves them forward

Be encouraging, specific, and actionable. Focus on the absolute smallest next action.

Return ONLY valid JSON in this exact format:
{
  "smallerStep": "string",
  "threeMinuteVersion": "string"
}`;

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  // Parse JSON response
  let json;
  try {
    const cleanedText = rawText.replace(/```json|```/g, "").trim();
    json = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse Gemini response: ${parseError}`);
  }

  return {
    smallerStep: json.smallerStep || "Take a deep breath and write down one specific thing you can do in the next 5 minutes.",
    threeMinuteVersion: json.threeMinuteVersion || "Set a 3-minute timer and just start. Do the smallest possible version - even if it's just opening the right document or writing one sentence.",
  };
}

