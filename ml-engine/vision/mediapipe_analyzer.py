# placeholder for Feature 4 — will replace the CNN with MediaPipe Face Mesh
# keeping the file here so imports don't break during development

# rough plan:
#   - use mp.solutions.face_mesh to get 468 landmarks per frame
#   - derive emotion from key landmark distances (eyebrow raise, lip corners, etc.)
#   - no GPU needed, runs at ~8ms per frame on CPU
#   - should fix the lighting/shadow issues the CNN keeps having
