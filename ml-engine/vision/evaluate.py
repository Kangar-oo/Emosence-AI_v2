import tensorflow as tf
from keras.preprocessing.image import ImageDataGenerator
import os

MODEL_PATH = '../ml-engine/models/emosense_cnn.h5'
TEST_DIR = '../dataset/test'


def evaluate():
    if not os.path.exists(MODEL_PATH):
        print("Model not found — run train_model.py first")
        return

    model = tf.keras.models.load_model(MODEL_PATH)
    test_datagen = ImageDataGenerator(rescale=1./255)

    test_gen = test_datagen.flow_from_directory(
        TEST_DIR, target_size=(48, 48), batch_size=64,
        color_mode='grayscale', class_mode='categorical', shuffle=False
    )

    loss, acc = model.evaluate(test_gen)
    print(f"Test accuracy: {acc * 100:.2f}%")
    # anything above ~65% on FER-2013 is reasonable for a 7-class problem
    # the dataset itself has noisy labels so there's a hard ceiling around 72-75%


if __name__ == "__main__":
    evaluate()