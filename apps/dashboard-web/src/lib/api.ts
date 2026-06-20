import type { DashboardOverview, ProviderAnalytics, ModelAnalytics, UserAnalytics, ProjectAnalytics, TrendsResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, Period, EnrollmentKey, GenerateEnrollmentKeyRequest, GenerateEnrollmentKeyResponse, Agent, OnboardingProgress, ApiKey, CreateApiKeyRequest, CreateApiKeyResponse, SessionListResponse, SessionListFilters, SessionDetail, MachineDetailResponse } from '@/types/dashboard';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_REFRESH_TOKEN_STORAGE_KEY } from '@/lib/storage-keys';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
        headers['Authorization'] = `Bearer ${data.token}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
        window.location.href = '/login';
      }
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return fetchApi<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOverview(period: Period): Promise<DashboardOverview> {
  return fetchApi<DashboardOverview>(`/api/v1/dashboard/overview?period=${period}`);
}

export async function getProviders(period: Period): Promise<ProviderAnalytics[]> {
  return fetchApi<ProviderAnalytics[]>(`/api/v1/dashboard/providers?period=${period}`);
}

export async function getModels(period: Period, limit?: number): Promise<ModelAnalytics[]> {
  const params = new URLSearchParams({ period });
  if (limit) params.set('limit', limit.toString());
  return fetchApi<ModelAnalytics[]>(`/api/v1/dashboard/models?${params}`);
}

export async function getUsers(period: Period, limit?: number): Promise<UserAnalytics[]> {
  const params = new URLSearchParams({ period });
  if (limit) params.set('limit', limit.toString());
  return fetchApi<UserAnalytics[]>(`/api/v1/dashboard/users?${params}`);
}

export async function getProjects(period: Period, limit?: number): Promise<ProjectAnalytics[]> {
  const params = new URLSearchParams({ period });
  if (limit) params.set('limit', limit.toString());
  return fetchApi<ProjectAnalytics[]>(`/api/v1/dashboard/projects?${params}`);
}

export async function getTrends(period: Period, granularity: 'daily' | 'weekly' | 'monthly'): Promise<TrendsResponse> {
  return fetchApi<TrendsResponse>(`/api/v1/dashboard/trends?period=${period}&granularity=${granularity}`);
}

// ── Enrollment Keys ──────────────────────────────────────

export async function listEnrollmentKeys(): Promise<EnrollmentKey[]> {
  return fetchApi<EnrollmentKey[]>('/api/v1/enrollment-keys/');
}

export async function generateEnrollmentKey(data: GenerateEnrollmentKeyRequest): Promise<GenerateEnrollmentKeyResponse> {
  return fetchApi<GenerateEnrollmentKeyResponse>('/api/v1/enrollment-keys/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function revokeEnrollmentKey(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/api/v1/enrollment-keys/${id}`, {
    method: 'DELETE',
  });
}

export async function rotateEnrollmentKey(id: string): Promise<GenerateEnrollmentKeyResponse> {
  return fetchApi<GenerateEnrollmentKeyResponse>(`/api/v1/enrollment-keys/${id}/rotate`, {
    method: 'POST',
  });
}

// ── Agents ───────────────────────────────────────────────

export async function listAgents(): Promise<Agent[]> {
  return fetchApi<Agent[]>('/api/v1/agents/');
}

// ── Onboarding ───────────────────────────────────────────

export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  return fetchApi<OnboardingProgress>('/api/v1/onboarding/progress');
}

// ── API Keys ─────────────────────────────────────────────

export async function listApiKeys(): Promise<ApiKey[]> {
  return fetchApi<ApiKey[]>('/api/v1/api-keys/');
}

export async function createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  return fetchApi<CreateApiKeyResponse>('/api/v1/api-keys/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteApiKey(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/api/v1/api-keys/${id}`, {
    method: 'DELETE',
  });
}

// ── Sessions ─────────────────────────────────────────────

export async function listSessions(filters?: SessionListFilters): Promise<SessionListResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
  }
  return fetchApi<SessionListResponse>(`/api/v1/sessions/?${params}`);
}

export async function getSession(id: string): Promise<SessionDetail> {
  return fetchApi<SessionDetail>(`/api/v1/sessions/${id}`);
}

// ── Machines ─────────────────────────────────────────────

export async function getMachine(id: string): Promise<MachineDetailResponse> {
  return fetchApi<MachineDetailResponse>(`/api/v1/machines/${id}`);
}