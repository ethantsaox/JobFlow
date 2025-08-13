"""add salary_text field only

Revision ID: add_salary_text_only
Revises: add_profile_picture_to_user
Create Date: 2025-08-10 21:48:00.000000-07:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_salary_text_only'
down_revision = 'add_profile_picture_to_user'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add salary_text column to job_applications table
    op.add_column('job_applications', sa.Column('salary_text', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove salary_text column
    op.drop_column('job_applications', 'salary_text')