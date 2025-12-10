import { YamlLoader } from './YamlLoader.js';
import { ServiceFactory } from './ServiceFactory.js';
import { logger } from '../../infra/logging/LoggerService.js';
import { MCPServer } from '../mcp/server.js';
import { WorkflowManager } from '../workflow/WorkflowManager.js';
export class Container {
    config;
    factory;
    persistence;
    eventBus;
    services = new Map();
    agents = new Map();
    mcpServer;
    constructor(configPath) {
        this.config = YamlLoader.load(configPath);
        this.factory = new ServiceFactory(this.config);
        this.mcpServer = new MCPServer();
    }
    async init() {
        logger.info('Initializing Container...');
        // 1. Infrastructure
        this.persistence = this.factory.createPersistence();
        this.eventBus = this.factory.createEventBus();
        // 2. Register Internal Services (Adapters)
        const dependencies = {
            db: this.persistence,
            eventBus: this.eventBus
        };
        if (this.config.mcp && this.config.mcp.mcp_servers) {
            for (const server of this.config.mcp.mcp_servers) {
                if (server.type === 'internal' && server.class) {
                    try {
                        const instance = this.factory.createAdapter(server.class, dependencies);
                        this.services.set(server.id, instance);
                        // Map to dependency name
                        const depName = this.mapClassToDependency(server.class);
                        if (depName) {
                            dependencies[depName] = instance;
                        }
                        logger.info(`Registered internal service: ${server.id} (${server.class})`);
                        // Register MCP Wrapper
                        const wrapper = this.factory.createMcpWrapper(server.class, instance);
                        if (wrapper) {
                            const tools = wrapper.getTools();
                            for (const tool of tools) {
                                this.mcpServer.registerTool(tool.name, (args) => wrapper.executeTool(tool.name, args));
                            }
                            logger.info(`Registered MCP tools for ${server.class}`);
                        }
                    }
                    catch (e) {
                        logger.error(`Failed to register service ${server.id}: ${e.message}`);
                    }
                }
            }
        }
        // 3. Initialize Agents
        if (this.config.agents && this.config.agents.agents) {
            for (const agentConfig of this.config.agents.agents) {
                try {
                    const agent = this.factory.createAgent(agentConfig.class, dependencies);
                    this.agents.set(agentConfig.id, agent);
                    logger.info(`Registered agent: ${agentConfig.id}`);
                }
                catch (e) {
                    logger.error(`Failed to register agent ${agentConfig.id}: ${e.message}`);
                }
            }
        }
        // 4. Initialize Workflow Manager
        if (this.config.workflows) {
            try {
                const workflowManager = new WorkflowManager(this.eventBus, this.config.workflows, (id) => this.agents.get(id));
                workflowManager.registerSubscriptions();
                logger.info('Workflow Manager initialized and subscriptions registered.');
            }
            catch (e) {
                logger.error(`Failed to initialize Workflow Manager: ${e.message}`);
            }
        }
        logger.info('Container initialized.');
    }
    mapClassToDependency(className) {
        switch (className) {
            case 'ShopifyAdapter': return 'shop';
            case 'AdsAdapter': return 'ads';
            case 'TrendAdapter': return 'trend';
            case 'CompetitorAdapter': return 'competitor';
            case 'FulfilmentAdapter': return 'fulfilment';
            case 'EmailAdapter': return 'email';
            case 'AiAdapter': return 'ai';
            default: return null;
        }
    }
    getService(id) {
        return this.services.get(id);
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    getConfig() {
        return this.config;
    }
    getMcpServer() {
        return this.mcpServer;
    }
}
