# Audio Engine (STT + TTS)

---

## Why this matters

V1 used the browser's Web Speech API for voice input. The problem is that API sends your audio to Google or Apple servers to transcribe it. For an app that's supposed to be completely private, that's a fundamental contradiction.

Feature 3 replaces both STT and TTS with local models that never touch the network.

---

## Speech-to-Text: Faster-Whisper

Chose faster-whisper over the original openai-whisper because:
- 4x faster on CPU (int8 quantization vs float32)
- Same Python API, literally just change the import
- The "base" model is ~130MB which is manageable

```
Microphone → WAV blob → POST /api/audio/transcribe
                │
                ▼
    faster-whisper (int8, base model)
                │
                ▼
    {"transcript": "I've been feeling really anxious lately"}
```

Config that's worked well in testing:

```python
model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    audio_path,
    beam_size=5,
    language="en",
    vad_filter=True,          # skips silence — important, reduces hallucinations
    vad_parameters={"min_silence_duration_ms": 500}
)
```

`vad_filter=True` is important — without it Whisper will try to transcribe background noise and make stuff up.

Hardware: ~400ms for 5 seconds of audio on a modern CPU, ~250MB RAM, ~130MB storage.

---

## Text-to-Speech: Piper

Tried a few options:
- **Google TTS** — cloud, ruled out immediately
- **Coqui XTTS** — sounds great but ~4-8s generation time on CPU, too slow
- **Piper** — ~150ms generation, ONNX runtime, sounds natural enough

Using `en_US-lessac-medium` as the default voice — it has a warm tone which felt appropriate for a mental health context. There's also `en_US-hfc_female-medium` if you want an alternative.

```
POST /api/audio/speak  {"text": "I understand how you feel..."}
        │
        ▼
Piper TTS (ONNX, lessac-medium)
        │
        ▼
WAV stream → React Web Audio API
```

---

## Testing

```bash
pytest tests/test_audio.py -v

# manual
python ml-engine/audio/stt.py --audio test_audio.wav
python ml-engine/audio/tts.py --text "Hello, how are you?"
```

Fallback: if the audio endpoints aren't running, frontend falls back to browser Web Speech API with a visible warning banner.
