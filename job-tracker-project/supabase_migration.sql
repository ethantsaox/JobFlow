-- JobFlow Database Schema Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ,
    daily_goal INTEGER NOT NULL DEFAULT 2,
    weekly_goal INTEGER NOT NULL DEFAULT 10,
    timezone VARCHAR NOT NULL DEFAULT 'UTC'
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    size VARCHAR,
    industry VARCHAR,
    website VARCHAR,
    description TEXT,
    headquarters VARCHAR,
    founded_year INTEGER,
    logo_url VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position_title VARCHAR NOT NULL,
    job_description TEXT,
    application_url VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'applied',
    applied_date DATE NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR DEFAULT 'USD',
    location VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    interview_date TIMESTAMPTZ,
    interview_notes TEXT,
    follow_up_date DATE,
    rejection_reason TEXT,
    offer_details TEXT,
    remote_type VARCHAR DEFAULT 'hybrid',
    job_type VARCHAR DEFAULT 'full_time',
    experience_level VARCHAR DEFAULT 'mid',
    application_method VARCHAR DEFAULT 'online',
    referral_source VARCHAR,
    cover_letter_used BOOLEAN DEFAULT false,
    portfolio_submitted BOOLEAN DEFAULT false,
    salary_text VARCHAR
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR NOT NULL,
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rarity VARCHAR DEFAULT 'common'
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Create streaks table
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_type VARCHAR NOT NULL DEFAULT 'daily',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, streak_type)
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create privacy_settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR NOT NULL DEFAULT 'private',
    show_streak BOOLEAN NOT NULL DEFAULT true,
    show_goals BOOLEAN NOT NULL DEFAULT true,
    show_achievements BOOLEAN NOT NULL DEFAULT true,
    show_activity BOOLEAN NOT NULL DEFAULT false,
    allow_friend_requests BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(requester_id, addressee_id)
);

-- Create online_status table
CREATE TABLE IF NOT EXISTS online_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create status_transitions table
CREATE TABLE IF NOT EXISTS status_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    from_status VARCHAR,
    to_status VARCHAR NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add user settings columns to users table (if they don't exist)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE users ADD COLUMN profile_picture VARCHAR;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE users ADD COLUMN theme VARCHAR DEFAULT 'light';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE users ADD COLUMN push_notifications BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_company_id ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS ix_job_applications_applied_date ON job_applications(applied_date);
CREATE INDEX IF NOT EXISTS ix_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS ix_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS ix_friendships_requester_id ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS ix_friendships_addressee_id ON friendships(addressee_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, criteria, rarity) VALUES
('First Application', 'Submit your first job application', '🎯', '{"type": "application_count", "value": 1}', 'common'),
('Application Streak', 'Apply to 5 jobs in a row', '🔥', '{"type": "streak", "value": 5}', 'common'),
('Goal Achiever', 'Reach your daily goal', '✅', '{"type": "daily_goal", "value": 1}', 'common'),
('Persistent Hunter', 'Apply to 10 jobs', '🏹', '{"type": "application_count", "value": 10}', 'uncommon'),
('Interview Ready', 'Get your first interview', '💼', '{"type": "interview_count", "value": 1}', 'uncommon'),
('The Networker', 'Add company information to 5 applications', '🌐', '{"type": "detailed_applications", "value": 5}', 'uncommon'),
('Job Hunter', 'Apply to 25 jobs', '🎯', '{"type": "application_count", "value": 25}', 'rare'),
('Interview Pro', 'Complete 5 interviews', '🎤', '{"type": "interview_count", "value": 5}', 'rare'),
('The Achiever', 'Reach your weekly goal', '🏆', '{"type": "weekly_goal", "value": 1}', 'rare'),
('Application Master', 'Apply to 50 jobs', '👑', '{"type": "application_count", "value": 50}', 'epic'),
('Success Story', 'Get your first job offer', '🎉', '{"type": "offer_count", "value": 1}', 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Create alembic version table
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Set the migration version to the latest
INSERT INTO alembic_version VALUES ('add_salary_text_only') ON CONFLICT DO NOTHING;

-- Success message
SELECT 'JobFlow database schema created successfully!' as result;