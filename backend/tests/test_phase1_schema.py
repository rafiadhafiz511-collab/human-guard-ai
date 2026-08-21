import unittest

from app.models.device import Device
from app.models.home import Home
from app.models.room import Room


class PhaseOneSchemaTests(unittest.TestCase):
    def test_device_lifecycle_columns_are_present(self):
        columns = Device.__table__.c
        for name in (
            "serial_number",
            "model",
            "capabilities",
            "claim_status",
            "lifecycle_status",
            "connection_status",
            "room_id",
        ):
            self.assertIn(name, columns)

    def test_room_relationships_are_present(self):
        self.assertEqual(Room.__tablename__, "rooms")
        self.assertIn("rooms", Home.__mapper__.relationships)
        self.assertIn("room", Device.__mapper__.relationships)


if __name__ == "__main__":
    unittest.main()
