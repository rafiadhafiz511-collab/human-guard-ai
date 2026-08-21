"""create device channels table

Revision ID: 5b15d2c1c2e2
Revises: 450ea518bb39
Create Date: 2026-08-16 08:10:38.754517

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5b15d2c1c2e2"
down_revision: Union[str, Sequence[str], None] = "450ea518bb39"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "device_channels",

        sa.Column(
            "id",
            sa.String(),
            primary_key=True,
        ),

        sa.Column(
            "device_id",
            sa.String(),
            sa.ForeignKey(
                "devices.id",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        ),

        sa.Column(
            "channel_number",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "type",
            sa.String(50),
            nullable=False,
        ),

        sa.Column(
            "state",
            sa.String(20),
            nullable=False,
            server_default="OFF",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.UniqueConstraint(
            "device_id",
            "channel_number",
            name="uq_device_channel_number",
        ),
    )


def downgrade() -> None:
    op.drop_table("device_channels")