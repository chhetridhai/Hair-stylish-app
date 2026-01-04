import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    metrics: {
      type: Type.OBJECT,
      properties: {
        faceShape: { type: Type.STRING, description: "e.g., Oval, Square, Heart, Diamond" },
        skinTone: { type: Type.STRING, description: "Description of skin tone" },
        jawline: { type: Type.NUMBER, description: "0-100 rating of jawline definition" },
        cheekbones: { type: Type.NUMBER, description: "0-100 rating of cheekbone prominence" },
        forehead: { type: Type.NUMBER, description: "0-100 rating of forehead height/width balance" },
        symmetry: { type: Type.NUMBER, description: "0-100 rating of facial symmetry" },
        description: { type: Type.STRING, description: "A detailed paragraph analyzing the facial structure." },
      },
      required: ["faceShape", "skinTone", "jawline", "cheekbones", "forehead", "symmetry", "description"],
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          reason: { type: Type.STRING },
          colorHex: { type: Type.STRING, description: "Suggested hex color code for this style" },
        },
        required: ["name", "description", "reason"],
      },
    },
  },
  required: ["metrics", "suggestions"],
};

export const analyzeFaceImage = async (base64Image: string): Promise<AnalysisReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this person's face structure in detail. Identify face shape, key metrics, and suggest 4 DISTINCT modern hairstyles that would suit them perfectly. Return JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 2048 }, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisReport;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateHairstyleImage = async (
  base64Original: string,
  styleName: string,
  styleDesc: string,
  color?: string
): Promise<string> => {
  try {
    const prompt = `Edit this image. Keep the person's face, identity, skin texture, lighting, and background EXACTLY the same. ONLY change the hair.
    The new hairstyle is: ${styleName}. Description: ${styleDesc}.
    ${color ? `Hair color: ${color}` : ''}
    The hair should look ultra-realistic, physically correct, and blend naturally with the head.
    Do not change the face.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Nano Banana for editing
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Original,
            },
          },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Hairstyle generation failed:", error);
    throw error;
  }
};
