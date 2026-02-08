/* lib/gemini.ts 

Purpose: 
- Encapsulates Gemini API usage in one place
- Builds a structured prompt that forces JSON outputs
- Parses and validates Gemini output against PlanSchema

Design Choices 
- We keep the schema strict so the UI doesn't break
*/

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PlanSchema, type Plan } from "@/models/Plan";

/* Initialize Gemini client using the server side API key. */
function getGenAI() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.");
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}


/*
Generates a structured plan from a career/school goal.

Input:
- goalText: the user's main goal
- targetRole: helps gemini tailor tasks
- hoursPerWeek: helps gemini balance the plan with the user's time constraints
- timelineWeeks: helps gemini balance the plan with the user's time constraints
- skillLevel: helps gemini tailor the plan to the user's current abilities

Output:
- A validated Plan object matching PlanSchema
*/

export async function generatePlan(input: {
    goalText: string;
    hoursPerWeek: number;
    timelineWeeks: number;
    skilllevel: "beginner" | "intermediate" | "advanced";
    targetRole?: string;
}): Promise<Plan> {
    // Selecting a model is an important lever for controlling Gemini's output. More advanced models are better at following complex instructions and generating structured outputs, but they also cost more and have higher latency. 
    // Use actual available models. Can be overridden with GEMINI_MODEL env var.
    // Available models: "gemini-2.5-flash" (fast), "gemini-2.5-pro" (more capable), "gemini-flash-latest", "gemini-pro-latest"
    const genAI = getGenAI();
    const defaultModel = "gemini-2.5-flash"; // Fast and capable model
    const modelName = process.env.GEMINI_MODEL || defaultModel;

    /* Prompt strategy:
    - Provide constraints so the plan is realistic
    - Provide categories so tasks are diverse
    - Provide an explicit JSON schema and insist on JSON only.
    
    Note:
    - IDs should be stable for persistance and task completion tracking.
    */

    const prompt = `
    You are an AI career planning assistant.

    User Goal: "${input.goalText}"
    Target Role: "${input.targetRole ?? "N/A"}"
    Time Available: ${input.hoursPerWeek} hours per week
    Timeline: ${input.timelineWeeks} weeks
    Skill Level: ${input.skilllevel}

    Rules:
    - Break the goal into weekly milestones.
    - Each milestone has small actionable tasks (15-90) minutes each.
    - Tasks must be specific and measurable with clear success criteria.
    - Categories: research, build, practice, network, apply.
    - Output must be valid JSON matching this schema exactly. Do not include any text outside the JSON.


    {
        "title": string,
        "summary": string,
        "weeks": [
            {
                "week": number,
                "theme": string,
                "milestones": [
                    {
                        "id": string,
                        "name": string,
                        "why": string,
                        "tasks": [
                            {
                                "id": string,
                                "text": string,
                                "minutes": number,
                                "category": "research"|"build"|"practice"|"network"|"apply",
                                "successCriteria": string,
                                "prereqs": string[]
                            }
                        ]
                    }
                ]
            }
        ]
    }
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
                console.log(`Successfully used model: ${tryModelName} (fallback from ${modelName})`);
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
        console.log("SDK failed, trying REST API directly with v1...");
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
                    console.log(`REST API failed for ${modelPath}: ${response.status} - ${errorText}`);
                    continue;
                }
                
                const data = await response.json();
                const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!generatedText) {
                    console.log(`No text in response for ${modelPath}`);
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
                
                // Validate against schema
                return PlanSchema.parse(json);
            } catch (error) {
                console.log(`REST API error for ${tryModelName}:`, error);
                continue;
            }
        }
        
        throw new Error(`Failed to generate content with SDK and REST API. Tried models: ${modelNamesToTry.join(", ")}. Last error: ${lastError?.message || "Unknown error"}. Please check your GEMINI_API_KEY and available models. Visit /api/models/list to see available models.`);
    }

    /**
     * Gemini returns text. We expect JSON.
     * Sometimes models wrap output in ```json ... ``` fences. We strip those if present.
     *
     * Hackathon note:
     * - This is a "good enough" parser for MVP.
     * - If Gemini returns extra text, we'll tighten prompt or add a more robust JSON extractor.
     */
    const rawText = result.response.text();

    let json;
    try {
        const cleanedText = rawText.replace(/```json|```/g, "").trim();
        json = JSON.parse(cleanedText);
    } catch (parseError) {
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Raw response: ${rawText.substring(0, 200)}`);
    }

    /**
     * Validate against schema.
     * - If invalid, Zod throws with helpful errors.
     */
    return PlanSchema.parse(json);
}