import { AppConfig } from './ConfigTypes.js';
import { YamlLoader } from './YamlLoader.js';
import { ServiceFactory } from './ServiceFactory.js';
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../../core/domain/ports/EventBusPort.js';
import { logger } from '../../infra/logging/LoggerService.js';
import { MCPServer } from '../mcp/server.js';

export class Container {
  private config: AppConfig;
  private factory: ServiceFactory;
  private persistence!: PersistencePort;
  private eventBus!: EventBusPort;
  private services: Map<string, any> = new Map();
  private agents: Map<string, any> = new Map();
  private mcpServer: MCPServer;

  constructor(configPath: string) {
    this.config = YamlLoader.load(configPath);
    this.factory = new ServiceFactory(this.config);
    this.mcpServer = new MCPServer();
  }

  public async init() {
    logger.info('Initializing Container...');
    
    // 1. Infrastructure
    this.persistence = this.factory.createPersistence();
    this.eventBus = this.factory.createEventBus();
    
    // 2. Register Internal Services (Adapters)
    const dependencies: any = {
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
                            this.mcpServer.registerTool(tool.name, (args: any) => wrapper.executeTool(tool.name, args));
                        }
                        logger.info(`Registered MCP tools for ${server.class}`);
                    }
                } catch (e: any) {
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
             } catch (e: any) {
                 logger.error(`Failed to register agent ${agentConfig.id}: ${e.message}`);
             }
        }
    }
    
    logger.info('Container initialized.');
  }

  private mapClassToDependency(className: string): string | null {
      switch(className) {
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

  public getService(id: string) {
      return this.services.get(id);
  }

  public getAgent(id: string) {
      return this.agents.get(id);
  }
  
  public getConfig() {
      return this.config;
  }

  public getMcpServer() {
      return this.mcpServer;
  }
}
