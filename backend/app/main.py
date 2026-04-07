from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router
from app.core.config import get_settings
from app.core.database import connect_db, disconnect_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 EmoSense v2 starting...")
    print(f"   model : {settings.OLLAMA_MODEL}")
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="EmoSense AI",
    version="2.0.0",
    lifespan=lifespan,
)

# TODO: tighten this to specific origins before any kind of deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(analytics_router)
# app.include_router(audio_router)    # Feature 3 — whisper/piper
# app.include_router(vision_router)   # Feature 4 — mediapipe


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
