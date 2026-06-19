import * as machineRepo from '../repositories/machine.repository.js';
import type { MachineDetailResponse } from '../types/session.types.js';

export async function getMachineDetail(
  orgId: string,
  machineId: string
): Promise<MachineDetailResponse | null> {
  const machine = await machineRepo.getMachineById(orgId, machineId);
  if (!machine) return null;

  const [stats, dailyActivity, providerBreakdown, modelBreakdown, recentSessions] =
    await Promise.all([
      machineRepo.getMachineStats(orgId, machineId),
      machineRepo.getMachineDailyActivity(orgId, machineId, 30),
      machineRepo.getMachineProviderBreakdown(orgId, machineId),
      machineRepo.getMachineModelBreakdown(orgId, machineId),
      machineRepo.getMachineRecentSessions(orgId, machineId, 10),
    ]);

  return {
    machine,
    stats,
    dailyActivity,
    providerBreakdown,
    modelBreakdown,
    recentSessions,
  };
}
