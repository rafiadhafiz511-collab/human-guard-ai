
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.device_channel import DeviceChannel
from app.models.device_command import DeviceCommand


# ============================================================
# ALLOWED DEVICE COMMANDS
# ============================================================
#
# These are the standard commands supported by each device type.
#
# Architecture:
#
#   API / Automation / Channel
#              ↓
#       create_device_command()
#              ↓
#        device_commands
#              ↓
#          pending
#
# ============================================================

ALLOWED_COMMANDS = {
    "PUMP": {
        "PUMP_ON",
        "PUMP_OFF",
        "AUTO_MODE",
        "MANUAL_MODE",
    },

    "SMART_PUMP": {
        "PUMP_ON",
        "PUMP_OFF",
        "AUTO_MODE",
        "MANUAL_MODE",
    },

    "LIGHT": {
        "LIGHT_ON",
        "LIGHT_OFF",
    },

    "FAN": {
        "FAN_ON",
        "FAN_OFF",
    },

    "TV": {
        "TV_ON",
        "TV_OFF",
    },

    "AC": {
        "AC_ON",
        "AC_OFF",
    },

    "SMART_PLUG": {
        "SMART_PLUG_ON",
        "SMART_PLUG_OFF",
    },
}


# ============================================================
# CHANNEL COMMAND VALIDATION
# ============================================================

def is_channel_command(command: str) -> bool:
    """
    Check whether a command is a channel command.

    Examples:

        CHANNEL:1:ON
        CHANNEL:1:OFF
        CHANNEL:2:ON
        CHANNEL:2:OFF
    """

    parts = command.split(":")

    if len(parts) != 3:
        return False

    if parts[0] != "CHANNEL":
        return False

    try:
        channel_number = int(parts[1])
    except ValueError:
        return False

    if channel_number < 1:
        return False

    if parts[2] not in {"ON", "OFF"}:
        return False

    return True


# ============================================================
# COMMAND VALIDATION
# ============================================================

def validate_device_command(
    db: Session,
    device: Device,
    command: str,
) -> str:
    """
    Validate and normalize a device command.

    Returns:
        Normalized command string.

    Raises:
        ValueError:
            If the command is not supported.
    """

    command_name = command.strip().upper()

    if not command_name:
        raise ValueError(
            "Command cannot be empty"
        )

    # --------------------------------------------------------
    # CHANNEL COMMAND
    # --------------------------------------------------------

    if is_channel_command(command_name):
        parts = command_name.split(":")
        channel_number = int(parts[1])

        channel = (
            db.query(DeviceChannel)
            .filter(
                DeviceChannel.device_id == device.id,
                DeviceChannel.channel_number == channel_number,
            )
            .first()
        )

        if channel is None:
            raise ValueError(
                f"Channel {channel_number} does not exist "
                f"for device '{device.device_id}'"
            )

        return command_name

    # --------------------------------------------------------
    # STANDARD DEVICE COMMAND
    # --------------------------------------------------------

    allowed_commands = ALLOWED_COMMANDS.get(
        device.device_type,
        set(),
    )

    if command_name not in allowed_commands:
        raise ValueError(
            f"Invalid command '{command_name}' "
            f"for device type '{device.device_type}'"
        )

    return command_name


# ============================================================
# CANCEL PENDING COMMANDS
# ============================================================

def cancel_pending_commands(
    db: Session,
    device: Device,
) -> int:
    """
    Cancel all existing pending commands for a device.

    This prevents multiple commands from building up in the
    queue when a newer command replaces an older one.

    Example:

        PUMP_ON  -> pending
        PUMP_OFF -> new request

    Result:

        PUMP_ON  -> cancelled
        PUMP_OFF -> pending

    Returns:
        Number of cancelled commands.
    """

    pending_commands = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device.id,
            DeviceCommand.status == "pending",
        )
        .all()
    )

    cancelled_count = 0

    for old_command in pending_commands:
        old_command.status = "cancelled"
        cancelled_count += 1

    return cancelled_count


# ============================================================
# CREATE DEVICE COMMAND
# ============================================================

def create_device_command(
    db: Session,
    device: Device,
    command: str,
) -> DeviceCommand:
    """
    Create a pending command for a device.

    This is the central command creation service.

    Used by:

        - Phone control
        - Automation engine
        - Channel control
        - Future scenes
        - Future schedules

    Command lifecycle:

        pending
            ↓
          sent
            ↓
        completed
          OR
         failed
    """

    # --------------------------------------------------------
    # VALIDATE COMMAND
    # --------------------------------------------------------

    command_name = validate_device_command(
        db=db,
        device=device,
        command=command,
    )

    # --------------------------------------------------------
    # CANCEL OLD PENDING COMMANDS
    # --------------------------------------------------------

    cancel_pending_commands(
        db=db,
        device=device,
    )

    # --------------------------------------------------------
    # CREATE NEW COMMAND
    # --------------------------------------------------------
    #
    # created_at is explicitly assigned because the
    # DeviceCommand model requires this field.
    #
    # --------------------------------------------------------

    device_command = DeviceCommand(
        device_id=device.id,
        command=command_name,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )

    db.add(device_command)

    return device_command
