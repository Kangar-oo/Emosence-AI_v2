# V1 Drawbacks & V2 Solutions

Notes on why I'm rewriting this and the architectural changes needed for V2.

---

## 1. Blocking LLM Calls
**Problem:** FastAPI waits for the entire Ollama response before returning. Puts a 5-15s delay between user sending a message and seeing anything happen. Frustrating UX.
**Fix:** Switch to SSE. FastAPI yields tokens from Ollama. Frontend needs a React hook to stream chunks into the chat bubble real-time.

## 2. No Real Memory
**Problem:** Chat history is just React `useState`. Refresh the tab and everything's gone. A therapy bot that has amnesia every session is useless.
**Fix:** Drop in a database to persist sessions. On new messages, fetch the last 4-5 emotional states from history (RAG) and silently inject them into the system prompt.

## 3. Web Speech API Isn't Private
**Problem:** Chrome's `SpeechRecognition` secretly sends audio to Google. That completely invalidates the "100% offline & private" claim. Also the built-in synthetic voices sound terrible.
**Fix:** Run `faster-whisper` locally for STT and `piper` for TTS. They can run on CPU without too much latency hit.

## 4. The CNN Model Breaks Easily
**Problem:** The custom CNN trained on FER-2013 is notoriously bad outside of perfect lighting conditions. It also freaks out if the user is wearing glasses or sits at a tough angle.
**Fix:** Rip out the CNN. Replace with MediaPipe Face Mesh. We can just use the geometric distances between facial landmarks to infer emotion (e.g., brow distance, lip corners). Much lighter and more robust.

## 5. Horrible Setup Process
**Problem:** Having to open 3 tabs to start Ollama, uvicorn, and vite is annoying.
**Fix:** Dockerize it and add a simple `start.bat` wrapper.

## 6. Meaningless Emotion Logging
**Problem:** It logs "Happy" or "Sad" but does nothing with it. Over a session you want to know if the user is actually cooling down or getting more stressed.
**Fix:** Pass the confidence float from the ML model to the frontend and chart it over time using a simple line graph (maybe Recharts). Let users see their mood trend.
