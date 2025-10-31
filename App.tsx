
import React, { useState } from 'react';
import { ScriptGenerator } from './components/ScriptGenerator';
import { ImageEditor } from './components/ImageEditor';
import { Header } from './components/Header';
import { ScriptIcon, ImageIcon } from './components/Icons';
import { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SCRIPT_GENERATOR);

  const renderView = () => {
    switch (view) {
      case AppView.SCRIPT_GENERATOR:
        return <ScriptGenerator />;
      case AppView.IMAGE_EDITOR:
        return <ImageEditor />;
      default:
        return <ScriptGenerator />;
    }
  };

  const navItems = [
    { id: AppView.SCRIPT_GENERATOR, label: 'Script Generator', icon: <ScriptIcon /> },
    { id: AppView.IMAGE_EDITOR, label: 'Image Editor', icon: <ImageIcon /> },
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-brand-surface p-2 rounded-full flex items-center space-x-2 shadow-lg">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50 ${
                  view === item.id
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-transparent text-brand-text-secondary hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
