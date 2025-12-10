export interface BootstrapConfig {
  system: {
    mode: 'live' | 'simulation';
    persistence: string;
    event_bus: string;
  };
  services?: {
    shop?: 'live' | 'mock';
    ads?: 'live' | 'mock';
    trends?: 'live' | 'mock';
    competitor?: 'live' | 'mock';
    fulfilment?: 'live' | 'mock';
    email?: 'live' | 'mock';
    ai?: 'live' | 'mock';
  };
  paths: {
    infrastructure: string;
    mcp: string;
    agents: string;
    workflows: string;
  };
}

export interface InfrastructureConfig {
  event_bus: {
    type: 'postgres';
    connection_string?: string;
  };
  database?: {
    live_url?: string;
    simulation_url?: string;
  };
  server: {
    port: number;
  };
}

export interface McpConfig {
  mcp_servers: Array<{
    id: string;
    type: 'internal' | 'stdio' | 'sse';
    class?: string; // For internal
    command?: string; // For stdio
    args?: string[]; // For stdio
    config?: Record<string, any>;
  }>;
}

export interface AgentsConfig {
  agents: Array<{
    id: string;
    class: string;
    model: string;
    system_prompt: string;
    tools: string[]; // List of Tool IDs
  }>;
}

export interface WorkflowsConfig {
  subscriptions: Array<{
    event: string;
    subscriber: string; // Agent ID
    action: string; // Method name or instruction
  }>;
}

export interface AppConfig {
  bootstrap: BootstrapConfig;
  infrastructure: InfrastructureConfig;
  mcp: McpConfig;
  agents: AgentsConfig;
  workflows: WorkflowsConfig;
}
