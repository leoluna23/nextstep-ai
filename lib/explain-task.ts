/*
lib/explain-task.ts

Purpose:
- Generates explanations for tasks, weeks, and overall plan using Gemini
- These explanations can then be converted to audio via ElevenLabs
*/

import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function explainTask(input: {
  taskText: string;
  taskMinutes: number;
  category: string;
  successCriteria: string;
  goalText?: string;
  milestoneName?: string;
  weekNumber?: number;
}): Promise<string> {
  const genAI = getGenAI();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You are a helpful coach explaining a task to someone working toward their goal.

Goal: ${input.goalText || "Career advancement"}
${input.weekNumber ? `Week ${input.weekNumber}` : ""}
${input.milestoneName ? `Milestone: ${input.milestoneName}` : ""}

Task: ${input.taskText}
Category: ${input.category}
Estimated time: ${input.taskMinutes} minutes
Success criteria: ${input.successCriteria}

Provide a clear, encouraging explanation of this task. Explain:
1. What the task involves
2. Why it's important for their goal
3. How to approach it
4. What success looks like

Keep it concise (2-3 sentences) and motivational. Speak directly to the user as if you're their coach.

Return ONLY the explanation text, no markdown, no quotes, just the explanation.`;

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function explainWeek(input: {
  weekNumber: number;
  theme: string;
  milestones: Array<{ name: string; why: string; tasks: Array<{ text: string }> }>;
  goalText?: string;
}): Promise<string> {
  const genAI = getGenAI();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const milestoneSummary = input.milestones.map(m => 
    `${m.name}: ${m.tasks.length} tasks`
  ).join(", ");

  const prompt = `You are a helpful coach explaining a week of work to someone working toward their goal.

Goal: ${input.goalText || "Career advancement"}

Week ${input.weekNumber}
Theme: ${input.theme}
Milestones: ${milestoneSummary}

Provide a clear, encouraging overview of this week. Explain:
1. What this week focuses on
2. Why this week matters for their goal
3. What they'll accomplish
4. How to approach the week

Keep it concise (3-4 sentences) and motivational. Speak directly to the user as if you're their coach.

Return ONLY the explanation text, no markdown, no quotes, just the explanation.`;

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function explainPlan(input: {
  title: string;
  summary: string;
  goalText: string;
  totalWeeks: number;
  totalTasks: number;
}): Promise<string> {
  const genAI = getGenAI();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You are a helpful coach explaining an overall plan to someone working toward their goal.

Goal: ${input.goalText}

Plan Title: ${input.title}
Summary: ${input.summary}
Duration: ${input.totalWeeks} weeks
Total tasks: ${input.totalTasks} waypoints

Provide a clear, encouraging overview of this plan. Explain:
1. What the plan covers
2. How it will help them reach their goal
3. The journey ahead
4. What to expect

Keep it concise (4-5 sentences) and motivational. Speak directly to the user as if you're their coach.

Return ONLY the explanation text, no markdown, no quotes, just the explanation.`;

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

