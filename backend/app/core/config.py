from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # switched to mongo after realizing sqlite would need migrations every time
    # we add a new emotion field. not worth it.
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "emosense"

    CNN_MODEL_PATH: str = "../ml-engine/models/emosense_cnn.h5"

    # whisper "base" is good enough for now, might bump to "small" later
    WHISPER_MODEL_SIZE: str = "base"
    PIPER_MODEL_PATH: str = "../ml-engine/audio/models/en_US-lessac-medium.onnx"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
