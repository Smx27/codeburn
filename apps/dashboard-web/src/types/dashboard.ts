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
