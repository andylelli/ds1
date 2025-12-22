import { logger } from '../../logging/LoggerService.js';
import { google, youtube_v3 } from 'googleapis';
import { VideoAnalysisPort, VideoResult, VideoDetails } from '../../../core/domain/ports/VideoAnalysisPort';

export class LiveVideoAdapter implements VideoAnalysisPort {
    private youtube: youtube_v3.Youtube;

    constructor() {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ YOUTUBE_API_KEY is missing. YouTube integration will fail.");
        }
        this.youtube = google.youtube({
            version: 'v3',
            auth: apiKey
        });
    }

    async searchVideos(query: string, maxResults: number = 10): Promise<VideoResult[]> {
        try {
            const response = await this.youtube.search.list({
                part: ['snippet'],
                q: query,
                type: ['video'],
                maxResults: maxResults,
                order: 'viewCount' // Get most popular videos to validate demand
            });

            if (!response.data.items) {
                logger.external('YouTube', 'searchVideos', { query, maxResults, resultCount: 0 });
                return [];
            }

            const results = response.data.items.map(item => ({
                id: item.id?.videoId || '',
                title: item.snippet?.title || '',
                description: item.snippet?.description || '',
                channelTitle: item.snippet?.channelTitle || '',
                publishedAt: item.snippet?.publishedAt || '',
                thumbnailUrl: item.snippet?.thumbnails?.high?.url || ''
            }));
            logger.external('YouTube', 'searchVideos', { query, maxResults, resultCount: results.length });
            return results;
        } catch (error) {
            logger.external('YouTube', 'searchVideos', { query, maxResults, error: error.message });
            console.error("Error searching YouTube videos:", error);
            return [];
        }
    }

    async getVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
        if (videoIds.length === 0) return [];

        try {
            const response = await this.youtube.videos.list({
                part: ['snippet', 'statistics'],
                id: videoIds
            });

            if (!response.data.items) {
                logger.external('YouTube', 'getVideoDetails', { videoIds, resultCount: 0 });
                return [];
            }

            const details = response.data.items.map(item => ({
                id: item.id || '',
                title: item.snippet?.title || '',
                description: item.snippet?.description || '',
                channelTitle: item.snippet?.channelTitle || '',
                publishedAt: item.snippet?.publishedAt || '',
                thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
                viewCount: parseInt(item.statistics?.viewCount || '0'),
                likeCount: parseInt(item.statistics?.likeCount || '0'),
                commentCount: parseInt(item.statistics?.commentCount || '0'),
                tags: item.snippet?.tags || []
            }));
            logger.external('YouTube', 'getVideoDetails', { videoIds, resultCount: details.length });
            return details;
        } catch (error) {
            logger.external('YouTube', 'getVideoDetails', { videoIds, error: error.message });
            console.error("Error getting YouTube video details:", error);
            return [];
        }
    }
}
