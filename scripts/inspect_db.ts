
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const tables = ['products', 'orders', 'ads', 'events', 'consumer_offsets', 'events_archive'];

function clearLogs(mode: string) {
    const logDir = path.join(projectRoot, 'logs', mode);
    if (fs.existsSync(logDir)) {
        console.log(`Clearing logs for ${mode} in ${logDir}...`);
        const files = fs.readdirSync(logDir);
        for (const file of files) {
            if (file.endsWith('.log')) {
                fs.unlinkSync(path.join(logDir, file));
                console.log(`  Deleted ${file}`);
            }
        }
    } else {
        console.log(`No logs found for ${mode} (directory does not exist).`);
    }
}

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
        clearLogs('live');
    } else if (action === 'clear-sim') {
        await clearDatabase('SIMULATION (dropship_sim)', simDbUrl);
        clearLogs('simulation');
    } else if (action === 'clear-all') {
        await clearDatabase('LIVE (dropship)', dbUrl);
        clearLogs('live');
        await clearDatabase('SIMULATION (dropship_sim)', simDbUrl);
        clearLogs('simulation');
    } else {
        await checkDatabase('LIVE (dropship)', dbUrl);
        await checkDatabase('SIMULATION (dropship_sim)', simDbUrl);
    }
}

main();
