# Testing

Each feature can be tested independently without the whole stack running. That was a design goal from the start — made the SSE streaming work much easier to debug in isolation.

---

## Running tests

```bash
cd backend
pytest tests/ -v          # all
pytest tests/test_streaming.py -v    # just feature 1
pytest tests/test_database.py -v     # just feature 2
```

---

## Per-feature checklist

**Feature 1 — Streaming**
- [ ] First token arrives in under 1 second
- [ ] Done flag received at end of stream
- [ ] Graceful fallback when Ollama is offline

**Feature 2 — MongoDB**
- [ ] Session document created on first message
- [ ] Emotion log increments with each send
- [ ] RAG context visible in logged system prompt

**Feature 3 — Voice**
- [ ] Whisper transcribes a WAV file correctly
- [ ] Piper generates audio and returns WAV stream
- [ ] Both work with no internet connection (firewall test)

**Feature 4 — Vision**
- [ ] MediaPipe returns emotion label from a test image
- [ ] Falls back to Neutral on blank/no-face image
- [ ] Result shows up in SSE done event

**Feature 5 — Analytics**
- [ ] `/api/analytics/session?session_id=X` returns timeline array
- [ ] Recharts line chart renders with emotion data points

---

## End-to-end test (full stack)

1. Start everything (`start.bat` or `docker-compose up`)
2. Open `http://localhost:5173`
3. Allow camera, send a text message — verify word-by-word streaming
4. Send via voice — verify transcript appears in input
5. Open Dashboard tab — verify mood graph has data points
6. Refresh page — verify conversation is still there
