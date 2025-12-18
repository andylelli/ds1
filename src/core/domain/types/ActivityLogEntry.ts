export interface ActivityLogEntry {
  id?: number;
  timestamp?: Date;
  agent: string;
  action: string;
  category: string;
  status?: 'started' | 'completed' | 'failed' | 'warning';
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  message: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogFilter {
  agent?: string;
  category?: string;
  status?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
