-- Initialize database for Personal Spending Assistant

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit', 'investment', 'loan');
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');
CREATE TYPE budget_status AS ENUM ('under_budget', 'on_track', 'over_budget', 'warning');

-- Create initial indexes for performance
-- (Tables will be created by SQLAlchemy/Alembic)