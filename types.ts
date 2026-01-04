export interface FaceMetrics {
  faceShape: string;
  skinTone: string;
  jawline: number;
  cheekbones: number;
  forehead: number;
  symmetry: number;
  description: string;
}

export interface HairstyleSuggestion {
  name: string;
  description: string;
  reason: string; // Why it fits the face
  colorHex?: string;
}

export interface AnalysisReport {
  metrics: FaceMetrics;
  suggestions: HairstyleSuggestion[];
}

export interface GeneratedImage {
  id: string;
  styleName: string;
  imageUrl: string;
  loading: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}
