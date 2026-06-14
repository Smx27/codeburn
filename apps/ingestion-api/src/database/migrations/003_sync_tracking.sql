-- Migration 003: Sync tracking tables
-- Run after 002_sessions_events.sql

-- Sync sources table (tracks source files)
CREATE TABLE sync_sources (
    id BIGSERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    source_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    checksum TEXT,
    last_modified TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (machine_id, provider, source_path)
);

-- Sync state table (tracks synchronization progress)
CREATE TABLE sync_state (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    source_identifier TEXT NOT NULL,
    last_processed_at TIMESTAMPTZ,
    last_hash TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, machine_id, provider, source_identifier)
);

-- Indexes for sync_sources
CREATE INDEX idx_sync_sources_machine_id ON sync_sources(machine_id);
CREATE INDEX idx_sync_sources_provider ON sync_sources(provider);
CREATE INDEX idx_sync_sources_last_synced ON sync_sources(last_synced_at);

-- Indexes for sync_state
CREATE INDEX idx_sync_state_org_id ON sync_state(organization_id);
CREATE INDEX idx_sync_state_machine_id ON sync_state(machine_id);
CREATE INDEX idx_sync_state_provider ON sync_state(provider);
CREATE INDEX idx_sync_state_source ON sync_state(source_identifier);
CREATE INDEX idx_sync_state_updated ON sync_state(updated_at);