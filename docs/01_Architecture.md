# Architecture

Last updated: April 2026

---

## Overview

Three independent services talking over HTTP:

```
┌───────────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
│   React Frontend  │◄──SSE──│   FastAPI Backend (8000) │◄────── │ MongoDB (27017)  │
│   (Vite, :5173)   │        │   + ML Engine integration│        │  (Motor async)   │
└───────────────────┘        └──────────────────────────┘        └──────────────────┘
                                          │
                             ┌────────────┼────────────┐
                             ▼            ▼            ▼
                        Ollama LLM   MediaPipe    Whisper/Piper
                        (llama3.2)   (Vision)    (Audio STT/TTS)
```

| Service | Port | Tech |
|---|---|---|
| Frontend | 5173 | React + Vite + Zustand |
| Backend | 8000 | FastAPI + Motor |
| MongoDB | 27017 | MongoDB 7 |
| Ollama | 11434 | Local LLM runtime |

---

## What happens when a user sends a message

1. Frontend captures text + webcam frame (base64 JPEG)
2. POST to `/api/chat/stream` with `{text, image_b64, session_id}`
3. Backend runs vision model on the image → emotion + confidence
4. Backend queries MongoDB for the last 5 emotional context entries
5. Builds enriched system prompt, calls `ollama(stream=True)`
6. SSE tokens stream back to React → rendered word-by-word
7. After stream: full response + emotion logged to MongoDB (BackgroundTask)

---

## Backend module layout

```
backend/app/
├── api/
│   ├── chat.py         # SSE streaming endpoint
│   ├── analytics.py    # mood timeline (Feature 5)
│   └── audio.py        # whisper/piper (Feature 3, TODO)
├── core/
│   ├── config.py       # reads .env via pydantic-settings
│   └── database.py     # Motor client + indexes
├── models/
│   └── db.py           # collection schemas
├── services/
│   ├── llm.py          # ollama streaming wrapper
│   ├── memory.py       # RAG + DB logging
│   └── vision.py       # frame → emotion
└── main.py
```

---

## Key decisions

| Decision | Why |
|---|---|
| MongoDB over SQLite | Motor is properly async; chat data is document-shaped |
| SSE over WebSockets | One-way stream is all we need; simpler CORS |
| MediaPipe over CNN | No GPU, works in low light, 8ms vs 50ms |
| Faster-Whisper | 4x faster than OpenAI Whisper, same API |
