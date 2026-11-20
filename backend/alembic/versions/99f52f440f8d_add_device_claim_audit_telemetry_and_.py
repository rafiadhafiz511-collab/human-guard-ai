"""add device claim audit telemetry and credentials

Revision ID: 99f52f440f8d
Revises: aa8d7c14b692
Create Date: 2026-08-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "99f52f440f8d"
down_revision: Union[str, Sequence[str], None] = "aa8d7c14b692"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The following tables already exist in the database:
    #
    # - device_claim_tokens
    # - device_claims
    # - device_events
    # - device_telemetry
    # - device_credentials
    #
    # They were created before this Alembic revision was recorded.
    # Therefore we intentionally do not recreate them here.

    # Keep firmware schema aligned with the SQLAlchemy model.
    op.alter_column(
        "firmwares",
        "file_size",
        existing_type=sa.INTEGER(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )


def downgrade() -> None:
    # Reverse firmware schema change.
    op.alter_column(
        "firmwares",
        "file_size",
        existing_type=sa.BigInteger(),
        type_=sa.INTEGER(),
        existing_nullable=True,
    )

    # Do NOT drop the five existing device-domain tables here.
    # They predate this migration revision.