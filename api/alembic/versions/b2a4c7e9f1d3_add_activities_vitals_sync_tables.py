"""add activities vitals and sync history tables

Revision ID: b2a4c7e9f1d3
Revises: 8a034fb76eab
Create Date: 2026-02-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2a4c7e9f1d3'
down_revision: Union[str, Sequence[str], None] = '8a034fb76eab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Activities table
    op.create_table(
        'activities',
        sa.Column('activity_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('garmin_activity_id', sa.String, nullable=True),
        sa.Column('activity_type', sa.String, nullable=False),
        sa.Column('date', sa.DateTime, nullable=False),
        sa.Column('duration', sa.Float, nullable=True),  # in seconds
        sa.Column('distance', sa.Float, nullable=True),  # in meters
        sa.Column('calories', sa.Integer, nullable=True),
        sa.Column('avg_hr', sa.Integer, nullable=True),
        sa.Column('max_hr', sa.Integer, nullable=True),
        sa.Column('rpe', sa.Integer, nullable=True),  # Rate of Perceived Exertion (1-10)
        sa.Column('training_load', sa.Float, nullable=True),
        sa.Column('trpe', sa.Float, nullable=True),  # Training RPE
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Indexes for activities
    op.create_index('ix_activities_user_id', 'activities', ['user_id'])
    op.create_index('ix_activities_date', 'activities', ['date'])
    op.create_index('ix_activities_garmin_id', 'activities', ['garmin_activity_id'])
    op.create_index('ix_activities_user_date', 'activities', ['user_id', 'date'])
    
    # Vitals table
    op.create_table(
        'vitals',
        sa.Column('vital_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('sleep_score', sa.Float, nullable=True),
        sa.Column('sleeping_hr', sa.Float, nullable=True),  # sleeping heart rate
        sa.Column('hrv', sa.Float, nullable=True),  # heart rate variability
        sa.Column('stress', sa.Float, nullable=True),  # stress level
        sa.Column('resting_hr', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Indexes for vitals
    op.create_index('ix_vitals_user_id', 'vitals', ['user_id'])
    op.create_index('ix_vitals_date', 'vitals', ['date'])
    op.create_index('ix_vitals_user_date', 'vitals', ['user_id', 'date'], unique=True)
    
    # Sync history table for tracking sync operations
    op.create_table(
        'sync_history',
        sa.Column('sync_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('sync_type', sa.String, nullable=False),  # 'activities', 'vitals', etc.
        sa.Column('status', sa.String, nullable=False),  # 'success', 'error'
        sa.Column('items_synced', sa.Integer, default=0),
        sa.Column('error', sa.Text, nullable=True),
        sa.Column('last_sync_at', sa.DateTime, nullable=False),
    )
    
    # Indexes for sync_history
    op.create_index('ix_sync_history_user_id', 'sync_history', ['user_id'])
    op.create_index('ix_sync_history_sync_type', 'sync_history', ['sync_type'])
    op.create_index('ix_sync_history_last_sync', 'sync_history', ['last_sync_at'])
    op.create_index('ix_sync_history_user_type', 'sync_history', ['user_id', 'sync_type', 'last_sync_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('sync_history')
    op.drop_table('vitals')
    op.drop_table('activities')
