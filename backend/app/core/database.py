from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    # basic indexes — without these the RAG query was painfully slow on my machine
    await db.sessions.create_index("session_id", unique=True)
    await db.messages.create_index([("session_id", 1), ("timestamp", 1)])
    await db.emotion_log.create_index([("session_id", 1), ("timestamp", 1)])

    # auto-delete old emotion logs after 90 days (privacy thing)
    # TODO: make this configurable via .env instead of hardcoded
    await db.emotion_log.create_index(
        "timestamp", expireAfterSeconds=60 * 60 * 24 * 90, name="emotion_ttl"
    )

    print(f"✅ MongoDB connected → {settings.MONGO_URI}/{settings.MONGO_DB_NAME}")


async def disconnect_db() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("DB not initialized — did lifespan run?")
    return db
