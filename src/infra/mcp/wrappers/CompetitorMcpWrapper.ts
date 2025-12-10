import { McpToolProvider } from '../../../core/mcp/McpToolProvider.js';
import { CompetitorAnalysisPort } from '../../../core/domain/ports/CompetitorAnalysisPort.js';
import { ToolDefinition } from '../../../core/domain/ports/AiPort.js';

export class CompetitorMcpWrapper implements McpToolProvider {
    constructor(private adapter: CompetitorAnalysisPort) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'competitor_analyze',
                description: 'Analyze competitors in a specific category.',
                parameters: {
                    type: 'object',
                    properties: {
                        category: { type: 'string' }
                    },
                    required: ['category']
                }
            },
            {
                name: 'competitor_get_ads',
                description: 'Get active ads for a specific competitor URL.',
                parameters: {
                    type: 'object',
                    properties: {
                        competitorUrl: { type: 'string' }
                    },
                    required: ['competitorUrl']
                }
            }
        ];
    }

    async executeTool(name: string, args: any): Promise<any> {
        switch (name) {
            case 'competitor_analyze':
                return this.adapter.analyzeCompetitors(args.category);
            case 'competitor_get_ads':
                return this.adapter.getCompetitorAds(args.competitorUrl);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
