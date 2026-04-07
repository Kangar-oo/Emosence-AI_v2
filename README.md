# EmoSense AI v2

A local, offline mental health assistant. Started as a quick weekend project, this is the v2 rewrite fixing the latency and memory issues of the original prototype.

No APIs are called. No audio or video leaves the machine. Everything runs locally on consumer hardware.

---

## What changed in V2

- **Streaming LLM**: V1 waited for the entire response before showing anything. V2 streams tokens via SSE so it feels instantaneous.
- **MongoDB**: SQLite was too rigid for chat logs. Moved to MongoDB with Motor for async queries.
- **Memory (RAG)**: The AI now remembers your previous responses in a session.
- **Better Voice (WIP)**: Swapping the browser Web Speech API (which secretly goes to Google/Apple) for Faster-Whisper and Piper TTS.
- **Vision Update (WIP)**: The old FER-2013 CNN model breaks in bad lighting. Moving to MediaPipe Face Mesh.

---

## Architecture

- **Frontend**: React, Vite, Tailwind, Zustand
- **Backend**: FastAPI, Motor
- **Database**: MongoDB 7
- **LLM**: Ollama (llama3.2)
- **ML**: Faster-Whisper, Piper, CNN / MediaPipe

See the `docs/` folder for technical deeper dives into each component.

---

## Setup

You need Node 18, Python 3.10+, MongoDB, and Ollama.

1. **Pull the LLM**
   ```bash
   ollama pull llama3.2
   ```

2. **Database**
   Start MongoDB locally, e.g. via Docker:
   ```bash
   docker run -d -p 27017:27017 --name emosense-mongo mongo:7
   ```

3. **Backend**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # edit if needed
   uvicorn app.main:app --reload
   ```

4. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. Make sure you give it camera permissions.

---

## Troubleshooting

- **MongoDB errors**: Make sure the container is actually running
- **Model not found**: If the CNN weights aren't present, the vision engine gracefully falls back to passing "Neutral" to the LLM. You'll need to train it using the scripts in `ml-engine/vision` or wait for the MediaPipe rewrite.
- **Ollama connection refused**: Ensure `ollama serve` is running in another terminal.

---

**License:** MIT