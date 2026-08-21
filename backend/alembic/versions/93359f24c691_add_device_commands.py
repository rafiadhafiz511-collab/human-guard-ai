"""add device commands

Revision ID: 93359f24c691
Revises: 8fc146cd926a
Create Date: 2026-08-07 10:50:07.662869
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision: str = "93359f24c691"
down_revision: Union[str, Sequence[str], None] = "8fc146cd926a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass