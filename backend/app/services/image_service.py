from pathlib import Path
from datetime import datetime
import uuid


BASE_DIR = Path("app/uploads")


def save_image(image_bytes: bytes) -> str:
    """
    Save uploaded image and return relative path.
    """

    today = datetime.now()

    folder = (
        BASE_DIR
        / str(today.year)
        / f"{today.month:02}"
        / f"{today.day:02}"
    )

    folder.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.jpg"

    filepath = folder / filename

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return str(filepath).replace("\\", "/")