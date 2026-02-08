/* lib/gemini-replan.ts 

Purpose: 
- Generates new tasks to replace incomplete tasks in an existing plan
- Uses Gemini to create contextually appropriate replacement tasks
- Preserves completed tasks and their structure

Design Choices 
- Focuses on generating tasks that fit the remaining timeline
- Considers completed tasks as context for what's already done
*/

import { GoogleGenerativeAI } from "@google/generative-ai";

/* Initialize Gemini client using the server side API key. */
function getGenAI() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.");
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export type CompletedTask = {
    id: string;
    text: string;
    category: "research" | "build" | "practice" | "network" | "apply";
};

export type RemainingTask = {
    id: string;
    text: string;
    category: "research" | "build" | "practice" | "network" | "apply";
};

export type AiTask = {
    text: string;
    minutes: number;
    category: "research" | "build" | "practice" | "network" | "apply";
    successCriteria: string;
    prereqs?: string[];
    week?: number;
    milestoneName?: string;
};

export type ReplanResponse = {
    tasks: AiTask[];
};

export async function replanRemainingTasksNested(input: {
    goalText: string;
    timelineWeeks: number;
    completedTasks: CompletedTask[];
    remainingTasks: RemainingTask[];
    constraints?: string;
    feedback?: string;
}): Promise<ReplanResponse> {
    const genAI = getGenAI();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    
    // Build context about completed tasks
    const completedContext = input.completedTasks.length > 0
        ? `\n\nCompleted Tasks (${input.completedTasks.length}):\n${input.completedTasks.map(t => `- [${t.category}] ${t.text}`).join("\n")}`
        : "\n\nNo tasks completed yet.";

    // Build context about tasks being replaced
    const remainingContext = input.remainingTasks.length > 0
        ? `\n\nTasks Being Replaced (${input.remainingTasks.length}):\n${input.remainingTasks.map(t => `- [${t.category}] ${t.text}`).join("\n")}`
        : "";

    const constraintsText = input.constraints ? `\n\nAdditional Constraints: ${input.constraints}` : "";
    const feedbackText = input.feedback ? `\n\nUser Feedback: ${input.feedback}` : "";

    const prompt = `
You are an AI career planning assistant helping to replan remaining tasks.

Original Goal: "${input.goalText}"
Timeline: ${input.timelineWeeks} weeks remaining
${completedContext}
${remainingContext}${constraintsText}${feedbackText}

Your task:
- Generate NEW tasks to replace the remaining tasks listed above
- These tasks should help the user continue toward their goal: "${input.goalText}"
- Consider what has already been completed and build upon that progress
- Distribute tasks across the remaining ${input.timelineWeeks} weeks
- Each task should be 15-90 minutes
- Use categories: research, build, practice, network, apply
- Tasks must be specific and measurable with clear success criteria
- Prerequisites (prereqs) should only reference completed task IDs if needed

Output must be valid JSON matching this schema exactly:
{
  "tasks": [
    {
      "text": string,
      "minutes": number (15-90),
      "category": "research"|"build"|"practice"|"network"|"apply",
      "successCriteria": string,
      "prereqs": string[] (optional, only use completed task IDs),
      "week": number (1-${input.timelineWeeks}),
      "milestoneName": string
    }
  ]
}

Generate ${Math.max(5, Math.min(30, input.remainingTasks.length + 5))} new tasks. Do not include any text outside the JSON.
`.trim();

    /* Try multiple model names if the first one fails - using actual available models */
    const modelNamesToTry = [
        modelName,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-2.0-flash"
    ];
    
    let result;
    let lastError: Error | null = null;
    
    for (const tryModelName of modelNamesToTry) {
        try {
            const model = genAI.getGenerativeModel({model: tryModelName});
            result = await model.generateContent(prompt);
            if (tryModelName !== modelName) {
                console.log(`Replan: Successfully used model: ${tryModelName} (fallback from ${modelName})`);
            }
            break;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // If it's not a 404/model not found error, throw immediately
            if (!lastError.message.includes("404") && !lastError.message.includes("not found")) {
                throw lastError;
            }
            continue;
        }
    }
    
    // If SDK fails, try REST API directly with v1 (instead of v1beta)
    if (!result) {
        console.log("Replan: SDK failed, trying REST API directly with v1...");
        const apiKey = process.env.GEMINI_API_KEY!;
        
        // Try REST API with v1 endpoint
        for (const tryModelName of modelNamesToTry) {
            try {
                // Ensure model name has "models/" prefix for REST API
                const modelPath = tryModelName.startsWith("models/") 
                    ? tryModelName 
                    : `models/${tryModelName}`;
                
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1/${modelPath}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    }
                );
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`Replan: REST API failed for ${modelPath}: ${response.status} - ${errorText}`);
                    continue;
                }
                
                const data = await response.json();
                const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!generatedText) {
                    console.log(`Replan: No text in response for ${modelPath}`);
                    continue;
                }
                
                // Parse the response
                let json;
                try {
                    const cleanedText = generatedText.replace(/```json|```/g, "").trim();
                    json = JSON.parse(cleanedText);
                } catch (parseError) {
                    throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Raw response: ${generatedText.substring(0, 200)}`);
                }
                
                return json as ReplanResponse;
            } catch (error) {
                console.log(`Replan: REST API error for ${tryModelName}:`, error);
                continue;
            }
        }
        
        throw new Error(`Failed to generate replan with SDK and REST API. Tried models: ${modelNamesToTry.join(", ")}. Last error: ${lastError?.message || "Unknown error"}.`);
    }

    /**
     * Gemini returns text. We expect JSON.
     * Sometimes models wrap output in ```json ... ``` fences. We strip those if present.
     */
    const rawText = result.response.text();

    let json: ReplanResponse;
    try {
        const cleanedText = rawText.replace(/```json|```/g, "").trim();
        json = JSON.parse(cleanedText);
    } catch (parseError) {
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Raw response: ${rawText.substring(0, 200)}`);
    }

    return json;
}

