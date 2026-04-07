import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EmotionDataPoint } from '../types';

// simple uuid v4 — didn't want to pull in a whole library just for this
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SessionState {
  sessionId: string;
  emotionTimeline: EmotionDataPoint[];
  addEmotionPoint: (point: EmotionDataPoint) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      emotionTimeline: [],

      addEmotionPoint: (point) =>
        set((state) => ({ emotionTimeline: [...state.emotionTimeline, point] })),

      resetSession: () => set({ sessionId: generateSessionId(), emotionTimeline: [] }),
    }),
    {
      name: 'emosense-session',
      // only persist sessionId — timeline is re-fetched from mongo when needed
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
