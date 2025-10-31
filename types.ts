
export interface Source {
  title: string;
  uri: string;
}

export interface GroundingChunk {
  text: string;
  source: Source;
}

export interface ScriptPart {
  part: string;
  script: string;
  memeIdea: string;
  generatedImageUrl?: string;
  isGeneratingImage: boolean;
  groundingChunks: GroundingChunk[];
}

export enum AppView {
  SCRIPT_GENERATOR = 'script_generator',
  IMAGE_EDITOR = 'image_editor',
}
