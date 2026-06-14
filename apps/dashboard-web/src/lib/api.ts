import type { DashboardOverview, ProviderAnalytics, ModelAnalytics, UserAnalytics, ProjectAnalytics, TrendsResponse, LoginRequest, LoginResponse, Period } from '@/types/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aiinsight_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aiinsight_token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/api/v1/auth/login', {
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