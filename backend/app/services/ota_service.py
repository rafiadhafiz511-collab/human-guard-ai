
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.firmware import Firmware


# ============================================================
# OTA STATUS
# ============================================================

OTA_IDLE = "idle"
OTA_PENDING = "pending"
OTA_DOWNLOADING = "downloading"
OTA_INSTALLING = "installing"
OTA_COMPLETED = "completed"
OTA_FAILED = "failed"


# ============================================================
# VERSION NORMALIZATION
# ============================================================

def normalize_version(version: Optional[str]) -> str:
    """
    Normalize firmware version.

    Examples:
        1.0.0 -> 1.0.0
        v1.0.0 -> 1.0.0
    """

    if not version:
        return "0.0.0"

    version = version.strip().lower()

    if version.startswith("v"):
        version = version[1:]

    return version


# ============================================================
# VERSION COMPARISON
# ============================================================

def parse_version(version: Optional[str]) -> tuple[int, ...]:
    """
    Convert version string into comparable numbers.

    Example:
        1.2.10 -> (1, 2, 10)
    """

    normalized = normalize_version(version)

    parts = normalized.split(".")

    result = []

    for part in parts:
        try:
            result.append(int(part))
        except ValueError:
            result.append(0)

    return tuple(result)


def is_newer_version(
    current_version: Optional[str],
    target_version: Optional[str],
) -> bool:
    """
    Return True when target firmware is newer.
    """

    current = parse_version(current_version)
    target = parse_version(target_version)

    return target > current


# ============================================================
# FIND FIRMWARE
# ============================================================

def get_firmware(
    db: Session,
    firmware_id: str,
) -> Optional[Firmware]:
    """
    Find firmware by ID.
    """

    return (
        db.query(Firmware)
        .filter(
            Firmware.id == firmware_id,
            Firmware.is_active.is_(True),
        )
        .first()
    )


# ============================================================
# FIND LATEST FIRMWARE
# ============================================================

def get_latest_firmware(
    db: Session,
    device_type: str,
) -> Optional[Firmware]:
    """
    Find the newest active firmware for a device type.
    """

    firmwares = (
        db.query(Firmware)
        .filter(
            Firmware.device_type == device_type,
            Firmware.is_active.is_(True),
        )
        .all()
    )

    if not firmwares:
        return None

    return max(
        firmwares,
        key=lambda firmware: parse_version(
            firmware.version
        ),
    )


# ============================================================
# CHECK OTA AVAILABILITY
# ============================================================

def check_update_available(
    db: Session,
    device: Device,
) -> Optional[Firmware]:
    """
    Find a newer firmware for the device.

    Returns:
        Firmware object when update is available.
        None when device is already up to date.
    """

    firmware = get_latest_firmware(
        db=db,
        device_type=device.device_type,
    )

    if not firmware:
        return None

    if not is_newer_version(
        current_version=device.firmware_version,
        target_version=firmware.version,
    ):
        return None

    return firmware


# ============================================================
# REQUEST OTA UPDATE
# ============================================================

def request_ota_update(
    db: Session,
    device: Device,
    firmware: Firmware,
) -> Device:
    """
    Prepare a device for OTA update.

    The ESP32 will receive these values through
    the heartbeat response and download the firmware
    directly from the backend.
    """

    if firmware.device_type != device.device_type:
        raise ValueError(
            "Firmware device type does not match device type"
        )

    if not is_newer_version(
        current_version=device.firmware_version,
        target_version=firmware.version,
    ):
        raise ValueError(
            "Firmware version is not newer than current version"
        )

    device.ota_target_version = normalize_version(
        firmware.version
    )

    device.ota_firmware_url = firmware.download_url

    device.ota_checksum = firmware.sha256

    device.ota_status = OTA_PENDING

    device.ota_requested_at = datetime.now(
        timezone.utc
    )

    device.ota_completed_at = None

    return device


# ============================================================
# MARK OTA COMPLETED
# ============================================================

def mark_ota_completed(
    db: Session,
    device: Device,
    firmware_version: str,
) -> Device:
    """
    Mark OTA update as completed.
    """

    device.firmware_version = normalize_version(
        firmware_version
    )

    device.ota_status = OTA_COMPLETED

    device.ota_completed_at = datetime.now(
        timezone.utc
    )

    device.ota_target_version = None
    device.ota_firmware_url = None
    device.ota_checksum = None

    return device


# ============================================================
# MARK OTA FAILED
# ============================================================

def mark_ota_failed(
    db: Session,
    device: Device,
) -> Device:
    """
    Mark OTA update as failed.
    """

    device.ota_status = OTA_FAILED

    return device
