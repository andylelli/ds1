import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Initializing PostgresAdapter...');
  const adapter = new PostgresAdapter();
  
  // Give it a moment to initialize pools if needed, though it's synchronous in constructor
  
  try {
    const pool = adapter.getPool();
    
    const migrationPath = path.join(__dirname, '../src/db/migrations/001_update_events_table.sql');
    console.log(`Reading migration from: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration SQL...');
    await pool.query(sql);
    console.log('Migration successful.');
  } catch (e: any) {
    console.error('Migration failed:', e.message);
    if (e.message.includes('Database pool not initialized')) {
        console.error('Check your database configuration.');
    }
  }
  
  process.exit(0);
}

run();
