import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

export interface CompetitorAnalysis {
    id: string;
    position: number;
    sentiment: number; // 0-100 score
    reasoning: string; // Arabic
}

export interface AnalysisResult {
    competitors: CompetitorAnalysis[];
}

const AnalysisSchema = z.object({
    competitors: z.array(z.object({
        id: z.string().describe("company name in english lowercase, no spaces (e.g., 'shopify', 'salla')"),
        position: z.number().int().describe("Strictly sequential integer (1, 2, 3...). NO decimals (e.g. 2.1 is forbidden). Based on order of mention."),
        sentiment: z.number().min(0).max(100).describe("Preference percentage (0-100) - how strongly the answer favors this company."),
        reasoning: z.string().describe("Brief explanation in ARABIC (بالعربي) of the position and preference percentage."),
    })).describe("List of companies mentioned in the answer with their position and preference score"),
});

export async function analyzeAnswer(text: string, query: string, clientName: string): Promise<AnalysisResult> {
    try {
        const { experimental_output: output } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            experimental_output: Output.object({ schema: AnalysisSchema }),
            prompt: `Analyze the answer for query: "${query}". Extract: 1. Companies mentioned. 2. Order of mention (position) for each company. MUST be a simple integer (1, 2, 3). DO NOT use decimals like 1.1 or 1.2. 3. Preference percentage (sentiment) for each company. Answer: "${text}"`,

        });

        return output as AnalysisResult;
    } catch (error) {
        console.error("Error analyzing answer:", error);
        return {
            competitors: [],
        };
    }
}
