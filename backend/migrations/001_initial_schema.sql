-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('founder', 'investor');

-- Create connection status enum
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Founder profiles table
CREATE TABLE IF NOT EXISTS founder_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    funding_stage VARCHAR(100) NOT NULL,
    valuation DECIMAL(15, 2) NOT NULL,
    description TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investor profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    domain VARCHAR(255),
    stage_interest VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(founder_id, investor_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CSV files table
CREATE TABLE IF NOT EXISTS csv_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- CSV data table (time-series financial data)
CREATE TABLE IF NOT EXISTS csv_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csv_file_id UUID REFERENCES csv_files(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    revenue DECIMAL(15, 2) DEFAULT 0,
    expenses DECIMAL(15, 2) DEFAULT 0,
    profit DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_connections_founder ON connections(founder_id);
CREATE INDEX IF NOT EXISTS idx_connections_investor ON connections(investor_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_messages_connection ON messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_csv_data_founder ON csv_data(founder_id);
CREATE INDEX IF NOT EXISTS idx_csv_data_month ON csv_data(month);
CREATE INDEX IF NOT EXISTS idx_csv_files_founder ON csv_files(founder_id);

-- Additional performance indexes
-- These are already included in 001_initial_schema.sql, but kept here for future additions

-- Composite index for connection lookups
CREATE INDEX IF NOT EXISTS idx_connections_founder_status ON connections(founder_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_investor_status ON connections(investor_id, status);

-- Index for CSV data queries by founder and month range
CREATE INDEX IF NOT EXISTS idx_csv_data_founder_month ON csv_data(founder_id, month);

