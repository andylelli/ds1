import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
export class YamlLoader {
    /**
     * Loads the bootstrap YAML and all referenced configuration files.
     * @param bootstrapPath Path to the bootstrap.yaml file (relative to CWD or absolute)
     */
    static load(bootstrapPath) {
        const resolvedBootstrapPath = path.resolve(process.cwd(), bootstrapPath);
        if (!fs.existsSync(resolvedBootstrapPath)) {
            throw new Error(`Bootstrap file not found at: ${resolvedBootstrapPath}`);
        }
        const bootstrap = this.readYaml(resolvedBootstrapPath);
        // Helper to resolve paths defined in bootstrap
        const resolveConfigPath = (configPath) => {
            return path.resolve(process.cwd(), configPath);
        };
        const infrastructure = this.readYaml(resolveConfigPath(bootstrap.paths.infrastructure));
        const mcp = this.readYaml(resolveConfigPath(bootstrap.paths.mcp));
        const agents = this.readYaml(resolveConfigPath(bootstrap.paths.agents));
        const workflows = this.readYaml(resolveConfigPath(bootstrap.paths.workflows));
        return {
            bootstrap,
            infrastructure,
            mcp,
            agents,
            workflows
        };
    }
    static readYaml(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Configuration file not found at: ${filePath}`);
        }
        try {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            return yaml.load(fileContents);
        }
        catch (error) {
            throw new Error(`Failed to parse YAML file at ${filePath}: ${error.message}`);
        }
    }
}
