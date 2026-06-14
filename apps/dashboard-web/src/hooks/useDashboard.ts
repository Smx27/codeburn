import { useQuery } from '@tanstack/react-query';
import { getOverview, getProviders, getModels, getUsers, getProjects, getTrends, getOnboardingProgress, listAgents } from '@/lib/api';
import type { Period } from '@/types/dashboard';

export function useOverview(period: Period) {
  return useQuery({
    queryKey: ['overview', period],
    queryFn: () => getOverview(period),
  });
}

export function useProviders(period: Period) {
  return useQuery({
    queryKey: ['providers', period],
    queryFn: () => getProviders(period),
  });
}

export function useModels(period: Period, limit?: number) {
  return useQuery({
    queryKey: ['models', period, limit],
    queryFn: () => getModels(period, limit),
  });
}

export function useUsers(period: Period, limit?: number) {
  return useQuery({
    queryKey: ['users', period, limit],
    queryFn: () => getUsers(period, limit),
  });
}

export function useProjects(period: Period, limit?: number) {
  return useQuery({
    queryKey: ['projects', period, limit],
    queryFn: () => getProjects(period, limit),
  });
}

export function useTrends(period: Period, granularity: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['trends', period, granularity],
    queryFn: () => getTrends(period, granularity),
  });
}

export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: () => getOnboardingProgress(),
    staleTime: 60_000,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents(),
    staleTime: 30_000,
  });
}