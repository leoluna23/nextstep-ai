/*
Helper endpoint to list available Gemini models.
This helps debug which models are actually available with your API key.
*/

import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY not set" },
                { status: 500 }
            );
        }

        // Try v1beta first
        let response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        
        if (!response.ok) {
            // Try v1 if v1beta fails
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { 
                    error: `Failed to fetch models: ${response.status} ${response.statusText}`,
                    v1betaError: response.statusText
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        const models = data.models || [];
        
        // Filter models that support generateContent
        const generateContentModels = models
            .filter((m: any) => 
                m.supportedGenerationMethods?.includes('generateContent') ||
                m.supportedGenerationMethods?.includes('generateContentStream')
            )
            .map((m: any) => ({
                name: m.name,
                displayName: m.displayName,
                supportedMethods: m.supportedGenerationMethods
            }));

        return NextResponse.json({
            totalModels: models.length,
            generateContentModels,
            allModels: models.map((m: any) => m.name)
        });
    } catch (error: any) {
        return NextResponse.json(
            { 
                error: "Failed to list models",
                details: error.message 
            },
            { status: 500 }
        );
    }
}

