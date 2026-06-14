-- Migration 001: Initial schema - organizations, users, machines, providers
-- Run this first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, email)
);

-- Machines table
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    os TEXT,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, hostname)
);

-- Providers table (reference data)
CREATE TABLE providers (
    id SMALLINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Seed provider reference data
INSERT INTO providers (id, name) VALUES
    (1, 'claude'),
    (2, 'codex'),
    (3, 'cursor'),
    (4, 'gemini'),
    (5, 'warp'),
    (6, 'opencode')
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_machines_org_id ON machines(organization_id);
CREATE INDEX idx_machines_user_id ON machines(user_id);