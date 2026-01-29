"""create users table

Revision ID: fc1d486dd86a
Revises: 
Create Date: 2026-01-29 22:38:49.527168

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc1d486dd86a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime),
    )

    # create garmin_sessions
    op.create_table(
        "garmin_sessions",
        sa.Column("user_id", sa.String, primary_key=True),
        sa.Column("session_json", sa.String, nullable=False),
        sa.Column("updated_at", sa.DateTime),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("garmin_sessions")
    op.drop_table("users")