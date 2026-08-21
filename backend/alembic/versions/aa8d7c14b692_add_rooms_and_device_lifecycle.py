"""add rooms and device lifecycle fields

Revision ID: aa8d7c14b692
Revises: 75658dfdd439
Create Date: 2026-08-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "aa8d7c14b692"
down_revision: Union[str, Sequence[str], None] = "75658dfdd439"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The rooms table already exists in the current database.
    # This migration only brings the devices table up to the new
    # Phase 1 schema and links devices to the existing rooms table.

    op.add_column(
        "devices",
        sa.Column(
            "serial_number",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "model",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "capabilities",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "claim_status",
            sa.String(length=20),
            nullable=False,
            server_default="CLAIMED",
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "lifecycle_status",
            sa.String(length=20),
            nullable=False,
            server_default="ACTIVE",
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "connection_status",
            sa.String(length=20),
            nullable=False,
            server_default="OFFLINE",
        ),
    )

    op.add_column(
        "devices",
        sa.Column(
            "room_id",
            sa.String(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_devices_serial_number",
        "devices",
        ["serial_number"],
        unique=True,
    )

    op.create_index(
        "ix_devices_model",
        "devices",
        ["model"],
        unique=False,
    )

    op.create_index(
        "ix_devices_claim_status",
        "devices",
        ["claim_status"],
        unique=False,
    )

    op.create_index(
        "ix_devices_lifecycle_status",
        "devices",
        ["lifecycle_status"],
        unique=False,
    )

    op.create_index(
        "ix_devices_connection_status",
        "devices",
        ["connection_status"],
        unique=False,
    )

    op.create_index(
        "ix_devices_room_id",
        "devices",
        ["room_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_devices_room_id_rooms",
        "devices",
        "rooms",
        ["room_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_devices_room_id_rooms",
        "devices",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_devices_room_id",
        table_name="devices",
    )

    op.drop_index(
        "ix_devices_connection_status",
        table_name="devices",
    )

    op.drop_index(
        "ix_devices_lifecycle_status",
        table_name="devices",
    )

    op.drop_index(
        "ix_devices_claim_status",
        table_name="devices",
    )

    op.drop_index(
        "ix_devices_model",
        table_name="devices",
    )

    op.drop_index(
        "ix_devices_serial_number",
        table_name="devices",
    )

    op.drop_column("devices", "room_id")
    op.drop_column("devices", "connection_status")
    op.drop_column("devices", "lifecycle_status")
    op.drop_column("devices", "claim_status")
    op.drop_column("devices", "capabilities")
    op.drop_column("devices", "model")
    op.drop_column("devices", "serial_number")