"""add_rarity_to_achievements

Revision ID: bd46dda07681
Revises: e63385864f40
Create Date: 2025-08-06 01:39:42.396754-07:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'bd46dda07681'
down_revision = 'e63385864f40'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add rarity column to achievements table
    op.add_column('achievements', sa.Column('rarity', sa.String(), nullable=False, server_default='common'))


def downgrade() -> None:
    # Remove rarity column from achievements table
    op.drop_column('achievements', 'rarity')