import React from 'react';

export const ScannerOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyber-primary opacity-80" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyber-primary opacity-80" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyber-primary opacity-80" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyber-primary opacity-80" />
      
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-16 h-16 border border-cyber-primary/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-cyber-primary rounded-full shadow-[0_0_10px_#06b6d4]" />
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Scanning Bar */}
      <div className="scan-line" />
      
      {/* Data Widgets */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2 font-mono text-[10px] text-cyber-primary opacity-70 hidden md:flex">
        <div>TRGT_LCK: <span className="animate-pulse">ACQUIRED</span></div>
        <div>ISO: AUTO</div>
        <div>EXP: 1/200</div>
        <div>F_DIST: 50mm</div>
      </div>
    </div>
  );
};
