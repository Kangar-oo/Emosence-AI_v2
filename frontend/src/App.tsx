import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam, { WebcamRef } from './components/Webcam';
import ChatMessage from './components/ChatMessage';
import { useSSEStream } from './hooks/useSSEStream';
import { useSessionStore } from './store/sessionStore';
import { Message, EmotionType } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello. I am listening. How are you feeling?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [lastDetectedMood, setLastDetectedMood] = useState<EmotionType | null>(null);

  const webcamRef = useRef<WebcamRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamingMsgId = useRef<string | null>(null);

  // zustand — session_id persists across refreshes via localStorage
  const sessionId = useSessionStore((s) => s.sessionId);
  const addEmotionPoint = useSessionStore((s) => s.addEmotionPoint);
  const resetSession = useSessionStore((s) => s.resetSession);

  const { sendMessage, streamedText, isStreaming } = useSSEStream();

  // browser speech recognition — placeholder until Feature 3 (Whisper) replaces this
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        setInputValue(event.results[0][0].transcript);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  // --- 2. SPEAKING SETUP — replaced with Piper TTS in Feature 3 ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes('Google US English') || v.name.includes('Samantha')
      );
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Live patch placeholder bubble as tokens arrive ---
  useEffect(() => {
    if (!streamingMsgId.current || !isStreaming) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingMsgId.current ? { ...m, text: streamedText } : m
      )
    );
  }, [streamedText, isStreaming]);

  // --- 3. MAIN LOGIC — SSE streaming ---
  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
      const text = textOverride || inputValue;
      if (!text.trim() || isStreaming) return;

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');

      // Add placeholder AI bubble
      const aiMsgId = (Date.now() + 1).toString();
      streamingMsgId.current = aiMsgId;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: 'model', text: '', timestamp: Date.now(), isStreaming: true },
      ]);

      // Capture webcam frame
      const imageB64 =
        cameraActive && webcamRef.current ? webcamRef.current.getScreenshot() : null;

      // Stream — resolves when done sentinel is received
      const result = await sendMessage(text, imageB64, sessionId);

      // Finalize the AI bubble
      streamingMsgId.current = null;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: result.fullText,
                isStreaming: false,
                mood: result.mood as EmotionType,
                confidence: result.confidence,
              }
            : m
        )
      );

      setLastDetectedMood(result.mood as EmotionType);

      // Log emotion point locally for MoodGraph (Feature 5)
      addEmotionPoint({
        timestamp: Date.now(),
        emotion: result.mood as EmotionType,
        confidence: result.confidence,
      });

      speakText(result.fullText);
    },
    [inputValue, isStreaming, cameraActive, sendMessage, sessionId, addEmotionPoint]
  );


  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans p-4 md:p-6 gap-6 overflow-hidden">

      {/* LEFT: Camera & Stats */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          EmoSense AI
        </h1>

        <div className="aspect-[4/3] w-full rounded-3xl relative overflow-hidden border border-slate-800 shadow-2xl bg-black">
          <Webcam ref={webcamRef} isActive={cameraActive} />

          {/* Mood Overlay */}
          {lastDetectedMood && (
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Detected</span>
                <div className="text-lg font-bold text-white">{lastDetectedMood}</div>
              </div>
            </div>
          )}

          {/* Streaming badge */}
          {isStreaming && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1.5 bg-indigo-600/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Streaming
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCameraActive(!cameraActive)}
          className="w-full bg-slate-800/50 hover:bg-slate-700 py-3 rounded-xl transition text-sm font-medium border border-slate-700"
        >
          {cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
        </button>

        {/* Session controls */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-500 font-mono">
            Session: <span className="text-slate-400">{sessionId.slice(0, 8)}…</span>
          </span>
          <button
            onClick={() => {
              resetSession();
              setMessages([{
                id: 'welcome',
                role: 'model',
                text: 'New session started. How are you feeling?',
                timestamp: Date.now(),
              }]);
              setLastDetectedMood(null);
            }}
            className="text-[11px] text-slate-500 hover:text-red-400 transition-colors underline underline-offset-2"
            title="Start a fresh session (clears local history)"
          >
            New Session
          </button>
        </div>
      </div>


      {/* RIGHT: Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-slate-800/50 shadow-inner overflow-hidden">

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex gap-3 items-center">

          {/* Microphone Button */}
          <button
            onClick={toggleListening}
            className={`p-4 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                : 'bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-white'
            }`}
            title="Toggle Voice Input"
          >
            {isListening ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isListening
                ? 'Listening...'
                : isStreaming
                ? 'EmoSense is responding...'
                : 'Type or speak...'
            }
            className="flex-1 bg-slate-800/50 text-white placeholder-slate-500 border border-slate-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={isStreaming}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isStreaming}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;