-- Optimized indexes for session listing and filtering
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_started ON sessions(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_org_provider ON sessions(organization_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_machine ON sessions(organization_id, machine_id);

-- Composite index for session aggregation queries
CREATE INDEX IF NOT EXISTS idx_events_session_agg ON events(session_id, input_tokens, output_tokens, estimated_cost);
CREATE INDEX IF NOT EXISTS idx_events_model ON events(organization_id, model);
