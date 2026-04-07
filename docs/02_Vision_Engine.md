# Vision Engine

---

## V1 vs V2

V1 used a custom CNN trained on FER-2013 — 48×48px grayscale, runs okay but breaks in anything except ideal lighting. Also doesn't handle glasses or partial occlusion well.

V2 plan is MediaPipe Face Mesh — 468 landmarks per frame, runs at ~8ms on CPU, and doesn't care about lighting.

| | V1 (CNN) | V2 (MediaPipe) |
|---|---|---|
| Input | 48×48 grayscale | Full color, any res |
| Lighting | Poor | Good |
| Glasses | Usually fails | Robust |
| Inference | ~50ms | ~8ms |
| GPU needed | Yes (recommended) | No |

---

## How MediaPipe emotion inference works

MediaPipe gives you 468 3D facial landmark points `(x, y, z)` normalized to `[0, 1]`.

The emotion is derived from distances between key landmark groups:

- **Eyebrow position** — landmarks 70, 63, 105, 66 (surprise / fear)
- **Lip corners** — landmarks 61, 291 (happiness / sadness)  
- **Mouth openness** — vertical gap between 13 and 14

```
AU1 (Inner Brow Raise):  Δy(landmark_17, landmark_10) / face_height
AU12 (Lip Corner Pull):  Δx(landmark_61, landmark_291) / face_width
```

These are "Action Units" from the FACS (Facial Action Coding System) — it's the industry standard for this stuff.

Hardware: CPU-only, ~8ms/frame, ~150MB RAM.

---

## Testing

```bash
pytest tests/test_vision.py -v

# manual
python ml-engine/vision/mediapipe_analyzer.py --image test_face.jpg
```

If no webcam frame, defaults to `Neutral, 0.0` — handled in vision.py.
