import cv2
import numpy as np
from ultralytics import YOLO

# Load YOLO model only once
model = YOLO("yolov8n.pt")


def decode_image(image_bytes: bytes):
    """
    Convert uploaded image bytes into OpenCV image.
    """

    np_array = np.frombuffer(image_bytes, np.uint8)

    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid Image")

    return image


def detect_person(image):
    """
    Detect person using YOLOv8.
    """

    results = model(image)

    for result in results:
        for box in result.boxes:

            class_id = int(box.cls[0])

            # COCO Person Class = 0
            if class_id == 0:

                confidence = float(box.conf[0])

                return {
                    "person": True,
                    "confidence": round(confidence, 2),
                    "alarm": confidence >= 0.70,
                }

    return {
        "person": False,
        "confidence": 0.0,
        "alarm": False,
    }