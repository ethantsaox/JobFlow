"""Add achievements table

Revision ID: fba940f19d75
Revises: 001274a99efe
Create Date: 2025-07-23 16:07:51.255068-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fba940f19d75'
down_revision = '001274a99efe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create achievements table
    op.create_table('achievements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('achievement_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('criteria_value', sa.Integer(), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('unlocked', sa.Boolean(), nullable=False, default=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_progress', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes for achievements
    op.create_index('ix_achievements_user_id', 'achievements', ['user_id'])
    op.create_index('ix_achievements_unlocked', 'achievements', ['unlocked'])
    op.create_index('ix_achievements_category', 'achievements', ['category'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_achievements_user_id')
    op.drop_index('ix_achievements_unlocked') 
    op.drop_index('ix_achievements_category')
    
    # Drop table
    op.drop_table('achievements')