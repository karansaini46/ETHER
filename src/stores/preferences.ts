import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QualityPreset, ExplorerPreferences } from '@/types/api';

interface PreferencesState extends ExplorerPreferences {
  setQuality: (quality: QualityPreset) => void;
  toggleLabels: () => void;
  toggleDependencyLines: () => void;
  toggleActivityEffects: () => void;
  completeOnboarding: () => void;
  toggleMuted: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      quality: 'auto',
      showLabels: true,
      showDependencyLines: true,
      showActivityEffects: true,
      onboardingCompleted: false,
      muted: true,

      setQuality: (quality) => set({ quality }),
      toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
      toggleDependencyLines: () => set((s) => ({ showDependencyLines: !s.showDependencyLines })),
      toggleActivityEffects: () => set((s) => ({ showActivityEffects: !s.showActivityEffects })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    {
      name: 'ether-preferences',
      partialize: (state) => ({
        quality: state.quality,
        showLabels: state.showLabels,
        showDependencyLines: state.showDependencyLines,
        showActivityEffects: state.showActivityEffects,
        onboardingCompleted: state.onboardingCompleted,
        muted: state.muted,
      }),
    },
  ),
);
