
import React from 'react';
import { Source } from '../types';
import { LinkIcon } from './Icons';

interface SourceTooltipProps {
  source: Source;
  children: React.ReactNode;
}

export const SourceTooltip: React.FC<SourceTooltipProps> = ({ source, children }) => {
  return (
    <div className="relative inline-block group">
      {children}
      <div className="absolute bottom-full mb-2 w-72 bg-brand-surface border border-brand-primary p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <p className="font-bold text-sm text-brand-text mb-1 line-clamp-2">{source.title}</p>
        <a 
          href={source.uri} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-xs text-brand-secondary hover:underline break-all pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <LinkIcon />
          <span className="ml-1 truncate">{source.uri}</span>
        </a>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-brand-primary"></div>
      </div>
    </div>
  );
};
