import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const pool = new Pool({
  connectionString: config.simulatorDatabaseUrl,
});

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Running schema migration for SIMULATOR DB...');
    await pool.query(schemaSql);
    console.log('Schema migration completed successfully.');
  } catch (err) {
    console.error('Error running schema migration:', err);
  } finally {
    await pool.end();
  }
}

initDb();
