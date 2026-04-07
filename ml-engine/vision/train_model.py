import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
import os

TRAIN_DIR = '../dataset/train'
TEST_DIR = '../dataset/test'
IMG_SIZE = (48, 48)
BATCH_SIZE = 64
EPOCHS = 30  # 30 was enough to plateau on FER-2013, going higher didn't help much


def train_cnn():
    if not os.path.exists(TRAIN_DIR):
        print(f"Dataset not found at {TRAIN_DIR}")
        print("Download FER-2013 from Kaggle and put train/ and test/ in the dataset folder.")
        return

    # augmentation helped a lot with overfitting — rotation + zoom felt most natural
    # horizontal_flip is fine since emotions aren't laterally asymmetric
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    val_datagen = ImageDataGenerator(rescale=1./255)

    print("Loading dataset...")
    try:
        train_gen = train_datagen.flow_from_directory(
            TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            color_mode='grayscale', class_mode='categorical'
        )
        val_gen = val_datagen.flow_from_directory(
            TEST_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            color_mode='grayscale', class_mode='categorical'
        )
    except Exception as e:
        print(f"Data loading failed: {e}")
        return

    # 3-block CNN — nothing fancy, just what worked after a few attempts
    # tried VGG-style deeper blocks but they overfit badly without more data
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
        BatchNormalization(),
        MaxPooling2D(2, 2),
        Dropout(0.25),

        Conv2D(64, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(2, 2),
        Dropout(0.25),

        Conv2D(128, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(2, 2),
        Dropout(0.25),

        Flatten(),
        Dense(256, activation='relu'),
        BatchNormalization(),
        Dropout(0.5),
        Dense(7, activation='softmax')
    ])

    # lr=0.0001 was much more stable than the default 0.001 for this dataset
    model.compile(
        optimizer=Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    print("Training... (Ctrl+C stops early if accuracy plateaus)")
    model.fit(train_gen, epochs=EPOCHS, validation_data=val_gen)

    # TODO: update save path to ml-engine/models/ now that files were reorganized
    model.save('emosense_cnn.h5')
    print("Saved as emosense_cnn.h5")


if __name__ == "__main__":
    train_cnn()