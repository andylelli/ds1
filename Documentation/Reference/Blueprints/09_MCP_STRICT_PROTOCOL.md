# Blueprint: Strict MCP Protocol Implementation

## 1. Executive Summary
This document outlines the plan to standardize all Model Context Protocol (MCP) tool interactions across the DS1 system. We will transition from ad-hoc JSON responses to a strict **Standard MCP Tool Contract**. This ensures that all agents (Research, Marketing, Sourcing) consume data in a consistent, evidence-based format, regardless of the underlying API (BigQuery, Shopify, Facebook Ads).

## 2. Core Objectives
1.  **Normalization**: All tools must return a standard `McpResponse` envelope.
2.  **Traceability**: Every piece of data must have a `source`, `timestamp`, and `confidence_level`.
3.  **Decoupling**: Agents should not know the specifics of the underlying API, only the standardized signal type.

---

## 3. The Standard Contract (Target State)

We will enforce the schema defined in `doc_4_standard_mcp_tool_contract.md`.

### 3.1 The Envelope Interface
We will define this in `src/core/mcp/types.ts`.

```typescript
export type SignalType = 'social' | 'search' | 'marketplace' | 'ads' | 'supplier';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface McpResponse<T = any> {
  // Provenance
  source: string;          // e.g., 'google_bigquery', 'shopify_admin', 'facebook_ads'
  signal_type: SignalType; // The logical category of this data
  
  // Context
  query_context: {
    keywords?: string[];
    category?: string;
    geo?: string;
    [key: string]: any;
  };
  
  timeframe: {
    start?: string; // ISO Date
    end?: string;   // ISO Date
  };
  
  retrieved_at: string; // ISO Date
  
  // Quality
  confidence_level: ConfidenceLevel;
  notes?: string; // Caveats (e.g., "Data sampled", "Estimated")
  
  // Payload
  items: T[];
}
```

### 3.2 The Signal Item Interface
All items within the `items` array must share a common base structure.

```typescript
export interface SignalItem {
  item_id: string;
  item_type: 'post' | 'query' | 'product' | 'ad' | 'listing';
  title_or_label: string;
  description?: string;
  url?: string;
  
  // Quantitative Data
  metrics: Record<string, number>; // e.g., { volume: 1000, cpc: 1.5 }
  
  // Qualitative Data
  qualitative?: Record<string, any>;
}
```

---

## 4. Implementation Plan

### Phase 1: Core Infrastructure
1.  **Create Types**: Define `McpResponse` and `SignalItem` in `src/core/mcp/types.ts`.
2.  **Create Helper**: Implement a `McpResponseBuilder` class to make it easy for tool developers to construct valid responses.

```typescript
// Example Usage
return new McpResponseBuilder('google_bigquery', 'search')
  .setContext({ category: 'kitchen' })
  .setConfidence('high')
  .addItems(products.map(p => toSignalItem(p)))
  .build();
```

### Phase 2: Refactor Existing Tools
We will refactor the existing `ProductResearchAgent` tools to return this format.

**Example: `find_winning_products` (BigQuery)**
*   **Current Return:** `{ products: [{ name: '...', score: 90 }] }`
*   **New Return:**
    ```json
    {
      "source": "google_bigquery_public",
      "signal_type": "search",
      "confidence_level": "high",
      "items": [
        {
          "item_id": "term_123",
          "item_type": "query",
          "title_or_label": "Air Fryer",
          "metrics": { "demand_score": 90, "competition_score": 10 }
        }
      ]
    }
    ```

### Phase 3: Update Agent Consumption Logic
The `ProductResearchAgent` (and others) currently expect direct arrays. We need to update the calling logic to unwrap the envelope.

*   **Before:** `const products = await tool.findProducts(...)`
*   **After:** 
    ```typescript
    const response = await tool.findProducts(...);
    if (response.confidence_level === 'low') { /* handle low confidence */ }
    const products = response.items;
    ```

---

## 5. Migration Strategy

To avoid breaking the system, we will use a **Versioned Tool Approach**.

1.  **Keep V1 Tools**: Leave `find_winning_products` as is for now.
2.  **Create V2 Tools**: Create `find_winning_products_v2` (or `scan_search_signals`) that implements the new contract.
3.  **Switch Consumers**: Update the Agent to call the V2 tool.
4.  **Deprecate V1**: Remove the old tool once the Agent is fully migrated.

## 6. Future Proofing
This structure allows us to swap BigQuery for Google Ads API or Amazon API without changing the Agent's core logic. The Agent just asks for `signal_type: 'search'` and processes the standardized `items`.
