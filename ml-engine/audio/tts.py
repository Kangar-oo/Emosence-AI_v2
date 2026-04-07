# placeholder for Feature 3 — Piper TTS
#
# picked Piper over Coqui XTTS because:
#   - Coqui needs 4-8 seconds warm-up per sentence on CPU — too slow for real-time
#   - Piper generates audio in ~150ms using ONNX runtime
#   - en_US-lessac-medium sounds natural enough without being too robotic
#
# the plan is to stream the WAV back as a binary response
# and play it client-side using the Web Audio API
