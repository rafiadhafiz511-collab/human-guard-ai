"""align device claim token unique constraint"""

from typing import Sequence, Union

from alembic import op


revision: str = "1cf87378b1aa"
down_revision: Union[str, Sequence[str], None] = "99f52f440f8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Replace the existing unique index with a proper
    # UNIQUE constraint so the database matches the
    # SQLAlchemy model.
    op.drop_index(
        "ix_device_claim_tokens_token_hash",
        table_name="device_claim_tokens",
    )

    op.create_unique_constraint(
        "uq_device_claim_tokens_token_hash",
        "device_claim_tokens",
        ["token_hash"],
    )


def downgrade() -> None:
    # Restore the original unique index.
    op.drop_constraint(
        "uq_device_claim_tokens_token_hash",
        "device_claim_tokens",
        type_="unique",
    )

    op.create_index(
        "ix_device_claim_tokens_token_hash",
        "device_claim_tokens",
        ["token_hash"],
        unique=True,
    )
