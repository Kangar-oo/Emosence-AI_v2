# placeholder for Feature 3 — Faster-Whisper speech-to-text
#
# going with faster-whisper over openai-whisper because:
#   - 4x faster on CPU (int8 quantization)
#   - identical API, just swap the import
#   - "base" model is ~130MB which is acceptable
#
# TODO: add VAD (voice activity detection) to skip silence — reduces hallucinations
