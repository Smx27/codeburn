export interface AggregationRun {
  id: string;
  organization_id: string;
  aggregation_type: 'daily' | 'historical_backfill';
  started_at: Date;
  completed_at: Date | null;
  status: 'running' | 'completed' | 'failed';
  records_processed: number;
  error_message: string | null;
  created_at: Date;
}

export interface DailyUsage {
  id: string;
  organization_id: string;
  usage_date: Date;
  total_sessions: number;
  total_users: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  created_at: Date;
}

export interface DailyProviderUsage {
  id: string;
  organization_id: string;
  provider_id: number;
  usage_date: Date;
  total_sessions: number;
  total_tokens: number;
  total_cost: number;
  created_at: Date;
}

export interface DailyModelUsage {
  id: string;
  organization_id: string;
  model: string;
  usage_date: Date;
  total_tokens: number;
  total_cost: number;
  session_count: number;
  created_at: Date;
}

export interface DailyUserUsage {
  id: string;
  organization_id: string;
  user_id: string;
  usage_date: Date;
  session_count: number;
  token_count: number;
  cost: number;
  created_at: Date;
}

export interface DailyProjectUsage {
  id: string;
  organization_id: string;
  project_name: string;
  usage_date: Date;
  session_count: number;
  token_count: number;
  cost: number;
  created_at: Date;
}

export interface AggregationJobInput {
  organizationId: string;
  startDate: Date;
  endDate: Date;
}

export interface DailyAggregationInput {
  organizationId: string;
  date: Date;
}

export interface BackfillProgress {
  organizationId: string;
  totalDays: number;
  processedDays: number;
  currentDate: Date | null;
  startedAt: Date;
  estimatedCompletion: Date | null;
}

export interface DashboardOverview {
  totalSessions: number;
  totalUsers: number;
  totalTokens: number;
  totalCost: number;
  activeProviders: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface ProviderAnalytics {
  providerId: number;
  providerName: string;
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  percentageOfTotal: number;
}

export interface ModelAnalytics {
  model: string;
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
  percentageOfTotal: number;
}

export interface UserAnalytics {
  userId: string;
  userEmail: string;
  userName: string | null;
  sessionCount: number;
  tokenCount: number;
  cost: number;
}

export interface ProjectAnalytics {
  projectName: string;
  sessionCount: number;
  tokenCount: number;
  cost: number;
}

export interface TrendPoint {
  date: Date;
  sessions: number;
  users: number;
  tokens: number;
  cost: number;
}

export interface TrendsResponse {
  granularity: 'daily' | 'weekly' | 'monthly';
  data: TrendPoint[];
  periodStart: Date;
  periodEnd: Date;
}

export type AggregationType = 'daily' | 'historical_backfill';
export type AggregationStatus = 'running' | 'completed' | 'failed';