import unittest
from unittest.mock import MagicMock

from app.models.device import Device
from app.services.device_command_service import (
    is_channel_command,
    validate_device_command,
)


class DeviceCommandValidationTests(unittest.TestCase):

    def setUp(self):
        self.db = MagicMock()

        self.device = Device(
            id="test-device-db-id",
            device_id="TEST001",
            device_name="Test Device",
            secret_key="test-secret",
            device_type="LIGHT",
        )

    def test_channel_command_format_is_valid(self):
        self.assertTrue(
            is_channel_command("CHANNEL:1:ON")
        )

        self.assertTrue(
            is_channel_command("CHANNEL:2:OFF")
        )

    def test_invalid_channel_format_is_rejected(self):
        self.assertFalse(
            is_channel_command("CHANNEL:X:ON")
        )

        self.assertFalse(
            is_channel_command("CHANNEL:0:ON")
        )

        self.assertFalse(
            is_channel_command("CHANNEL:1:INVALID")
        )

    def test_existing_channel_is_accepted(self):
        channel = MagicMock()

        self.db.query.return_value.filter.return_value.first.return_value = channel

        result = validate_device_command(
            db=self.db,
            device=self.device,
            command="CHANNEL:1:ON",
        )

        self.assertEqual(
            result,
            "CHANNEL:1:ON",
        )

    def test_non_existing_channel_is_rejected(self):
        self.db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaisesRegex(
            ValueError,
            "Channel 99 does not exist",
        ):
            validate_device_command(
                db=self.db,
                device=self.device,
                command="CHANNEL:99:ON",
            )

    def test_channel_is_checked_against_device_and_channel_number(self):
        channel = MagicMock()

        self.db.query.return_value.filter.return_value.first.return_value = channel

        validate_device_command(
            db=self.db,
            device=self.device,
            command="CHANNEL:7:ON",
        )

        self.db.query.assert_called_once_with(
            unittest.mock.ANY
        )

        filter_call = self.db.query.return_value.filter.call_args

        self.assertIsNotNone(filter_call)

        conditions = filter_call.args

        self.assertEqual(
            len(conditions),
            2,
        )

        self.assertIn(
            self.device.id,
            [
                getattr(condition.right, "value", None)
                for condition in conditions
                if hasattr(condition, "right")
            ],
        )

        self.assertIn(
            7,
            [
                getattr(condition.right, "value", None)
                for condition in conditions
                if hasattr(condition, "right")
            ],
        )


if __name__ == "__main__":
    unittest.main()
