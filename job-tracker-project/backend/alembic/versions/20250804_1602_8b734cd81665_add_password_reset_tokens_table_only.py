"""Add password reset tokens table only

Revision ID: 8b734cd81665
Revises: 0647bcd20607
Create Date: 2025-08-04 16:02:33.611460-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b734cd81665'
down_revision = '45a5ee54d2f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create password reset tokens table
    op.create_table('password_reset_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_tokens_id'), 'password_reset_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_token_hash'), 'password_reset_tokens', ['token_hash'], unique=False)


def downgrade() -> None:
    # Drop password reset tokens table
    op.drop_index(op.f('ix_password_reset_tokens_token_hash'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_id'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')