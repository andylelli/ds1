import fs from 'fs';
import path from 'path';
const DB_FILE = path.resolve(process.cwd(), 'sandbox_db.json');
export class MockAdapter {
    dbId = "DropShipDB";
    constructor() {
        this.ensureDb();
    }
    ensureDb() {
        if (!fs.existsSync(DB_FILE)) {
            this.writeDb({});
        }
    }
    readDb() {
        try {
            if (!fs.existsSync(DB_FILE))
                return {};
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        }
        catch (e) {
            return {};
        }
    }
    writeDb(data) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }
    async saveItem(containerId, item) {
        const db = this.readDb();
        if (!db[this.dbId])
            db[this.dbId] = {};
        if (!db[this.dbId][containerId])
            db[this.dbId][containerId] = [];
        const container = db[this.dbId][containerId];
        const existingIndex = container.findIndex((i) => i.id === item.id);
        const storedItem = {
            ...item,
            timestamp: item.timestamp || new Date().toISOString(),
            _ts: Math.floor(Date.now() / 1000)
        };
        if (existingIndex >= 0) {
            container[existingIndex] = storedItem;
        }
        else {
            container.push(storedItem);
        }
        this.writeDb(db);
    }
    async getItems(containerId) {
        const db = this.readDb();
        return db[this.dbId]?.[containerId] || [];
    }
    async saveProduct(product) {
        await this.saveItem("Products", product);
    }
    async getProducts() {
        return await this.getItems("Products");
    }
    async saveOrder(order) {
        await this.saveItem("Orders", order);
    }
    async getOrders() {
        return await this.getItems("Orders");
    }
    async saveCampaign(campaign) {
        await this.saveItem("Ads", campaign);
    }
    async getCampaigns() {
        return await this.getItems("Ads");
    }
    async saveLog(agent, message, level, data) {
        await this.saveItem("AgentMemory", {
            agent,
            message,
            level,
            data,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }
    async getRecentLogs(limit) {
        const logs = await this.getItems("AgentMemory");
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    }
}
