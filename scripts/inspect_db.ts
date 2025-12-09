
import pg from 'pg';
const { Pool } = pg;

const tables = ['products', 'orders', 'ads', 'events', 'consumer_offsets', 'events_archive'];

async function checkDatabase(name: string, connectionString: string) {
    console.log(`\n--- Checking Database: ${name} ---`);
    const pool = new Pool({ connectionString });
    
    try {
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                const count = res.rows[0].count;
                console.log(`${table}: ${count}`);
                
                if (parseInt(count) > 0) {
                    // If there is data, let's see a sample
                    const sample = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
                    console.log(`  Sample data from ${table}:`, JSON.stringify(sample.rows[0]));
                }
            } catch (err: any) {
                console.log(`${table}: Error - ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`Failed to connect to ${name}:`, err);
    } finally {
        await pool.end();
    }
}

async function clearDatabase(name: string, connectionString: string) {
    console.log(`\n--- Clearing Database: ${name} ---`);
    const pool = new Pool({ connectionString });
    
    try {
        for (const table of tables) {
            try {
                await pool.query(`DELETE FROM ${table}`);
                console.log(`Cleared ${table}`);
            } catch (err: any) {
                console.log(`${table}: Error - ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`Failed to connect to ${name}:`, err);
    } finally {
        await pool.end();
    }
}

async function main() {
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dropship";
    const simDbUrl = process.env.SIMULATOR_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dropship_sim";

    const action = process.argv[2];
    
    if (action === 'clear-live') {
        await clearDatabase('LIVE (dropship)', dbUrl);
    } else if (action === 'clear-sim') {
        await clearDatabase('SIMULATION (dropship_sim)', simDbUrl);
    } else if (action === 'clear-all') {
        await clearDatabase('LIVE (dropship)', dbUrl);
        await clearDatabase('SIMULATION (dropship_sim)', simDbUrl);
    } else {
        await checkDatabase('LIVE (dropship)', dbUrl);
        await checkDatabase('SIMULATION (dropship_sim)', simDbUrl);
    }
}

main();
