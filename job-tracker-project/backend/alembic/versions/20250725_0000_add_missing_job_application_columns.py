"""Add missing job_application columns

Revision ID: add_missing_cols
Revises: fba940f19d75
Create Date: 2025-07-25 00:00:00.000000-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_cols'
down_revision = 'fba940f19d75'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to job_applications table
    op.add_column('job_applications', sa.Column('priority', sa.String(), nullable=False, server_default='medium'))
    op.add_column('job_applications', sa.Column('stage', sa.String(), nullable=True))
    op.add_column('job_applications', sa.Column('next_action', sa.String(), nullable=True))
    op.add_column('job_applications', sa.Column('next_action_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('job_applications', sa.Column('follow_up_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('job_applications', sa.Column('rejection_reason', sa.String(), nullable=True))
    op.add_column('job_applications', sa.Column('offer_amount', sa.Numeric(10, 2), nullable=True))
    op.add_column('job_applications', sa.Column('response_deadline', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove added columns
    op.drop_column('job_applications', 'response_deadline')
    op.drop_column('job_applications', 'offer_amount')
    op.drop_column('job_applications', 'rejection_reason')
    op.drop_column('job_applications', 'follow_up_date')
    op.drop_column('job_applications', 'next_action_date')
    op.drop_column('job_applications', 'next_action')
    op.drop_column('job_applications', 'stage')
    op.drop_column('job_applications', 'priority')