export type AnalysisStage =
  | 'validating'
  | 'reading-structure'
  | 'mapping-languages'
  | 'detecting-dependencies'
  | 'measuring-activity'
  | 'constructing-constellations'
  | 'calculating-layout'
  | 'ready'
  | 'error'
  | 'cancelled';

export interface AnalysisStatus {
  id: string;
  stage: AnalysisStage;
  progress: number;
  message: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  recoveryAction?: string;
}

export type QualityPreset = 'auto' | 'high' | 'balanced' | 'low';

export interface ExplorerPreferences {
  quality: QualityPreset;
  showLabels: boolean;
  showDependencyLines: boolean;
  showActivityEffects: boolean;
  onboardingCompleted: boolean;
  muted: boolean;
}
