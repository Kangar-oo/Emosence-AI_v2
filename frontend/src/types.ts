export type Role = 'user' | 'model';

export type EmotionType =
  | 'Happy'
  | 'Neutral'
  | 'Sad'
  | 'Angry'
  | 'Surprise'
  | 'Disgust'
  | 'Fear';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  /** True while the SSE stream for this message is still arriving */
  isStreaming?: boolean;
  mood?: EmotionType;
  confidence?: number;
}

export interface EmotionDataPoint {
  timestamp: number;
  emotion: EmotionType;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}