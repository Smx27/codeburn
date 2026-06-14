-- Migration 002: Sessions and Events tables
-- Run after 001_initial_schema.sql

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider_id SMALLINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    external_session_id TEXT NOT NULL,
    project_name TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    raw_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, external_session_id)
);

-- Events table (raw normalized data lake)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    cache_read_tokens BIGINT NOT NULL DEFAULT 0,
    cache_write_tokens BIGINT NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    payload JSONB NOT NULL
);

-- Indexes for sessions
CREATE INDEX idx_sessions_org_id ON sessions(organization_id);
CREATE INDEX idx_sessions_machine_id ON sessions(machine_id);
CREATE INDEX idx_sessions_provider_id ON sessions(provider_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);

-- Indexes for events
CREATE INDEX idx_events_org_id ON events(organization_id);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_event_time ON events(event_time);
CREATE INDEX idx_events_model ON events(model);
CREATE INDEX idx_events_event_type ON events(event_type);

-- Composite indexes for common query patterns
CREATE INDEX idx_events_org_time ON events(organization_id, event_time DESC);
CREATE INDEX idx_events_session_time ON events(session_id, event_time);