"""empty message

Revision ID: 555ab22f44f5
Revises: 
Create Date: 2026-01-30 21:56:55.445903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '555ab22f44f5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create:
        - users table (user_id, email, password_hash, created_at, updated_at, last_login_at, ...oauth1_token, oauth1_token_secre)
        - sessions table (session_id, user_id, created_at, expires_at, ip_address, user_agent)
    """
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('last_login_at', sa.DateTime, nullable=True),
        sa.Column('oauth_token', sa.String(length=255), nullable=False),
        sa.Column('oauth_token_secret', sa.String(length=255), nullable=False),
    )
    op.create_table(
        'tokens',
        sa.Column('session_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('token', sa.String(length=255), nullable=False),
    )


def downgrade() -> None:
    """Drop users and sessions tables."""
    op.drop_table('sessions')
    op.drop_table('users')