/**
 * Database Connection Manager
 * 
 * What it does:
 * - Manages connections to Azure Cosmos DB.
 * - Provides helper functions to initialize the DB and save agent logs.
 * 
 * Interacts with:
 * - Azure Cosmos DB
 * - Main Server (initialization)
 * - Agents (logging/memory)
 */
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { MockCosmosClient } from "./mockDb.js";
import { config } from "./config.js";

let client = null;
let database = null;
let container = null;
let productsContainer = null;
let ordersContainer = null;
let adsContainer = null;

export async function initDatabase() {
  const mode = config.get('dbMode');
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const dbName = process.env.AZURE_COSMOS_DB_NAME || "DropShipDB";
  const containerName = "AgentMemory";

  console.log(`[Database] Initializing in ${mode.toUpperCase()} mode...`);

  if (mode === 'mock') {
    client = new MockCosmosClient();
  } else {
    if (!endpoint) {
      console.warn("[Database] Cannot switch to LIVE mode: AZURE_COSMOS_ENDPOINT not set. Falling back to MOCK.");
      client = new MockCosmosClient();
      config.set('dbMode', 'mock'); // Revert config
    } else {
      // Use Managed Identity if no key provided
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

export async function saveProduct(product) {
  if (!productsContainer) return;
  try {
    await productsContainer.items.create({
      ...product,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to save product:", e.message);
  }
}

export async function saveOrder(order) {
  if (!ordersContainer) return;
  try {
    await ordersContainer.items.create({
      ...order,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to save order:", e.message);
  }
}

export async function saveAd(ad) {
  if (!adsContainer) return;
  try {
    await adsContainer.items.create({
      ...ad,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to save ad:", e.message);
  }
}

export async function saveAgentLog(agentName, message, type = 'log', data = null) {
  if (!container) return; // Fallback if DB not init
  
  try {
    await container.items.create({
      agent: agentName,
      message: message,
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to save log:", e.message);
  }
}

export async function getRecentLogs(limit = 20) {
  if (!container) return [];

  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit",
      parameters: [
        { name: "@limit", value: limit }
      ]
    };
    
    const { resources: items } = await container.items.query(querySpec).fetchAll();
    return items.reverse(); // Return chronological order
  } catch (e) {
    console.error("Failed to fetch logs:", e.message);
    return [];
  }
}

export async function getProducts() {
  if (!productsContainer) return [];
  try {
    const querySpec = { query: "SELECT * FROM c ORDER BY c.timestamp DESC" };
    const { resources: items } = await productsContainer.items.query(querySpec).fetchAll();
    return items;
  } catch (e) {
    console.error("Failed to fetch products:", e.message);
    return [];
  }
}

export async function getOrders() {
  if (!ordersContainer) return [];
  try {
    const querySpec = { query: "SELECT * FROM c ORDER BY c.timestamp DESC" };
    const { resources: items } = await ordersContainer.items.query(querySpec).fetchAll();
    return items;
  } catch (e) {
    console.error("Failed to fetch orders:", e.message);
    return [];
  }
}

export async function getAds() {
  if (!adsContainer) return [];
  try {
    const querySpec = { query: "SELECT * FROM c ORDER BY c.timestamp DESC" };
    const { resources: items } = await adsContainer.items.query(querySpec).fetchAll();
    return items;
  } catch (e) {
    console.error("Failed to fetch ads:", e.message);
    return [];
  }
}
