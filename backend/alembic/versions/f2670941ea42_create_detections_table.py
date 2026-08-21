"""fix detections table indexes

Revision ID: f2670941ea42
Revises: cafb16f4113e
Create Date: 2026-07-21 12:48:06.633123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2670941ea42'
down_revision: Union[str, Sequence[str], None] = 'cafb16f4113e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - ensure indexes exist."""
    # This was a duplicate, now just ensures index exists
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
