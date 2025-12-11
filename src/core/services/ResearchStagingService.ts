import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface StagedItem {
  id: number;
  sessionId: string;
  itemType: 'product' | 'trend' | 'competitor';
  name: string;
  description: string;
  rawData: any;
  confidenceScore: number;
  source: string;
  trendEvidence: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export interface ResearchSession {
  id: string;
  category: string;
  researchType: string;
  sourceModes: { trends: string; research: string };
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  status: string;
  startedAt: Date;
}

export class ResearchStagingService {
  constructor(private pool: Pool) {}

  // === Session Management ===

  async createSession(category: string, researchType: string, sourceModes: any): Promise<string> {
    const sessionId = `research_${uuidv4().slice(0, 8)}`;
    
    await this.pool.query(`
      INSERT INTO research_sessions (id, category, research_type, source_modes, status)
      VALUES ($1, $2, $3, $4, 'in_progress')
    `, [sessionId, category, researchType, JSON.stringify(sourceModes)]);
    
    return sessionId;
  }

  async getSession(sessionId: string): Promise<ResearchSession | null> {
    const result = await this.pool.query(`
      SELECT * FROM research_sessions WHERE id = $1
    `, [sessionId]);
    
    return result.rows[0] ? this.mapSession(result.rows[0]) : null;
  }

  async getAllSessions(status?: string): Promise<ResearchSession[]> {
    let query = 'SELECT * FROM research_sessions';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY started_at DESC LIMIT 50';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => this.mapSession(r));
  }

  async completeSession(sessionId: string): Promise<void> {
    await this.pool.query(`
      UPDATE research_sessions 
      SET status = 'awaiting_review', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sessionId]);
  }

  // === Staging Items ===

  async stageItem(sessionId: string, item: Partial<StagedItem>): Promise<number> {
    const result = await this.pool.query(`
      INSERT INTO research_staging 
        (session_id, item_type, name, description, raw_data, confidence_score, source, trend_evidence, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP + INTERVAL '7 days')
      RETURNING id
    `, [
      sessionId,
      item.itemType,
      item.name,
      item.description,
      JSON.stringify(item.rawData),
      item.confidenceScore,
      item.source,
      item.trendEvidence
    ]);
    
    // Update session counters
    await this.pool.query(`
      UPDATE research_sessions 
      SET total_items = total_items + 1, pending_items = pending_items + 1
      WHERE id = $1
    `, [sessionId]);
    
    return result.rows[0].id;
  }

  async stageMultiple(sessionId: string, items: Partial<StagedItem>[]): Promise<number[]> {
    const ids: number[] = [];
    for (const item of items) {
      const id = await this.stageItem(sessionId, item);
      ids.push(id);
    }
    return ids;
  }

  async getStagedItems(sessionId?: string, status?: string): Promise<StagedItem[]> {
    let query = 'SELECT * FROM research_staging WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }
    
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY confidence_score DESC, created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => this.mapStagedItem(r));
  }

  async getItem(id: number): Promise<StagedItem | null> {
    const result = await this.pool.query('SELECT * FROM research_staging WHERE id = $1', [id]);
    return result.rows[0] ? this.mapStagedItem(result.rows[0]) : null;
  }

  async getPendingCount(): Promise<number> {
    const result = await this.pool.query(`
      SELECT COUNT(*) FROM research_staging WHERE status = 'pending'
    `);
    return parseInt(result.rows[0].count);
  }

  // === Review Actions ===

  async approveItem(itemId: number, reviewedBy: string, notes?: string): Promise<void> {
    await this.updateItemStatus(itemId, 'approved', reviewedBy, notes);
  }

  async rejectItem(itemId: number, reviewedBy: string, notes?: string): Promise<void> {
    await this.updateItemStatus(itemId, 'rejected', reviewedBy, notes);
  }

  async requestMoreInfo(itemId: number, reviewedBy: string, notes: string): Promise<void> {
    await this.updateItemStatus(itemId, 'needs_info', reviewedBy, notes);
  }

  async bulkApprove(itemIds: number[], reviewedBy: string): Promise<void> {
    for (const id of itemIds) {
      await this.approveItem(id, reviewedBy, 'Bulk approved');
    }
  }

  async bulkReject(itemIds: number[], reviewedBy: string): Promise<void> {
    for (const id of itemIds) {
      await this.rejectItem(id, reviewedBy, 'Bulk rejected');
    }
  }

  async approveHighScore(sessionId: string, threshold: number, reviewedBy: string): Promise<number> {
    const result = await this.pool.query(`
      UPDATE research_staging 
      SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = 'Auto-approved (high score)'
      WHERE session_id = $2 AND status = 'pending' AND confidence_score >= $3
      RETURNING id
    `, [reviewedBy, sessionId, threshold]);
    
    await this.updateSessionCounters(sessionId);
    return result.rowCount || 0;
  }

  async rejectLowScore(sessionId: string, threshold: number, reviewedBy: string): Promise<number> {
    const result = await this.pool.query(`
      UPDATE research_staging 
      SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = 'Auto-rejected (low score)'
      WHERE session_id = $2 AND status = 'pending' AND confidence_score < $3
      RETURNING id
    `, [reviewedBy, sessionId, threshold]);
    
    await this.updateSessionCounters(sessionId);
    return result.rowCount || 0;
  }

  // === Get Approved Items for Use ===

  async getApprovedProducts(sessionId?: string): Promise<any[]> {
    let query = `
      SELECT raw_data, name, description, confidence_score, source, trend_evidence
      FROM research_staging 
      WHERE status = 'approved' AND item_type = 'product'
    `;
    const params: any[] = [];
    
    if (sessionId) {
      query += ' AND session_id = $1';
      params.push(sessionId);
    }
    
    query += ' ORDER BY confidence_score DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => ({
      ...r.raw_data,
      name: r.name,
      description: r.description,
      confidenceScore: r.confidence_score,
      source: r.source,
      reviewStatus: 'approved'
    }));
  }

  // === Private Helpers ===

  private async updateItemStatus(itemId: number, status: string, reviewedBy: string, notes?: string): Promise<void> {
    const item = await this.pool.query('SELECT session_id FROM research_staging WHERE id = $1', [itemId]);
    
    await this.pool.query(`
      UPDATE research_staging 
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3
      WHERE id = $4
    `, [status, reviewedBy, notes, itemId]);
    
    if (item.rows[0]) {
      await this.updateSessionCounters(item.rows[0].session_id);
    }
  }

  private async updateSessionCounters(sessionId: string): Promise<void> {
    await this.pool.query(`
      UPDATE research_sessions SET
        pending_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'pending'),
        approved_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'approved'),
        rejected_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'rejected')
      WHERE id = $1
    `, [sessionId]);
    
    // Check if fully reviewed
    const session = await this.getSession(sessionId);
    if (session && session.pendingItems === 0) {
      await this.pool.query(`
        UPDATE research_sessions SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [sessionId]);
    }
  }

  private mapSession(row: any): ResearchSession {
    return {
      id: row.id,
      category: row.category,
      researchType: row.research_type,
      sourceModes: row.source_modes,
      totalItems: row.total_items,
      pendingItems: row.pending_items,
      approvedItems: row.approved_items,
      rejectedItems: row.rejected_items,
      status: row.status,
      startedAt: row.started_at
    };
  }

  private mapStagedItem(row: any): StagedItem {
    return {
      id: row.id,
      sessionId: row.session_id,
      itemType: row.item_type,
      name: row.name,
      description: row.description,
      rawData: row.raw_data,
      confidenceScore: row.confidence_score,
      source: row.source,
      trendEvidence: row.trend_evidence,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      createdAt: row.created_at
    };
  }
}
