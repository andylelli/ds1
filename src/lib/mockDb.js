import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'sandbox_db.json');

// Helper to read/write DB
function readDb() {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export class MockCosmosClient {
  constructor() {
    this.databases = {
      createIfNotExists: async ({ id }) => {
        console.log(`[MockDB] Database '${id}' ready.`);
        return { database: new MockDatabase(id) };
      }
    };
  }
}

class MockDatabase {
  constructor(dbId) {
    this.dbId = dbId;
    this.containers = {
      createIfNotExists: async ({ id }) => {
        console.log(`[MockDB] Container '${id}' ready.`);
        return { container: new MockContainer(this.dbId, id) };
      }
    };
  }
}

class MockContainer {
  constructor(dbId, containerId) {
    this.dbId = dbId;
    this.containerId = containerId;
    this.items = {
      create: async (item) => {
        const db = readDb();
        // Initialize structure if missing
        if (!db[this.dbId]) db[this.dbId] = {};
        if (!db[this.dbId][this.containerId]) db[this.dbId][this.containerId] = [];
        
        // Add metadata
        const storedItem = {
          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          _ts: Math.floor(Date.now() / 1000),
          ...item
        };

        db[this.dbId][this.containerId].push(storedItem);
        writeDb(db);
        
        return { resource: storedItem };
      },
      query: (querySpec) => {
        const db = readDb();
        let items = db[this.dbId]?.[this.containerId] || [];
        
        // Very basic query simulation
        // If query contains "ORDER BY c.timestamp DESC", we sort
        if (querySpec.query.includes('ORDER BY c.timestamp DESC')) {
          items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        // If query contains "LIMIT", we slice
        // Note: This is a very rough approximation for sandbox purposes
        const limitMatch = querySpec.query.match(/LIMIT @limit/);
        if (limitMatch && querySpec.parameters) {
           const limitParam = querySpec.parameters.find(p => p.name === '@limit');
           if (limitParam) {
             items = items.slice(0, limitParam.value);
           }
        }

        return { 
          fetchAll: async () => ({ resources: items }) 
        };
      }
    };
  }
}
