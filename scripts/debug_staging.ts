
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;

async function inspectStaging() {
    // Use simulator DB by default as per config.json
    const connectionString = process.env.SIMULATOR_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dropship_sim';
    console.log(`Connecting to DB: ${connectionString.replace(/:[^:]*@/, ':****@')}...`);
    
    const pool = new Pool({ connectionString });

    try {
        console.log('\n--- Research Sessions ---');
        const sessions = await pool.query('SELECT id, category, status, started_at FROM research_sessions ORDER BY started_at DESC LIMIT 5');
        console.table(sessions.rows);

        console.log('\n--- Research Staging Items ---');
        const items = await pool.query('SELECT id, session_id, name, confidence_score, status, created_at FROM research_staging ORDER BY created_at DESC LIMIT 10');
        console.table(items.rows);

        if (items.rows.length > 0) {
            console.log('\n--- Detailed View of Latest Item ---');
            const latest = items.rows[0];
            const fullItem = await pool.query('SELECT * FROM research_staging WHERE id = $1', [latest.id]);
            console.log(JSON.stringify(fullItem.rows[0], null, 2));
        }

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

inspectStaging();
