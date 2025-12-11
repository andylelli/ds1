
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function checkLogs() {
  try {
    const res = await pool.query("SELECT * FROM activity_log LIMIT 1");
    if (res.rows.length > 0) {
        console.log("Columns:", Object.keys(res.rows[0]));
    } else {
        console.log("Table is empty, cannot determine columns from data.");
    }

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

checkLogs();
