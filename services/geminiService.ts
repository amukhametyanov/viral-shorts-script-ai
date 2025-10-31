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

export const generateScriptWithGrounding = async (topic: string, language: string, talkingPoints: string): Promise<ScriptPart[]> => {
  const talkingPointsInstruction = talkingPoints
    ? `The narrative MUST be based on and answer these specific questions or talking points: "${talkingPoints}". Weave them into a cohesive story.`
    : `Create the most intriguing narrative you can based on your research.`;

  const prompt = `You are a master storyteller and YouTube Shorts scriptwriter, specializing in creating viral content that feels like a narrator gradually unraveling a secret.

Your task is to create a script about '${topic}' in the language with code '${language}'.

**Narrative Style:**
- **Unravel a Secret:** Structure the script to build suspense. Start with an intriguing hook, reveal clues or pieces of information incrementally, and lead to a satisfying or shocking conclusion.
- **Engaging Tone:** Use a captivating, slightly mysterious narrator's voice.

**Content Guidance:**
- ${talkingPointsInstruction}

**Crucial Output Instructions:**
1.  **Meta-Information:** For any important entity (person, company, product), YOU MUST provide meta-information to establish credibility. For example, if you mention "Tyler McVicker," add context like "(the reputable Valve insider who previously predicted Half-Life: Alyx)". This is non-negotiable.
2.  **Meme/Visual Idea:** For each part, suggest a relevant meme or a compelling visual idea that enhances the storytelling.
3.  **Language:** The "script" content MUST be in the target language: '${language}'. All other JSON fields ('part', 'memeIdea') must be in English.
4.  **Part Naming:** Name the 'part' fields to reflect the story's progression (e.g., "The Intriguing Premise", "The First Clue", "The Plot Twist", "The Final Reveal").

Structure your response as a JSON array string inside a markdown code block. Example:
\`\`\`json
[
  { "part": "The Ominous Intro", "script": "The hook in ${language} that sets up the mystery...", "memeIdea": "A 'thinking face' emoji overlay" },
  { "part": "The First Clue", "script": "The first piece of the puzzle in ${language} with meta-info...", "memeIdea": "Zoom in on a map with red string" },
  { "part": "The Shocking Reveal", "script": "The climax of the story in ${language}...", "memeIdea": "Mind blown GIF" }
]
\`\`\`
Use Google Search to ensure all information is accurate, up-to-date, and to uncover interesting, little-known facts that support the 'secret unraveling' narrative.`;

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