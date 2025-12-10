import dotenv from 'dotenv';
import path from 'path';
import { Container } from './core/bootstrap/Container.js';

// Load env vars
dotenv.config();

async function main() {
    try {
        // Initialize Container
        const configPath = path.join(process.cwd(), 'config', 'bootstrap.yaml');
        const container = new Container(configPath);
        await container.init();

        // Start MCP Server
        const mcpServer = container.getMcpServer();
        if (mcpServer) {
            await mcpServer.start();
        } else {
            console.error('MCP Server not initialized in container.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Failed to start MCP Server:', error);
        process.exit(1);
    }
}

main();
