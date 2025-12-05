#!/usr/bin/env node
import pg from 'pg';
import { EventStore } from '../lib/eventbus/EventStore.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

function printHelp() {
  console.log(`eventbus-cli - Inspect your event bus

Usage:
  node eventbus-cli.js list-topics
  node eventbus-cli.js list-consumers
  node eventbus-cli.js show-events --topic <topic> [--limit <n>]
  node eventbus-cli.js show-offsets [--topic <topic>]

Environment:
  DATABASE_URL  Postgres connection URL (or set in config.json)
`);
}

function parseArgs(argv) {
  const [, , ...rest] = argv;
  const result = { command: undefined, flags: {} };

  if (rest.length === 0) return result;
  result.command = rest[0];

  let i = 1;
  while (i < rest.length) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith("--")) {
        result.flags[key] = true;
        i += 1;
      } else {
        result.flags[key] = next;
        i += 2;
      }
    } else {
      i += 1;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.command || args.flags["help"]) {
    printHelp();
    process.exit(0);
  }

  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // Try to read from config.json
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const configPath = path.join(__dirname, '../../config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      dbUrl = config.databaseUrl;
    } catch (e) {
      // ignore
    }
  }

  if (!dbUrl) {
    console.error("DATABASE_URL environment variable is required or must be set in config.json");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  // const store = new EventStore(pool); // Not used directly in CLI but good to have if we extend it

  try {
    switch (args.command) {
      case "list-topics": {
        const res = await pool.query(
          "SELECT DISTINCT topic FROM events ORDER BY topic ASC"
        );
        if (res.rowCount === 0) {
          console.log("No topics found.");
        } else {
          console.log("Topics:");
          for (const row of res.rows) {
            console.log(" -", row.topic);
          }
        }
        break;
      }

      case "list-consumers": {
        const res = await pool.query(
          "SELECT consumer_name, topic, last_event_id, updated_at FROM consumer_offsets ORDER BY consumer_name, topic"
        );
        if (res.rowCount === 0) {
          console.log("No consumers found.");
        } else {
          console.log("Consumers:");
          for (const row of res.rows) {
            console.log(
              ` - ${row.consumer_name} on topic=${row.topic}, last_event_id=${row.last_event_id}, updated_at=${row.updated_at}`
            );
          }
        }
        break;
      }

      case "show-events": {
        const topic = args.flags["topic"];
        const limitFlag = args.flags["limit"];
        const limit = typeof limitFlag === "string" ? parseInt(limitFlag, 10) : 20;

        if (!topic || typeof topic !== "string") {
          console.error("--topic is required");
          process.exit(1);
        }

        const res = await pool.query(
          "SELECT id, topic, type, payload, created_at FROM events WHERE topic = $1 ORDER BY id DESC LIMIT $2",
          [topic, isNaN(limit) ? 20 : limit]
        );

        if (res.rowCount === 0) {
          console.log(`No events found for topic '${topic}'.`);
        } else {
          console.log(`Events for topic '${topic}':`);
          for (const row of res.rows) {
            console.log(
              `
#${row.id} [${row.created_at}] type=${row.type}
payload=${JSON.stringify(
                row.payload,
                null,
                2
              )}`
            );
          }
        }
        break;
      }

      case "show-offsets": {
        const topic = args.flags["topic"];
        if (topic && typeof topic !== "string") {
          console.error("--topic must be a string");
          process.exit(1);
        }

        const query =
          "SELECT consumer_name, topic, last_event_id, updated_at FROM consumer_offsets" +           (topic ? " WHERE topic = $1" : "") +           " ORDER BY consumer_name, topic";

        const res = topic
          ? await pool.query(query, [topic])
          : await pool.query(query.replace(" WHERE topic = $1", ""));

        if (res.rowCount === 0) {
          console.log(topic ? `No offsets found for topic '${topic}'.` : "No offsets found.");
        } else {
          console.log("Offsets:");
          for (const row of res.rows) {
            console.log(
              ` - ${row.consumer_name} on topic=${row.topic}, last_event_id=${row.last_event_id}, updated_at=${row.updated_at}`
            );
          }
        }
        break;
      }

      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
