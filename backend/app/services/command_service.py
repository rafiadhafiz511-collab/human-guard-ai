from datetime import datetime, timezone

from app.models.device_command import DeviceCommand


COMMAND_TIMEOUT_SECONDS = 30
MAX_COMMAND_ATTEMPTS = 3


def mark_command_sent(command: DeviceCommand) -> None:
    """
    Mark a pending command as sent.

    Tracks:
    - first send time
    - latest attempt time
    - total attempt count
    """

    now = datetime.now(timezone.utc)

    command.status = "sent"

    if command.sent_at is None:
        command.sent_at = now

    command.last_attempt_at = now
    command.attempt_count += 1


def is_command_timeout(command: DeviceCommand) -> bool:
    """
    Check whether a sent command has timed out.
    """

    if command.status != "sent":
        return False

    if command.last_attempt_at is None:
        return False

    now = datetime.now(timezone.utc)

    # PostgreSQL may return naive datetime
    last_attempt = command.last_attempt_at

    if last_attempt.tzinfo is None:
        last_attempt = last_attempt.replace(
            tzinfo=timezone.utc
        )

    elapsed = (
        now - last_attempt
    ).total_seconds()

    return elapsed >= COMMAND_TIMEOUT_SECONDS


def can_retry_command(command: DeviceCommand) -> bool:
    """
    Check whether another delivery attempt is allowed.
    """

    return (
        command.attempt_count < MAX_COMMAND_ATTEMPTS
    )

def handle_command_timeout(command: DeviceCommand) -> str:
    """
    Decide what should happen when a sent command times out.

    Returns:
        "retry"  -> command can be sent again
        "failed" -> maximum attempts reached
        "active" -> command has not timed out
    """

    if not is_command_timeout(command):
        return "active"

    if can_retry_command(command):
        command.status = "pending"
        return "retry"

    command.status = "failed"
    return "failed"