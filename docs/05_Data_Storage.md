# Data Storage (MongoDB)

---

## Why MongoDB and not SQLite

My first plan was SQLite — no separate server, zero setup. Got about 30 minutes into the schema design and hit a wall: storing the emotion confidence per message needed a junction table, and if I wanted to add more fields later I'd need migrations. That's fine for a relational use-case but chat data is fundamentally a document.

MongoDB with Motor (the async driver) fits much better:
- Document-shaped data — no joins needed
- Motor is natively async — no thread pool workarounds for FastAPI
- TTL indexes for auto-expiry (privacy feature)
- Aggregation pipeline for analytics queries

---

## Collections

**`sessions`** — one doc per browser session
```json
{
  "session_id": "uuid4-string",
  "created_at": "ISODate",
  "last_active": "ISODate",
  "message_count": 12,
  "dominant_emotion": "Sad"
}
```

**`messages`** — one doc per chat turn (user or model)
```json
{
  "session_id": "uuid4-string",
  "role": "user | model",
  "text": "I feel really anxious today",
  "timestamp": "ISODate"
}
```

**`emotion_log`** — one doc per AI response, driving RAG and analytics
```json
{
  "session_id": "uuid4-string",
  "emotion": "Sad",
  "confidence": 0.87,
  "source": "vision",
  "user_text_snippet": "I've been struggling with...",
  "timestamp": "ISODate"
}
```

`emotion_log` has a TTL index — documents auto-delete after 90 days. Privacy feature.

---

## Queries

RAG context (last 5 emotional turns, used by memory.py):
```python
entries = await db.emotion_log
    .find({"session_id": session_id})
    .sort("timestamp", -1)
    .limit(5)
    .to_list(5)
```

Analytics timeline (used by the mood graph):
```python
timeline = await db.emotion_log
    .find({"session_id": sid}, {"_id": 0, "emotion": 1, "confidence": 1, "timestamp": 1})
    .sort("timestamp", 1)
    .to_list(500)
```

---

## Testing

```bash
pytest tests/test_database.py -v

# quick connection check
python -c "from app.core.database import get_db; print('OK')"
```
