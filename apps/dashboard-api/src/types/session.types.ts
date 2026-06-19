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
  page: number;
  limit: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search?: string;
  provider?: string;
  model?: string;
  userId?: string;
  machineId?: string;
  startDate?: string;
  endDate?: string;
}

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
