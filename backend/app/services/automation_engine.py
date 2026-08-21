import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.mqtt import publish_device_command
from app.core.notifications import send_push_notification
from app.models.automation import ActionType, AutomationRule, TriggerType
from app.models.device import Device
from app.models.device_channel import DeviceChannel
from app.models.home import HomeMember
from app.models.user import User
from app.services.device_command_service import create_device_command

logger = logging.getLogger(__name__)


# ============================================================
# COOLDOWN MEMORY (IN-MEMORY)
# ============================================================

_last_execution: dict[str, datetime] = {}


# ============================================================
# CONDITION EVALUATION
# ============================================================

def evaluate_condition(
    current: Any,
    operator: str,
    target: Any,
) -> bool:
    """
    Evaluate a single automation condition safely with type casting.
    """
    try:
        # Try converting to float for dynamic numeric comparison
        curr_val = float(current)
        targ_val = float(target)
    except (ValueError, TypeError):
        curr_val = current
        targ_val = target

    try:
        if operator == "==":
            return curr_val == targ_val
        if operator == "!=":
            return curr_val != targ_val
        if operator == ">":
            return curr_val > targ_val
        if operator == ">=":
            return curr_val >= targ_val
        if operator == "<":
            return curr_val < targ_val
        if operator == "<=":
            return curr_val <= targ_val
    except TypeError:
        logger.warning(
            "Automation condition comparison failed due to type mismatch: "
            "current=%r operator=%s target=%r",
            current,
            operator,
            target,
        )

    return False


# ============================================================
# ADDITIONAL CONDITIONS (TIME/DAY RESTRICTIONS)
# ============================================================

def check_additional_conditions(
    conditions: dict | None,
) -> bool:
    """
    Check optional time-window and day-of-week conditions.
    """
    if not conditions:
        return True

    now = datetime.now()

    # Time-between check
    time_between = conditions.get("time_between")
    if time_between and isinstance(time_between, list) and len(time_between) == 2:
        start_time, end_time = time_between[0], time_between[1]
        current_time = now.strftime("%H:%M")

        if start_time <= end_time:
            if not (start_time <= current_time <= end_time):
                return False
        else:  # Overnight range (e.g., 22:00 to 06:00)
            if not (current_time >= start_time or current_time <= end_time):
                return False

    # Days check
    allowed_days = conditions.get("days")
    if allowed_days and isinstance(allowed_days, list):
        current_day = now.strftime("%a").upper()
        if current_day not in allowed_days:
            return False

    return True


# ============================================================
# COOLDOWN MANAGEMENT
# ============================================================

def is_on_cooldown(rule: AutomationRule) -> bool:
    """
    Check whether an automation rule is currently in its cooldown period.
    """
    cooldown_seconds = getattr(rule, "cooldown_seconds", 0) or 0
    if cooldown_seconds <= 0:
        return False

    rule_key = str(rule.id)
    last_exec = _last_execution.get(rule_key)
    if not last_exec:
        return False

    now = datetime.now(timezone.utc)
    return (now - last_exec).total_seconds() < cooldown_seconds


def mark_automation_executed(rule: AutomationRule) -> None:
    """
    Record the latest execution timestamp for cooldown tracking.
    """
    _last_execution[str(rule.id)] = datetime.now(timezone.utc)


# ============================================================
# MAIN TELEMETRY & DEVICE STATE PROCESSOR
# ============================================================

def process_device_telemetry_or_state(
    db: Session,
    home_id: str,
    device_id: str,
    incoming_data: dict[str, Any],
) -> None:
    """
    ESP32 টেলিমোট্রি প্রসেস করে হোম আইডি ও ডিভাইস আইডি মিলিয়ে
    সক্রিয় অটোমেশন রুল মূল্যায়ন ও এক্সিকিউট করে।
    """
    if not isinstance(incoming_data, dict):
        logger.error("Invalid telemetry payload format for device %s", device_id)
        return

    try:
        # 1. Fetch active automation rules for this home
        rules = (
            db.query(AutomationRule)
            .filter(
                AutomationRule.home_id == home_id,
                AutomationRule.is_active.is_(True),
            )
            .all()
        )

        for rule in rules:
            try:
                # 2. Extract trigger parameters (handles both DB schema types)
                trigger_type = getattr(rule, "trigger_type", None)
                config = getattr(rule, "trigger_config", None) or {}

                target_device_id = config.get("device_id") or getattr(rule, "trigger_device_id", None)
                target_key = config.get("key") or getattr(rule, "trigger_sensor_key", None)
                operator = config.get("operator") or getattr(rule, "condition_operator", "==")
                target_value = config.get("value") if "value" in config else getattr(rule, "trigger_value", None)

                # Filter by device_id if specified in rule
                if target_device_id and str(target_device_id) != str(device_id):
                    continue

                if not target_key or target_key not in incoming_data:
                    continue

                # 3. Evaluate condition
                current_value = incoming_data[target_key]
                if not evaluate_condition(current_value, operator, target_value):
                    continue

                # 4. Check time/day conditions
                conditions = getattr(rule, "conditions", None)
                if not check_additional_conditions(conditions):
                    logger.debug("Automation rule %s additional condition failed", rule.id)
                    continue

                # 5. Cooldown check
                if is_on_cooldown(rule):
                    logger.debug("Automation rule %s is on cooldown", rule.id)
                    continue

                # 6. Execute action & update cooldown
                if execute_automation_action(db, rule):
                    mark_automation_executed(rule)

            except Exception:
                logger.exception("Failed processing rule %s for device %s", rule.id, device_id)

    except Exception:
        db.rollback()
        logger.exception("Database error while evaluating automation for device %s", device_id)


# ============================================================
# ACTION EXECUTION ENGINE
# ============================================================

def execute_automation_action(
    db: Session,
    rule: AutomationRule,
) -> bool:
    """
    Execute configured automation action (Device command, Multi-channel relay, or Push Notification).
    """
    logger.info("[AUTOMATION TRIGGERED] rule_id=%s name=%s", rule.id, getattr(rule, "name", "Unnamed"))

    action_type = getattr(rule, "action_type", None)
    action_config = getattr(rule, "action_config", None) or {}

    # --------------------------------------------------------
    # 1. CHANNEL/RELAY ACTION (Direct Relay Control)
    # --------------------------------------------------------
    target_channel_id = getattr(rule, "target_channel_id", None) or action_config.get("target_channel_id")

    if target_channel_id:
        return _execute_channel_action(db, rule, target_channel_id)

    # --------------------------------------------------------
    # 2. GENERIC DEVICE COMMAND ACTION
    # --------------------------------------------------------
    if action_type == ActionType.DEVICE_COMMAND or "command" in action_config:
        return _execute_device_command_action(db, rule, action_config)

    # --------------------------------------------------------
    # 3. PUSH NOTIFICATION ACTION
    # --------------------------------------------------------
    if action_type == ActionType.NOTIFICATION:
        return _execute_notification_action(db, rule, action_config)

    logger.warning("Unsupported automation action type on rule=%s", rule.id)
    return False


def _execute_channel_action(db: Session, rule: AutomationRule, target_channel_id: Any) -> bool:
    """
    Execute hardware relay/channel activation.
    """
    target_channel = db.query(DeviceChannel).filter(DeviceChannel.id == target_channel_id).first()
    if not target_channel:
        logger.error("Automation %s target channel not found: %s", rule.id, target_channel_id)
        return False

    target_device = db.query(Device).filter(Device.id == target_channel.device_id).first()
    if not target_device:
        logger.error("Automation %s target device not found for channel: %s", rule.id, target_channel_id)
        return False

    desired_state = (getattr(rule, "target_state", None) or rule.action_config.get("state", "ON")).upper()

    # Avoid redundant MQTT triggers if state is unchanged
    if target_channel.state == desired_state:
        return False

    target_channel.state = desired_state
    command_str = f"CHANNEL:{target_channel.channel_number}:{desired_state}"

    try:
        # DB Command record
        device_cmd = create_device_command(db=db, device=target_device, command=command_str)
        db.commit()
        db.refresh(device_cmd)

        # Realtime MQTT Publish
        publish_device_command(
            device_id=target_device.device_id,
            command_payload={
                "command": command_str,
                "channel": target_channel.channel_number,
                "state": desired_state,
                "triggered_by": f"automation_rule:{rule.id}",
            },
        )
        logger.info("[CHANNEL ACTION EXECUTED] rule=%s device=%s command=%s", rule.id, target_device.device_id, command_str)
        return True

    except Exception:
        db.rollback()
        logger.exception("Failed executing channel action for rule=%s", rule.id)
        return False


def _execute_device_command_action(db: Session, rule: AutomationRule, action_config: dict) -> bool:
    """
    Execute standard raw command action to an ESP32.
    """
    target_device_id = action_config.get("device_id")
    command = action_config.get("command")

    if not target_device_id or not command:
        logger.error("Automation %s missing target_device_id or command", rule.id)
        return False

    device = db.query(Device).filter(
        Device.device_id == target_device_id,
        Device.home_id == rule.home_id,
    ).first()

    if not device:
        logger.error("Target device %s not found for automation %s", target_device_id, rule.id)
        return False

    try:
        device_cmd = create_device_command(db=db, device=device, command=command)
        db.commit()
        db.refresh(device_cmd)

        publish_device_command(
            device_id=device.device_id,
            command_payload={
                "command": command,
                "triggered_by": f"automation_rule:{rule.id}",
            },
        )
        logger.info("[COMMAND ACTION EXECUTED] rule=%s device=%s command=%s", rule.id, target_device_id, command)
        return True

    except Exception:
        db.rollback()
        logger.exception("Failed sending command action for rule=%s", rule.id)
        return False


def _execute_notification_action(db: Session, rule: AutomationRule, action_config: dict) -> bool:
    """
    Send push notifications to all users registered in the home.
    """
    title = action_config.get("title", "Smart Home Alert")
    body = action_config.get("body", f"Automation '{getattr(rule, 'name', 'Rule')}' triggered.")

    members = db.query(HomeMember).filter(HomeMember.home_id == rule.home_id).all()
    sent_count = 0

    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if not user or not getattr(user, "fcm_token", None):
            continue

        try:
            send_push_notification(
                fcm_token=user.fcm_token,
                title=title,
                body=body,
                data={
                    "home_id": str(rule.home_id),
                    "rule_id": str(rule.id),
                },
            )
            sent_count += 1
        except Exception:
            logger.exception("Push notification send error for user=%s rule=%s", user.id, rule.id)

    logger.info("[NOTIFICATION ACTION EXECUTED] rule=%s sent_to=%s users", rule.id, sent_count)
    return sent_count > 0