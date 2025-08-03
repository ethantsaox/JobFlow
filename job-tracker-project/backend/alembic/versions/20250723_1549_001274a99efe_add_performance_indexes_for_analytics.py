"""Add performance indexes for analytics

Revision ID: 001274a99efe
Revises: 62b7e5a44fe2
Create Date: 2025-07-23 15:49:24.791401-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001274a99efe'
down_revision = '62b7e5a44fe2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes for analytics performance
    
    # Job applications - frequently queried by user_id and applied_date  
    op.create_index('ix_job_applications_user_applied_date', 'job_applications', ['user_id', 'applied_date'], unique=False)
    op.create_index('ix_job_applications_user_status', 'job_applications', ['user_id', 'status'], unique=False)
    
    # Streaks - for streak analytics
    op.create_index('ix_streaks_user_date', 'streaks', ['user_id', 'date'], unique=False)
    op.create_index('ix_streaks_user_goal_met', 'streaks', ['user_id', 'goal_met'], unique=False)


def downgrade() -> None:
    # Remove indexes
    op.drop_index('ix_job_applications_user_applied_date')
    op.drop_index('ix_job_applications_user_status')
    op.drop_index('ix_streaks_user_date')
    op.drop_index('ix_streaks_user_goal_met')