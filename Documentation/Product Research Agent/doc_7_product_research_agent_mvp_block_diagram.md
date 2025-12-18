# Product Research Agent — MVP Block Diagram

```mermaid
flowchart TB
  %% Global Styling
  classDef store fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:black;
  classDef step fill:#e1f5fe,stroke:#01579b,color:black;
  classDef decision fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:black;
  classDef adapter fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:black;
  classDef active fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:black;
  classDef missing fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5,color:black;
  classDef bus fill:#212121,stroke:#000,color:#fff;

  %% --- LEFT COLUMN: PERSISTENCE ---
  subgraph Persistence [Persistence Layer]
    direction TB
    CS[(Config Store)]
    EM[(Memory Store)]
    ES[(Evidence Store)]
    BS[(Brief Store)]
  end

  %% --- CENTER COLUMN: PIPELINE ---
  subgraph Process [Product Research Agent Pipeline]
    direction TB
    
    Trigger([Event: Research Requested])

    subgraph P1 [Phase 1: Discovery]
      S1[1. Request Intake]
      S2[2. Load Context]
      S3[3. Signal Discovery]
      S4[4. Theme Gen]
    end

    subgraph P2 [Phase 2: Filtering]
      S5{5. Strategic Gate}
      S6[6. Score & Rank]
      S7{7. Time Fitness}
      Reject[Log Rejection]
    end

    subgraph P3 [Phase 3: Packaging]
      S8[8. Deep Validation]
      S9[9. Offer Concepts]
      S10[10. Build Brief]
      S11[11. Publish Events]
    end
  end

  %% --- RIGHT COLUMN: EXTERNAL ---
  subgraph External [External World]
    direction TB
    
    subgraph MCP [MCP Adapters]
      TA[Trend Adapter]
      CA[Competitor Adapter]
    end

    subgraph Sources [Data Sources]
      GT[Google Trends]
      GADS[Google Ads]
      FB[Meta Ads]
      IG[Instagram]
      YT[YouTube]
    end
  end

  %% --- WIRING ---
  
  %% Main Flow
  Trigger --> S1
  S1 --> S2 --> S3 --> S4 --> S5
  S5 -->|Pass| S6 --> S7
  S7 -->|Pass| S8 --> S9 --> S10 --> S11
  S5 -->|Fail| Reject
  S7 -->|Fail| Reject

  %% Persistence Links (Left)
  CS -.->|Read Rules| S1
  EM -.->|Read History| S2
  S11 -.->|Update History| EM
  S3 -.->|Store Raw| ES
  S8 -.->|Store Validated| ES
  S10 -.->|Save Final| BS

  %% External Links (Right)
  S3 -->|Query| TA
  S3 -->|Query| CA
  S8 -->|Verify| CA

  TA -->|Active| GT
  TA -.->|Missing| GADS
  CA -.->|Missing| FB
  CA -.->|Missing| IG
  CA -.->|Missing| YT

  %% Class Assignments
  class CS,EM,ES,BS store;
  class S1,S2,S3,S4,S6,S8,S9,S10,S11 step;
  class S5,S7 decision;
  class Reject missing; %% Reusing red style for reject
  class TA,CA adapter;
  class GT active;
  class GADS,FB,IG,YT missing;
  class Trigger bus;
```
