export interface VideoAnalysisPort {
    /**
     * Search for videos related to a query.
     * Returns a list of videos with metrics (views, likes, comments).
     */
    searchVideos(query: string, maxResults?: number): Promise<VideoResult[]>;

    /**
     * Get detailed statistics for specific video IDs.
     */
    getVideoDetails(videoIds: string[]): Promise<VideoDetails[]>;
}

export interface VideoResult {
    id: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnailUrl: string;
}

export interface VideoDetails extends VideoResult {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    tags: string[];
}
