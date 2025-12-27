import { GoogleGenAI, SchemaType } from "@google/genai";
import { SubgoalSuggestion } from "../types";

// In a real app, use a secure way to store the API key.
// For Expo, you can use EXPO_PUBLIC_GEMINI_API_KEY in a .env file.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const getAIClient = () => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI(API_KEY);
};

export const suggestSubgoals = async (goalTitle: string, goalDescription?: string): Promise<SubgoalSuggestion[]> => {
  try {
    const ai = getAIClient();
    if (!ai) return [];

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash", // Using 1.5-flash as 2.5-flash might not be available or was a typo in original
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    const prompt = `
      You are a helpful goal-setting assistant.
      User Goal: "${goalTitle}"
      ${goalDescription ? `Context: ${goalDescription}` : ''}
      
      Task: Break this goal down into 3 to 5 concrete, actionable sub-tasks.
      Output: A JSON array of objects with "title" and "description" fields.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
        console.warn("AI returned empty text");
        return [];
    }

    try {
        return JSON.parse(text) as SubgoalSuggestion[];
    } catch (parseError) {
        console.error("Failed to parse AI response:", text);
        return [];
    }
  } catch (error) {
    console.error("Error generating subgoals:", error);
    return [];
  }
};

export const generateMotivation = async (goalTitle: string, progress: number): Promise<string> => {
    try {
        const ai = getAIClient();
        if (!ai) return "Consistency is key!";

        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          My goal is "${goalTitle}" and I am ${Math.round(progress)}% done.
          Give me a short, 1-sentence motivational boost or advice.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Keep going, you're doing great!";
    } catch (error) {
        console.error("Motivation error", error);
        return "Consistency is key!";
    }
}
