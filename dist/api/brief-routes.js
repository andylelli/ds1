import { Router } from 'express';
export function createBriefRoutes(db) {
    const router = Router();
    // GET /api/briefs - List all opportunity briefs
    router.get('/', async (req, res) => {
        try {
            const briefs = await db.getBriefs();
            res.json({ briefs, count: briefs.length });
        }
        catch (error) {
            console.error('[Brief API] Get briefs error:', error.message);
            res.status(500).json({ error: 'Failed to get briefs' });
        }
    });
    // GET /api/briefs/:id - Get brief details
    router.get('/:id', async (req, res) => {
        try {
            const briefs = await db.getBriefs();
            const brief = briefs.find(b => b.id === req.params.id);
            if (!brief) {
                return res.status(404).json({ error: 'Brief not found' });
            }
            res.json({ brief });
        }
        catch (error) {
            console.error('[Brief API] Get brief error:', error.message);
            res.status(500).json({ error: 'Failed to get brief' });
        }
    });
    return router;
}
