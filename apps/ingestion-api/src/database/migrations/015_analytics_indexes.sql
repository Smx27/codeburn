-- Performance indexes for query-time analytics (no pre-aggregation required)

-- Project analytics: GROUP BY project_name with org + date filtering
CREATE INDEX IF NOT EXISTS idx_sessions_project_name ON sessions(project_name);

-- Covering index for token/cost aggregations per session
CREATE INDEX IF NOT EXISTS idx_events_org_model_cost ON events(organization_id, model, input_tokens, output_tokens, estimated_cost);
