
import React from 'react';
import { LogoIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="py-4 bg-brand-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LogoIcon />
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
            Viral Script AI
          </h1>
        </div>
      </div>
    </header>
  );
};
