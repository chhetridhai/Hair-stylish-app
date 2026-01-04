import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Zap, Activity, Scissors, ScanFace, ChevronRight, X, Sparkles } from 'lucide-react';
import { ScannerOverlay } from './components/ScannerOverlay';
import { FaceRadarChart } from './components/RadarChart';
import { HairstyleCard } from './components/HairstyleCard';
import { analyzeFaceImage, generateHairstyleImage } from './services/geminiService';
import { AppState, AnalysisReport, GeneratedImage } from './types';

// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [generatedStyles, setGeneratedStyles] = useState<GeneratedImage[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera handling
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setAppState(AppState.SCANNING);
      }
    } catch (err) {
      setError("Camera access denied. Please upload an image.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      
      handleImageSelection(dataUrl.split(',')[1]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      handleImageSelection(base64);
    }
  };

  const handleImageSelection = async (base64: string) => {
    setOriginalImage(base64);
    setAppState(AppState.ANALYZING);
    setLoadingMessage("ANALYZING FACIAL GEOMETRY...");
    setError(null);

    try {
      // Step 1: Analyze Face
      const report = await analyzeFaceImage(base64);
      setAnalysisReport(report);
      
      // Prepare placeholders for generation
      const initialPlaceholders: GeneratedImage[] = report.suggestions.map((s, i) => ({
        id: `style-${i}`,
        styleName: s.name,
        imageUrl: '',
        loading: true,
      }));
      setGeneratedStyles(initialPlaceholders);
      setAppState(AppState.RESULTS);

      // Step 2: Trigger Generation sequentially (to avoid rate limits and show progress)
      // Note: In production, we might want to let user click to generate. Here we do auto.
      for (let i = 0; i < report.suggestions.length; i++) {
        const suggestion = report.suggestions[i];
        try {
          // Use a slight delay between requests
          await new Promise(r => setTimeout(r, 500));
          
          const newImageBase64 = await generateHairstyleImage(
            base64, 
            suggestion.name, 
            suggestion.description, 
            suggestion.colorHex
          );

          setGeneratedStyles(prev => prev.map(item => 
            item.styleName === suggestion.name 
              ? { ...item, imageUrl: `data:image/jpeg;base64,${newImageBase64}`, loading: false }
              : item
          ));

        } catch (genErr) {
            console.error(genErr);
             setGeneratedStyles(prev => prev.map(item => 
            item.styleName === suggestion.name 
              ? { ...item, loading: false } // Should handle error state visually
              : item
          ));
        }
      }

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try a clearer photo.");
      setAppState(AppState.IDLE);
    }
  };

  const regenerateStyle = async (index: number) => {
    if (!analysisReport || !originalImage) return;
    const suggestion = analysisReport.suggestions[index];
    
    setGeneratedStyles(prev => prev.map((item, i) => 
      i === index ? { ...item, loading: true } : item
    ));

    try {
      const newImageBase64 = await generateHairstyleImage(
        originalImage, 
        suggestion.name, 
        suggestion.description + " (alternative variation)", 
        suggestion.colorHex
      );
      
      setGeneratedStyles(prev => prev.map((item, i) => 
        i === index 
          ? { ...item, imageUrl: `data:image/jpeg;base64,${newImageBase64}`, loading: false }
          : item
      ));
    } catch (e) {
      console.error(e);
      setGeneratedStyles(prev => prev.map((item, i) => 
        i === index ? { ...item, loading: false } : item
      ));
    }
  };

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center z-10">
      <div className="mb-8 relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
           <ScanFace size={64} className="text-cyber-primary" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500 mb-6 tracking-tight">
        AI FACE <span className="text-cyber-primary">ANALYZER</span>
      </h1>
      
      <p className="font-body text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
        Advanced neural network analysis for facial geometry.
        <br />
        <span className="text-cyber-primary font-mono text-sm border border-cyber-primary/30 px-2 py-1 rounded bg-cyber-primary/5 mt-2 inline-block">SYSTEM V3.0 ONLINE</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={startCamera}
          className="flex-1 group relative overflow-hidden rounded-lg bg-cyber-primary p-[1px] focus:outline-none focus:ring-2 focus:ring-cyber-primary focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <div className="relative flex items-center justify-center gap-2 h-full bg-slate-950 px-8 py-4 transition-all group-hover:bg-slate-900">
            <Camera size={20} className="text-cyber-primary" />
            <span className="font-display font-bold text-white tracking-wider">INITIATE SCAN</span>
          </div>
        </button>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 group relative overflow-hidden rounded-lg bg-slate-800 p-[1px] hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 h-full px-8 py-4">
            <Upload size={20} className="text-slate-400 group-hover:text-white transition-colors" />
            <span className="font-display font-bold text-slate-400 group-hover:text-white tracking-wider transition-colors">UPLOAD DATA</span>
          </div>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );

  const renderScanning = () => (
    <div className="relative w-full h-screen bg-black flex flex-col">
       <div className="relative flex-1 bg-black overflow-hidden">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
         />
         <ScannerOverlay />
         
         <div className="absolute bottom-10 inset-x-0 flex justify-center z-30">
           <button 
             onClick={capturePhoto}
             className="w-20 h-20 rounded-full border-4 border-cyber-primary flex items-center justify-center bg-cyber-primary/20 backdrop-blur-sm hover:scale-105 transition-transform"
           >
             <div className="w-16 h-16 rounded-full bg-cyber-primary/80 animate-pulse" />
           </button>
         </div>
       </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-t-4 border-cyber-primary animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-4 border-cyber-secondary animate-spin-slow"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="text-white animate-pulse" size={32} />
        </div>
      </div>
      <h2 className="font-display text-2xl text-white tracking-widest animate-pulse">{loadingMessage}</h2>
      <div className="font-mono text-cyan-500/60 mt-2 text-sm">PROCESSING BIOMETRICS...</div>
    </div>
  );

  const renderResults = () => {
    if (!analysisReport || !originalImage) return null;

    return (
      <div className="min-h-screen w-full p-4 md:p-8 space-y-6 pb-20">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-primary/10 rounded-lg">
               <Zap className="text-cyber-primary" size={24} />
             </div>
             <div>
               <h1 className="font-display font-bold text-2xl text-white">ANALYSIS REPORT</h1>
               <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                 ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
               </div>
             </div>
           </div>
           <button 
            onClick={() => {
              setAppState(AppState.IDLE);
              setAnalysisReport(null);
              setGeneratedStyles([]);
              setOriginalImage(null);
            }}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
           >
             <X className="text-slate-400" />
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Source & Data */}
          <div className="lg:col-span-4 space-y-6">
             {/* Source Image Card */}
             <div className="glass-panel p-1 rounded-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60 z-10" />
                <img 
                  src={`data:image/jpeg;base64,${originalImage}`} 
                  alt="Subject" 
                  className="w-full aspect-[4/5] object-cover rounded-xl"
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="px-3 py-1 bg-cyber-primary/20 backdrop-blur-md border border-cyber-primary/30 rounded text-cyber-primary font-mono text-xs">
                    SUBJECT_01
                  </div>
                </div>
                <div className="absolute top-4 right-4 z-20">
                   <ScanFace className="text-white/50" />
                </div>
             </div>

             {/* Metrics Card */}
             <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyber-secondary">
               <h3 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                 <Activity size={18} className="text-cyber-secondary" />
                 BIOMETRIC RADAR
               </h3>
               <FaceRadarChart metrics={analysisReport.metrics} />
             </div>
             
             {/* Text Analysis */}
             <div className="glass-panel p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-white text-lg">FACE SHAPE</h3>
                    <p className="text-2xl font-bold text-cyber-primary">{analysisReport.metrics.faceShape}</p>
                  </div>
                  <div className="text-right">
                     <h3 className="font-display text-white text-lg">SKIN TONE</h3>
                     <p className="text-sm font-mono text-slate-400">{analysisReport.metrics.skinTone}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-body border-t border-slate-800 pt-4">
                  {analysisReport.metrics.description}
                </p>
             </div>
          </div>

          {/* Right Column: Generated Styles */}
          <div className="lg:col-span-8">
             <div className="flex items-center gap-3 mb-6">
               <Scissors className="text-cyber-accent" />
               <h2 className="font-display text-xl text-white">NEURAL HAIRSTYLE SIMULATION</h2>
               <div className="h-px flex-1 bg-slate-800 ml-4" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedStyles.map((style, idx) => (
                  <div key={style.id} className="space-y-3">
                     <HairstyleCard 
                        item={style} 
                        onRegenerate={() => regenerateStyle(idx)} 
                     />
                     <div className="px-2">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-bold font-display">{style.styleName}</h4>
                          <span className="text-xs font-mono text-cyber-secondary px-2 py-0.5 rounded border border-cyber-secondary/30">
                            FIT: 9{idx}%
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2">{analysisReport.suggestions[idx].reason}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cyber-black text-slate-200 selection:bg-cyber-primary selection:text-black font-body overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-cyber-primary/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyber-secondary/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {appState === AppState.IDLE && renderIntro()}
        {appState === AppState.SCANNING && renderScanning()}
        {appState === AppState.ANALYZING && renderAnalyzing()}
        {appState === AppState.RESULTS && renderResults()}
        
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-3 animate-pulse">
            <X size={20} />
            <span className="font-mono">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
