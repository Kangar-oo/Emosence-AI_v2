from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field
import uuid


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SessionDocument(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=utc_now)
    last_active: datetime = Field(default_factory=utc_now)
    message_count: int = 0
    dominant_emotion: Optional[str] = None


class MessageDocument(BaseModel):
    session_id: str
    role: Literal["user", "model"]
    text: str
    timestamp: datetime = Field(default_factory=utc_now)


# one entry per AI response — links emotion reading to the message that triggered it
class EmotionLogDocument(BaseModel):
    session_id: str
    emotion: str
    confidence: float
    source: Literal["vision", "text"] = "vision"
    # only storing snippet so we don't bloat the collection with full message text
    user_text_snippet: str
    timestamp: datetime = Field(default_factory=utc_now)
