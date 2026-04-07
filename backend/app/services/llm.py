import json
import ollama
from typing import AsyncGenerator

from app.core.config import get_settings

settings = get_settings()


def _build_prompt(emotion: str, confidence: float, history: str = "") -> str:
    history_block = f"\nPAST CONTEXT:\n{history}" if history else ""

    return (
        "You are EmoSense, a compassionate mental health assistant. "
        "You speak warmly, never clinically. No medical diagnoses ever.\n"
        f"CURRENT: User appears to be feeling '{emotion}' ({confidence:.0%}).{history_block}\n"
        "Respond with genuine empathy in 2-3 sentences. "
        "Acknowledge their state naturally — don't bluntly announce the detected emotion."
    )


async def stream_llm_response(
    user_text: str,
    emotion: str,
    confidence: float,
    history_context: str = "",
) -> AsyncGenerator[str, None]:
    prompt = _build_prompt(emotion, confidence, history_context)

    try:
        # stream=True is the whole point of this function
        # tried asyncio run_in_executor approach first but it was messier
        stream = ollama.chat(
            model=settings.OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_text},
            ],
            stream=True,
        )

        for chunk in stream:
            token = chunk["message"]["content"]
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

        # done sentinel carries mood metadata back to the frontend
        yield f"data: {json.dumps({'token': '', 'done': True, 'mood': emotion, 'confidence': round(confidence, 4)})}\n\n"

    except Exception as e:
        # TODO: distinguish between "ollama not running" vs "model not pulled"
        # right now both give the same generic message which is confusing
        err_msg = f"I'm having trouble thinking right now. ({e})"
        yield f"data: {json.dumps({'token': err_msg, 'done': True, 'mood': emotion, 'confidence': 0.0, 'error': True})}\n\n"
        print(f"LLM error: {e}")
