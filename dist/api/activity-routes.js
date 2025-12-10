import { Router } from 'express';
export function createActivityRoutes(activityLog) {
    const router = Router();
    /**
     * GET /api/activity - Get activity logs with filters
     */
    router.get('/', async (req, res) => {
        try {
            const filter = {};
            if (req.query.agent)
                filter.agent = req.query.agent;
            if (req.query.category)
                filter.category = req.query.category;
            if (req.query.status)
                filter.status = req.query.status;
            if (req.query.entityType)
                filter.entityType = req.query.entityType;
            if (req.query.entityId)
                filter.entityId = req.query.entityId;
            if (req.query.limit)
                filter.limit = parseInt(req.query.limit);
            if (req.query.startDate)
                filter.startDate = new Date(req.query.startDate);
            if (req.query.endDate)
                filter.endDate = new Date(req.query.endDate);
            const activities = await activityLog.getActivities(filter);
            res.json({ activities });
        }
        catch (error) {
            console.error('[Activity API] Error fetching activities:', error);
            res.status(500).json({ error: 'Failed to fetch activities' });
        }
    });
    /**
     * GET /api/activity/recent - Get recent activity
     */
    router.get('/recent', async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const activities = await activityLog.getRecent(limit);
            res.json({ activities });
        }
        catch (error) {
            console.error('[Activity API] Error fetching recent activities:', error);
            res.status(500).json({ error: 'Failed to fetch recent activities' });
        }
    });
    /**
     * GET /api/activity/stats - Get activity statistics
     */
    router.get('/stats', async (req, res) => {
        try {
            const hours = req.query.hours ? parseInt(req.query.hours) : 24;
            const stats = await activityLog.getStats(hours);
            res.json(stats);
        }
        catch (error) {
            console.error('[Activity API] Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    });
    /**
     * GET /api/activity/summary - Get activity summary
     */
    router.get('/summary', async (req, res) => {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
            const summary = await activityLog.getSummary(startDate);
            res.json({ summary });
        }
        catch (error) {
            console.error('[Activity API] Error fetching summary:', error);
            res.status(500).json({ error: 'Failed to fetch summary' });
        }
    });
    /**
     * GET /api/activity/entity/:type/:id - Get activity for a specific entity
     */
    router.get('/entity/:type/:id', async (req, res) => {
        try {
            const { type, id } = req.params;
            const activities = await activityLog.getEntityHistory(type, id);
            res.json({ activities });
        }
        catch (error) {
            console.error('[Activity API] Error fetching entity history:', error);
            res.status(500).json({ error: 'Failed to fetch entity history' });
        }
    });
    /**
     * POST /api/activity/clear-old - Clear old logs
     */
    router.post('/clear-old', async (req, res) => {
        try {
            const daysToKeep = req.body.daysToKeep || 30;
            const deleted = await activityLog.clearOldLogs(daysToKeep);
            res.json({ deleted, message: `Cleared ${deleted} old log entries` });
        }
        catch (error) {
            console.error('[Activity API] Error clearing old logs:', error);
            res.status(500).json({ error: 'Failed to clear old logs' });
        }
    });
    return router;
}
