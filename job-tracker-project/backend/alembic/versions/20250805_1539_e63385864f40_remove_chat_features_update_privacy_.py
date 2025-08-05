"""Remove chat features, update privacy settings

Revision ID: e63385864f40
Revises: 083bd0a275e9
Create Date: 2025-08-05 15:39:33.514249-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e63385864f40'
down_revision = '083bd0a275e9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove messages table (chat not needed)
    op.drop_index('ix_messages_sender_id', table_name='messages')
    op.drop_index('ix_messages_receiver_id', table_name='messages')
    op.drop_index('ix_messages_id', table_name='messages')
    op.drop_index('ix_messages_created_at', table_name='messages')
    op.drop_table('messages')
    
    # Remove chat-related columns from privacy_settings
    op.drop_column('privacy_settings', 'allow_direct_messages')
    op.drop_column('privacy_settings', 'message_from_friends_only')


def downgrade() -> None:
    # Add back chat-related privacy columns
    op.add_column('privacy_settings', sa.Column('allow_direct_messages', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('privacy_settings', sa.Column('message_from_friends_only', sa.Boolean(), nullable=False, server_default='true'))
    
    # Recreate messages table
    op.create_table('messages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('sender_id', sa.UUID(), nullable=False),
    sa.Column('receiver_id', sa.UUID(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=False),
    sa.Column('is_edited', sa.Boolean(), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('message_type', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_created_at', 'messages', ['created_at'], unique=False)
    op.create_index('ix_messages_id', 'messages', ['id'], unique=False)
    op.create_index('ix_messages_receiver_id', 'messages', ['receiver_id'], unique=False)
    op.create_index('ix_messages_sender_id', 'messages', ['sender_id'], unique=False)