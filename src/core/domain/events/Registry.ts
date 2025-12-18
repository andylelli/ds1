
/**
 * Global Event Registry
 * Defines the taxonomy of all events in the system and their payload structures.
 */

export interface DomainEvent<T = any> {
  event_id: string;
  correlation_id: string;
  timestamp: Date;
  topic: string; // The high-level domain (e.g., 'OpportunityResearch', 'System')
  type: string;  // The specific event type (e.g., 'Requested', 'Error')
  source: string; // The service/agent that emitted the event
  payload: T;
}

// Define the shape of payloads for each event type
export type EventRegistry = {
  // --- Research Domain ---
  'OpportunityResearch.Requested': {
    request_id: string;
    criteria: any;
    constraints?: any;
  };
  'OpportunityResearch.BriefCreated': {
    brief_id: string;
    initial_scope: any;
  };
  'OpportunityResearch.SignalsCollected': {
    brief_id: string;
    signal_count: number;
    sources: string[];
  };
  'OpportunityResearch.ThemesGenerated': {
    brief_id: string;
    themes: any[];
  };
  'OpportunityResearch.ShortlistRanked': {
    brief_id: string;
    candidates: any[];
  };
  'OpportunityResearch.BriefPublished': {
    brief_id: string;
    brief_json: any;
  };
  'OpportunityResearch.Aborted': {
    brief_id: string;
    reason: string;
    kill_code?: string;
  };

  // --- Sourcing Domain ---
  'Sourcing.FeasibilityRequested': {
    brief_id: string;
  };
  'Sourcing.SupplierFound': {
    supplier_id: string;
    cost: number;
    moq: number;
  };

  // --- Marketing Domain ---
  'Marketing.CampaignRequested': {
    product_id: string;
  };
  'Marketing.AdLaunched': {
    ad_id: string;
    platform: string;
  };

  // --- Sales Domain ---
  'Sales.OrderReceived': {
    order_id: string;
    items: any[];
    total: number;
  };
  'Sales.OrderShipped': {
    order: any;
    tracking: string;
  };

  // --- Product Domain (Legacy/Transition) ---
  'Product.Approved': {
    product: any;
    reason: string;
  };
  'Product.Found': {
    product: any;
  };

  // --- Store Domain ---
  'Store.PageCreated': {
    product: any;
    pageUrl: string;
  };

  // --- Supplier Domain ---
  'Supplier.Approved': {
    product: any;
    supplier: any;
    reason: string;
  };
  'Supplier.Found': {
    product: any;
    supplier: any;
  };

  // --- Marketing Domain ---
  'Marketing.CampaignStarted': {
    campaign: any;
    product: any;
  };


  // --- System Domain ---
  'System.Error': {
    error: string;
    context?: any;
    stack?: string;
  };
  'System.Log': {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    metadata?: any;
  };

  // --- Analytics Domain ---
  'Analytics.ReportRequested': {
    period: string;
  };
};

export type EventName = keyof EventRegistry;

export type EventPayload<K extends EventName> = EventRegistry[K];
