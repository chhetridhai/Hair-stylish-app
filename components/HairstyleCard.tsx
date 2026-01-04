import React from 'react';
import { GeneratedImage } from '../types';
import { Download, RefreshCw } from 'lucide-react';

interface Props {
  item: GeneratedImage;
  onRegenerate: () => void;
}

export const HairstyleCard: React.FC<Props> = ({ item, onRegenerate }) => {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50 hover:border-cyber-primary/50 transition-all duration-300">
      <div className="aspect-[3/4] w-full relative">
        {item.loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-12 h-12 border-4 border-cyber-primary/30 border-t-cyber-primary rounded-full animate-spin mb-4" />
            <span className="font-mono text-xs text-cyber-primary animate-pulse">SYNTHESIZING...</span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.styleName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        
        {/* Overlay Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
           <h3 className="font-display font-bold text-white text-lg leading-tight">{item.styleName}</h3>
           {!item.loading && (
             <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = item.imageUrl;
                    link.download = `hairstyle-${item.styleName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                    link.click();
                  }}
                  className="p-2 bg-cyber-primary/20 hover:bg-cyber-primary/40 rounded-lg text-cyber-primary transition-colors"
                >
                 <Download size={16} />
               </button>
               <button 
                  onClick={onRegenerate}
                  className="p-2 bg-cyber-secondary/20 hover:bg-cyber-secondary/40 rounded-lg text-cyber-secondary transition-colors"
                >
                 <RefreshCw size={16} />
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
