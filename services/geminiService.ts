import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ScriptPart, Source, GroundingChunk } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SCRIPT_GEN_MODEL = 'gemini-2.5-flash';
const IMAGE_GEN_MODEL = 'gemini-2.5-flash-image';

// Helper to extract JSON from markdown code block
const extractJson = (text: string): any => {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse JSON from response:", e);
      return null;
    }
  }
  console.error("No JSON block found in response");
  return null;
};

export const generateScriptWithGrounding = async (topic: string, language: string): Promise<ScriptPart[]> => {
  const prompt = `You are a YouTube Shorts scriptwriter. Create a viral script about '${topic}' in the language with code '${language}'.
The script should have a strong hook, 2-3 engaging points, and a clear call-to-action.

**Crucial Instructions:**
1.  **Meta-Information:** For any important entity (person, company, product, event), you MUST provide meta-information to establish credibility and context. For example, if you mention "Tyler McVicker," you must add why he is reputable, like "(the reputable Valve insider who previously predicted Half-Life: Alyx)". This makes the script more informative and trustworthy.
2.  **Meme/Visual Idea:** For each part of the script, suggest a funny, relevant meme or a visual idea.
3.  **Language:** The entire "script" content must be in the target language: '${language}'. The other JSON fields ('part', 'memeIdea') should remain in English for structural consistency.

Structure your response as a JSON array string within a markdown code block like this:
\`\`\`json
[
  { "part": "Hook", "script": "The script for the hook in ${language}...", "memeIdea": "A funny cat meme" },
  { "part": "Main Point 1", "script": "The script for the first point in ${language} with meta-info...", "memeIdea": "Surprised Pikachu face" },
  { "part": "Call to Action", "script": "The script for the CTA in ${language}...", "memeIdea": "Shut up and take my money meme" }
]
\`\`\`
Use Google Search to ensure all factual claims are accurate and up-to-date.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: SCRIPT_GEN_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const responseText = response.text;
  const parsedScriptParts = extractJson(responseText);

  if (!Array.isArray(parsedScriptParts)) {
    throw new Error("Failed to generate a valid script structure.");
  }

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const apiChunks = groundingMetadata?.groundingChunks ?? [];

  return parsedScriptParts.map(part => {
    const groundingChunks: GroundingChunk[] = [];
    if (part.script) {
      apiChunks.forEach(chunk => {
        if (chunk.web && 'text' in chunk && typeof chunk.text === 'string' && part.script.includes(chunk.text)) {
          groundingChunks.push({
            text: chunk.text,
            source: { title: chunk.web.title, uri: chunk.web.uri },
          });
        }
      });
    }
    return {
      ...part,
      isGeneratingImage: false,
      groundingChunks,
    };
  });
};

export const generateImageForScript = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: IMAGE_GEN_MODEL,
    contents: {
      parts: [{ text: `Generate a funny, meme-style image for a YouTube short. The idea is: ${prompt}` }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && firstPart.inlineData) {
    return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
  }
  throw new Error("Image generation failed.");
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
   const response = await ai.models.generateContent({
    model: IMAGE_GEN_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && firstPart.inlineData) {
    return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
  }
  throw new Error("Image editing failed.");
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });