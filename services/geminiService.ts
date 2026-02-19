
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAIPalette(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a beautiful gradient color palette based on this theme: "${prompt}". Return 2 to 5 hex colors that look professional and aesthetically pleasing.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of hex color strings"
            },
            name: {
              type: Type.STRING,
              description: "A creative name for this gradient"
            }
          },
          required: ["colors", "name"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as { colors: string[]; name: string };
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
