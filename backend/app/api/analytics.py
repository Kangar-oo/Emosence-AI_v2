from fastapi import APIRouter, Query
from app.services.memory import get_session_timeline
from app.core.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/session")
async def get_session_analytics(session_id: str = Query(...)):
    db = get_db()
    timeline = await get_session_timeline(db, session_id)

    # motor returns datetime objects — json can't serialize them directly
    for entry in timeline:
        if "timestamp" in entry and hasattr(entry["timestamp"], "isoformat"):
            entry["timestamp"] = entry["timestamp"].isoformat()

    return {"session_id": session_id, "timeline": timeline}
