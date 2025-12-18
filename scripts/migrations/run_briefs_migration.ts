import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dropship_sim'  // Use dropship_sim for test mode
});

async function runMigration() {
  const sqlFile = path.join(__dirname, '../migrations/create_briefs_table.sql');
  console.log(`Running migration: ${sqlFile}`);
  
  try {
    const sql = readFileSync(sqlFile, 'utf-8');
    await pool.query(sql);
    console.log('✅ Opportunity Briefs table created successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
