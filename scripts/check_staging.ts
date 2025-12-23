
import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://postgres:postgres@localhost:5432/dropship_sim';

async function run() {
    const pool = new Pool({ connectionString });
    try {
        const res = await pool.query("SELECT * FROM research_staging WHERE session_id = 'research_d9a542da'");
        console.log(`Found ${res.rows.length} items.`);
        res.rows.forEach(row => {
            console.log(`ID: ${row.id}`);
            console.log(`Name: '${row.name}'`);
            console.log(`Description: '${row.description}'`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
