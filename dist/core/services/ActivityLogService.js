export class ActivityLogService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Log an activity
     */
    async log(entry) {
        const query = `
      INSERT INTO activity_log (agent, action, category, status, entity_type, entity_id, details, message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
        try {
            await this.pool.query(query, [
                entry.agent,
                entry.action,
                entry.category,
                entry.status || 'completed',
                entry.entityType || null,
                entry.entityId || null,
                entry.details ? JSON.stringify(entry.details) : null,
                entry.message,
                entry.metadata ? JSON.stringify(entry.metadata) : null
            ]);
        }
        catch (error) {
            console.error('[ActivityLog] Failed to log activity:', error);
            // Don't throw - logging failures shouldn't break the app
        }
    }
    /**
     * Get activity logs with filters
     */
    async getActivities(filter = {}) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (filter.agent) {
            conditions.push(`agent = $${paramIndex++}`);
            params.push(filter.agent);
        }
        if (filter.category) {
            conditions.push(`category = $${paramIndex++}`);
            params.push(filter.category);
        }
        if (filter.status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(filter.status);
        }
        if (filter.entityType) {
            conditions.push(`entity_type = $${paramIndex++}`);
            params.push(filter.entityType);
        }
        if (filter.entityId) {
            conditions.push(`entity_id = $${paramIndex++}`);
            params.push(filter.entityId);
        }
        if (filter.startDate) {
            conditions.push(`timestamp >= $${paramIndex++}`);
            params.push(filter.startDate);
        }
        if (filter.endDate) {
            conditions.push(`timestamp <= $${paramIndex++}`);
            params.push(filter.endDate);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filter.limit || 100;
        const query = `
      SELECT id, timestamp, agent, action, category, status, entity_type as "entityType", 
             entity_id as "entityId", details, message, metadata
      FROM activity_log
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;
        params.push(limit);
        const result = await this.pool.query(query, params);
        return result.rows;
    }
    /**
     * Get recent activity (last N entries)
     */
    async getRecent(limit = 50) {
        return this.getActivities({ limit });
    }
    /**
     * Get the latest status for a specific agent
     */
    async getAgentStatus(agentName) {
        const query = `
      SELECT id, timestamp, agent, action, category, status, entity_type as "entityType", 
             entity_id as "entityId", details, message, metadata
      FROM activity_log
      WHERE agent = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
        try {
            const result = await this.pool.query(query, [agentName]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`[ActivityLog] Failed to get status for ${agentName}:`, error);
            return null;
        }
    }
    /**
     * Get activity by category
     */
    async getByCategory(category, limit = 50) {
        return this.getActivities({ category, limit });
    }
    /**
     * Get activity for a specific entity
     */
    async getEntityHistory(entityType, entityId) {
        return this.getActivities({ entityType, entityId, limit: 200 });
    }
    /**
     * Get activity summary (counts by category)
     */
    async getSummary(startDate) {
        const whereClause = startDate ? 'WHERE timestamp >= $1' : '';
        const params = startDate ? [startDate] : [];
        const query = `
      SELECT category, COUNT(*) as count
      FROM activity_log
      ${whereClause}
      GROUP BY category
      ORDER BY count DESC
    `;
        const result = await this.pool.query(query, params);
        const summary = {};
        result.rows.forEach(row => {
            summary[row.category] = parseInt(row.count);
        });
        return summary;
    }
    /**
     * Clear old logs (retention policy)
     */
    async clearOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const query = `
      DELETE FROM activity_log
      WHERE timestamp < $1
    `;
        const result = await this.pool.query(query, [cutoffDate]);
        return result.rowCount || 0;
    }
    /**
     * Get activity stats for dashboard
     */
    async getStats(hours = 24) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        const query = `
      SELECT 
        COUNT(*) as total,
        json_object_agg(agent, agent_count) as by_agent,
        json_object_agg(category, category_count) as by_category,
        json_object_agg(status, status_count) as by_status
      FROM (
        SELECT 
          agent,
          category,
          status,
          COUNT(*) OVER (PARTITION BY agent) as agent_count,
          COUNT(*) OVER (PARTITION BY category) as category_count,
          COUNT(*) OVER (PARTITION BY status) as status_count,
          COUNT(*) OVER () as total
        FROM activity_log
        WHERE timestamp >= $1
      ) t
      LIMIT 1
    `;
        const result = await this.pool.query(query, [startDate]);
        if (result.rows.length === 0) {
            return { total: 0, byAgent: {}, byCategory: {}, byStatus: {} };
        }
        const row = result.rows[0];
        return {
            total: parseInt(row.total) || 0,
            byAgent: row.by_agent || {},
            byCategory: row.by_category || {},
            byStatus: row.by_status || {}
        };
    }
}
