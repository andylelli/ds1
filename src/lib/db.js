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

let client = null;
let database = null;
let container = null;

export async function initDatabase() {
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const dbName = process.env.AZURE_COSMOS_DB_NAME || "DropShipDB";
  const containerName = "AgentMemory";

  if (!endpoint) {
    console.warn("AZURE_COSMOS_ENDPOINT not set. Running in memory-only mode.");
    return;
  }

  // Use Managed Identity if no key provided
  if (process.env.AZURE_COSMOS_KEY) {
    client = new CosmosClient({ endpoint, key: process.env.AZURE_COSMOS_KEY });
  } else {
    client = new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
  }

  const { database: db } = await client.databases.createIfNotExists({ id: dbName });
  database = db;
  
  const { container: c } = await database.containers.createIfNotExists({ id: containerName });
  container = c;
  
  console.log(`[Database] Connected to Cosmos DB: ${dbName}`);
}

export async function saveAgentLog(agentName, message) {
  if (!container) return; // Fallback if DB not init
  
  await container.items.create({
    agent: agentName,
    message: message,
    timestamp: new Date().toISOString(),
    type: 'log'
  });
}
