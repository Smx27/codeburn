export interface DashboardOverview {
  totalSessions: number;
  totalUsers: number;
  totalTokens: number;
  totalCost: number;
  activeProviders: number;
  periodStart: string;
  periodEnd: string;
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
  date: string;
  sessions: number;
  users: number;
  tokens: number;
  cost: number;
}

export interface TrendsResponse {
  granularity: "daily" | "weekly" | "monthly";
  data: TrendPoint[];
}

export type Period = "24h" | "7d" | "30d" | "90d" | "1y";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    organizationId: string;
    role: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  organizationId: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface RegisterResponse {
  token: string;
  user: AuthUser;
}

// ── Enrollment Key Types ─────────────────────────────────

export interface EnrollmentKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
}

export interface GenerateEnrollmentKeyRequest {
  name: string;
  expiresAt?: string;
}

export interface GenerateEnrollmentKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
}

// ── Agent Types ──────────────────────────────────────────

export type AgentStatus = 'ONLINE' | 'OFFLINE';

export interface Agent {
  id: string;
  hostname: string;
  os: string;
  architecture: string;
  agentVersion: string;
  status: AgentStatus;
  lastSeenAt: string;
  registeredAt: string;
}

// ── New Dashboard Types ──────────────────────────────────

export type InsightType = "anomaly" | "trend" | "milestone" | "recommendation";

export interface InsightItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metric?: string;
  metricValue?: string;
  trend?: "up" | "down" | "flat";
  trendPercent?: number;
  icon?: string;
  timestamp: string;
  dismissed: boolean;
}

export interface HeatmapCell {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapDay {
  day: string;
  cells: HeatmapCell[];
}

export interface HeatmapData {
  weeks: HeatmapDay[];
  maxValue: number;
  totalActivity: number;
}

export type ProviderStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ProviderHealth {
  providerId: number;
  providerName: string;
  status: ProviderStatus;
  latencyMs: number;
  errorRate: number;
  uptimePercent: number;
  lastChecked: string;
  requestCount: number;
}

export interface ChartConfig {
  id: string;
  title: string;
  description?: string;
  type:
    | "area"
    | "bar"
    | "line"
    | "pie"
    | "donut"
    | "radar"
    | "scatter"
    | "heatmap";
  dataKey: string;
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
  formatValue?: (value: number) => string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
}

export type NavItemType = "link" | "separator" | "group";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: string;
  type: NavItemType;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "destructive";
  active?: boolean;
  disabled?: boolean;
  children?: NavItem[];
}

export interface ActivitySummary {
  totalEvents: number;
  activeUsers: number;
  peakHour: string;
  peakHourEvents: number;
  topAction: string;
  topActionCount: number;
  eventsByHour: number[];
  eventsByDay: number[];
}

// ── Onboarding Types ─────────────────────────────────────

export interface OnboardingSteps {
  organizationCreated: boolean;
  enrollmentKeyGenerated: boolean;
  agentInstalled: boolean;
  syncRunning: boolean;
  syncComplete: boolean;
  teamInvited: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingSteps;
  completionPercentage: number;
}

// ── API Key Types ────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  role: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface CreateApiKeyRequest {
  name: string;
  role?: 'read' | 'write' | 'admin';
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  role: string;
  created_at: string;
  key: string;
}

// ── Session Types ────────────────────────────────────────

export interface SessionListItem {
  id: string;
  provider: string;
  projectName: string | null;
  userName: string;
  userEmail: string;
  machineName: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface SessionEvent {
  id: string;
  eventType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCost: number;
  eventTime: string;
}

export interface SessionDetail {
  id: string;
  provider: string;
  projectName: string | null;
  user: { id: string; name: string | null; email: string };
  machine: { id: string; hostname: string };
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  eventCount: number;
  events: SessionEvent[];
}

export interface SessionListResponse {
  sessions: SessionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SessionListFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  provider?: string;
  model?: string;
  userId?: string;
  machineId?: string;
  startDate?: string;
  endDate?: string;
}

// ── Machine Detail Types ─────────────────────────────────

export interface MachineDetail {
  id: string;
  hostname: string;
  os: string | null;
  architecture: string | null;
  agentVersion: string | null;
  status: string;
  firstSeen: string;
  lastSeen: string;
  user: { id: string; name: string | null; email: string };
}

export interface MachineStats {
  totalSessions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface MachineDailyActivity {
  date: string;
  sessions: number;
  tokens: number;
  cost: number;
}

export interface MachineProviderBreakdown {
  provider: string;
  sessions: number;
  tokens: number;
  cost: number;
}

export interface MachineModelBreakdown {
  model: string;
  sessions: number;
  tokens: number;
  cost: number;
}

export interface MachineDetailResponse {
  machine: MachineDetail;
  stats: MachineStats;
  dailyActivity: MachineDailyActivity[];
  providerBreakdown: MachineProviderBreakdown[];
  modelBreakdown: MachineModelBreakdown[];
  recentSessions: SessionListItem[];
}
