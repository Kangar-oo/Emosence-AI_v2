from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.db import SessionDocument, MessageDocument, EmotionLogDocument


async def ensure_session(db: AsyncIOMotorDatabase, session_id: str) -> None:
    await db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {"last_active": datetime.now(timezone.utc)},
            "$setOnInsert": {
                "session_id": session_id,
                "created_at": datetime.now(timezone.utc),
                "message_count": 0,
                "dominant_emotion": None,
            },
        },
        upsert=True,
    )


async def log_interaction(
    db: AsyncIOMotorDatabase,
    session_id: str,
    user_text: str,
    ai_text: str,
    emotion: str,
    confidence: float,
) -> None:
    await db.messages.insert_one(
        MessageDocument(session_id=session_id, role="user", text=user_text).model_dump()
    )
    await db.messages.insert_one(
        MessageDocument(session_id=session_id, role="model", text=ai_text).model_dump()
    )
    await db.emotion_log.insert_one(
        EmotionLogDocument(
            session_id=session_id,
            emotion=emotion,
            confidence=confidence,
            source="vision",
            user_text_snippet=user_text[:80],
        ).model_dump()
    )

    # update session stats
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$inc": {"message_count": 1}, "$set": {"dominant_emotion": emotion}},
    )


async def get_rag_context(db: AsyncIOMotorDatabase, session_id: str) -> str:
    # grab the last 5 emotion entries for this session
    # 5 feels like a good number — enough context without bloating the prompt
    entries = await (
        db.emotion_log
        .find({"session_id": session_id})
        .sort("timestamp", -1)
        .limit(5)
        .to_list(length=5)
    )

    if not entries:
        return ""

    entries.reverse()  # oldest first makes more sense for the LLM to read

    lines = []
    n = len(entries)
    for i, e in enumerate(entries):
        label = "Last turn" if i == n - 1 else f"{n - i} turns ago"
        lines.append(
            f"  - {label}: felt '{e.get('emotion')}' ({e.get('confidence', 0):.0%})"
            f" → \"{e.get('user_text_snippet', '')}...\""
        )

    return "\n".join(lines)


async def get_session_timeline(db: AsyncIOMotorDatabase, session_id: str) -> list:
    # used by analytics endpoint for the mood graph
    return await (
        db.emotion_log
        .find(
            {"session_id": session_id},
            {"_id": 0, "emotion": 1, "confidence": 1, "timestamp": 1},
        )
        .sort("timestamp", 1)
        .to_list(length=500)
    )
