import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv1D,
    MaxPooling1D,
    Bidirectional,
    LSTM,
    Dense,
    Dropout,
    Input
)


def build_model(input_shape):
    """
    Builds a CNN + BiLSTM model for binary intrusion detection.
    """

    model = Sequential([
        Input(shape=input_shape),

        Conv1D(
            filters=64,
            kernel_size=3,
            activation='relu',
            padding='same'
        ),

        MaxPooling1D(pool_size=2),

        Bidirectional(
            LSTM(
                64,
                return_sequences=False
            )
        ),

        Dropout(0.3),

        Dense(
            64,
            activation='relu'
        ),

        Dense(
            2,
            activation='softmax'
        )
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model