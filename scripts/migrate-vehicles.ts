import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = neon(process.env.DATABASE_URL!);
const migrationSql = readFileSync(join(process.cwd(), 'src/lib/db/migrations/0001_vehicles.sql'), 'utf-8');

async function migrate() {
  console.log('Running vehicle migration...');
  await sql(migrationSql);
  console.log('Migration complete!');
}

migrate().catch(console.error);
