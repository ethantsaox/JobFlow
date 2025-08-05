"""Add social features models only

Revision ID: 083bd0a275e9
Revises: 8b734cd81665
Create Date: 2025-08-05 15:34:13.869129-07:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '083bd0a275e9'
down_revision = '8b734cd81665'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create friendships table
    op.create_table('friendships',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('requester_id', sa.UUID(), nullable=False),
    sa.Column('addressee_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'BLOCKED', 'DECLINED', name='friendshipstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['addressee_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_friendships_addressee_id'), 'friendships', ['addressee_id'], unique=False)
    op.create_index(op.f('ix_friendships_id'), 'friendships', ['id'], unique=False)
    op.create_index(op.f('ix_friendships_requester_id'), 'friendships', ['requester_id'], unique=False)
    op.create_index(op.f('ix_friendships_status'), 'friendships', ['status'], unique=False)

    # Create messages table
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
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.create_index(op.f('ix_messages_receiver_id'), 'messages', ['receiver_id'], unique=False)
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)

    # Create online_status table
    op.create_table('online_status',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('is_online', sa.Boolean(), nullable=False),
    sa.Column('last_seen', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),  
    sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('session_id', sa.String(), nullable=True),
    sa.Column('device_info', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_online_status_id'), 'online_status', ['id'], unique=False)
    op.create_index(op.f('ix_online_status_is_online'), 'online_status', ['is_online'], unique=False)
    op.create_index(op.f('ix_online_status_last_seen'), 'online_status', ['last_seen'], unique=False)
    op.create_index(op.f('ix_online_status_user_id'), 'online_status', ['user_id'], unique=False)

    # Create privacy_settings table
    op.create_table('privacy_settings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('allow_friend_requests', sa.Boolean(), nullable=False),
    sa.Column('show_online_status', sa.Boolean(), nullable=False),
    sa.Column('show_last_seen', sa.Boolean(), nullable=False),
    sa.Column('share_application_stats', sa.Boolean(), nullable=False),
    sa.Column('share_streak_data', sa.Boolean(), nullable=False),
    sa.Column('share_achievement_data', sa.Boolean(), nullable=False),
    sa.Column('share_goal_progress', sa.Boolean(), nullable=False),
    sa.Column('show_total_applications', sa.Boolean(), nullable=False),
    sa.Column('show_interview_count', sa.Boolean(), nullable=False),
    sa.Column('show_offer_count', sa.Boolean(), nullable=False),
    sa.Column('show_rejection_count', sa.Boolean(), nullable=False),
    sa.Column('allow_direct_messages', sa.Boolean(), nullable=False),
    sa.Column('message_from_friends_only', sa.Boolean(), nullable=False),
    sa.Column('discoverable_by_email', sa.Boolean(), nullable=False),
    sa.Column('discoverable_by_name', sa.Boolean(), nullable=False),
    sa.Column('show_in_friend_suggestions', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_privacy_settings_id'), 'privacy_settings', ['id'], unique=False)
    op.create_index(op.f('ix_privacy_settings_user_id'), 'privacy_settings', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop privacy_settings table
    op.drop_index(op.f('ix_privacy_settings_user_id'), table_name='privacy_settings')
    op.drop_index(op.f('ix_privacy_settings_id'), table_name='privacy_settings')
    op.drop_table('privacy_settings')
    
    # Drop online_status table
    op.drop_index(op.f('ix_online_status_user_id'), table_name='online_status')
    op.drop_index(op.f('ix_online_status_last_seen'), table_name='online_status')
    op.drop_index(op.f('ix_online_status_is_online'), table_name='online_status')
    op.drop_index(op.f('ix_online_status_id'), table_name='online_status')
    op.drop_table('online_status')
    
    # Drop messages table
    op.drop_index(op.f('ix_messages_sender_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_receiver_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_created_at'), table_name='messages')
    op.drop_table('messages')
    
    # Drop friendships table
    op.drop_index(op.f('ix_friendships_status'), table_name='friendships')
    op.drop_index(op.f('ix_friendships_requester_id'), table_name='friendships')
    op.drop_index(op.f('ix_friendships_id'), table_name='friendships')
    op.drop_index(op.f('ix_friendships_addressee_id'), table_name='friendships')
    op.drop_table('friendships')
    
    # Drop enum type
    op.execute('DROP TYPE friendshipstatus')