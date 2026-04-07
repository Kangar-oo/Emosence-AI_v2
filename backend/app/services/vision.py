import numpy as np
import cv2
import base64
import os
from typing import Tuple

from app.core.config import get_settings

settings = get_settings()

EMOTION_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model

    try:
        import tensorflow as tf

        path = settings.CNN_MODEL_PATH
        if os.path.exists(path):
            _model = tf.keras.models.load_model(path)
            print("✅ Vision model loaded.")
        else:
            # FIXME: this silently falls back to Neutral — add a warning banner in the UI
            print(f"⚠️  Model not found at {path}. Defaulting to Neutral.")
            _model = None
    except Exception as e:
        print(f"⚠️  Couldn't load vision model: {e}")
        _model = None

    return _model


def analyze_frame(image_b64: str) -> Tuple[str, float]:
    model = _load_model()
    if not model or not image_b64:
        return "Neutral", 0.0

    try:
        raw = image_b64.split(",")[1] if "," in image_b64 else image_b64
        img_bytes = base64.b64decode(raw)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

        img = cv2.resize(img, (48, 48))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)
        img = np.expand_dims(img, axis=-1)

        preds = model.predict(img, verbose=0)
        idx = int(np.argmax(preds[0]))
        conf = float(np.max(preds[0]))

        # TODO: add confidence threshold — if conf < 0.4, return Neutral
        # was getting too many random Angry detections with sunlight behind me

        print(f"👁️  {EMOTION_LABELS[idx]} ({conf:.2%})")
        return EMOTION_LABELS[idx], conf

    except Exception as e:
        print(f"Vision error: {e}")
        return "Neutral", 0.0
