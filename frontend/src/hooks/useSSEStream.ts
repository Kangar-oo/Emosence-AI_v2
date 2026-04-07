import { useState, useRef, useCallback } from 'react';

export interface SSEChunk {
  token: string;
  done: boolean;
  mood?: string;
  confidence?: number;
  error?: boolean;
}

export interface StreamResult {
  fullText: string;
  mood: string;
  confidence: number;
}

interface UseSSEStreamReturn {
  streamedText: string;
  isStreaming: boolean;
  mood: string | null;
  sendMessage: (text: string, imageB64?: string | null, sessionId?: string) => Promise<StreamResult>;
}

const API_BASE = 'http://localhost:8000';

export function useSSEStream(): UseSSEStreamReturn {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mood, setMood] = useState<string | null>(null);

  // ref to avoid stale closure issue when updating text mid-stream
  const accumulated = useRef('');

  const sendMessage = useCallback(
    async (
      text: string,
      imageB64?: string | null,
      sessionId: string = 'default'
    ): Promise<StreamResult> => {
      accumulated.current = '';
      setStreamedText('');
      setIsStreaming(true);
      setMood(null);

      let finalMood = 'Neutral';
      let finalConfidence = 0;

      try {
        const res = await fetch(`${API_BASE}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, image_b64: imageB64 ?? null, session_id: sessionId }),
        });

        if (!res.ok) throw new Error(`Backend returned ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });

          // each SSE event is "data: {...}\n\n" — split and parse
          for (const line of raw.split('\n').filter(l => l.startsWith('data: '))) {
            try {
              const chunk: SSEChunk = JSON.parse(line.slice(6));
              if (!chunk.done) {
                accumulated.current += chunk.token;
                setStreamedText(accumulated.current);
              } else {
                finalMood = chunk.mood ?? 'Neutral';
                finalConfidence = chunk.confidence ?? 0;
                setMood(finalMood);
              }
            } catch {
              // malformed chunk — just skip it
            }
          }
        }
      } catch (err) {
        const msg = `Something went wrong. (${err})`;
        accumulated.current = msg;
        setStreamedText(msg);
        console.error('[useSSEStream]', err);
      } finally {
        setIsStreaming(false);
      }

      return { fullText: accumulated.current, mood: finalMood, confidence: finalConfidence };
    },
    []
  );

  return { streamedText, isStreaming, mood, sendMessage };
}
