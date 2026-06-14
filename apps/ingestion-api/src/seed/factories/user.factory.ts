import { query } from '../../database/pool.js';
import type { OrganizationData } from './organization.factory.js';

export interface UserData {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: string;
}

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
  'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Aisha', 'Wei', 'Hiroshi', 'Priya', 'Carlos', 'Fatima',
  'Olga', 'Raj', 'Yuki', 'Amir', 'Sofia', 'Chen', 'Diego', 'Anya',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Patel', 'Chen', 'Kim', 'Singh', 'Kumar', 'Wang', 'Li', 'Zhang',
  'Tanaka', 'Sato', 'Suzuki', 'Watanabe', 'Yamamoto', 'Nakamura', 'Kobayashi',
  'Fischer', 'Mueller', 'Weber', 'Schneider', 'Meyer', 'Schmidt', 'Wagner',
];

const JOB_TITLES = [
  'Senior Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'DevOps Engineer',
  'AI Engineer',
  'Platform Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'outlook.com', 'proton.me', 'fastmail.com', 'hey.com'];
  const separators = ['.', '_', ''];
  const sep = randomFrom(separators);
  const domain = randomFrom(domains);
  return `${firstName.toLowerCase()}${sep}${lastName.toLowerCase()}@${domain}`;
}

export async function createUsers(
  organizations: OrganizationData[],
  usersPerOrg: number = 75
): Promise<UserData[]> {
  const allUsers: UserData[] = [];
  const usedEmails = new Set<string>();

  for (const org of organizations) {
    const orgUsers: UserData[] = [];

    // Create 1 org_admin for the org
    const adminFirstName = randomFrom(FIRST_NAMES);
    const adminLastName = randomFrom(LAST_NAMES);
    let adminEmail = generateEmail(adminFirstName, adminLastName);
    while (usedEmails.has(adminEmail)) {
      adminEmail = generateEmail(adminFirstName, adminLastName + Math.floor(Math.random() * 100));
    }
    usedEmails.add(adminEmail);

    const adminResult = await query<UserData>(
      `INSERT INTO users (organization_id, email, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id, organization_id, email, name, role`,
      [org.id, adminEmail, `${adminFirstName} ${adminLastName}`, 'org_admin']
    );
    if (adminResult.rows.length > 0) {
      orgUsers.push(adminResult.rows[0]);
    } else {
      const existing = await query<UserData>(
        'SELECT id, organization_id, email, name, role FROM users WHERE email = $1',
        [adminEmail]
      );
      if (existing.rows[0]) orgUsers.push(existing.rows[0]);
    }

    // Create remaining users with role 'user'
    const remaining = usersPerOrg - 1;
    const batchSize = 50;

    for (let batch = 0; batch < remaining; batch += batchSize) {
      const end = Math.min(batch + batchSize, remaining);
      const values: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      for (let i = batch; i < end; i++) {
        let firstName = randomFrom(FIRST_NAMES);
        let lastName = randomFrom(LAST_NAMES);
        let email = generateEmail(firstName, lastName);

        let attempts = 0;
        while (usedEmails.has(email) && attempts < 10) {
          firstName = randomFrom(FIRST_NAMES);
          lastName = randomFrom(LAST_NAMES);
          email = generateEmail(firstName, lastName + Math.floor(Math.random() * 100));
          attempts++;
        }
        if (usedEmails.has(email)) continue;
        usedEmails.add(email);

        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
        params.push(org.id, email, `${firstName} ${lastName}`, 'user');
        paramIdx += 4;
      }

      if (values.length === 0) continue;

      const result = await query<UserData>(
        `INSERT INTO users (organization_id, email, name, role)
         VALUES ${values.join(', ')}
         ON CONFLICT DO NOTHING
         RETURNING id, organization_id, email, name, role`,
        params
      );
      allUsers.push(...result.rows);
    }

    allUsers.push(...orgUsers);
  }

  return allUsers;
}
