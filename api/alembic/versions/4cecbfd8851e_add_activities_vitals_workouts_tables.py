"""add_activities_vitals_workouts_tables

Revision ID: 4cecbfd8851e
Revises: 555ab22f44f5
Create Date: 2026-01-30 22:13:43.787294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4cecbfd8851e'
down_revision: Union[str, Sequence[str], None] = '555ab22f44f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'activities',
        sa.Column('activity_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('date', sa.String(10), nullable=False),
        sa.Column('duration', sa.Float, nullable=False),
        sa.Column('rpe', sa.Integer, nullable=False),
        sa.Column('training_load', sa.Float, nullable=False),
        sa.Column('trpe', sa.Float, nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_table(
        'vitals',
        sa.Column('vital_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('date', sa.String(10), nullable=False),
        sa.Column('sleep_score', sa.Float, nullable=True),
        sa.Column('sleeping_hr', sa.Float, nullable=True),
        sa.Column('hrv', sa.Float, nullable=True),
        sa.Column('stress', sa.Float, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_table(
        'workouts',
        sa.Column('workout_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('sport', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('steps', sa.Text, nullable=True),
        sa.Column('rpe', sa.Integer, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('estimated_load', sa.Float, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('workouts')
    op.drop_table('vitals')
    op.drop_table('activities')
