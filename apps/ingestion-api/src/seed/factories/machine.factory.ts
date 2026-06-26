import { query } from '../../database/pool.js';
import type { UserData } from './user.factory.js';

export interface MachineData {
  id: string;
  organization_id: string;
  user_id: string;
  hostname: string;
  os: string;
  first_seen: Date;
  last_seen: Date;
}

const OS_OPTIONS = [
  'macOS 14.4 Sonoma',
  'macOS 13.6 Ventura',
  'macOS 15.1 Sequoia',
  'Ubuntu 24.04 LTS',
  'Ubuntu 22.04 LTS',
  'Debian 12 Bookworm',
  'Fedora 40',
  'Arch Linux',
  'Windows 11 Pro',
  'Windows 11 Home',
  'Windows 10 Enterprise',
];

const HOSTNAME_PREFIXES = [
  'dev', 'work', 'prod', 'office', 'home', 'remote', 'laptop', 'desktop',
];

const HOSTNAME_SUFFIXES = [
  'macbook-pro', 'macbook-air', 'imac', 'thinkpad', 'xps', 'surface',
  'workstation', 'desktop', 'server', 'pi', 'ubuntu', 'debian', 'fedora',
  'windows', 'pc', 'rig',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHostname(): string {
  return `${randomFrom(HOSTNAME_PREFIXES)}-${randomFrom(HOSTNAME_SUFFIXES)}`;
}

export async function createMachines(
  users: UserData[],
  machinesPerUser: number = 2
): Promise<MachineData[]> {
  const allMachines: MachineData[] = [];
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  const batchSize = 100;

  for (let batch = 0; batch < users.length; batch += batchSize) {
    const batchUsers = users.slice(batch, batch + batchSize);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const user of batchUsers) {
      const numMachines = randomBetween(1, machinesPerUser);
      for (let i = 0; i < numMachines; i++) {
        const firstSeen = new Date(sixMonthsAgo + Math.random() * (now - sixMonthsAgo));
        const lastSeen = new Date(firstSeen.getTime() + Math.random() * (now - firstSeen.getTime()));

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
        );
        params.push(
          user.organization_id,
          user.id,
          generateHostname(),
          randomFrom(OS_OPTIONS),
          firstSeen,
          lastSeen
        );
        paramIdx += 6;
      }
    }

    if (values.length === 0) continue;

    const result = await query<MachineData>(
      `INSERT INTO machines (organization_id, user_id, hostname, os, first_seen, last_seen)
       VALUES ${values.join(', ')}
       ON CONFLICT DO NOTHING
       RETURNING id, organization_id, user_id, hostname, os, first_seen, last_seen`,
      params
    );
    allMachines.push(...result.rows);
  }

  return allMachines;
}
