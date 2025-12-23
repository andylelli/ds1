export class VideoMcpWrapper {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    getTools() {
        return [
            {
                name: 'youtube_search',
                description: 'Search for videos on YouTube to validate product interest.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        maxResults: { type: 'number', description: 'Maximum number of results (default 10)' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'youtube_details',
                description: 'Get detailed statistics for specific YouTube videos.',
                parameters: {
                    type: 'object',
                    properties: {
                        videoIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of video IDs'
                        }
                    },
                    required: ['videoIds']
                }
            }
        ];
    }
    async executeTool(name, args) {
        switch (name) {
            case 'youtube_search':
                return await this.adapter.searchVideos(args.query, args.maxResults);
            case 'youtube_details':
                return await this.adapter.getVideoDetails(args.videoIds);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
