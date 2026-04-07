import json
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator

from app.services.llm import stream_llm_response
from app.services.vision import analyze_frame
from app.services.memory import ensure_session, get_rag_context, log_interaction
from app.core.database import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    text: str
    image_b64: Optional[str] = None
    session_id: Optional[str] = "default"


async def _stream_and_capture(
    user_text: str,
    image_b64: Optional[str],
    session_id: str,
    background_tasks: BackgroundTasks,
) -> AsyncGenerator[bytes, None]:
    db = get_db()
    await ensure_session(db, session_id)

    emotion, confidence = analyze_frame(image_b64 or "")
    history_context = await get_rag_context(db, session_id)

    # collect tokens so we can log the full response to mongo after streaming
    # had to do it this way because we can't await inside the generator after yield
    collected: list[str] = []

    async for chunk in stream_llm_response(user_text, emotion, confidence, history_context):
        try:
            parsed = json.loads(chunk[len("data: "):].strip())
            if not parsed.get("done") and parsed.get("token"):
                collected.append(parsed["token"])
        except Exception:
            pass
        yield chunk.encode("utf-8")

    background_tasks.add_task(
        log_interaction,
        db=db,
        session_id=session_id,
        user_text=user_text,
        ai_text="".join(collected),
        emotion=emotion,
        confidence=confidence,
    )


@router.post("/stream")
async def chat_stream(payload: ChatRequest, background_tasks: BackgroundTasks):
    return StreamingResponse(
        _stream_and_capture(
            user_text=payload.text,
            image_b64=payload.image_b64,
            session_id=payload.session_id or "default",
            background_tasks=background_tasks,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
