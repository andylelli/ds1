import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AppConfig, BootstrapConfig, InfrastructureConfig, McpConfig, AgentsConfig, WorkflowsConfig } from './ConfigTypes.js';

export class YamlLoader {
  /**
   * Loads the bootstrap YAML and all referenced configuration files.
   * @param bootstrapPath Path to the bootstrap.yaml file (relative to CWD or absolute)
   */
  static load(bootstrapPath: string): AppConfig {
    const resolvedBootstrapPath = path.resolve(process.cwd(), bootstrapPath);
    
    if (!fs.existsSync(resolvedBootstrapPath)) {
      throw new Error(`Bootstrap file not found at: ${resolvedBootstrapPath}`);
    }

    const bootstrap = this.readYaml<BootstrapConfig>(resolvedBootstrapPath);

    // Helper to resolve paths defined in bootstrap
    const resolveConfigPath = (configPath: string) => {
      return path.resolve(process.cwd(), configPath);
    };

    const infrastructure = this.readYaml<InfrastructureConfig>(resolveConfigPath(bootstrap.paths.infrastructure));
    const mcp = this.readYaml<McpConfig>(resolveConfigPath(bootstrap.paths.mcp));
    const agents = this.readYaml<AgentsConfig>(resolveConfigPath(bootstrap.paths.agents));
    const workflows = this.readYaml<WorkflowsConfig>(resolveConfigPath(bootstrap.paths.workflows));

    return {
      bootstrap,
      infrastructure,
      mcp,
      agents,
      workflows
    };
  }

  private static readYaml<T>(filePath: string): T {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found at: ${filePath}`);
    }
    try {
      let fileContents = fs.readFileSync(filePath, 'utf8');
      
      // Simple environment variable substitution
      fileContents = fileContents.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
        return process.env[envVar] || '';
      });

      return yaml.load(fileContents) as T;
    } catch (error) {
      throw new Error(`Failed to parse YAML file at ${filePath}: ${(error as Error).message}`);
    }
  }
}
