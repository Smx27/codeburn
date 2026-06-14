import { execSync } from 'child_process';

console.log('\n🚀 Setting up AiInsight test organization...\n');

try {
  execSync('npx tsx scripts/seeds/seed-dev-org.ts', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Failed to seed test organization');
  console.error('Make sure PostgreSQL is running and DATABASE_URL is set');
  process.exit(1);
}
