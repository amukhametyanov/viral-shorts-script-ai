
import React, { useState, useCallback } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import { Loader } from './Loader';
import { UploadIcon } from './Icons';

export const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null); // Clear previous edit on new image upload
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleEditImage = useCallback(async () => {
    if (!prompt || !file) {
      setError("Please upload an image and provide an editing instruction.");
      return;
    }
    setLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Image = await fileToBase64(file);
      const result = await editImage(prompt, base64Image, file.type);
      setEditedImage(result);
    } catch (e) {
      console.error(e);
      setError("Failed to edit image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prompt, file]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-brand-surface p-6 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-text">AI Image Editor</h2>
        
        <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Input Side */}
            <div>
              <label htmlFor="file-upload" className="w-full h-48 bg-black/20 rounded-lg border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:bg-black/30 transition-colors">
                {originalImage ? (
                  <img src={originalImage} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                  <>
                    <UploadIcon />
                    <span className="mt-2 text-sm text-brand-text-secondary">Click to upload an image</span>
                  </>
                )}
              </label>
              <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add a retro filter, make it look like a watercolor painting..."
                className="w-full mt-4 p-3 bg-black/20 rounded-md border border-white/20 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
                rows={3}
              />

              <button
                onClick={handleEditImage}
                disabled={loading || !file}
                className="w-full mt-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader /> : 'Generate Edit'}
              </button>
            </div>
            
            {/* Output Side */}
            <div className="h-full">
              <div className="w-full h-full min-h-[300px] bg-black/20 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                {loading && <Loader />}
                {error && !loading && <p className="text-red-500 text-center p-4">{error}</p>}
                {!loading && !error && editedImage && (
                  <img src={editedImage} alt="Edited result" className="h-full w-full object-contain rounded-lg" />
                )}
                {!loading && !error && !editedImage && (
                  <p className="text-brand-text-secondary text-center p-4">Your edited image will appear here</p>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
