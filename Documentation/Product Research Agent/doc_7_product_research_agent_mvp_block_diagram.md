# Product Research Agent — MVP Block Diagram

```mermaid
flowchart TB
  EB[(EventBus)]
  PRA[Product Research Agent Orchestrator]

  EB -->|Request| PRA

  S1[1 Normalize Request
  Create Research Brief]
  S2[2 Collect Signals
  Social Search Marketplace]
  S3[3 Generate Themes
  Cluster and Dedupe]
  S4[4 Hard Gates
  Risk Strategy Feasibility]
  S5[5 Score and Rank
  Top Shortlist]
  S6[6 Validate
  Pricing Competition Spot checks]
  S7[7 Build Offer Concepts]
  S8[8 Publish Opportunity Brief
  Schema validated JSON]

  PRA --> S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8

  subgraph STORES[Stores]
    CS[(Config Store)]
    EM[(Memory Store)]
    ES[(Evidence Store)]
    BS[(Brief Store)]
  end

  PRA -->|Load rules| CS
  PRA -->|Read learnings| EM
  PRA -->|Write learnings| EM
  S2 -->|Write evidence| ES
  S6 -->|Write evidence| ES
  S8 -->|Write briefs| BS

  subgraph MCP[MCP Tool Layer]
    MC[Standard MCP Contract
    scan and sample]
    SOC[MCP SOCIAL]
    SEA[MCP SEARCH]
    MAR[MCP MARKETPLACE]
    SUP[MCP SUPPLIER
    light check]
  end

  S2 --> MC
  S6 --> MC
  S7 --> SUP
  MC --> SOC
  MC --> SEA
  MC --> MAR

  subgraph EXT[External Sources Examples]
    YT[YouTube]
    IG[Instagram]
    GADS[Google Ads Keywords]
    PIN[Pinterest]
    AMZ[Amazon]
    ALI[Alibaba]
  end

  SOC --> YT
  SOC --> IG
  SEA --> GADS
  SEA --> PIN
  MAR --> AMZ
  SUP --> ALI

  subgraph DOWN[Downstream Consumers]
    SA[Supplier Agent]
    MA[Marketing Agent]
    OA[Ops and Risk Review]
    AA[Analytics Review]
  end

  EB -->|Feasibility| SA
  EB -->|Angles| MA
  EB -->|Risk review| OA
  EB -->|Score review| AA
```
