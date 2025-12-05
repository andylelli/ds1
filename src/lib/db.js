import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { MockCosmosClient } from "./mockDb.js";
import { config } from "./config.js";
import pg from 'pg';
const { Pool } = pg;

let client = null;
let database = null;
let container = null;
let productsContainer = null;
let ordersContainer = null;
let adsContainer = null;

// Postgres Pools
let pgPool = null;
let simPool = null;

export async function initDatabase() {
  const mode = config.get('dbMode');
  
  // Initialize Postgres Pools
  if (!pgPool) {
    pgPool = new Pool({ connectionString: config.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship" });
  }
  if (!simPool) {
    simPool = new Pool({ connectionString: config.get('simulatorDatabaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship_sim" });
  }

  // Legacy Cosmos/Mock Init (keeping for backward compatibility if needed, but we are moving to PG)
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const dbName = process.env.AZURE_COSMOS_DB_NAME || "DropShipDB";
  const containerName = "AgentMemory";

  console.log(`[Database] Initializing in ${mode.toUpperCase()} mode...`);

  if (mode === 'mock') {
    client = new MockCosmosClient();
  } else {
    if (!endpoint) {
      // console.warn("[Database] Cannot switch to LIVE mode: AZURE_COSMOS_ENDPOINT not set. Falling back to MOCK.");
      client = new MockCosmosClient();
      // config.set('dbMode', 'mock'); // Revert config
    } else {
      if (process.env.AZURE_COSMOS_KEY) {
        client = new CosmosClient({ endpoint, key: process.env.AZURE_COSMOS_KEY });
      } else {
        client = new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
      }
    }
  }

  const { database: db } = await client.databases.createIfNotExists({ id: dbName });
  database = db;
  const { container: c } = await database.containers.createIfNotExists({ id: containerName });
  container = c;
  const { container: pc } = await database.containers.createIfNotExists({ id: "Products" });
  productsContainer = pc;
  const { container: oc } = await database.containers.createIfNotExists({ id: "Orders" });
  ordersContainer = oc;
  const { container: ac } = await database.containers.createIfNotExists({ id: "Ads" });
  adsContainer = ac;
  
  console.log(`[Database] Connected to ${mode === 'mock' ? 'Mock DB' : 'Cosmos DB'}: ${dbName}`);
}

export async function switchDatabaseMode(newMode) {
  if (newMode !== 'mock' && newMode !== 'live') return;
  config.set('dbMode', newMode);
  await initDatabase();
}

// Helper to get the correct pool based on context or config
// For now, we default to pgPool (Live), but simulation can override
function getPool(overridePool) {
  return overridePool || pgPool;
}

export async function saveProduct(product, poolOverride = null) {
  const pool = getPool(poolOverride);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO products (id, name, description, price, potential, margin, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           data = EXCLUDED.data`,
        [
          product.id, 
          product.name, 
          product.description, 
          product.price, 
          product.potential, 
          product.margin, 
          JSON.stringify(product)
        ]
      );
    } catch (e) {
      console.error("Failed to save product to PG:", e.message);
    }
  }
  
  // Keep saving to Mock/Cosmos for now to not break existing UI that relies on it?
  // Actually, user wants to see it in DB tab which reads from PG.
  // But existing "Products" tab reads from `getProducts` which reads from Cosmos/Mock.
  // I should update `getProducts` too.
  
  if (productsContainer) {
    try {
      await productsContainer.items.create({ ...product, timestamp: new Date().toISOString() });
    } catch (e) {}
  }
}

export async function saveOrder(order, poolOverride = null) {
  const pool = getPool(poolOverride);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (id, product_id, amount, status, source, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          order.id,
          order.productId || order.product_id || 'unknown', // Ensure field mapping
          order.amount,
          order.status || 'pending',
          order.source || 'unknown',
          JSON.stringify(order)
        ]
      );
    } catch (e) {
      console.error("Failed to save order to PG:", e.message);
    }
  }

  if (ordersContainer) {
    try {
      await ordersContainer.items.create({ ...order, timestamp: new Date().toISOString() });
    } catch (e) {}
  }
}

export async function saveAd(ad, poolOverride = null) {
  const pool = getPool(poolOverride);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO ads (id, platform, product, budget, status, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          ad.id || `ad_${Date.now()}`,
          ad.platform,
          ad.product,
          ad.budget,
          ad.status,
          JSON.stringify(ad)
        ]
      );
    } catch (e) {
      console.error("Failed to save ad to PG:", e.message);
    }
  }

  if (adsContainer) {
    try {
      await adsContainer.items.create({ ...ad, timestamp: new Date().toISOString() });
    } catch (e) {}
  }
}

export async function saveAgentLog(agentName, message, level = 'info', data = null) {
  // Logs are special, they go to Events table via EventBus usually, but here we might just log to console or Cosmos
  // The simulation uses EventBus directly for logs now.
  // We keep this for backward compatibility with other agents.
  if (container) {
    try {
      await container.items.create({
        agent: agentName,
        message: message,
        level: level,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}
  }
}

export async function getRecentLogs(limit = 20) {
  if (!container) return [];
  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit",
      parameters: [{ name: "@limit", value: limit }]
    })
    .fetchAll();
  return resources;
}

export async function getProducts() {
  // Prefer PG if available?
  if (pgPool) {
    try {
      const res = await pgPool.query("SELECT * FROM products ORDER BY created_at DESC");
      return res.rows.map(r => ({ ...r.data, timestamp: r.created_at }));
    } catch (e) { console.error(e); }
  }
  
  if (!productsContainer) return [];
  const { resources } = await productsContainer.items.query("SELECT * FROM c").fetchAll();
  return resources;
}

export async function getOrders() {
  if (pgPool) {
    try {
      const res = await pgPool.query("SELECT * FROM orders ORDER BY created_at DESC");
      return res.rows.map(r => ({ ...r.data, timestamp: r.created_at }));
    } catch (e) { console.error(e); }
  }

  if (!ordersContainer) return [];
  const { resources } = await ordersContainer.items.query("SELECT * FROM c").fetchAll();
  return resources;
}

export async function getAds() {
  if (pgPool) {
    try {
      const res = await pgPool.query("SELECT * FROM ads ORDER BY created_at DESC");
      return res.rows.map(r => ({ ...r.data, timestamp: r.created_at }));
    } catch (e) { console.error(e); }
  }

  if (!adsContainer) return [];
  const { resources } = await adsContainer.items.query("SELECT * FROM c").fetchAll();
  return resources;
}
