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
        this.services.set('db', this.persistence);
        this.eventBus = this.factory.createEventBus();
        // Create Staging Service
        let stagingService;
        try {
            stagingService = this.factory.createStagingService(this.persistence);
            this.services.set('staging', stagingService);
        }
        catch (e) {
            logger.warn(`[Container] Failed to create Staging Service: ${e}`);
        }
        // 2. Register Internal Services (Adapters)
        const dependencies = {
            db: this.persistence,
            eventBus: this.eventBus,
            staging: stagingService
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
        const systemMode = this.config.bootstrap?.system?.mode || 'live';
        const servicesConfig = this.config.bootstrap?.services || {};
        logger.info(`[Container] System Mode from config: ${systemMode}`);
        logger.info(`[Container] Services Config: ${JSON.stringify(servicesConfig)}`);
        if (this.config.agents && this.config.agents.agents) {
            for (const agentConfig of this.config.agents.agents) {
                try {
                    const agent = this.factory.createAgent(agentConfig.class, dependencies);
                    // Determine Agent Mode
                    let agentMode = systemMode;
                    const serviceKey = this.mapAgentToService(agentConfig.id);
                    if (serviceKey) {
                        const specificMode = servicesConfig[serviceKey];
                        if (specificMode) {
                            agentMode = specificMode;
                            logger.info(`[Container] Agent ${agentConfig.id} mapped to service ${serviceKey} with mode ${specificMode}`);
                        }
                        else {
                            logger.info(`[Container] Agent ${agentConfig.id} mapped to service ${serviceKey} but no specific mode found. Using system mode: ${systemMode}`);
                        }
                    }
                    else {
                        logger.info(`[Container] Agent ${agentConfig.id} has no service mapping. Using system mode: ${systemMode}`);
                    }
                    // Set Agent Mode
                    if (typeof agent.setMode === 'function') {
                        agent.setMode(agentMode);
                    }
                    this.agents.set(agentConfig.id, agent);
                    logger.info(`Registered agent: ${agentConfig.id} [${agentMode}]`);
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
            case 'LiveVideoAdapter': return 'video';
            default: return null;
        }
    }
    mapAgentToService(agentId) {
        switch (agentId) {
            case 'ceo_agent': return 'ceo';
            case 'product_research_agent': return 'trends';
            case 'marketing_agent': return 'ads';
            case 'store_build_agent': return 'shop';
            case 'customer_service_agent': return 'email';
            case 'supplier_agent': return 'fulfilment';
            case 'operations_agent': return 'operations';
            case 'analytics_agent': return 'analytics';
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
    getEventBus() {
        return this.eventBus;
    }
}
