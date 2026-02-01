"""create users table

Revision ID: 8a034fb76eab
Revises: 
Create Date: 2026-02-01 10:00:12.461611

"""
from click.core import F
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a034fb76eab_create_users_table'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('email', sa.String, nullable=False, unique=True),
        sa.Column('password_hash', sa.String, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('last_login_at', sa.DateTime, nullable=True),
    )
    

    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_created_at', 'users', ['created_at'])
    
    op.create_table(
        'oauth_tokens',
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), primary_key=True),
        sa.Column('oauth1_token', sa.String, nullable=False),
        sa.Column('oauth1_token_secret', sa.String, nullable=False),
        sa.Column('oauth1_mfa_token', sa.String, nullable=True),
        sa.Column('oauth1_mfa_expiration_timestamp', sa.DateTime, nullable=True),
        sa.Column('oauth1_domain', sa.String, nullable=True),
        sa.Column('oauth2_access_token', sa.String, nullable=False),
        sa.Column('oauth2_refresh_token', sa.String, nullable=False),
        sa.Column('oauth2_expires_in', sa.Integer, nullable=False),
        sa.Column('oauth2_expires_at', sa.Integer, nullable=False),
        sa.Column('oauth2_refresh_token_expires_in', sa.Integer, nullable=False),
        sa.Column('oauth2_refresh_token_expires_at', sa.Integer, nullable=False),
        sa.Column('oauth2_token_type', sa.Enum('bearer', name='token_type_enum'), nullable=False),
        sa.Column('oauth2_scope', sa.String, nullable=False),
        sa.Column('oauth2_jti', sa.String, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    op.create_index('ix_oauth_tokens_user_id', 'oauth_tokens', ['user_id'])
    op.create_index('ix_oauth_tokens_oauth2_jti', 'oauth_tokens', ['oauth2_jti'])
    op.create_index('ix_oauth_tokens_oauth2_expires_at', 'oauth_tokens', ['oauth2_expires_at'])
    op.create_index('ix_oauth_tokens_updated_at', 'oauth_tokens', ['updated_at'])



def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_oauth_tokens_updated_at', table_name='oauth_tokens')
    op.drop_index('ix_oauth_tokens_oauth2_expires_at', table_name='oauth_tokens')
    op.drop_index('ix_oauth_tokens_oauth2_jti', table_name='oauth_tokens')
    op.drop_table('oauth_tokens')
    op.drop_table('users')