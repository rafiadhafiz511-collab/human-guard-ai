import hashlib
from pathlib import Path
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.permissions import require_admin
from app.database.database import get_db
from app.models.firmware import Firmware
from app.models.user import User


router = APIRouter(
    prefix="/firmware",
    tags=["Firmware"],
)


# ============================================================
# STORAGE
# ============================================================

FIRMWARE_DIR = (
    Path(__file__).resolve().parents[2]
    / "uploads"
    / "firmware"
)

FIRMWARE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# UPLOAD FIRMWARE
# ============================================================

@router.post("/upload")
async def upload_firmware(
    version: str = Form(...),
    device_type: str = Form(...),
    release_notes: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Upload a firmware binary.

    Flow:

        .bin file
            ↓
        validate
            ↓
        calculate SHA256
            ↓
        save file
            ↓
        create Firmware record
    """

    # --------------------------------------------------------
    # VALIDATE FILE
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Firmware file is required",
        )

    if not file.filename.lower().endswith(".bin"):
        raise HTTPException(
            status_code=400,
            detail="Only .bin firmware files are allowed",
        )

    if not version.strip():
        raise HTTPException(
            status_code=400,
            detail="Firmware version is required",
        )

    if not device_type.strip():
        raise HTTPException(
            status_code=400,
            detail="Device type is required",
        )

    # --------------------------------------------------------
    # NORMALIZE VERSION
    # --------------------------------------------------------

    normalized_version = version.strip()

    if normalized_version.lower().startswith("v"):
        normalized_version = normalized_version[1:]

    # --------------------------------------------------------
    # CHECK DUPLICATE
    # --------------------------------------------------------

    existing = (
        db.query(Firmware)
        .filter(
            Firmware.version == normalized_version,
            Firmware.device_type == device_type.strip(),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "Firmware version already exists "
                "for this device type"
            ),
        )

    # --------------------------------------------------------
    # TEMPORARY FILE
    # --------------------------------------------------------

    safe_filename = Path(file.filename).name

    temp_path = FIRMWARE_DIR / (
        f"upload_{safe_filename}"
    )

    final_filename = (
        f"{device_type.strip()}_"
        f"v{normalized_version}_"
        f"{safe_filename}"
    )

    final_path = FIRMWARE_DIR / final_filename

    sha256 = hashlib.sha256()
    file_size = 0

    try:

        # ----------------------------------------------------
        # SAVE + HASH
        # ----------------------------------------------------

        with temp_path.open("wb") as buffer:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                buffer.write(chunk)

                sha256.update(chunk)

                file_size += len(chunk)

        checksum = sha256.hexdigest()

        # ----------------------------------------------------
        # MOVE TO FINAL PATH
        # ----------------------------------------------------

        shutil.move(
            str(temp_path),
            str(final_path),
        )

        # ----------------------------------------------------
        # DATABASE RECORD
        # ----------------------------------------------------

        firmware = Firmware(
            version=normalized_version,
            device_type=device_type.strip(),
            filename=safe_filename,
            download_url=str(final_path),
            sha256=checksum,
            file_size=file_size,
            release_notes=release_notes,
            is_active=True,
        )

        db.add(firmware)

        db.commit()

        db.refresh(firmware)

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {
            "success": True,
            "message": "Firmware uploaded successfully",
            "firmware": {
                "id": firmware.id,
                "version": firmware.version,
                "device_type": firmware.device_type,
                "filename": firmware.filename,
                "download_url": (
                    f"/api/v1/firmware/"
                    f"{firmware.id}/download"
                ),
                "sha256": firmware.sha256,
                "file_size": firmware.file_size,
                "is_active": firmware.is_active,
                "created_at": firmware.created_at,
            },
        }

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        if temp_path.exists():
            temp_path.unlink()

        if final_path.exists():
            final_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to upload firmware",
        )

    finally:
        await file.close()


# ============================================================
# DOWNLOAD FIRMWARE
# ============================================================

@router.get("/{firmware_id}/download")
def download_firmware(
    firmware_id: str,
    db: Session = Depends(get_db),
):
    """
    Download firmware binary.
    """

    firmware = (
        db.query(Firmware)
        .filter(
            Firmware.id == firmware_id,
            Firmware.is_active.is_(True),
        )
        .first()
    )

    if not firmware:
        raise HTTPException(
            status_code=404,
            detail="Firmware not found",
        )

    file_path = Path(
        firmware.download_url
    )

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Firmware file not found",
        )

    return FileResponse(
        path=file_path,
        filename=firmware.filename,
        media_type="application/octet-stream",
    )