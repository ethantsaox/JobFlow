-- Simple JobFlow Database Schema Migration
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
    timezone VARCHAR NOT NULL DEFAULT 'UTC',
    profile_picture VARCHAR,
    theme VARCHAR DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true
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
    name VARCHAR NOT NULL UNIQUE,
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
ju
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_company_id ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_status ON job_applications(status);

-- Create alembic version table
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (vbersion_num)
);

-- Insert version
INSERT INTO alembic_version VALUES ('add_salary_text_only') 
ON CONFLICT (version_num) DO NOTHING;

-- Success message
SELECT 'JobFlow database schema created successfully!' as result;