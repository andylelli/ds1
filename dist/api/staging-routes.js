import { Router } from 'express';
import { ResearchStagingService } from '../core/services/ResearchStagingService.js';
export function createStagingRoutes(pool) {
    const router = Router();
    const stagingService = new ResearchStagingService(pool);
    // === Sessions ===
    // GET /api/staging/sessions - List all research sessions
    router.get('/sessions', async (req, res) => {
        try {
            const status = req.query.status;
            const sessions = await stagingService.getAllSessions(status);
            res.json({ sessions });
        }
        catch (error) {
            console.error('[Staging API] Get sessions error:', error.message);
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    });
    // GET /api/staging/sessions/:id - Get session details
    router.get('/sessions/:id', async (req, res) => {
        try {
            const session = await stagingService.getSession(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            const items = await stagingService.getStagedItems(req.params.id);
            res.json({ session, items });
        }
        catch (error) {
            console.error('[Staging API] Get session error:', error.message);
            res.status(500).json({ error: 'Failed to get session' });
        }
    });
    // === Items ===
    // GET /api/staging/items - Get all staged items
    router.get('/items', async (req, res) => {
        try {
            const { sessionId, status } = req.query;
            const items = await stagingService.getStagedItems(sessionId, status);
            res.json({ items, count: items.length });
        }
        catch (error) {
            console.error('[Staging API] Get items error:', error.message);
            res.status(500).json({ error: 'Failed to get items' });
        }
    });
    // GET /api/staging/pending - Get pending count
    router.get('/pending', async (req, res) => {
        try {
            const count = await stagingService.getPendingCount();
            res.json({ pendingCount: count });
        }
        catch (error) {
            console.error('[Staging API] Get pending count error:', error.message);
            res.status(500).json({ error: 'Failed to get pending count' });
        }
    });
    // === Review Actions ===
    // POST /api/staging/items/:id/approve
    router.post('/items/:id/approve', async (req, res) => {
        try {
            const { reviewedBy = 'admin', notes } = req.body;
            await stagingService.approveItem(parseInt(req.params.id), reviewedBy, notes);
            res.json({ success: true, message: 'Item approved' });
        }
        catch (error) {
            console.error('[Staging API] Approve item error:', error.message);
            res.status(500).json({ error: 'Failed to approve item' });
        }
    });
    // POST /api/staging/items/:id/reject
    router.post('/items/:id/reject', async (req, res) => {
        try {
            const { reviewedBy = 'admin', notes } = req.body;
            await stagingService.rejectItem(parseInt(req.params.id), reviewedBy, notes);
            res.json({ success: true, message: 'Item rejected' });
        }
        catch (error) {
            console.error('[Staging API] Reject item error:', error.message);
            res.status(500).json({ error: 'Failed to reject item' });
        }
    });
    // POST /api/staging/items/:id/need-info
    router.post('/items/:id/need-info', async (req, res) => {
        try {
            const { reviewedBy = 'admin', notes } = req.body;
            await stagingService.requestMoreInfo(parseInt(req.params.id), reviewedBy, notes);
            res.json({ success: true, message: 'Marked as needs info' });
        }
        catch (error) {
            console.error('[Staging API] Need info error:', error.message);
            res.status(500).json({ error: 'Failed to update item' });
        }
    });
    // === Bulk Actions ===
    // POST /api/staging/bulk/approve
    router.post('/bulk/approve', async (req, res) => {
        try {
            const { itemIds, reviewedBy = 'admin' } = req.body;
            await stagingService.bulkApprove(itemIds, reviewedBy);
            res.json({ success: true, message: `${itemIds.length} items approved` });
        }
        catch (error) {
            console.error('[Staging API] Bulk approve error:', error.message);
            res.status(500).json({ error: 'Failed to bulk approve' });
        }
    });
    // POST /api/staging/bulk/reject
    router.post('/bulk/reject', async (req, res) => {
        try {
            const { itemIds, reviewedBy = 'admin' } = req.body;
            await stagingService.bulkReject(itemIds, reviewedBy);
            res.json({ success: true, message: `${itemIds.length} items rejected` });
        }
        catch (error) {
            console.error('[Staging API] Bulk reject error:', error.message);
            res.status(500).json({ error: 'Failed to bulk reject' });
        }
    });
    // POST /api/staging/sessions/:id/auto-approve
    router.post('/sessions/:id/auto-approve', async (req, res) => {
        try {
            const { threshold = 70, reviewedBy = 'admin' } = req.body;
            const count = await stagingService.approveHighScore(req.params.id, threshold, reviewedBy);
            res.json({ success: true, message: `${count} items auto-approved (score >= ${threshold})` });
        }
        catch (error) {
            console.error('[Staging API] Auto-approve error:', error.message);
            res.status(500).json({ error: 'Failed to auto-approve' });
        }
    });
    // POST /api/staging/sessions/:id/auto-reject
    router.post('/sessions/:id/auto-reject', async (req, res) => {
        try {
            const { threshold = 40, reviewedBy = 'admin' } = req.body;
            const count = await stagingService.rejectLowScore(req.params.id, threshold, reviewedBy);
            res.json({ success: true, message: `${count} items auto-rejected (score < ${threshold})` });
        }
        catch (error) {
            console.error('[Staging API] Auto-reject error:', error.message);
            res.status(500).json({ error: 'Failed to auto-reject' });
        }
    });
    // === Approved Items (for downstream use) ===
    // GET /api/staging/approved/products
    router.get('/approved/products', async (req, res) => {
        try {
            const { sessionId } = req.query;
            const products = await stagingService.getApprovedProducts(sessionId);
            res.json({ products, count: products.length });
        }
        catch (error) {
            console.error('[Staging API] Get approved products error:', error.message);
            res.status(500).json({ error: 'Failed to get approved products' });
        }
    });
    return router;
}
