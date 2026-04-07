# Language Engine (LLM + Streaming + RAG)

---

## The problem with V1

V1 called `ollama.chat()` and waited for the full response before sending anything back. On my machine that's 8–12 seconds for a medium-length reply. For a mental health app, waiting that long mid-conversation feels cold and broken.

The fix is SSE (Server-Sent Events) — stream tokens as they're generated, same way ChatGPT does it.

---

## How streaming works

```
User sends message
      │
      ▼
POST /api/chat/stream
      │
      ├── 1. vision analysis (image_b64)
      ├── 2. RAG context query from MongoDB
      ├── 3. build system prompt
      │
      ▼
ollama.chat(stream=True)
      │
      ▼
StreamingResponse (text/event-stream)
      │
      ▼
useSSEStream hook in React → tokens appended to chat bubble
```

Each SSE event is a JSON line:
```
data: {"token": "I", "done": false}
data: {"token": " understand", "done": false}
data: {"token": "", "done": true, "mood": "Sad", "confidence": 0.87}
```

The `done: true` event carries the mood metadata back to the frontend so it can update the emotion badge.

---

## RAG — why not just send the whole history?

Injecting the full message history into every prompt gets expensive fast. At 5+ messages per session you're eating a lot of tokens for context the model mostly ignores anyway.

Instead we query just the last 5 entries from `emotion_log` and format them as a brief context block:

```
PAST CONTEXT:
  - 3 turns ago: felt 'Sad' (82%) → "my boss criticized my report..."
  - 2 turns ago: felt 'Sad' (74%) → "I couldn't sleep last night..."
  - Last turn:   felt 'Neutral' (61%) → "talking helps a bit..."
```

This gives the LLM enough to notice patterns ("user has been sad for several messages") without blowing up the context window. Tested with 3, 5, and 10 entries — 5 was the sweet spot.

---

## Testing

```bash
pytest tests/test_streaming.py -v

# quick manual test via curl
curl -N http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious", "session_id": "test-123"}'
```

If Ollama is offline, the error handler in `llm.py` returns a graceful fallback token so the stream still completes cleanly.
