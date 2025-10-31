import React, { useState, useCallback } from 'react';
import { generateScriptWithGrounding, generateImageForScript } from '../services/geminiService';
import { ScriptPart, GroundingChunk } from '../types';
import { SourceTooltip } from './SourceTooltip';
import { Loader } from './Loader';
import { GenerateIcon, MemeIcon } from './Icons';

const ScriptPartDisplay: React.FC<{ part: ScriptPart; onGenerateImage: () => void }> = ({ part, onGenerateImage }) => {
  
  const renderScriptWithTooltips = () => {
    let scriptJsx: (string | React.ReactNode)[] = [part.script];

    part.groundingChunks.forEach((chunk, index) => {
      const newScriptJsx: (string | React.ReactNode)[] = [];
      scriptJsx.forEach(segment => {
        if (typeof segment === 'string') {
          if (segment.includes(chunk.text)) {
            const parts = segment.split(chunk.text);
            parts.forEach((p, i) => {
              newScriptJsx.push(p);
              if (i < parts.length - 1) {
                newScriptJsx.push(
                  <SourceTooltip key={`${index}-${i}`} source={chunk.source}>
                    <span className="bg-brand-secondary/20 text-brand-secondary font-semibold p-1 rounded-md border-b-2 border-brand-secondary border-dashed cursor-pointer">
                      {chunk.text}
                    </span>
                  </SourceTooltip>
                );
              }
            });
          } else {
            newScriptJsx.push(segment);
          }
        } else {
          newScriptJsx.push(segment);
        }
      });
      scriptJsx = newScriptJsx;
    });

    return scriptJsx.map((item, index) => <React.Fragment key={index}>{item}</React.Fragment>);
  };

  return (
    <div className="bg-brand-surface rounded-xl p-6 mb-6 shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
      <h3 className="text-xl font-bold text-brand-accent mb-3">{part.part}</h3>
      <p className="text-brand-text whitespace-pre-wrap mb-4">{renderScriptWithTooltips()}</p>
      <div className="bg-black/20 p-4 rounded-lg">
        <div className="flex items-start space-x-3 mb-4">
          <div className="text-brand-primary pt-1"><MemeIcon /></div>
          <div>
            <h4 className="font-semibold text-brand-text-secondary">Visual Idea</h4>
            <p className="text-sm text-brand-text-secondary">{part.memeIdea}</p>
          </div>
        </div>
        
        {part.isGeneratingImage ? (
          <div className="flex justify-center items-center h-48 bg-black/30 rounded-lg"><Loader /></div>
        ) : part.generatedImageUrl ? (
          <img src={part.generatedImageUrl} alt={part.memeIdea} className="rounded-lg w-full h-48 object-cover" />
        ) : (
          <button
            onClick={onGenerateImage}
            className="w-full bg-brand-secondary hover:bg-brand-secondary/80 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-300"
          >
            <GenerateIcon />
            <span className="ml-2">Generate Image</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const ScriptGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [scriptParts, setScriptParts] = useState<ScriptPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'ru-RU', name: 'Русский' },
  ];

  const handleGenerateScript = useCallback(async () => {
    if (!prompt) {
      setError("Please enter a topic for your script.");
      return;
    }
    setLoading(true);
    setError(null);
    setScriptParts([]);
    try {
      const parts = await generateScriptWithGrounding(prompt, language);
      setScriptParts(parts);
    } catch (e) {
      console.error(e);
      setError("Failed to generate script. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prompt, language]);
  
  const handleGenerateImage = useCallback(async (partIndex: number) => {
      setScriptParts(prevParts => 
        prevParts.map((p, i) => i === partIndex ? { ...p, isGeneratingImage: true } : p)
      );
      try {
        const imageUrl = await generateImageForScript(scriptParts[partIndex].memeIdea);
        setScriptParts(prevParts => 
          prevParts.map((p, i) => i === partIndex ? { ...p, generatedImageUrl: imageUrl, isGeneratingImage: false } : p)
        );
      } catch (e) {
        console.error(e);
        setError(`Failed to generate image for "${scriptParts[partIndex].part}". Please try again.`);
        setScriptParts(prevParts => 
          prevParts.map((p, i) => i === partIndex ? { ...p, isGeneratingImage: false } : p)
        );
      }
  }, [scriptParts]);


  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-brand-surface p-6 rounded-xl shadow-2xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-text">Create Your Viral Short Script</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., The history of memes"
          className="w-full p-3 bg-black/20 rounded-md border border-white/20 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
          rows={3}
        />
        <div className="mt-4">
            <label htmlFor="language-select" className="block text-sm font-medium text-brand-text-secondary mb-1">
                Script Language
            </label>
            <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 bg-black/20 rounded-md border border-white/20 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
            >
                {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-brand-surface text-brand-text">{lang.name}</option>
                ))}
            </select>
        </div>
        <button
          onClick={handleGenerateScript}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader /> : 'Generate Script'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {loading && scriptParts.length === 0 && (
         <div className="text-center p-8">
            <Loader />
            <p className="mt-4 text-brand-text-secondary">Generating your script... this may take a moment.</p>
         </div>
      )}

      {scriptParts.length > 0 && (
        <div>
          {scriptParts.map((part, index) => (
            <ScriptPartDisplay 
                key={index} 
                part={part}
                onGenerateImage={() => handleGenerateImage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};