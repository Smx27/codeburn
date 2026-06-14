export { createOrganizations, OrganizationData } from './factories/organization.factory.js';
export { createUsers, UserData } from './factories/user.factory.js';
export { createMachines, MachineData } from './factories/machine.factory.js';
export { createSessions, SessionData } from './factories/session.factory.js';
export { createEvents, EventData } from './factories/event.factory.js';

export async function seed(): Promise<void> {
  const { createOrganizations: createOrgs } = await import('./factories/organization.factory.js');
  const { createUsers: createUsrs } = await import('./factories/user.factory.js');
  const { createMachines: createMchns } = await import('./factories/machine.factory.js');
  const { createSessions: createSessns } = await import('./factories/session.factory.js');
  const { createEvents: createEvnts } = await import('./factories/event.factory.js');

  const organizations = await createOrgs();
  const users = await createUsrs(organizations, 75);
  const machines = await createMchns(users, 2);
  const sessions = await createSessns(users, machines, 20);
  await createEvnts(sessions, 15);
}
